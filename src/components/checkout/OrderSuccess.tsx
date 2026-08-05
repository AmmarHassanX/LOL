import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Check, Copy } from 'lucide-react';
import { formatCents } from './cartPricing';

interface OrderSuccessProps {
  orderId: number;
  orderNo: string;
  eta: string | null;
  totalCents: number;
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.55 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' as const } },
};

/** Animated order confirmation — replaces the checkout wizard on success. */
export default function OrderSuccess({ orderId, orderNo, eta, totalCents }: OrderSuccessProps) {
  const [copied, setCopied] = useState(false);

  const copyOrderNo = async () => {
    try {
      await navigator.clipboard.writeText(orderNo);
    } catch {
      // clipboard unavailable — still show feedback
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="mx-auto flex max-w-[1100px] items-center justify-center px-6 py-16 md:py-24">
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="w-full max-w-lg rounded-xl border border-line bg-paper p-10 text-center shadow-[0_12px_32px_-12px_rgba(22,21,15,0.12)]"
      >
        <motion.svg
          viewBox="0 0 52 52"
          className="mx-auto h-20 w-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.circle
            cx="26"
            cy="26"
            r="24"
            fill="none"
            stroke="#2F5D3A"
            strokeWidth="2"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
          <motion.path
            d="M15 27l7.5 7.5L37 19"
            fill="none"
            stroke="#2F5D3A"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.4, delay: 0.5, ease: 'easeOut' }}
          />
        </motion.svg>

        <motion.p
          variants={item}
          className="mt-6 font-mono text-[11px] font-bold tracking-[0.18em] text-forest"
        >
          {'// ORDER CONFIRMED'}
        </motion.p>
        <motion.h1
          variants={item}
          className="mt-3 font-display text-3xl font-bold tracking-tight text-ink"
        >
          Order placed!
        </motion.h1>

        <motion.div variants={item} className="mt-5 flex items-center justify-center gap-2">
          <span className="rounded-lg border border-line bg-paper-2 px-4 py-2 font-mono text-sm font-bold tracking-wider text-ink">
            {orderNo}
          </span>
          <button
            type="button"
            onClick={copyOrderNo}
            aria-label="Copy order number"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-line text-stone transition-colors hover:border-ink hover:text-ink"
          >
            {copied ? <Check className="h-4 w-4 text-forest" /> : <Copy className="h-4 w-4" />}
          </button>
        </motion.div>

        <motion.p variants={item} className="mt-4 font-mono text-[11px] tracking-[0.14em] text-stone">
          {eta ? `ESTIMATED DELIVERY: ${eta.toUpperCase()}` : 'ESTIMATED DELIVERY: WITHIN 48 HRS'}
        </motion.p>
        <motion.p variants={item} className="mt-1.5 font-mono text-[11px] tracking-[0.14em] text-stone">
          ORDER TOTAL: {formatCents(totalCents)}
        </motion.p>

        <motion.div variants={item} className="mt-8 flex flex-col gap-3">
          <Link
            to={`/account/orders/${orderId}`}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-amber px-6 py-3.5 text-sm font-semibold text-paper transition-all duration-150 hover:bg-amber-deep active:scale-[0.97]"
          >
            Track Order
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/products"
            className="inline-flex w-full items-center justify-center rounded-lg border border-line bg-transparent px-6 py-3.5 text-sm font-semibold text-ink transition-all duration-150 hover:border-ink active:scale-[0.97]"
          >
            Continue Shopping
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
