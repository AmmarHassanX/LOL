import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { animate, motion, useInView } from 'framer-motion';
import {
  Facebook,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  Target,
  Telescope,
  Twitter,
} from 'lucide-react';
import HoursTable from '@/components/about/HoursTable';
import OpenStatusChip from '@/components/about/OpenStatusChip';
import { WAREHOUSE } from '@/data/catalog';
import { cn } from '@/lib/utils';

const EASE_OUT = [0.16, 1, 0.3, 1] as [number, number, number, number];

/* ---------------------------------- hero ---------------------------------- */

function HeroHeadline() {
  const words: Array<{ text: string; accent: boolean }> = [
    { text: 'Family', accent: false },
    { text: 'owned.', accent: false },
    { text: 'Indiana', accent: true },
    { text: 'proud.', accent: true },
  ];
  return (
    <h1 className="font-display text-[40px] font-bold leading-[1.02] tracking-[-0.025em] text-ink md:text-[56px]">
      {words.map((w, i) => (
        <span key={w.text} className="inline-block overflow-hidden pb-1 align-bottom">
          <motion.span
            className={cn('inline-block', w.accent && 'text-amber')}
            initial={{ y: '110%' }}
            animate={{ y: 0 }}
            transition={{ duration: 0.9, delay: 0.1 + i * 0.06, ease: EASE_OUT }}
          >
            {w.text}
            {i < words.length - 1 ? '\u00A0' : ''}
          </motion.span>
        </span>
      ))}
    </h1>
  );
}

function AboutHero() {
  return (
    <section className="bg-paper pb-16 pt-20 lg:pb-24 lg:pt-28">
      <div className="mx-auto max-w-[860px] px-6 text-center lg:px-12">
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE_OUT }}
          className="font-mono text-xs font-bold tracking-[0.18em] text-amber"
        >
          // ABOUT MB WHOLESALE
        </motion.p>
        <div className="mt-4">
          <HeroHeadline />
        </div>
        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.35, ease: EASE_OUT }}
          className="mx-auto mt-6 max-w-[720px] text-base leading-[1.6] text-stone md:text-lg"
        >
          For ten years, MB Wholesale has helped Indiana&rsquo;s stores, gas stations, and restaurants
          keep their shelves stocked and their margins healthy — with quality service, quality
          products, and quality prices.
        </motion.p>
      </div>

      <div className="mx-auto mt-12 max-w-[1280px] px-6 lg:px-12">
        <motion.div
          initial={{ clipPath: 'inset(100% 0% 0% 0%)' }}
          animate={{ clipPath: 'inset(0% 0% 0% 0%)' }}
          transition={{ duration: 1, delay: 0.25, ease: EASE_OUT }}
          className="overflow-hidden rounded-[20px] border border-line"
        >
          <motion.img
            src="/about-family.jpg"
            alt="The MB Wholesale family team in the Indianapolis warehouse"
            initial={{ scale: 1.06 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1.4, delay: 0.25, ease: EASE_OUT }}
            className="aspect-[16/9] w-full object-cover md:aspect-[21/9]"
          />
        </motion.div>
      </div>
    </section>
  );
}

/* ---------------------------------- story --------------------------------- */

