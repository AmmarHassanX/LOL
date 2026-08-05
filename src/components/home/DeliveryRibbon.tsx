import { memo } from 'react';
import { motion } from 'framer-motion';

const CITIES = [
  'DELIVERING EVERYWHERE IN INDIANA',
  'FORT WAYNE',
  'EVANSVILLE',
  'SOUTH BEND',
  'BLOOMINGTON',
  'TERRE HAUTE',
  'LAFAYETTE',
  'GARY',
  'MUNCIE',
  'COLUMBUS',
];

/** Isolated, memoized infinite marquee track. */
const MarqueeTrack = memo(function MarqueeTrack() {
  return (
    <div className="marquee-track flex w-max animate-marquee items-center">
      {[0, 1].map((dup) => (
        <div key={dup} className="flex items-center" aria-hidden={dup === 1}>
          {CITIES.map((city) => (
            <span
              key={`${dup}-${city}`}
              className="flex items-center whitespace-nowrap font-display text-lg font-bold tracking-tight text-ink"
            >
              <span className="px-6">{city}</span>
              <span className="text-sm">✦</span>
            </span>
          ))}
        </div>
      ))}
    </div>
  );
});

/** Section 2 — amber delivery ribbon marquee. */
export default function DeliveryRibbon() {
  return (
    <motion.div
      initial={{ y: '-100%' }}
      whileInView={{ y: 0 }}
      viewport={{ once: true, amount: 0.9 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="relative z-10 -my-2 -rotate-1 scale-[1.02] overflow-hidden"
    >
      <div className="marquee-paused flex h-14 items-center overflow-hidden bg-amber">
        <MarqueeTrack />
      </div>
    </motion.div>
  );
}
