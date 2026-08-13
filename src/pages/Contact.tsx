import { useRef, type ReactNode } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowUpRight, Mail, MapPin, Phone } from 'lucide-react';
import ContactForm from '@/components/contact/ContactForm';
import HoursTable from '@/components/about/HoursTable';
import OpenStatusChip from '@/components/about/OpenStatusChip';
import { Toaster } from '@/components/ui/sonner';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { WAREHOUSE } from '@/data/catalog';

const EASE_OUT = [0.16, 1, 0.3, 1] as [number, number, number, number];

const DIRECTIONS_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(WAREHOUSE.address)}`;

/* ----------------------------------- hero ---------------------------------- */

function ContactHero() {
  return (
    <section className="border-b border-line bg-paper-2 py-16 lg:py-20">
      <div className="mx-auto max-w-[1280px] px-6 lg:px-12">
        {[
          <p key="eyebrow" className="font-mono text-xs font-bold tracking-[0.18em] text-amber">
            // CONTACT
          </p>,
          <h1
            key="h1"
            className="mt-3 font-display text-[34px] font-bold leading-[1.02] tracking-[-0.025em] text-ink md:text-[48px]"
          >
            Talk to a real person.
          </h1>,
          <p key="lead" className="mt-4 max-w-[560px] text-base leading-[1.6] text-stone md:text-lg">
            Questions about accounts, products, or delivery? We answer fast — usually the same
            business day.
          </p>,
        ].map((node, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: i * 0.08, ease: EASE_OUT }}
          >
            {node}
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* -------------------------------- info stack ------------------------------- */

const infoCardClasses =
  'rounded-xl border border-line bg-paper p-6 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_32px_-12px_rgba(22,21,15,0.12)]';

function IconCircle({ children }: { children: ReactNode }) {
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-soft text-amber-deep">
      {children}
    </span>
  );
}

function InfoStack() {
  return (
    <div className="space-y-5">
      {/* Warehouse */}
      <motion.div
        initial={{ opacity: 0, x: 32 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: '-10%' }}
        transition={{ duration: 0.6, ease: EASE_OUT }}
        className={infoCardClasses}
      >
        <div className="flex items-start gap-4">
          <IconCircle>
            <MapPin className="h-[18px] w-[18px]" />
          </IconCircle>
          <div>
            <p className="font-mono text-xs font-bold tracking-[0.18em] text-amber">WAREHOUSE</p>
            <p className="mt-2 text-[15px] font-medium leading-[1.5] text-ink">{WAREHOUSE.address}</p>
            <p className="mt-1 text-[13px] text-stone">
              Cash &amp; carry open Mon–Sat during business hours.
            </p>
            <a
              href={DIRECTIONS_URL}
              target="_blank"
              rel="noreferrer"
              className="group mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-ink transition-colors hover:text-amber-deep"
            >
              Get Directions
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
          </div>
        </div>
      </motion.div>

      {/* Call / Email */}
      <motion.div
        initial={{ opacity: 0, x: 32 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: '-10%' }}
        transition={{ duration: 0.6, delay: 0.12, ease: EASE_OUT }}
        className={infoCardClasses}
      >
        <div className="flex items-start gap-4">
          <IconCircle>
            <Phone className="h-[18px] w-[18px]" />
          </IconCircle>
          <div className="min-w-0">
            <p className="font-mono text-xs font-bold tracking-[0.18em] text-amber">CALL / EMAIL</p>
            <p className="mt-2">
              <a
                href={`tel:${WAREHOUSE.phone}`}
                className="text-[15px] font-medium text-ink transition-colors hover:text-amber-deep"
              >
                {WAREHOUSE.phone}
              </a>
            </p>
            <p className="mt-1 flex items-center gap-2">
              <Mail className="h-3.5 w-3.5 shrink-0 text-stone" />
              <a
                href={`mailto:${WAREHOUSE.email}`}
                className="truncate text-[15px] font-medium text-ink transition-colors hover:text-amber-deep"
              >
                {WAREHOUSE.email}
              </a>
            </p>
            <p className="mt-3 font-mono text-[11px] tracking-wide text-stone">
              MON–FRI 8AM–6PM EST
            </p>
          </div>
        </div>
      </motion.div>

      {/* Hours */}
      <motion.div
        initial={{ opacity: 0, x: 32 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: '-10%' }}
        transition={{ duration: 0.6, delay: 0.24, ease: EASE_OUT }}
        className={infoCardClasses}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-mono text-xs font-bold tracking-[0.18em] text-amber">HOURS</p>
          <OpenStatusChip showNote={false} />
        </div>
        <div className="mt-3">
          <HoursTable compact />
        </div>
      </motion.div>
    </div>
  );
}

/* ---------------------------------- map band -------------------------------- */

function MapBand() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.05]);

  return (
    <section ref={ref} className="relative h-[380px] overflow-hidden border-y border-line bg-paper-2">
      <motion.img
        src="/map-indiana.jpg"
        alt="Stylized map showing MB Wholesale delivery coverage across Indiana"
        loading="lazy"
        style={{ scale }}
        className="h-full w-full object-cover saturate-[0.55]"
      />

      {/* Amber hub pin on Indianapolis */}
      <motion.div
        initial={{ y: -40, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        viewport={{ once: true, margin: '-20%' }}
        transition={{ type: 'spring', stiffness: 260, damping: 14, delay: 0.15 }}
        className="absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-full"
      >
        <span className="relative flex flex-col items-center">
          <MapPin className="h-10 w-10 fill-amber text-amber-deep drop-shadow-[0_6px_12px_rgba(22,21,15,0.35)]" />
          <span className="absolute -bottom-1 h-1.5 w-6 rounded-full bg-ink/25 blur-[2px]" />
        </span>
      </motion.div>

      {/* Address card overlay */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-15%' }}
        transition={{ duration: 0.6, delay: 0.25, ease: EASE_OUT }}
        className="absolute bottom-6 left-6 max-w-[300px] rounded-lg border border-line bg-paper p-4 shadow-[0_12px_32px_-12px_rgba(22,21,15,0.18)]"
      >
        <p className="font-mono text-[10px] font-bold tracking-[0.18em] text-amber">MB WHOLESALE LLC</p>
        <p className="mt-1.5 text-sm font-medium leading-[1.5] text-ink">{WAREHOUSE.address}</p>
        <a
          href={DIRECTIONS_URL}
          target="_blank"
          rel="noreferrer"
          className="group mt-2 inline-flex items-center gap-1 text-[13px] font-semibold text-ink transition-colors hover:text-amber-deep"
        >
          Open in Maps
          <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </a>
      </motion.div>
    </section>
  );
}

/* ------------------------------------ faq ----------------------------------- */

const FAQS = [
  {
    q: 'Who can open a wholesale account?',
    a: 'Any registered Indiana retail or food-service business — c-stores, gas stations, smoke shops, restaurants, and markets. Approval is usually same day.',
  },
  {
    q: 'Where do you deliver?',
    a: 'Everywhere in Indiana. Minimum order applies outside metro Indianapolis.',
  },
  {
    q: 'Can I pick up instead?',
    a: 'Yes — cash & carry at our Indianapolis warehouse during business hours, Monday through Saturday.',
  },
  {
    q: "Why can't I see prices?",
    a: 'Wholesale pricing is exclusive to registered customers. Create a free account to unlock it.',
  },
  {
    q: 'How do I track my order?',
    a: 'Sign in → Account → Orders → Track. Every order shows live status.',
  },
  {
    q: 'Do you carry Gemrock shirts?',
    a: 'Yes, the full Gemrock apparel line, by the case.',
  },
];

function Faq() {
  return (
    <section className="bg-paper py-16 lg:py-24">
      <div className="mx-auto max-w-[760px] px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-15%' }}
          transition={{ duration: 0.6, ease: EASE_OUT }}
          className="text-center"
        >
          <p className="font-mono text-xs font-bold tracking-[0.18em] text-amber">// QUICK ANSWERS</p>
          <h3 className="mt-3 font-display text-2xl font-bold leading-[1.1] tracking-[-0.02em] text-ink md:text-[32px]">
            Before you ask.
          </h3>
        </motion.div>

        <Accordion type="single" collapsible className="mt-10 border-t border-line">
          {FAQS.map((item, i) => (
            <motion.div
              key={item.q}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-10%' }}
              transition={{ duration: 0.5, delay: i * 0.06, ease: EASE_OUT }}
            >
              <AccordionItem value={`faq-${i}`} className="border-line">
                <AccordionTrigger className="py-5 font-display text-base font-semibold tracking-[-0.01em] text-ink hover:no-underline [&>svg]:text-amber">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-[15px] leading-[1.6] text-stone">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            </motion.div>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

/* ----------------------------------- page ----------------------------------- */

export default function Contact() {
  return (
    <>
      <ContactHero />

      <section className="bg-paper py-16 lg:py-24">
        <div className="mx-auto grid max-w-[1280px] gap-10 px-6 lg:grid-cols-12 lg:px-12">
          <motion.div
            initial={{ opacity: 0, x: -32 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-10%' }}
            transition={{ duration: 0.6, ease: EASE_OUT }}
            className="lg:col-span-7"
          >
            <ContactForm />
          </motion.div>
          <div className="lg:col-span-5">
            <InfoStack />
          </div>
        </div>
      </section>

      <MapBand />
      <Faq />

      {/* Page-local toast stack for form feedback */}
      <Toaster position="bottom-right" />
    </>
  );
}
