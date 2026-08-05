import { useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { ArrowRight, CheckCircle2, MapPin } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

gsap.registerPlugin(ScrollTrigger, useGSAP);

const INDIANA_PATH =
  'M 96 16 L 330 16 L 330 392 L 318 420 L 296 408 L 283 436 L 262 428 L 244 462 L 226 452 L 207 492 L 188 478 L 172 514 L 150 506 L 128 536 L 108 524 L 88 540 L 72 516 L 64 470 L 58 120 L 64 72 L 84 36 Z';

const HUB = { x: 190, y: 250 };
const DOTS = [
  { x: 85, y: 42 },
  { x: 150, y: 30 },
  { x: 300, y: 60 },
  { x: 120, y: 220 },
  { x: 150, y: 420 },
  { x: 95, y: 515 },
];

const STATS = [
  { value: 90, suffix: '+', label: 'CITIES SERVED' },
  { value: 48, suffix: 'hr', label: 'STANDARD DELIVERY' },
  { value: 0, prefix: '$', label: 'DELIVERY FEES ON QUALIFYING ORDERS' },
];

/** Section 5 — delivery network (dark, GSAP scroll-driven). */
export default function DeliveryNetwork() {
  const rootRef = useRef<HTMLElement>(null);
  const [zipOpen, setZipOpen] = useState(false);
  const [zip, setZip] = useState('');
  const [zipResult, setZipResult] = useState<'idle' | 'ok' | 'bad'>('idle');

  useGSAP(
    () => {
      // Text block slides in from the left
      gsap.from('.dn-text > *', {
        opacity: 0,
        x: -40,
        duration: 0.8,
        stagger: 0.1,
        ease: 'power3.out',
        scrollTrigger: { trigger: '.dn-text', start: 'top 75%' },
      });

      // Pinned map choreography: routes draw + dots pulse in sequence
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: '.dn-pin',
          start: 'top top',
          end: '+=120%',
          scrub: 0.6,
          pin: true,
          pinSpacing: true,
        },
      });
      tl.from('.dn-outline', { opacity: 0, duration: 0.5 })
        .fromTo(
          '.dn-route',
          { strokeDasharray: 400, strokeDashoffset: 400 },
          { strokeDashoffset: 0, duration: 2, stagger: 0.25, ease: 'none' },
        )
        .fromTo(
          '.dn-dot',
          { scale: 0, transformOrigin: 'center' },
          { scale: 1, duration: 0.6, stagger: 0.25, ease: 'back.out(2.5)' },
          '<+0.2',
        )
        .fromTo(
          '.dn-ripple',
          { scale: 0.4, opacity: 0.8, transformOrigin: 'center' },
          { scale: 2.4, opacity: 0, duration: 1, stagger: 0.25, ease: 'power2.out' },
          '<',
        )
        .fromTo(
          '.dn-hub',
          { scale: 0, transformOrigin: 'center' },
          { scale: 1, duration: 0.6, ease: 'back.out(2.5)' },
          '<+0.4',
        );

      // Stat count-up
      gsap.utils.toArray<HTMLElement>('.dn-stat-num').forEach((el) => {
        const target = Number(el.dataset.value ?? 0);
        const obj = { v: 0 };
        gsap.to(obj, {
          v: target,
          duration: 1.2,
          ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 60%' },
          onUpdate: () => {
            el.textContent = String(Math.round(obj.v));
          },
        });
      });
    },
    { scope: rootRef },
  );

  const checkZip = () => {
    const n = Number(zip);
    setZipResult(zip.length === 5 && n >= 46001 && n <= 47997 ? 'ok' : 'bad');
  };

  return (
    <section ref={rootRef} className="dn-pin relative overflow-hidden bg-ink py-16 text-paper lg:py-24">
      {/* noise overlay */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{ backgroundImage: 'url(/hero-texture-noise.png)', backgroundRepeat: 'repeat' }}
      />

      <div className="relative mx-auto grid max-w-[1280px] grid-cols-1 items-center gap-12 px-6 lg:grid-cols-2 lg:px-12">
        {/* Text */}
        <div className="dn-text">
          <p className="font-mono text-xs font-bold tracking-[0.18em] text-amber">// STATEWIDE ROUTES</p>
          <h2 className="mt-3 font-display text-[34px] font-bold leading-[1.02] tracking-[-0.025em] md:text-[56px]">
            From our dock in Indianapolis to every corner of Indiana.
          </h2>
          <p className="mt-6 max-w-[520px] text-base leading-relaxed text-paper/70 md:text-lg">
            Our trucks run routes across the entire state — gas stations in Gary, restaurants in
            Bloomington, c-stores in Evansville. If you&apos;re in Indiana, you&apos;re on our route.
          </p>

          <div className="mt-10 grid grid-cols-3 gap-6">
            {STATS.map((s) => (
              <div key={s.label}>
                <p className="font-display text-4xl font-bold tracking-tight text-paper md:text-5xl">
                  {s.prefix}
                  <span className="dn-stat-num" data-value={s.value}>
                    0
                  </span>
                  <span className="text-amber">{s.suffix}</span>
                </p>
                <p className="mt-2 font-mono text-[10px] leading-relaxed tracking-[0.14em] text-paper/50">
                  {s.label}
                </p>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setZipOpen(true)}
            className="group mt-10 inline-flex items-center gap-2 rounded-lg border border-paper/30 px-6 py-3.5 text-sm font-semibold text-paper transition-all duration-150 hover:border-amber hover:text-amber active:scale-[0.97]"
          >
            Check delivery to your ZIP
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>

        {/* Map */}
        <div className="dn-map-wrap">
          <div className="rounded-[20px] border border-paper/15 bg-ink-2 p-6 md:p-10">
            <svg viewBox="0 0 400 560" className="mx-auto h-[380px] w-auto md:h-[480px]" fill="none">
              <path
                className="dn-outline"
                d={INDIANA_PATH}
                stroke="#FAF8F4"
                strokeWidth="3"
                strokeLinejoin="round"
                opacity="0.9"
              />
              {DOTS.map((dpos, i) => (
                <line
                  key={`r${i}`}
                  className="dn-route"
                  x1={HUB.x}
                  y1={HUB.y}
                  x2={dpos.x}
                  y2={dpos.y}
                  stroke="hsl(var(--brand-accent))"
                  strokeWidth="2"
                  opacity="0.7"
                />
              ))}
              {DOTS.map((dpos, i) => (
                <g key={`d${i}`}>
                  <circle className="dn-ripple" cx={dpos.x} cy={dpos.y} r="10" stroke="hsl(var(--brand-accent))" strokeWidth="2" />
                  <circle className="dn-dot" cx={dpos.x} cy={dpos.y} r="8" fill="hsl(var(--brand-accent))" />
                </g>
              ))}
              <g className="dn-hub">
                <circle cx={HUB.x} cy={HUB.y} r="14" stroke="hsl(var(--brand-accent))" strokeWidth="2" opacity="0.5" />
                <circle cx={HUB.x} cy={HUB.y} r="9" fill="hsl(var(--brand-accent))" />
              </g>
            </svg>
            <p className="mt-4 flex items-center justify-center gap-2 text-center font-mono text-[10px] tracking-[0.18em] text-paper/50">
              <MapPin className="h-3.5 w-3.5 text-amber" />
              HQ — 4414 W 30TH ST, INDIANAPOLIS
            </p>
          </div>
        </div>
      </div>

      {/* ZIP check modal */}
      <Dialog open={zipOpen} onOpenChange={setZipOpen}>
        <DialogContent className="border-line bg-paper">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl font-bold tracking-tight text-ink">
              Check your delivery route
            </DialogTitle>
            <DialogDescription className="text-stone">
              Enter any Indiana ZIP code — if you&apos;re in the state, you&apos;re on our route.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <input
              value={zip}
              onChange={(e) => {
                setZip(e.target.value.replace(/\D/g, '').slice(0, 5));
                setZipResult('idle');
              }}
              onKeyDown={(e) => e.key === 'Enter' && checkZip()}
              inputMode="numeric"
              placeholder="46222"
              className="h-12 flex-1 rounded-lg border border-line bg-paper px-4 font-mono text-sm text-ink placeholder:text-stone/60 focus:border-amber focus:outline-none"
            />
            <button
              type="button"
              onClick={checkZip}
              className="h-12 rounded-lg bg-amber px-5 text-sm font-semibold text-paper transition-all duration-150 hover:bg-amber-deep active:scale-[0.97]"
            >
              Check
            </button>
          </div>
          {zipResult === 'ok' && (
            <p className="flex items-center gap-2 rounded-lg bg-forest/10 px-4 py-3 font-mono text-sm font-medium text-forest">
              <CheckCircle2 className="h-4 w-4" />
              You&apos;re on the route.
            </p>
          )}
          {zipResult === 'bad' && (
            <p className="rounded-lg bg-amber-soft px-4 py-3 font-mono text-sm text-amber-deep">
              We currently deliver within Indiana only — call us for special requests.
            </p>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