function Story() {
  return (
    <section className="border-t border-line bg-paper py-16 lg:py-24">
      <div className="mx-auto grid max-w-[1280px] gap-12 px-6 lg:grid-cols-12 lg:px-12">
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-28">
            <motion.p
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-15%' }}
              transition={{ duration: 0.6, ease: EASE_OUT }}
              className="font-mono text-xs font-bold tracking-[0.18em] text-amber"
            >
              // OUR STORY
            </motion.p>
            <motion.h3
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-15%' }}
              transition={{ duration: 0.7, delay: 0.08, ease: EASE_OUT }}
              className="mt-3 font-display text-2xl font-bold leading-[1.1] tracking-[-0.02em] text-ink md:text-[32px]"
            >
              From one warehouse to every corner of the state.
            </motion.h3>
          </div>
        </div>

        <div className="lg:col-span-7">
          {[
            'MB Wholesale started the way a lot of Indiana businesses do — around a family kitchen table, with a box truck, a leased warehouse bay on the west side of Indianapolis, and a phone that never stopped ringing. We loaded pallets by hand, learned every back road in Marion County, and earned our first customers one delivery at a time.',
            'We grew the same way we started: word of mouth. Convenience-store owners told gas-station operators, who told restaurant managers, who told the market down the street. No gimmicks — just fair wholesale prices, routes that showed up when we said they would, and a family that answered its own phone.',
            'Today, MB Wholesale carries 2,000+ products across 8 departments — vapes, tobacco & cigarillos, snacks & candy, beverages, gas station supplies, restaurant supplies, health & beauty, and Gemrock apparel. Our trucks run routes to every corner of Indiana, and our cash & carry warehouse at 4414 W 30th St is open six days a week for walk-ins.',
          ].map((paragraph, i) => (
            <motion.p
              key={i}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-15%' }}
              transition={{ duration: 0.7, delay: i * 0.15, ease: EASE_OUT }}
              className="text-[15px] leading-[1.7] text-ink/80 [&:not(:first-child)]:mt-6"
            >
              {paragraph}
            </motion.p>
          ))}

          <div className="relative mt-10 pl-7">
            <motion.span
              initial={{ scaleY: 0 }}
              whileInView={{ scaleY: 1 }}
              viewport={{ once: true, margin: '-15%' }}
              transition={{ duration: 0.7, ease: EASE_OUT }}
              className="absolute bottom-0 left-0 top-0 w-[3px] origin-top bg-amber"
            />
            <motion.blockquote
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-15%' }}
              transition={{ duration: 0.7, delay: 0.4, ease: EASE_OUT }}
              className="font-display text-[22px] font-semibold leading-[1.35] tracking-[-0.01em] text-ink"
            >
              &ldquo;We treat every store like it&rsquo;s our own — because our name is on every truck
              that pulls up.&rdquo;
            </motion.blockquote>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ mission/vision ----------------------------- */

const MISSION_VISION = [
  {
    key: 'MISSION',
    icon: Target,
    text: 'To provide quality service and quality products at quality prices — making wholesale simple, fast, and dependable for every Indiana business we serve.',
  },
  {
    key: 'VISION',
    icon: Telescope,
    text: 'To be Indiana\u2019s most trusted wholesale partner — the first call for every store, station, and kitchen from Gary to Evansville.',
  },
];

function MissionVision() {
  return (
    <section id="mission" className="border-y border-line bg-paper-2 py-16 lg:py-24">
      <div className="mx-auto max-w-[1280px] px-6 lg:px-12">
        <div className="grid gap-6 md:grid-cols-2">
          {MISSION_VISION.map((card, i) => (
            <motion.div
              key={card.key}
              initial={{ opacity: 0, x: i === 0 ? -40 : 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-25%' }}
              transition={{ duration: 0.7, ease: EASE_OUT }}
              className="rounded-xl border border-line bg-paper p-8 lg:p-10"
            >
              <motion.span
                initial={{ opacity: 0, rotate: -20, scale: 0.8 }}
                whileInView={{ opacity: 1, rotate: 0, scale: 1 }}
                viewport={{ once: true, margin: '-25%' }}
                transition={{ duration: 0.6, delay: 0.2, ease: EASE_OUT }}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-soft text-amber-deep"
              >
                <card.icon className="h-5 w-5" />
              </motion.span>
              <p className="mt-6 font-mono text-xs font-bold tracking-[0.18em] text-amber">
                {card.key}
              </p>
              <p className="mt-3 font-display text-xl font-semibold leading-[1.45] tracking-[-0.01em] text-ink md:text-[22px]">
                {card.text}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------- values --------------------------------- */

const VALUES = [
  { n: 1, title: 'Reliability', body: 'Routes that run on time, every time.' },
  { n: 2, title: 'Honest Pricing', body: 'Wholesale prices with no games.' },
  { n: 3, title: 'Family First', body: "You'll always talk to a person who knows your name." },
  { n: 4, title: 'Indiana Only', body: 'Focused on one state, so we never spread thin.' },
];

function CountUp({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-15%' });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, value, {
      duration: 0.9,
      ease: 'easeOut',
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, value]);

  return <span ref={ref}>{String(display).padStart(2, '0')}</span>;
}

function Values() {
  return (
    <section className="bg-paper py-16 lg:py-24">
      <div className="mx-auto max-w-[1280px] px-6 lg:px-12">
        <motion.p
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-15%' }}
          transition={{ duration: 0.6, ease: EASE_OUT }}
          className="font-mono text-xs font-bold tracking-[0.18em] text-amber"
        >
          // WHAT WE STAND FOR
        </motion.p>
        <div className="mt-10 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {VALUES.map((v, i) => (
            <motion.div
              key={v.n}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-15%' }}
              transition={{ duration: 0.6, delay: i * 0.1, ease: EASE_OUT }}
              className="border-t border-line pt-6"
            >
              <p className="font-mono text-sm font-bold tracking-[0.14em] text-amber">
                <CountUp value={v.n} />
              </p>
              <h4 className="mt-3 font-display text-xl font-semibold tracking-[-0.01em] text-ink">
                {v.title}
              </h4>
              <p className="mt-2 text-sm leading-[1.6] text-stone">{v.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------- indiana operations --------------------------- */

const CITIES = [
  'INDIANAPOLIS',
  'FORT WAYNE',
  'EVANSVILLE',
  'SOUTH BEND',
  'CARMEL',
  'BLOOMINGTON',
  'HAMMOND',
  'TERRE HAUTE',
  'LAFAYETTE',
  'MUNCIE',
  '+ 80 MORE',
];

/** Approximate pin positions over the stylized map artwork. */
const MAP_PINS = [
  { left: '50%', top: '46%', hub: true }, // Indianapolis
  { left: '74%', top: '18%', hub: false }, // Fort Wayne
  { left: '30%', top: '84%', hub: false }, // Evansville
  { left: '56%', top: '8%', hub: false }, // South Bend
  { left: '16%', top: '56%', hub: false }, // Terre Haute
];

function IndianaOperations() {
  return (
    <section className="relative overflow-hidden bg-ink py-16 text-paper lg:py-24">
      <img
        src="/hero-texture-noise.png"
        alt=""
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-[0.06]"
      />
      <div className="relative mx-auto grid max-w-[1280px] items-center gap-12 px-6 lg:grid-cols-2 lg:px-12">
        {/* Map */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-15%' }}
          transition={{ duration: 0.7, ease: EASE_OUT }}
          className="relative overflow-hidden rounded-xl border border-paper/10"
        >
          <img
            src="/map-indiana.jpg"
            alt="Stylized map of MB Wholesale delivery routes across Indiana"
            loading="lazy"
            className="aspect-[4/3] w-full object-cover"
          />
          {MAP_PINS.map((pin, i) => (
            <motion.span
              key={i}
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true, margin: '-15%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 16, delay: 0.3 + i * 0.15 }}
              className="absolute"
              style={{ left: pin.left, top: pin.top }}
            >
              <span className="relative flex -translate-x-1/2 -translate-y-1/2">
                <span
                  className={cn(
                    'absolute inline-flex h-full w-full rounded-full bg-amber opacity-60 motion-safe:animate-ping',
                    pin.hub ? '[animation-duration:1.8s]' : '[animation-duration:2.4s]',
                  )}
                />
                <span
                  className={cn(
                    'relative rounded-full bg-amber ring-2 ring-ink/40',
                    pin.hub ? 'h-4 w-4' : 'h-2.5 w-2.5',
                  )}
                />
              </span>
            </motion.span>
          ))}
        </motion.div>

        {/* Copy */}
        <div>
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-15%' }}
            transition={{ duration: 0.6, ease: EASE_OUT }}
            className="font-mono text-xs font-bold tracking-[0.18em] text-amber"
          >
            // WHERE WE OPERATE
          </motion.p>
          <motion.h3
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-15%' }}
            transition={{ duration: 0.7, delay: 0.08, ease: EASE_OUT }}
            className="mt-3 font-display text-2xl font-bold leading-[1.1] tracking-[-0.02em] text-paper md:text-[32px]"
          >
            One state. Every ZIP.
          </motion.h3>
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-15%' }}
            transition={{ duration: 0.7, delay: 0.16, ease: EASE_OUT }}
            className="mt-4 text-[15px] leading-[1.7] text-paper/70"
          >
            We operate exclusively in Indiana and deliver to every city and town in the state —
            plus walk-in cash &amp; carry at our Indianapolis warehouse.
          </motion.p>

          <div className="mt-8 flex flex-wrap gap-2">
            {CITIES.map((city, i) => (
              <motion.span
                key={city}
                initial={{ opacity: 0, filter: 'blur(6px)' }}
                whileInView={{ opacity: 1, filter: 'blur(0px)' }}
                viewport={{ once: true, margin: '-10%' }}
                transition={{ duration: 0.5, delay: i * 0.03, ease: EASE_OUT }}
                className={cn(
                  'rounded-full border px-3.5 py-1.5 font-mono text-[11px] font-medium tracking-[0.14em]',
                  city === '+ 80 MORE'
                    ? 'border-amber bg-amber/10 text-amber'
                    : 'border-paper/20 text-paper/80',
                )}
              >
                {city}
              </motion.span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ hours + warehouse -------------------------- */

function HoursWarehouse() {
  return (
    <section className="bg-paper py-16 lg:py-24">
      <div className="mx-auto grid max-w-[1280px] items-center gap-12 px-6 lg:grid-cols-2 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-15%' }}
          transition={{ duration: 0.7, ease: EASE_OUT }}
          className="overflow-hidden rounded-xl border border-line"
        >
          <img
            src="/about-counter.jpg"
            alt="Cash & carry checkout counter inside the MB Wholesale warehouse"
            loading="lazy"
            className="aspect-[4/3] w-full object-cover"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-15%' }}
          transition={{ duration: 0.7, delay: 0.1, ease: EASE_OUT }}
          className="relative rounded-xl border border-line bg-paper p-7 lg:p-9"
        >
          <img
            src="/indiana-outline.svg"
            alt=""
            aria-hidden
            className="pointer-events-none absolute right-7 top-7 h-16 w-auto opacity-30"
          />
          <div className="flex flex-wrap items-center justify-between gap-3 pr-16">
            <p className="font-mono text-xs font-bold tracking-[0.18em] text-amber">
              // OPERATING HOURS
            </p>
            <OpenStatusChip />
          </div>

          <div className="mt-5">
            <HoursTable showWillCall />
          </div>

          <div className="mt-7 space-y-3 border-t border-line pt-6 text-sm">
            <p className="flex items-start gap-3 text-ink">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-amber-deep" />
              {WAREHOUSE.address}
            </p>
            <p className="flex items-center gap-3">
              <Phone className="h-4 w-4 shrink-0 text-amber-deep" />
              <a
                href={`tel:${WAREHOUSE.phone}`}
                className="text-ink transition-colors hover:text-amber-deep"
              >
                {WAREHOUSE.phone}
              </a>
            </p>
            <p className="flex items-center gap-3">
              <Mail className="h-4 w-4 shrink-0 text-amber-deep" />
              <a
                href={`mailto:${WAREHOUSE.email}`}
                className="text-ink transition-colors hover:text-amber-deep"
              >
                {WAREHOUSE.email}
              </a>
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ---------------------------------- socials -------------------------------- */

const SOCIALS = [
  { label: 'Facebook', icon: Facebook, href: 'https://facebook.com' },
  { label: 'Instagram', icon: Instagram, href: 'https://instagram.com' },
  { label: 'X / Twitter', icon: Twitter, href: 'https://x.com' },
  { label: 'LinkedIn', icon: Linkedin, href: 'https://linkedin.com' },
];

function Socials() {
  return (
    <section className="border-t border-line bg-paper py-16 text-center lg:py-24">
      <div className="mx-auto max-w-[1280px] px-6 lg:px-12">
        <motion.p
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-15%' }}
          transition={{ duration: 0.6, ease: EASE_OUT }}
          className="font-mono text-xs font-bold tracking-[0.18em] text-amber"
        >
          // FOLLOW ALONG
        </motion.p>
        <motion.h3
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-15%' }}
          transition={{ duration: 0.7, delay: 0.08, ease: EASE_OUT }}
          className="mt-3 font-display text-2xl font-bold leading-[1.1] tracking-[-0.02em] text-ink md:text-[32px]"
        >
          Find us online.
        </motion.h3>

        <div className="mt-10 flex items-center justify-center gap-4">
          {SOCIALS.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ scale: 0.6, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true, margin: '-10%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 15, delay: i * 0.08 }}
            >
              <a
                href={s.href}
                target="_blank"
                rel="noreferrer"
                aria-label={s.label}
                className="group flex h-16 w-16 items-center justify-center rounded-full border border-line bg-paper text-ink transition-all duration-300 hover:rotate-[8deg] hover:border-amber"
              >
                <s.icon className="h-5 w-5 transition-colors group-hover:text-amber" />
              </a>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ----------------------------------- page ---------------------------------- */

export default function About() {
  const { hash } = useLocation();

  // Honor footer anchor links such as /about#mission.
  useEffect(() => {
    if (!hash) return;
    const el = document.querySelector(hash);
    if (el) {
      const id = window.setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 350);
      return () => window.clearTimeout(id);
    }
  }, [hash]);

  return (
    <>
      <AboutHero />
      <Story />
      <MissionVision />
      <Values />
      <IndianaOperations />
      <HoursWarehouse />
      <Socials />
    </>
  );
}
