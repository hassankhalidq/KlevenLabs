import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useReducedMotion } from 'framer-motion';

/**
 * Primary call to action with a cursor magnet.
 *
 * Purpose: feedback. The pull tells you the target is live before you reach it,
 * which is worth something on a page whose whole claim is craft.
 *
 * Pointer position drives motion values, never React state. Routing a
 * mousemove through setState re-renders the tree on every frame and collapses
 * the moment anything else on the page is busy.
 *
 * Disabled on touch and under reduced motion, where it is either meaningless
 * or unwelcome.
 */
export default function MagneticCTA({
  href,
  children,
  className = '',
  strength = 0.32,
  ...rest
}) {
  const ref = useRef(null);
  const [enabled, setEnabled] = useState(false);
  const reduce = useReducedMotion();

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 220, damping: 22, mass: 0.6 });
  const sy = useSpring(y, { stiffness: 220, damping: 22, mass: 0.6 });

  useEffect(() => {
    if (reduce) {
      setEnabled(false);
      return undefined;
    }
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)');
    const apply = () => setEnabled(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [reduce]);

  const onMove = (event) => {
    if (!enabled || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    x.set((event.clientX - (rect.left + rect.width / 2)) * strength);
    y.set((event.clientY - (rect.top + rect.height / 2)) * strength);
  };

  const reset = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.a
      ref={ref}
      href={href}
      className={`cta ${className}`}
      style={enabled ? { x: sx, y: sy } : undefined}
      onMouseMove={onMove}
      onMouseLeave={reset}
      onBlur={reset}
      {...rest}
    >
      <span className="cta-label">{children}</span>
      {/* The hero's single red moment. A detail on the button, not its fill. */}
      <span className="cta-underline" aria-hidden="true" />
    </motion.a>
  );
}
