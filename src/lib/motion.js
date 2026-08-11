import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

// Debug handle for the QA scripts. Dev only, so nothing leaks into the bundle
// that ships.
if (import.meta.env.DEV && typeof window !== 'undefined') {
  window.ScrollTrigger = ScrollTrigger;
}

export { gsap, ScrollTrigger };

/** True when the visitor has asked the OS for less movement. */
export function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/** Desktop pointer, wide enough for the pinned mechanics to be worth it. */
export const DESKTOP = '(min-width: 900px) and (prefers-reduced-motion: no-preference)';
export const MOBILE = '(max-width: 899px), (prefers-reduced-motion: reduce)';
/** Any viewport, but only where movement is welcome. */
export const ANIMATED = '(prefers-reduced-motion: no-preference)';

/**
 * Lenis driven by GSAP's ticker, which is the documented integration: one rAF
 * loop for both, and ScrollTrigger updated from Lenis's scroll event so pinned
 * sections stay in step with the smoothed position instead of the native one.
 *
 * Running two rAF loops here is the classic way to get a page that looks fine
 * in isolation and drifts a frame behind itself once anything else is busy.
 *
 * Smooth scroll is itself motion, so under reduced motion Lenis never starts
 * and the browser's own scrolling is left alone.
 */
export function startSmoothScroll() {
  if (prefersReducedMotion()) return () => {};

  const lenis = new Lenis({
    duration: 1.05,
    easing: (t) => Math.min(1, 1.001 - 2 ** (-10 * t)),
    smoothWheel: true,
    // Touch devices already have momentum scrolling that feels native. Adding
    // Lenis on top makes the page feel detached from the finger.
    smoothTouch: false,
  });

  const onScroll = () => ScrollTrigger.update();
  lenis.on('scroll', onScroll);

  const raf = (time) => lenis.raf(time * 1000);
  gsap.ticker.add(raf);
  gsap.ticker.lagSmoothing(0);

  return () => {
    lenis.off('scroll', onScroll);
    gsap.ticker.remove(raf);
    gsap.ticker.lagSmoothing(500, 33);
    lenis.destroy();
  };
}
