import { and, desc, eq, inArray } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { orders, orderItems, products } from "@db/schema";
import { getDb } from "./queries/connection";
import { createRouter, authedQuery } from "./middleware";

/** Indiana ZIP codes are 5 digits beginning with 46 or 47. */
const indianaZip = z
  .string()
  .regex(/^4[67]\d{3}$/, "Delivery is Indiana-only: ZIP must start with 46 or 47");

const deliveryAddressInput = z.object({
  businessName: z.string().min(1).max(255),
  street: z.string().min(1).max(255),
  city: z.string().min(1).max(100),
  zip: indianaZip,
});

const createInput = z.object({
  items: z
    .array(
      z.object({
        productId: z.number().int().positive(),
        qty: z.number().int().min(1).max(999),
      }),
    )
    .min(1, "Order must contain at least one item"),
  deliveryAddress: deliveryAddressInput,
  notes: z.string().max(2000).optional(),
});

const ORDER_NO_PREFIX = "MB-2026-";

function formatEta(from: Date): string {
  // Standard wholesale route: delivery within 2 business days.
  const eta = new Date(from);
  let added = 0;
  while (added < 2) {
    eta.setDate(eta.getDate() + 1);
    const day = eta.getDay();
    if (day !== 0 && day !== 6) added += 1;
  }
  return eta.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export const ordersRouter = createRouter({
  create: authedQuery.input(createInput).mutation(async ({ ctx, input }) => {
    const db = getDb();
    const userId = ctx.user.id;

    const ids = [...new Set(input.items.map((item) => item.productId))];
    const found = await db
      .select()
      .from(products)
      .where(inArray(products.id, ids));

    if (found.length !== ids.length) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "One or more products do not exist",
      });
    }

    const byId = new Map(found.map((p) => [p.id, p]));
    for (const item of input.items) {
      const product = byId.get(item.productId)!;
      if (product.stockStatus === "out") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `"${product.name}" is out of stock`,
        });
      }
    }

    // Totals are always computed server-side from DB prices.
    const subtotalCents = input.items.reduce(
      (sum, item) => sum + byId.get(item.productId)!.priceCents * item.qty,
      0,
    );
    const deliveryFeeCents = 0;
    const totalCents = subtotalCents + deliveryFeeCents;
    const placedAt = new Date();

    const orderId = await db.transaction(async (tx) => {
      const latest = await tx.query.orders.findFirst({
        columns: { orderNo: true },
        orderBy: desc(orders.id),
      });
      const lastSeq = latest?.orderNo.startsWith(ORDER_NO_PREFIX)
        ? Number.parseInt(latest.orderNo.slice(ORDER_NO_PREFIX.length), 10)
        : 0;
      const orderNo = `${ORDER_NO_PREFIX}${String(
        (Number.isFinite(lastSeq) ? lastSeq : 0) + 1,
      ).padStart(5, "0")}`;

      const [{ id }] = await tx
        .insert(orders)
        .values({
          orderNo,
          userId,
          status: "placed",
          subtotalCents,
          deliveryFeeCents,
          totalCents,
          deliveryAddress: {
            ...input.deliveryAddress,
            state: "IN",
          },
          placedAt,
          eta: formatEta(placedAt),
          notes: input.notes ?? null,
        })
        .$returningId();

      await tx.insert(orderItems).values(
        input.items.map((item) => {
          const product = byId.get(item.productId)!;
          return {
            orderId: id,
            productId: product.id,
            name: product.name,
            brand: product.brand,
            qty: item.qty,
            priceCents: product.priceCents,
          };
        }),
      );

      return id;
    });

    const order = await db.query.orders.findFirst({
      where: and(eq(orders.id, orderId), eq(orders.userId, userId)),
      with: { items: true },
    });
    return order;
  }),

  mine: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const rows = await db.query.orders.findMany({
      where: eq(orders.userId, ctx.user.id),
      orderBy: desc(orders.placedAt),
      with: { items: { columns: { id: true, qty: true } } },
    });
    return rows.map(({ items, ...order }) => ({
      ...order,
      itemCount: items.length,
      totalQty: items.reduce((sum, item) => sum + item.qty, 0),
    }));
  }),

  byId: authedQuery
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const order = await db.query.orders.findFirst({
        where: and(eq(orders.id, input.id), eq(orders.userId, ctx.user.id)),
        with: { items: true },
      });
      if (!order) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });
      }
      return order;
    }),
});
