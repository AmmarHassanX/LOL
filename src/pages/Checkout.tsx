import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  ShoppingCart,
  Store,
  Truck,
} from 'lucide-react';
import { trpc } from '@/providers/trpc';
import { useAuth } from '@/hooks/useAuth';
import { useCartStore } from '@/store/cart';
import GuestGate from '@/components/checkout/GuestGate';
import CheckoutStepper from '@/components/checkout/CheckoutStepper';
import OrderSuccess from '@/components/checkout/OrderSuccess';
import {
  formatCents,
  useCartPricing,
  type PricedLine,
} from '@/components/checkout/cartPricing';
import { cn } from '@/lib/utils';

/** Indiana ZIP codes are 5 digits beginning with 46 or 47. */
const INDIANA_ZIP = /^4[67]\d{3}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Fulfillment = 'delivery' | 'pickup';

interface PlacedOrder {
  id: number;
  orderNo: string;
  eta: string | null;
  totalCents: number;
}

/** Next delivery days (warehouse closed Sundays). */
function deliveryDays(count = 5): Date[] {
  const days: Date[] = [];
  const d = new Date();
  while (days.length < count) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 0) days.push(new Date(d));
  }
  return days;
}

function formatDay(d: Date): { dow: string; date: string; value: string } {
  return {
    dow: d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
    date: d.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' }),
    value: d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
  };
}

const inputClass =
  'h-11 w-full rounded-lg border border-line bg-paper px-3.5 text-[15px] text-ink placeholder:text-stone/70 transition-colors focus:border-amber focus:outline-none disabled:cursor-not-allowed disabled:bg-paper-2 disabled:text-stone';
const labelClass = 'mb-1.5 block font-mono text-[10px] font-bold tracking-[0.14em] text-stone';

