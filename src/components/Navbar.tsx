import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpRight, ChevronDown, LogOut, Menu, Package, Search, ShoppingCart, Truck, UserRound, X } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import SearchOverlay from '@/components/SearchOverlay';
import { useCartCount, useCartStore } from '@/store/cart';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CATEGORIES, WAREHOUSE } from '@/data/catalog';
import { LOGIN_PATH } from '@/const';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

const NAV_LINKS = [
  { to: '/products', label: 'Products', mega: true },
  { to: '/products#brands', label: 'Brands' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const count = useCartCount();
  const openDrawer = useCartStore((s) => s.openDrawer);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Cmd/Ctrl+K opens the global search overlay from anywhere in the app.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-50 h-[72px] border-b border-line bg-paper transition-all duration-300',
          scrolled && 'bg-paper/85 backdrop-blur-md',
        )}
      >
        <div className="mx-auto flex h-full max-w-[1280px] items-center justify-between gap-4 px-6 lg:px-12">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-3">
            <img src="/logo.svg" alt="MB Wholesale" className="h-9 w-9" />
            <span className="flex flex-col leading-none">
              <span className="font-display text-lg font-extrabold tracking-tight text-ink">
                MB WHOLESALE
              </span>
              <span className="mt-1 font-mono text-[9px] tracking-[0.18em] text-stone">
                INDIANAPOLIS, IN
              </span>
            </span>
          </Link>

          {/* Center nav */}
          <nav className="hidden items-center gap-7 lg:flex">
            {NAV_LINKS.map((link) =>
              link.mega ? (
                <div key={link.label} className="group relative">
                  <NavLink
                    to={link.to}
                    className={({ isActive }) =>
                      cn(
                        'relative flex items-center gap-1 py-2 text-sm font-semibold tracking-[0.02em] transition-colors',
                        isActive ? 'text-ink' : 'text-stone hover:text-ink',
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {link.label}
                        <ChevronDown className="h-3.5 w-3.5 transition-transform duration-200 group-hover:rotate-180" />
                        {isActive && (
                          <motion.span
                            layoutId="nav-underline"
                            className="absolute -bottom-[1px] left-0 right-0 h-0.5 bg-amber"
                          />
                        )}
                      </>
                    )}
                  </NavLink>

                  {/* Mega menu */}
                  <div className="invisible absolute left-1/2 top-full z-50 w-[560px] -translate-x-1/2 pt-3 opacity-0 transition-all duration-200 group-hover:visible group-hover:opacity-100">
                    <div className="grid grid-cols-2 gap-1 rounded-xl border border-line bg-paper p-3 shadow-[0_12px_32px_-12px_rgba(22,21,15,0.12)]">
                      {CATEGORIES.map((cat) => (
                        <Link
                          key={cat.slug}
                          to={`/products?category=${cat.slug}`}
                          className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-paper-2"
                        >
                          <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-paper-2 text-ink">
                            <cat.icon className="h-4 w-4" />
                          </span>
                          <span className="flex flex-col">
                            <span className="text-sm font-semibold text-ink">{cat.name}</span>
                            <span className="font-mono text-[10px] tracking-wide text-stone">
                              {cat.count} PRODUCTS
                            </span>
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <NavLink
                  key={link.label}
                  to={link.to}
                  className={({ isActive }) =>
                    cn(
                      'relative py-2 text-sm font-semibold tracking-[0.02em] transition-colors',
                      isActive ? 'text-ink' : 'text-stone hover:text-ink',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {link.label}
                      {isActive && (
                        <motion.span
                          layoutId="nav-underline"
                          className="absolute -bottom-[1px] left-0 right-0 h-0.5 bg-amber"
                        />
                      )}
                    </>
                  )}
                </NavLink>
              ),
            )}
          </nav>

          {/* Right cluster */}
          <div className="flex items-center gap-2.5">
            <span className="hidden items-center gap-1.5 rounded-full bg-amber-soft px-3 py-1.5 font-mono text-[11px] font-medium tracking-wide text-amber-deep xl:flex">
              <Truck className="h-3.5 w-3.5" />
              DELIVERING ALL OF INDIANA
            </span>

            <button
              type="button"
              aria-label="Search (Ctrl+K)"
              onClick={() => setSearchOpen(true)}
              className="group flex h-9 items-center gap-1.5 rounded-lg px-2 text-ink transition-colors hover:bg-paper-2"
            >
              <Search className="h-[18px] w-[18px]" />
              <kbd className="hidden rounded border border-line bg-paper-2 px-1.5 py-0.5 font-mono text-[10px] text-stone group-hover:border-transparent lg:inline-block">
                ⌘K
              </kbd>
            </button>

            <ThemeToggle />

            {/* AUTH-SLOT: wired to grafted useAuth() */}
            <AuthSlot />

            <button
              type="button"
              onClick={openDrawer}
              aria-label="Open cart"
              className="relative flex h-9 w-9 items-center justify-center rounded-lg text-ink transition-colors hover:bg-paper-2"
            >
              <ShoppingCart className="h-[18px] w-[18px]" />
              <AnimatePresence>
                {count > 0 && (
                  <motion.span
                    key={count}
                    initial={{ scale: 0.4 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                    className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber px-1 font-mono text-[10px] font-bold text-paper"
                  >
                    {count}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

            <button
              type="button"
              aria-label="Open menu"
              onClick={() => setMobileOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-ink transition-colors hover:bg-paper-2 lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile full-screen menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[60] flex flex-col bg-ink text-paper"
          >
            <div className="flex h-[72px] items-center justify-between border-b border-paper/10 px-6">
              <span className="font-display text-lg font-extrabold tracking-tight">MB WHOLESALE</span>
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setMobileOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-paper transition-colors hover:bg-paper/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex flex-1 flex-col justify-center gap-2 px-8">
              {[{ to: '/products', label: 'Products' }, { to: '/about', label: 'About' }, { to: '/contact', label: 'Contact' }, { to: '/cart', label: 'Cart' }, { to: LOGIN_PATH, label: 'Sign In' }].map(
                (link, i) => (
                  <motion.div
                    key={link.label}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.08 + i * 0.06, duration: 0.4, ease: 'easeOut' }}
                  >
                    <Link
                      to={link.to}
                      className="group flex items-center justify-between border-b border-paper/10 py-4 font-display text-[32px] font-bold tracking-tight"
                    >
                      {link.label}
                      <ArrowUpRight className="h-6 w-6 text-amber transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                    </Link>
                  </motion.div>
                ),
              )}
            </nav>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45 }}
              className="px-8 pb-10"
            >
              <p className="font-mono text-[11px] tracking-[0.18em] text-amber">
                DELIVERING EVERYWHERE IN INDIANA
              </p>
              <div className="mt-3 space-y-1 font-mono text-xs text-paper/60">
                {WAREHOUSE.hours.map(([d, h]) => (
                  <p key={d}>
                    {d} — {h}
                  </p>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}

/** Right-cluster auth slot: placeholder while loading, Sign In for guests,
 *  avatar dropdown (Orders / Account / Sign Out) for customers. */
function AuthSlot() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  if (isLoading) {
    return (
      <span
        aria-hidden
        className="hidden h-9 w-[84px] animate-pulse rounded-lg bg-paper-2 sm:block"
      />
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <Link
        to={LOGIN_PATH}
        className="hidden rounded-lg border border-line px-4 py-2 text-sm font-semibold text-ink transition-all duration-150 hover:border-ink active:scale-[0.97] sm:block"
      >
        Sign In
      </Link>
    );
  }

  const name = user.name ?? 'Account';
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Account menu"
          className="flex items-center gap-2 rounded-lg border border-line py-1.5 pl-1.5 pr-2.5 transition-all duration-150 hover:border-ink active:scale-[0.97]"
        >
          <Avatar className="h-7 w-7">
            {user.avatar ? <AvatarImage src={user.avatar} alt={name} /> : null}
            <AvatarFallback className="bg-amber-soft font-mono text-[11px] font-bold text-amber-deep">
              {initials || <UserRound className="h-3.5 w-3.5" />}
            </AvatarFallback>
          </Avatar>
          <span className="hidden max-w-[120px] truncate text-sm font-semibold text-ink md:block">
            {name}
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-stone" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="truncate">{name}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/account/orders" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Orders
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/account" className="flex items-center gap-2">
            <UserRound className="h-4 w-4" />
            Account
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => logout()}
          className="flex items-center gap-2 text-amber-deep focus:text-amber-deep"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
