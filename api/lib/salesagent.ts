import { env } from "./env";

/**
 * SalesAgent ERP client — catalog/browsing endpoints only.
 *
 * ============================== IMPORTANT ==============================
 * This file was written by studying the ORIGINAL Next.js site's source
 * code (src/AsyncFunctions/*.js), which had a working SalesAgent
 * integration. Every endpoint path, param, and response-shape assumption
 * below is taken directly from that code — not guessed.
 *
 * HOWEVER: this sandbox's network egress does not allow
 * mbwholesale.salesgenterp.com (confirmed: a direct request returns
 * "Host not in allowlist"). That means none of this has been executed
 * against the real API — only type-checked and reviewed against the
 * source it was ported from. Treat every function here as
 * reviewed-but-unverified until it's actually run once deployed
 * (Vercel's network is not sandboxed the way this environment is).
 * =========================================================================
 *
 * What this file deliberately does NOT cover: checkout/payment, cart
 * mutation, and full account management. In the original site those were
 * partly handled by a closed-source vendor package
 * (@salesgenterp/ui-components) whose internals aren't visible from the
 * source code alone — see the conversation notes for why that's a
 * separate, harder problem than the read-only catalog endpoints below.
 */

const BASE = env.salesAgentApiBaseUrl;
const BUSINESS_TYPE_ID = env.salesAgentBusinessTypeId;
const DEFAULT_STORE_ID = env.salesAgentStoreId;

async function salesAgentFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`SalesAgent ${path} -> HTTP ${res.status}: ${body.slice(0, 300)}`);
  }
  const json = (await res.json()) as { result: T };
  return json.result;
}

function authHeaders(token?: string): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ---------------------------------------------------------------------------
// Menu / categories — GET /menu?businessTypeId=X
// ---------------------------------------------------------------------------
export interface SalesAgentMenuCategory {
  id: number;
  name: string;
  alias?: string;
  src?: string; // category icon/image URL, when SalesAgent has one set
  children?: SalesAgentMenuCategory[];
}

export function getMenu(businessTypeId: string = BUSINESS_TYPE_ID) {
  return salesAgentFetch<SalesAgentMenuCategory[]>(`/menu?businessTypeId=${businessTypeId}`);
}

// ---------------------------------------------------------------------------
// Business type — GET /store/businessType
// Useful to confirm the businessTypeId assumption above against the live
// account rather than trusting the inferred default.
// ---------------------------------------------------------------------------
export interface SalesAgentBusinessType {
  id: number;
  name: string;
}

export function getBusinessTypes() {
  return salesAgentFetch<SalesAgentBusinessType[]>(`/store/businessType`);
}

// ---------------------------------------------------------------------------
// Product listing by category — GET /ecommerce/product/category
// ---------------------------------------------------------------------------
export interface SalesAgentProduct {
  productId: number;
  productName: string;
  alias?: string;
  brand?: string;
  standardPrice?: number;
  standardPriceWithoutDiscount?: number;
  imageUrl?: string;
  stockStatus?: string;
  [key: string]: unknown; // the original code accessed fields defensively
  // (data?.result etc.) — SalesAgent's actual product DTO is larger than
  // what any single page in the old site used, so this stays loose
  // rather than pretending to a fully-known shape.
}

export interface SalesAgentProductPage {
  content: SalesAgentProduct[];
  totalElements: number;
  totalPages: number;
}

export function listProductsByCategory(params: {
  categoryIdList: number | string;
  page?: number;
  size?: number;
  sort?: string;
  sortDirection?: "asc" | "desc";
  storeIds?: string;
}) {
  const {
    categoryIdList,
    page = 0,
    size = 20,
    sort = "id",
    sortDirection = "desc",
    storeIds = DEFAULT_STORE_ID,
  } = params;
  const qs = new URLSearchParams({
    categoryIdList: String(categoryIdList),
    page: String(page),
    size: String(size),
    sort,
    sortDirection,
    storeIds,
  });
  return salesAgentFetch<SalesAgentProductPage>(`/ecommerce/product/category?${qs}`);
}

