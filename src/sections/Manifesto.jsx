import { useRef } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';

/**
 * Palate cleanser between the hero and the content. Tighter block than the
 * rest of the page on purpose, so it reads as a beat rather than a section.
 *
 * The one scroll-linked drift on the page. Purpose: rhythm. It gives the band
 * a sense of passing through rather than sitting still, and the travel is kept
 * small enough that the line never approaches the edges.
 */
export default function Manifesto() {
  const ref = useRef(null);
  const reduce = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });
  const x = useTransform(scrollYProgress, [0, 1], ['3.5vw', '-3.5vw']);

  return (
    <section className="manifesto" ref={ref} aria-label="Positioning">
      <motion.p className="manifesto-line" style={reduce ? undefined : { x }}>
        Most agencies sell hours. We sell{' '}
        <em className="manifesto-em">judgment</em>.
      </motion.p>
    </section>
  );
}
