import type { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutGrid,
  Package,
  Truck,
  User as UserIcon,
  LogOut,
  Lock,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { trpc } from '@/providers/trpc';
import { LOGIN_PATH } from '@/const';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Toaster } from '@/components/ui/sonner';

const NAV_ITEMS = [
  { label: 'Dashboard', to: '/account', icon: LayoutGrid, match: (p: string) => p === '/account' },
  { label: 'Orders', to: '/account/orders', icon: Package, match: (p: string) => p === '/account/orders' },
  { label: 'Track Order', to: '/account/orders', icon: Truck, match: (p: string) => /^\/account\/orders\/\d+/.test(p) },
  { label: 'Profile & Addresses', to: '/account#profile', icon: UserIcon, match: () => false },
];

function initials(name: string | null | undefined, email: string | null | undefined): string {
  const src = (name ?? '').trim() || (email ?? '').trim();
  if (!src) return 'MB';
  const parts = src.split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return src.slice(0, 2).toUpperCase();
}

function Rail() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const profileQuery = trpc.profile.get.useQuery(undefined, { retry: false });
  const businessName = profileQuery.data?.businessName ?? user?.name ?? 'Wholesale Customer';

  return (
    <aside className="lg:sticky lg:top-24 lg:self-start">
      {/* user card */}
      <div className="flex items-center gap-3 border-b border-line pb-5 lg:pr-6">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-soft font-display text-sm font-bold text-amber-deep">
          {initials(user?.name, user?.email)}
        </span>
        <div className="min-w-0">
          <p className="truncate font-display text-[15px] font-semibold text-ink">{businessName}</p>
          <p className="truncate font-mono text-[11px] text-stone">{user?.email ?? ''}</p>
        </div>
      </div>

      {/* nav — horizontal scroll tab bar on mobile, vertical rail on desktop */}
      <nav className="-mx-1 flex gap-1 overflow-x-auto px-1 py-4 lg:mx-0 lg:flex-col lg:gap-0.5 lg:overflow-visible lg:px-0 lg:pr-6">
        {NAV_ITEMS.map((item) => {
          const active = item.match(location.pathname);
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              to={item.to}
              className={cn(
                'relative flex shrink-0 items-center gap-2.5 rounded-md px-3 py-2.5 font-display text-[15px] font-semibold whitespace-nowrap transition-colors',
                active ? 'text-amber-deep' : 'text-ink hover:bg-paper-2',
              )}
            >
              {active && (
                <motion.span
                  layoutId="account-nav-indicator"
                  className="absolute top-1/2 left-0 h-5 w-0.5 -translate-y-1/2 rounded-full bg-amber"
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              )}
              <Icon className={cn('h-4 w-4', active ? 'text-amber' : 'text-stone')} />
              {item.label}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => {
            logout();
            navigate('/');
          }}
          className="relative flex shrink-0 items-center gap-2.5 rounded-md px-3 py-2.5 font-display text-[15px] font-semibold whitespace-nowrap text-stone transition-colors hover:bg-paper-2 hover:text-ink lg:mt-6"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </nav>
    </aside>
  );
}

/** Elegant gate shown to guests — links to the shared login flow. */
function SignInGate() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-[1280px] items-center justify-center px-6 py-24 lg:px-12">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-md rounded-xl border border-line bg-paper p-8 text-center shadow-[0_12px_32px_-12px_rgba(22,21,15,0.12)]"
      >
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-soft">
          <Lock className="h-5 w-5 text-amber-deep" />
        </span>
        <p className="mt-5 font-mono text-xs font-bold tracking-[0.18em] text-amber">// ACCOUNT ACCESS</p>
        <h1 className="mt-3 font-display text-2xl font-bold tracking-tight text-ink">
          Sign in to your wholesale account
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-stone">
          Order history, live tracking and wholesale pricing are available to registered MB
          Wholesale customers.
        </p>
        <Button asChild className="mt-6 w-full bg-amber text-paper hover:bg-amber-deep">
          <Link to={LOGIN_PATH}>
            Sign In
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
        <p className="mt-4 font-mono text-[11px] tracking-wider text-stone">
          NEW CUSTOMER? SIGN IN TO GET VERIFIED
        </p>
      </motion.div>
    </div>
  );
}

function ShellSkeleton() {
  return (
    <div className="mx-auto max-w-[1280px] px-6 py-12 lg:px-12">
      <div className="grid gap-10 lg:grid-cols-[220px_1fr]">
        <div className="space-y-3">
          <Skeleton className="h-11 w-11 rounded-full" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

/**
 * Account-area shell: auth gate + 2-col layout (left rail nav + content).
 * Renders the sign-in gate for guests, a skeleton while auth state loads.
 */
export default function AccountShell({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <ShellSkeleton />;
  if (!isAuthenticated) return <SignInGate />;

  return (
    <div className="mx-auto max-w-[1280px] px-6 py-10 lg:px-12 lg:py-14">
      <div className="grid gap-8 lg:grid-cols-[220px_1fr] lg:gap-0">
        <div className="lg:border-r lg:border-line">
          <Rail />
        </div>
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="min-w-0 lg:pl-10"
        >
          {children}
        </motion.div>
      </div>
      <Toaster position="bottom-right" />
    </div>
  );
}
