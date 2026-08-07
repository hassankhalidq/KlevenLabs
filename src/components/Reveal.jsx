import { motion, useReducedMotion } from 'framer-motion';

/**
 * Scroll reveal. Purpose: hierarchy. It gives each section one entrance beat
 * so the eye lands on the heading before the detail.
 *
 * Deliberately a *group* wrapper. Wrapping every element individually is what
 * makes a page feel like a slideshow. One block moves, its contents ride along.
 *
 * Reduced motion drops the translate and keeps a short opacity fade, which
 * still conveys "this is new" without moving anything on screen.
 */
export default function Reveal({
  children,
  as = 'div',
  delay = 0,
  y = 26,
  className = '',
  ...rest
}) {
  const reduce = useReducedMotion();
  const Tag = motion[as] ?? motion.div;

  return (
    <Tag
      className={className}
      initial={
        reduce
          ? { opacity: 0 }
          : { opacity: 0, transform: `translateY(${y}px)` }
      }
      whileInView={
        reduce ? { opacity: 1 } : { opacity: 1, transform: 'translateY(0px)' }
      }
      viewport={{ once: true, amount: 0.2, margin: '0px 0px -8% 0px' }}
      transition={{
        duration: reduce ? 0.24 : 0.62,
        delay,
        ease: [0.23, 1, 0.32, 1],
      }}
      {...rest}
    >
      {children}
    </Tag>
  );
}
