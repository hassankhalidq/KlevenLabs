import { useEffect, useRef } from 'react';
import { gsap, ANIMATED } from '../lib/motion';

/**
 * The brand's open-frame device (guide p.20): a single yellow bracket drawn
 * across the 12-column grid, one per composition.
 *
 * Built from three rules driven by scaleX/scaleY rather than an SVG path with
 * stroke-dashoffset. Two reasons: the whole thing stays on transform, which is
 * the motion rule for this build; and a stretched SVG has to choose between a
 * distorted stroke width and a dash pattern that resolves in screen pixels.
 * The process line already paid for that lesson.
 *
 * The stagger traces the bracket in drawing order, up then across then down,
 * so it reads as a frame being ruled rather than three bars appearing.
 */
export default function OpenFrame({ trigger = 'scroll', className = '' }) {
  const root = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add(ANIMATED, () => {
        const tl = gsap.timeline({
          defaults: { duration: 0.62, ease: 'power3.inOut' },
          ...(trigger === 'load'
            ? { delay: 0.72 }
            : {
                scrollTrigger: {
                  trigger: root.current,
                  start: 'top 82%',
                  once: true,
                },
              }),
        });

        tl.from('.frame-left', { scaleY: 0 })
          .from('.frame-top', { scaleX: 0 }, '-=0.28')
          .from('.frame-right', { scaleY: 0 }, '-=0.28');

        return () => {
          tl.scrollTrigger?.kill();
          tl.kill();
        };
      });

      return () => mm.revert();
    }, root);

    return () => ctx.revert();
  }, [trigger]);

  return (
    <div className={`frame ${className}`} ref={root} aria-hidden="true">
      <span className="frame-left" />
      <span className="frame-top" />
      <span className="frame-right" />
    </div>
  );
}
