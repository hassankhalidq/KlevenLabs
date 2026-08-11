import { useEffect, useRef, useState } from 'react';
import { prefersReducedMotion } from '../lib/motion';

const COUNT_MS = 520; // count runs, then the panel wipes: ~780ms total
const WIPE_MS = 260;

/**
 * Load sequence: a counter to 100, then a clean wipe up into the hero.
 *
 * Deliberately plain. A longer flourish reads as a studio showing off in the
 * one place a visitor has no patience for, and the whole thing is over inside
 * 800ms so it never becomes the reason the page feels slow.
 *
 * Counting is driven by rAF against a real clock rather than a setInterval per
 * tick, so a busy main thread drops numbers instead of stretching the sequence.
 *
 * This deliberately does NOT lock scroll. A lock here saves the visitor from
 * scrolling behind a panel for 780ms; a lock that fails to release looks
 * exactly like a page that cannot scroll, and that trade is not worth making.
 */
export default function Curtain() {
  const [count, setCount] = useState(0);
  const [gone, setGone] = useState(false);
  const [wiping, setWiping] = useState(false);
  const raf = useRef(0);

  useEffect(() => {
    if (prefersReducedMotion()) {
      setGone(true);
      return undefined;
    }

    const start = performance.now();
    let wipeTimer = 0;
    let doneTimer = 0;

    const tick = (now) => {
      const t = Math.min((now - start) / COUNT_MS, 1);
      // Ease the count so it decelerates into 100 instead of stopping dead.
      const eased = 1 - (1 - t) ** 3;
      setCount(Math.round(eased * 100));
      if (t < 1) {
        raf.current = requestAnimationFrame(tick);
      } else {
        setWiping(true);
        wipeTimer = setTimeout(() => {
          setGone(true);
        }, WIPE_MS);
      }
    };
    raf.current = requestAnimationFrame(tick);

    // Hard stop: the page is never held hostage by this, whatever happens.
    doneTimer = setTimeout(() => {
      setGone(true);
    }, 1600);

    return () => {
      cancelAnimationFrame(raf.current);
      clearTimeout(wipeTimer);
      clearTimeout(doneTimer);
    };
  }, []);

  if (gone) return null;

  return (
    <div className={`curtain${wiping ? ' curtain-wiping' : ''}`} aria-hidden="true">
      <span className="curtain-count label">{String(count).padStart(3, '0')}</span>
    </div>
  );
}