export default function Checkout() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { items, clear } = useCartStore();
  const {
    lines,
    subtotalCents,
    caseCount,
    deliveryFeeCents,
    totalCents,
    freeDelivery,
    hasUnavailable,
    isPricingLoading,
  } = useCartPricing();

  // ── Wizard state ─────────────────────────────────────────────────────────
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [direction, setDirection] = useState(1);
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [fulfillment, setFulfillment] = useState<Fulfillment>('delivery');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [zip, setZip] = useState('');
  const [zipTouched, setZipTouched] = useState(false);
  const [day, setDay] = useState('');
  const [window_, setWindow_] = useState<'Weekday AM' | 'Weekday PM'>('Weekday AM');
  const [notes, setNotes] = useState('');
  const [terms, setTerms] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<PlacedOrder | null>(null);

  const days = useMemo(() => deliveryDays().map(formatDay), []);

  // ── Prefill from account profile ─────────────────────────────────────────
  const profileQuery = trpc.profile.get.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 60_000,
    retry: false,
  });
  const prefilled = useRef(false);
  useEffect(() => {
    if (prefilled.current || !isAuthenticated) return;
    if (profileQuery.isLoading) return;
    const profile = profileQuery.data;
    prefilled.current = true;
    setContactName(
      profile ? `${profile.firstName} ${profile.lastName}`.trim() : (user?.name ?? ''),
    );
    setPhone(profile?.phone ?? '');
    setEmail(user?.email ?? '');
    setBusinessName(profile?.company ?? '');
    setStreet(profile?.address1 ?? '');
    setCity(profile?.city ?? '');
    setZip(profile?.zip ?? '');
  }, [isAuthenticated, profileQuery.isLoading, profileQuery.data, user]);

  // ── Place order ──────────────────────────────────────────────────────────
  const createOrder = trpc.orders.create.useMutation({
    onSuccess: (order) => {
      if (!order) return;
      // Cart clears; the success screen cascades in.
      clear();
      setPlacedOrder({
        id: Number(order.id),
        orderNo: order.orderNo,
        eta: order.eta,
        totalCents: order.totalCents,
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
  });

  const goTo = (next: 1 | 2 | 3) => {
    setDirection(next > step ? 1 : -1);
    setStep(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Validation ───────────────────────────────────────────────────────────
  const step1Valid =
    businessName.trim().length > 0 && contactName.trim().length > 0 && EMAIL_RE.test(email.trim());
  const zipValid = INDIANA_ZIP.test(zip.trim());
  const zipError = zipTouched && zip.trim().length > 0 && !zipValid;
  const step2Valid =
    fulfillment === 'pickup'
      ? true
      : street.trim().length > 0 && city.trim().length > 0 && zipValid && day.length > 0;

  const orderableLines = lines.filter((l) => l.dbId != null && l.stockStatus !== 'out');

  const placeOrder = () => {
    if (!terms || createOrder.isPending || orderableLines.length === 0) return;
    const noteParts: string[] = [];
    if (fulfillment === 'delivery') {
      noteParts.push(`Delivery day: ${day}. Window: ${window_}.`);
      noteParts.push(`Contact: ${contactName} · ${phone || 'no phone'} · ${email}`);
    } else {
      noteParts.push(`CASH & CARRY PICKUP at 4935 W 38th St, Indianapolis. Contact: ${contactName} · ${phone || 'no phone'} · ${email}`);
    }
    if (notes.trim()) noteParts.push(notes.trim());

    createOrder.mutate({
      items: orderableLines.map((l) => ({ productId: l.dbId as number, qty: l.qty })),
      deliveryAddress:
        fulfillment === 'delivery'
          ? {
              businessName: businessName.trim(),
              street: street.trim(),
              city: city.trim(),
              zip: zip.trim(),
            }
          : {
              businessName: businessName.trim(),
              street: '4935 W 38th St',
              city: 'Indianapolis',
              zip: '46222',
            },
      notes: noteParts.join('\n'),
    });
  };

  // ── Success screen replaces the wizard ───────────────────────────────────
  if (placedOrder) {
    return (
      <OrderSuccess
        orderId={placedOrder.id}
        orderNo={placedOrder.orderNo}
        eta={placedOrder.eta}
        totalCents={placedOrder.totalCents}
      />
    );
  }

  // ── Auth gates ───────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="mx-auto max-w-[1100px] px-6 py-16 md:py-24">
        <div className="h-10 w-56 animate-pulse rounded-lg bg-paper-2" />
        <div className="mt-10 grid gap-8 lg:grid-cols-12">
          <div className="h-96 animate-pulse rounded-xl border border-line bg-paper-2 lg:col-span-8" />
          <div className="h-96 animate-pulse rounded-xl border border-line bg-paper-2 lg:col-span-4" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <GuestGate
        title="Sign in to check out"
        description="Checkout is reserved for approved MB Wholesale customers. Sign in — or create a free wholesale account — to see your pricing and place this order."
        note="YOUR CART IS SAVED AND WILL BE WAITING"
      />
    );
  }

  // ── Empty cart ───────────────────────────────────────────────────────────
  if (items.length === 0) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-[1100px] flex-col items-center justify-center px-6 py-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="flex flex-col items-center"
        >
          <span className="flex h-20 w-20 items-center justify-center rounded-full border border-line text-stone">
            <ShoppingCart className="h-8 w-8" strokeWidth={1.75} />
          </span>
          <h1 className="mt-6 font-display text-3xl font-bold tracking-tight text-ink">
            Nothing to check out yet
          </h1>
          <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-stone">
            Add a few cases to your cart first — delivery is free statewide over $500.
          </p>
          <Link
            to="/products"
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-amber px-6 py-3 text-sm font-semibold text-paper transition-all duration-150 hover:bg-amber-deep active:scale-[0.97]"
          >
            Browse Catalog
            <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1100px] px-6 py-16 md:py-24">
      {/* Header */}
      <p className="font-mono text-[11px] font-bold tracking-[0.18em] text-amber">
        {'// SECURE CHECKOUT'}
      </p>
      <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-ink md:text-5xl">
        Checkout
      </h1>
      <div className="mt-8">
        <CheckoutStepper step={step} />
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-12">
        {/* ── Steps ──────────────────────────────────────────────────────── */}
        <div className="lg:col-span-8">
          <AnimatePresence mode="wait" initial={false} custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              initial={{ opacity: 0, x: 32 * direction }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -32 * direction }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              {step === 1 && (
                <section className="rounded-xl border border-line bg-paper p-6 md:p-8">
                  <h2 className="font-display text-xl font-bold tracking-tight text-ink">
                    Contact & Business
                  </h2>
                  <p className="mt-1.5 text-sm text-stone">
                    Prefilled from your wholesale account — edit anything that changed.
                  </p>

                  <div className="mt-6 grid gap-5 sm:grid-cols-2">
                    <div>
                      <label htmlFor="co-contact" className={labelClass}>
                        CONTACT NAME *
                      </label>
                      <input
                        id="co-contact"
                        className={inputClass}
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        placeholder="Jane Doe"
                        autoComplete="name"
                      />
                    </div>
                    <div>
                      <label htmlFor="co-phone" className={labelClass}>
                        PHONE
                      </label>
                      <input
                        id="co-phone"
                        className={inputClass}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="(317) 803-9060"
                        autoComplete="tel"
                      />
                    </div>
                    <div>
                      <label htmlFor="co-email" className={labelClass}>
                        EMAIL *
                      </label>
                      <input
                        id="co-email"
                        type="email"
                        className={inputClass}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@business.com"
                        autoComplete="email"
                      />
                    </div>
                    <div>
                      <label htmlFor="co-business" className={labelClass}>
                        BUSINESS NAME *
                      </label>
                      <input
                        id="co-business"
                        className={inputClass}
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        placeholder="Hoosier Mart LLC"
                        autoComplete="organization"
                      />
                    </div>
                  </div>

                  <div className="mt-8 flex justify-end">
                    <button
                      type="button"
                      disabled={!step1Valid}
                      onClick={() => goTo(2)}
                      className="inline-flex items-center gap-2 rounded-lg bg-amber px-8 py-3.5 text-sm font-semibold text-paper transition-all duration-150 hover:bg-amber-deep active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Continue
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </section>
              )}

              {step === 2 && (
                <section className="rounded-xl border border-line bg-paper p-6 md:p-8">
                  <h2 className="font-display text-xl font-bold tracking-tight text-ink">
                    Delivery
                  </h2>
                  <p className="mt-1.5 text-sm text-stone">
                    We deliver everywhere in Indiana — or pick up at the warehouse.
                  </p>

                  {/* Fulfillment radio cards */}
                  <div className="mt-6 grid gap-4 sm:grid-cols-2" role="radiogroup" aria-label="Fulfillment method">
                    <button
                      type="button"
                      role="radio"
                      aria-checked={fulfillment === 'delivery'}
                      onClick={() => setFulfillment('delivery')}
                      className={cn(
                        'rounded-xl border p-5 text-left transition-all duration-200 active:scale-[0.98]',
                        fulfillment === 'delivery'
                          ? 'border-amber bg-amber-soft/60 shadow-[0_0_0_1px_hsl(var(--brand-accent))]'
                          : 'border-line bg-paper hover:border-stone',
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <Truck
                          className={cn('h-5 w-5', fulfillment === 'delivery' ? 'text-amber-deep' : 'text-stone')}
                        />
                        <span
                          className={cn(
                            'flex h-4 w-4 items-center justify-center rounded-full border',
                            fulfillment === 'delivery' ? 'border-amber bg-amber' : 'border-line',
                          )}
                        >
                          {fulfillment === 'delivery' && <Check className="h-3 w-3 text-paper" strokeWidth={3.5} />}
                        </span>
                      </div>
                      <p className="mt-3 font-mono text-[11px] font-bold tracking-[0.14em] text-ink">
                        DELIVERY — STATEWIDE IN INDIANA
                      </p>
                      <p className="mt-1.5 font-mono text-[10px] tracking-[0.12em] text-stone">
                        {freeDelivery ? 'FREE · ~48 HRS' : 'FREE OVER $500 · ~48 HRS'}
                      </p>
                    </button>

                    <button
                      type="button"
                      role="radio"
                      aria-checked={fulfillment === 'pickup'}
                      onClick={() => setFulfillment('pickup')}
                      className={cn(
                        'rounded-xl border p-5 text-left transition-all duration-200 active:scale-[0.98]',
                        fulfillment === 'pickup'
                          ? 'border-amber bg-amber-soft/60 shadow-[0_0_0_1px_hsl(var(--brand-accent))]'
                          : 'border-line bg-paper hover:border-stone',
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <Store
                          className={cn('h-5 w-5', fulfillment === 'pickup' ? 'text-amber-deep' : 'text-stone')}
                        />
                        <span
                          className={cn(
                            'flex h-4 w-4 items-center justify-center rounded-full border',
                            fulfillment === 'pickup' ? 'border-amber bg-amber' : 'border-line',
                          )}
                        >
                          {fulfillment === 'pickup' && <Check className="h-3 w-3 text-paper" strokeWidth={3.5} />}
                        </span>
                      </div>
                      <p className="mt-3 font-mono text-[11px] font-bold tracking-[0.14em] text-ink">
                        CASH & CARRY PICKUP
                      </p>
                      <p className="mt-1.5 font-mono text-[10px] tracking-[0.12em] text-stone">
                        4935 W 38TH ST, INDIANAPOLIS
                      </p>
                    </button>
                  </div>

                  {fulfillment === 'delivery' && (
                    <div className="mt-6 grid gap-5 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <label htmlFor="co-street" className={labelClass}>
                          STREET ADDRESS *
                        </label>
                        <input
                          id="co-street"
                          className={inputClass}
                          value={street}
                          onChange={(e) => setStreet(e.target.value)}
                          placeholder="123 Main St"
                          autoComplete="street-address"
                        />
                      </div>
                      <div>
                        <label htmlFor="co-city" className={labelClass}>
                          CITY *
                        </label>
                        <input
                          id="co-city"
                          className={inputClass}
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="Fort Wayne"
                          autoComplete="address-level2"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="co-state" className={labelClass}>
                            STATE
                          </label>
                          <input id="co-state" className={inputClass} value="IN" disabled aria-describedby="co-state-note" />
                        </div>
                        <div>
                          <label htmlFor="co-zip" className={labelClass}>
                            ZIP *
                          </label>
                          <input
                            id="co-zip"
                            className={cn(inputClass, zipError && 'border-amber-deep bg-amber-soft/40')}
                            value={zip}
                            onChange={(e) => setZip(e.target.value.replace(/\D/g, '').slice(0, 5))}
                            onBlur={() => setZipTouched(true)}
                            placeholder="46222"
                            inputMode="numeric"
                            autoComplete="postal-code"
                            aria-invalid={zipError}
                          />
                        </div>
                      </div>
                      <p id="co-state-note" className="-mt-2 font-mono text-[10px] tracking-[0.12em] text-stone sm:col-span-2">
                        INDIANA-ONLY DELIVERY — STATE IS LOCKED TO IN
                      </p>
                      {zipError && (
                        <motion.p
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center gap-1.5 font-mono text-[11px] font-bold tracking-wide text-amber-deep sm:col-span-2"
                          role="alert"
                        >
                          <AlertTriangle className="h-3.5 w-3.5" />
                          We deliver within Indiana only.
                        </motion.p>
                      )}

                      <div className="sm:col-span-2">
                        <span className={labelClass}>DELIVERY DAY *</span>
                        <div className="flex flex-wrap gap-2">
                          {days.map((d) => (
                            <button
                              key={d.value}
                              type="button"
                              onClick={() => setDay(d.value)}
                              aria-pressed={day === d.value}
                              className={cn(
                                'rounded-lg border px-4 py-2.5 text-center transition-all duration-150 active:scale-[0.96]',
                                day === d.value
                                  ? 'border-amber bg-amber-soft/60 shadow-[0_0_0_1px_hsl(var(--brand-accent))]'
                                  : 'border-line hover:border-stone',
                              )}
                            >
                              <span className="block font-mono text-[11px] font-bold tracking-wider text-ink">
                                {d.dow}
                              </span>
                              <span className="mt-0.5 block font-mono text-[10px] text-stone">
                                {d.date}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label htmlFor="co-window" className={labelClass}>
                          DELIVERY WINDOW
                        </label>
                        <select
                          id="co-window"
                          className={inputClass}
                          value={window_}
                          onChange={(e) => setWindow_(e.target.value as 'Weekday AM' | 'Weekday PM')}
                        >
                          <option value="Weekday AM">Weekday AM (7:00 – 12:00)</option>
                          <option value="Weekday PM">Weekday PM (12:00 – 5:00)</option>
                        </select>
                      </div>
                    </div>
                  )}

                  <div className="mt-6">
                    <label htmlFor="co-notes" className={labelClass}>
                      ORDER NOTES
                    </label>
                    <textarea
                      id="co-notes"
                      rows={3}
                      className="w-full rounded-lg border border-line bg-paper px-3.5 py-3 text-[15px] text-ink placeholder:text-stone/70 transition-colors focus:border-amber focus:outline-none"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Loading dock instructions, substitutions, timing…"
                      maxLength={1500}
                    />
                  </div>

                  <div className="mt-8 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => goTo(1)}
                      className="inline-flex items-center gap-2 text-sm font-semibold text-stone transition-colors hover:text-ink"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Back
                    </button>
                    <button
                      type="button"
                      disabled={!step2Valid}
                      onClick={() => goTo(3)}
                      className="inline-flex items-center gap-2 rounded-lg bg-amber px-8 py-3.5 text-sm font-semibold text-paper transition-all duration-150 hover:bg-amber-deep active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Review Order
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </section>
              )}

              {step === 3 && (
                <section className="rounded-xl border border-line bg-paper p-6 md:p-8">
                  <h2 className="font-display text-xl font-bold tracking-tight text-ink">
                    Review & Place Order
                  </h2>

                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-lg border border-line bg-paper-2/50 p-4">
                      <p className="font-mono text-[10px] font-bold tracking-[0.14em] text-stone">
                        CONTACT
                      </p>
                      <p className="mt-2 text-sm font-semibold text-ink">{contactName}</p>
                      <p className="mt-0.5 text-sm text-stone">{businessName}</p>
                      <p className="mt-0.5 font-mono text-xs text-stone">{email}</p>
                      {phone && <p className="mt-0.5 font-mono text-xs text-stone">{phone}</p>}
                    </div>
                    <div className="rounded-lg border border-line bg-paper-2/50 p-4">
                      <p className="font-mono text-[10px] font-bold tracking-[0.14em] text-stone">
                        {fulfillment === 'delivery' ? 'DELIVERY' : 'PICKUP'}
                      </p>
                      {fulfillment === 'delivery' ? (
                        <>
                          <p className="mt-2 text-sm font-semibold text-ink">
                            {street}, {city}, IN {zip}
                          </p>
                          <p className="mt-0.5 font-mono text-xs text-stone">
                            {day} · {window_.toUpperCase()}
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="mt-2 text-sm font-semibold text-ink">Cash & Carry</p>
                          <p className="mt-0.5 font-mono text-xs text-stone">
                            4935 W 38TH ST, INDIANAPOLIS, IN 46254
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Items */}
                  <ul className="mt-6 divide-y divide-line rounded-lg border border-line">
                    {lines.map((line) => (
                      <ReviewLine key={line.productId} line={line} />
                    ))}
                  </ul>
                  {hasUnavailable && (
                    <p className="mt-2 flex items-center gap-1.5 font-mono text-[11px] tracking-wide text-amber-deep">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Unavailable items will be excluded from this order.
                    </p>
                  )}

                  {notes.trim() && (
                    <div className="mt-4 rounded-lg border border-line bg-paper-2/50 p-4">
                      <p className="font-mono text-[10px] font-bold tracking-[0.14em] text-stone">
                        NOTES
                      </p>
                      <p className="mt-1.5 whitespace-pre-line text-sm text-ink">{notes}</p>
                    </div>
                  )}

                  {/* Terms */}
                  <label className="mt-6 flex cursor-pointer items-start gap-3">
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={terms}
                      onClick={() => setTerms((t) => !t)}
                      className={cn(
                        'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors',
                        terms ? 'border-amber bg-amber text-paper' : 'border-line bg-paper',
                      )}
                    >
                      {terms && <Check className="h-3.5 w-3.5" strokeWidth={3.5} />}
                    </button>
                    <span className="text-sm leading-relaxed text-stone">
                      I confirm this wholesale order and agree to MB Wholesale's terms of sale.
                      Prices are wholesale per case; payment is due on delivery or per account
                      terms.
                    </span>
                  </label>

                  {createOrder.error && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      role="alert"
                      className="mt-4 flex items-start gap-2 rounded-lg border border-amber-deep/40 bg-amber-soft/50 px-4 py-3 text-sm font-medium text-amber-deep"
                    >
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                      {createOrder.error.message}
                    </motion.p>
                  )}

                  <div className="mt-8 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => goTo(2)}
                      className="inline-flex items-center gap-2 text-sm font-semibold text-stone transition-colors hover:text-ink"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={placeOrder}
                      disabled={!terms || createOrder.isPending || orderableLines.length === 0}
                      className="inline-flex items-center gap-2 rounded-lg bg-amber px-8 py-4 text-sm font-semibold text-paper transition-all duration-150 hover:bg-amber-deep active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {createOrder.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Placing Order…
                        </>
                      ) : (
                        <>
                          Place Order · {formatCents(totalCents)}
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  </div>
                </section>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── Sidebar summary ────────────────────────────────────────────── */}
        <div className="lg:col-span-4">
          <div className="rounded-xl border border-line bg-paper p-6 lg:sticky lg:top-[150px]">
            <h2 className="font-display text-lg font-bold tracking-tight text-ink">
              Order Summary
            </h2>

            <ul className="mt-4 space-y-3">
              {lines.map((line) => (
                <li key={line.productId} className="flex items-center gap-3">
                  <span className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-line bg-paper-2">
                    <img
                      src={line.image ?? '/product-placeholder.jpg'}
                      alt=""
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-ink">
                      {line.name}
                    </span>
                    <span className="font-mono text-[10px] tracking-wide text-stone">
                      ×{line.qty} CASE{line.qty === 1 ? '' : 'S'}
                    </span>
                  </span>
                  <span className="font-mono text-xs font-medium text-ink">
                    {line.lineTotalCents != null ? formatCents(line.lineTotalCents) : '—'}
                  </span>
                </li>
              ))}
            </ul>

            <dl className="mt-5 space-y-2.5 border-t border-line pt-4">
              <div className="flex items-center justify-between">
                <dt className="font-mono text-[11px] tracking-[0.14em] text-stone">SUBTOTAL</dt>
                <dd className="font-mono text-sm text-ink">
                  {isPricingLoading ? '—' : formatCents(subtotalCents)}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="font-mono text-[11px] tracking-[0.14em] text-stone">
                  CASES · {caseCount}
                </dt>
                <dd className="font-mono text-sm text-ink" />
              </div>
              <div className="flex items-center justify-between">
                <dt className="font-mono text-[11px] tracking-[0.14em] text-stone">DELIVERY</dt>
                <dd className={cn('font-mono text-sm font-bold', freeDelivery ? 'text-forest' : 'text-ink')}>
                  {fulfillment === 'pickup' || freeDelivery ? 'FREE' : formatCents(deliveryFeeCents)}
                </dd>
              </div>
              <div className="flex items-center justify-between border-t border-line pt-3">
                <dt className="font-mono text-[11px] font-bold tracking-[0.14em] text-ink">TOTAL</dt>
                <dd className="font-display text-xl font-bold tracking-tight text-ink">
                  {isPricingLoading ? '—' : formatCents(fulfillment === 'pickup' ? subtotalCents : totalCents)}
                </dd>
              </div>
            </dl>

            <div className="mt-5 overflow-hidden rounded-xl border border-line">
              <img
                src="/delivery-truck.jpg"
                alt="MB Wholesale delivery truck on an Indiana highway"
                className="h-32 w-full object-cover"
                loading="lazy"
              />
            </div>
            <p className="mt-3 flex items-center justify-center gap-1.5 rounded-full bg-amber-soft px-3 py-1.5 font-mono text-[10px] font-bold tracking-[0.14em] text-amber-deep">
              <Truck className="h-3.5 w-3.5" />
              {fulfillment === 'pickup'
                ? 'PICKUP: INDIANAPOLIS, IN'
                : `DELIVERING TO: ${city.trim() ? city.trim().toUpperCase() : 'INDIANA'}, IN`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReviewLine({ line }: { line: PricedLine }) {
  return (
    <li className="flex items-center gap-4 p-4">
      <span className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-line bg-paper-2">
        <img
          src={line.image ?? '/product-placeholder.jpg'}
          alt=""
          className="h-full w-full object-cover"
          loading="lazy"
        />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-ink">{line.name}</span>
        <span className="font-mono text-[10px] uppercase tracking-wide text-stone">
          {line.brand} · {line.caseSize} · ×{line.qty}
        </span>
      </span>
      <span className="font-mono text-sm font-bold text-ink">
        {line.lineTotalCents != null ? formatCents(line.lineTotalCents) : '—'}
      </span>
    </li>
  );
}
