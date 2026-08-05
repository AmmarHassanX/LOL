import { useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { ArrowRight } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger, useGSAP);

const STATEMENT =
  'Family owned. Indiana proud. Quality service, quality products, quality prices — for ten years and counting.';

/** Section 9 — mission strip (word-by-word scroll scrub, GSAP isolated). */
export default function MissionStrip() {
  const rootRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.fromTo(
        '.ms-word',
        { opacity: 0.15 },
        {
          opacity: 1,
          stagger: 0.06,
          ease: 'none',
          scrollTrigger: {
            trigger: rootRef.current,
            start: 'top 65%',
            end: 'bottom 45%',
            scrub: 0.4,
          },
        },
      );
    },
    { scope: rootRef },
  );

  return (
    <section ref={rootRef} className="bg-paper py-24 lg:py-32">
      <div className="mx-auto max-w-[720px] px-6 text-center">
        <p className="font-mono text-xs font-bold tracking-[0.18em] text-amber">// OUR PROMISE</p>
        <p className="mt-6 font-display text-2xl font-bold leading-snug tracking-[-0.02em] text-ink md:text-[32px]">
          {STATEMENT.split(' ').map((word, i) => (
            <span key={i} className="ms-word inline-block">
              {word}
              {'\u00A0'}
            </span>
          ))}
        </p>
        <Link
          to="/about"
          className="group mt-8 inline-flex items-center gap-2 text-sm font-semibold text-ink transition-colors hover:text-amber-deep"
        >
          Read our story
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </section>
  );
}
