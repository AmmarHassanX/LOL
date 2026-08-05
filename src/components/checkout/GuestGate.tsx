import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';
import { LOGIN_PATH } from '@/const';

interface GuestGateProps {
  title: string;
  description: string;
  /** mono footnote, e.g. "YOUR CART IS SAVED AND WILL BE WAITING" */
  note?: string;
}

/** Centered sign-in gate for guest visitors on cart / checkout routes. */
export default function GuestGate({ title, description, note }: GuestGateProps) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-[1100px] items-center justify-center px-6 py-24">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md rounded-xl border border-line bg-paper p-10 text-center shadow-[0_12px_32px_-12px_rgba(22,21,15,0.12)]"
      >
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-soft text-amber-deep">
          <Lock className="h-7 w-7" strokeWidth={2.25} />
        </span>
        <p className="mt-6 font-mono text-[11px] font-bold tracking-[0.18em] text-amber">
          {'// WHOLESALE ACCOUNT REQUIRED'}
        </p>
        <h1 className="mt-3 font-display text-2xl font-bold tracking-tight text-ink">{title}</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-stone">{description}</p>
        <div className="mt-8 flex flex-col gap-3">
          <Link
            to={LOGIN_PATH}
            className="inline-flex w-full items-center justify-center rounded-lg bg-amber px-6 py-3.5 text-sm font-semibold text-paper transition-all duration-150 hover:bg-amber-deep active:scale-[0.97]"
          >
            Sign In
          </Link>
          <Link
            to={LOGIN_PATH}
            className="inline-flex w-full items-center justify-center rounded-lg border border-line bg-transparent px-6 py-3.5 text-sm font-semibold text-ink transition-all duration-150 hover:border-ink active:scale-[0.97]"
          >
            Create Account
          </Link>
        </div>
        {note && (
          <p className="mt-6 font-mono text-[10px] tracking-[0.14em] text-stone">{note}</p>
        )}
      </motion.div>
    </div>
  );
}
