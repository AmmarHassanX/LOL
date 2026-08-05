import { useEffect } from 'react';
import { useLocation, useOutlet } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';

gsap.registerPlugin(ScrollTrigger);

function useSmoothScroll() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 1 });
    lenis.on('scroll', ScrollTrigger.update);
    let rafId = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);
}

/** Shared layout — nested-route pattern (renders the matched page via useOutlet). */
export default function Layout() {
  useSmoothScroll();
  const location = useLocation();
  const outlet = useOutlet();

  return (
    <div className="flex min-h-[100dvh] flex-col bg-paper">
      <Navbar />
      <AnimatePresence mode="wait" initial={false}>
        <motion.main
          key={location.pathname}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="flex-1"
        >
          {outlet}
        </motion.main>
      </AnimatePresence>
      <Footer />
      <CartDrawer />
    </div>
  );
}
