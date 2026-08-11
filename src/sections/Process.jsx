import { useEffect, useRef } from 'react';
import { gsap, ANIMATED } from '../lib/motion';

const STEPS = [
  { name: 'Discovery', line: 'Real scoping. Not a sales call in disguise.' },
  {
    name: 'Product thinking',
    line: 'Every build starts as a product decision, not a visual one.',
  },
  {
    name: 'Hand-coded build',
    line: 'No page builders. No bloated plugin stacks.',
  },
  {
    name: 'Launch and handoff',
    line: 'Clean delivery, documented, no loose ends.',
  },
];

/**
 * The connecting line draws itself as you scroll past, and each step arrives
 * as the line reaches it. Purpose: it encodes the sequence structurally, which
 * is what lets the steps drop "Step 1 / Step 2" labels and still read as
 * ordered.
 *
 * Deliberately vertical, not a horizontal scroll hijack.
 *
 * Light enough to run everywhere, so there is no separate mobile path. Every
 * animated value defaults to its finished state in CSS, so if the GSAP branch
 * never runs (reduced motion), the line is simply drawn and the steps are
 * simply there.
 */
export default function Process() {
  const root = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add(ANIMATED, () => {
        const draw = gsap.fromTo(
          '.process-path',
          { strokeDashoffset: 1 },
          {
            strokeDashoffset: 0,
            ease: 'none',
            scrollTrigger: {
              trigger: '.process-steps',
              start: 'top 80%',
              // Finishes as the last step settles, not the moment the block
              // first appears.
              end: 'bottom 60%',
              scrub: 0.4,
              invalidateOnRefresh: true,
            },
          },
        );

        const steps = gsap.utils.toArray('.process-step').map((step) =>
          gsap.from(step.children, {
            y: 22,
            opacity: 0,
            duration: 0.55,
            ease: 'power3.out',
            stagger: 0.06,
            scrollTrigger: { trigger: step, start: 'top 76%', once: true },
          }),
        );

        return () => {
          draw.scrollTrigger?.kill();
          draw.kill();
          steps.forEach((t) => {
            t.scrollTrigger?.kill();
            t.kill();
          });
        };
      });

      return () => mm.revert();
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <section className="section process" id="process" ref={root}>
      <div className="shell process-grid">
        <div className="process-aside">
          <h2 className="process-title">
            How this
            <br />
            works
          </h2>
        </div>

        <div className="process-steps">
          {/* A 1x1 viewBox stretched by preserveAspectRatio="none", so the
              dash pattern stays in user units and "1" always means the whole
              line however tall the steps end up.

              Deliberately no vector-effect="non-scaling-stroke" here: it
              resolves the dash pattern in screen pixels instead, which turns a
              single full-length dash into a dotted line. */}
          <svg
            className="process-svg"
            viewBox="0 0 1 1"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path className="process-track" d="M0.5 0 V1" />
            <path className="process-path" d="M0.5 0 V1" />
          </svg>

          <ol className="process-list">
            {STEPS.map((step, index) => (
              <li className="process-step" key={step.name}>
                <span
                  className={`process-dot${
                    index === STEPS.length - 1 ? ' process-dot-ship' : ''
                  }`}
                  aria-hidden="true"
                />
                <h3 className="process-name">{step.name}</h3>
                <p className="process-line">{step.line}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