// ---------------------------------------------------------------------------
// Search — GET /ecommerce/product/searchByProductOrCategory
// (This is the endpoint the smart-search work earlier assumed would
// eventually back the search bar — SalesAgent does its own matching
// server-side here; there was no evidence in the original code of what
// ranking algorithm it uses internally.)
// ---------------------------------------------------------------------------
export function searchProducts(searchInput: string) {
  return salesAgentFetch<SalesAgentProduct[]>(
    `/ecommerce/product/searchByProductOrCategory?searchInput=${encodeURIComponent(searchInput)}`,
  );
}

// ---------------------------------------------------------------------------
// Single product + related products
// ---------------------------------------------------------------------------
export function getProduct(id: number | string, storeIds: string = DEFAULT_STORE_ID) {
  return salesAgentFetch<SalesAgentProduct>(`/ecommerce/product/${id}?storeIds=${storeIds}`);
}

export function getRelatedProducts(id: number | string, storeIds: string = DEFAULT_STORE_ID) {
  return salesAgentFetch<SalesAgentProduct[]>(
    `/ecommerce/product/${id}/relatedProduct?storeIds=${storeIds}`,
  );
}

// ---------------------------------------------------------------------------
// Brands — GET /brand/list, GET /ecommerce/product/brand
// ---------------------------------------------------------------------------
export interface SalesAgentBrand {
  id: number;
  name: string;
}

export function listBrands() {
  return salesAgentFetch<SalesAgentBrand[]>(`/brand/list`);
}

export function getProductsByBrand(brandIdList: string) {
  // NOTE: the original code called this with a hardcoded brandIdList=332
  // (looked like leftover debug code, not a real pattern) — the signature
  // here takes it as a real param instead of copying that.
  return salesAgentFetch<SalesAgentProduct[]>(`/ecommerce/product/brand?brandIdList=${brandIdList}`);
}

// ---------------------------------------------------------------------------
// Deal tags — GET /home/productTagList, GET /home/product/tagId/:id
// These are the merchandising tags used for things like "Nick's Daily
// Deal" / "Weekly Special" sections — real ERP-driven promotional
// groupings, not hardcoded marketing copy.
// ---------------------------------------------------------------------------
export interface SalesAgentTag {
  id: number;
  name: string;
}

export function getTagList() {
  return salesAgentFetch<SalesAgentTag[]>(`/home/productTagList`);
}

export function getProductsByTag(params: {
  tagId: number | string;
  page?: number;
  size?: number;
  businessTypeId?: string;
  storeId?: string;
}) {
  const {
    tagId,
    page = 0,
    size = 10,
    businessTypeId = BUSINESS_TYPE_ID,
    storeId = DEFAULT_STORE_ID,
  } = params;
  return salesAgentFetch<SalesAgentProductPage>(
    `/home/product/tagId/${tagId}?page=${page}&size=${size}&businessTypeId=${businessTypeId}&storeId=${storeId}`,
  );
}

// ---------------------------------------------------------------------------
// Auth (login only, for now) — POST /authenticate, GET /ecommerce/customer
// Included here because the catalog can meaningfully use it (wholesale
// prices are gated behind login on the original site), but full account
// management (registration with document upload, password reset, child
// account switching) is intentionally NOT built out yet — see the file
// header note about scope.
// ---------------------------------------------------------------------------
export interface SalesAgentAuthResult {
  access: string;
  refresh: string;
}

export function login(username: string, password: string) {
  return salesAgentFetch<SalesAgentAuthResult>(`/authenticate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password, type: "customer" }),
  });
}

export interface SalesAgentCustomer {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  [key: string]: unknown;
}

export function getCustomer(token: string) {
  return salesAgentFetch<SalesAgentCustomer>(`/ecommerce/customer`, {
    headers: authHeaders(token),
  });
}
