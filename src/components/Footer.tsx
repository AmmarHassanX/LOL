import { Link } from 'react-router-dom';
import { ArrowRight, Facebook, Instagram, Linkedin, Twitter } from 'lucide-react';
import { WAREHOUSE } from '@/data/catalog';
import { LOGIN_PATH } from '@/const';

const SHOP_LINKS = [
  { label: 'All Products', to: '/products' },
  { label: 'Vapes', to: '/products?category=vapes' },
  { label: 'Tobacco & Cigarillos', to: '/products?category=tobacco-cigarillos' },
  { label: 'Snacks & Candy', to: '/products?category=snacks-candy' },
  { label: 'Beverages', to: '/products?category=beverages' },
  { label: 'Gas Station Supplies', to: '/products?category=gas-station-supplies' },
  { label: 'Restaurant Supplies', to: '/products?category=restaurant-supplies' },
  { label: 'Gemrock Apparel', to: '/products?category=gemrock-apparel' },
];

const COMPANY_LINKS = [
  { label: 'About', to: '/about' },
  { label: 'Mission & Vision', to: '/about#mission' },
  { label: 'Contact', to: '/contact' },
  { label: 'Become a Customer', to: LOGIN_PATH },
  { label: 'Track Order', to: '/account/orders' },
  { label: 'Request a Salesman', to: '/contact' },
];

const SOCIALS = [
  { label: 'Facebook', icon: Facebook, href: 'https://facebook.com' },
  { label: 'Instagram', icon: Instagram, href: 'https://instagram.com' },
  { label: 'X / Twitter', icon: Twitter, href: 'https://x.com' },
  { label: 'LinkedIn', icon: Linkedin, href: 'https://linkedin.com' },
];

/** Shared CTA band rendered above the footer on every page. */
export function CtaBand() {
  return (
    <section className="border-y border-line bg-paper-2">
      <div className="mx-auto flex max-w-[1280px] flex-col items-start gap-6 px-6 py-16 md:flex-row md:items-center md:justify-between lg:px-12">
        <div>
          <p className="font-mono text-xs font-bold tracking-[0.18em] text-amber">// GET STARTED</p>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-ink md:text-4xl">
            Ready to stock your shelves?
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            to={LOGIN_PATH}
            className="inline-flex items-center gap-2 rounded-lg bg-amber px-6 py-3.5 text-sm font-semibold text-paper transition-all duration-150 hover:bg-amber-deep active:scale-[0.97]"
          >
            Create a Wholesale Account
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 rounded-lg border border-ink/20 px-6 py-3.5 text-sm font-semibold text-ink transition-all duration-150 hover:border-ink active:scale-[0.97]"
          >
            Talk to Sales
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function Footer() {
  return (
    <>
      <CtaBand />
      <footer className="bg-ink text-paper">
        <div className="mx-auto grid max-w-[1280px] gap-12 px-6 py-16 md:grid-cols-2 lg:grid-cols-4 lg:px-12 lg:py-20">
          {/* Brand */}
          <div>
            <Link to="/" className="flex items-center gap-3">
              <img src="/logo.svg" alt="MB Wholesale" className="h-10 w-10" />
              <span className="font-display text-lg font-extrabold tracking-tight">MB WHOLESALE</span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-paper/70">{WAREHOUSE.tagline}</p>
            <p className="mt-2 text-sm text-paper/50">Family owned &amp; operated since day one.</p>
            <div className="mt-6 flex gap-2.5">
              {SOCIALS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={s.label}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-paper/20 text-paper/70 transition-colors hover:border-amber hover:text-amber"
                >
                  <s.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Shop */}
          <div>
            <h3 className="font-mono text-xs font-bold tracking-[0.18em] text-amber">SHOP</h3>
            <ul className="mt-5 space-y-2.5">
              {SHOP_LINKS.map((l) => (
                <li key={l.label}>
                  <Link to={l.to} className="text-sm text-paper/70 transition-colors hover:text-amber">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-mono text-xs font-bold tracking-[0.18em] text-amber">COMPANY</h3>
            <ul className="mt-5 space-y-2.5">
              {COMPANY_LINKS.map((l) => (
                <li key={l.label}>
                  <Link to={l.to} className="text-sm text-paper/70 transition-colors hover:text-amber">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Warehouse */}
          <div>
            <h3 className="font-mono text-xs font-bold tracking-[0.18em] text-amber">WAREHOUSE</h3>
            <address className="mt-5 space-y-2.5 text-sm not-italic text-paper/70">
              <p>{WAREHOUSE.address}</p>
              <p>
                <a href={`tel:${WAREHOUSE.phone}`} className="transition-colors hover:text-amber">
                  {WAREHOUSE.phone}
                </a>
              </p>
              <p>
                <a href={`mailto:${WAREHOUSE.email}`} className="transition-colors hover:text-amber">
                  {WAREHOUSE.email}
                </a>
              </p>
            </address>
            <table className="mt-5 w-full font-mono text-xs text-paper/60">
              <tbody>
                {WAREHOUSE.hours.map(([d, h]) => (
                  <tr key={d} className="border-b border-paper/10">
                    <td className="py-1.5">{d}</td>
                    <td className="py-1.5 text-right">{h}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-paper/10">
          <div className="mx-auto flex max-w-[1280px] flex-col items-center justify-between gap-3 px-6 py-6 text-xs text-paper/50 md:flex-row lg:px-12">
            <p>© 2025 MB Wholesale LLC — Indianapolis, Indiana</p>
            <p className="flex items-center gap-2 font-mono tracking-[0.18em] text-amber">
              DELIVERING EVERYWHERE IN INDIANA
              <svg viewBox="0 0 400 560" className="h-6 w-auto" fill="none" aria-hidden>
                <path
                  d="M 96 16 L 330 16 L 330 392 L 318 420 L 296 408 L 283 436 L 262 428 L 244 462 L 226 452 L 207 492 L 188 478 L 172 514 L 150 506 L 128 536 L 108 524 L 88 540 L 72 516 L 64 470 L 58 120 L 64 72 L 84 36 Z"
                  stroke="#FAF8F4"
                  strokeWidth="8"
                  strokeLinejoin="round"
                />
                <path
                  d="M 190.0 234.0 L 193.9 244.7 L 205.2 245.1 L 196.3 252.0 L 199.4 262.9 L 190.0 256.6 L 180.6 262.9 L 183.7 252.0 L 174.8 245.1 L 186.1 244.7 Z"
                  fill="#E8551D"
                />
              </svg>
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
