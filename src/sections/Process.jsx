import { useRef } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import Reveal from '../components/Reveal';

const STEPS = [
  {
    name: 'Discovery',
    line: 'Real scoping. Not a sales call in disguise.',
  },
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

export default function Process() {
  const ref = useRef(null);
  const reduce = useReducedMotion();

  // The rail fills as you read down it. Purpose: it encodes the sequence
  // structurally, which is what lets the steps drop the "Step 1 / Step 2"
  // labels and still read as ordered.
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start 72%', 'end 60%'],
  });
  const scaleY = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <section className="section process" id="process">
      <div className="shell process-grid">
        <div className="process-aside">
          <Reveal>
            <h2 className="process-title">
              How this
              <br />
              works
            </h2>
          </Reveal>
        </div>

        <div className="process-steps" ref={ref}>
          <div className="process-rail" aria-hidden="true">
            <motion.span
              className="process-rail-fill"
              style={reduce ? { transform: 'scaleY(1)' } : { scaleY }}
            />
          </div>

          <ol className="process-list">
            {STEPS.map((step, index) => (
              <Reveal
                as="li"
                className="process-step"
                key={step.name}
                delay={index * 0.04}
              >
                <span
                  className={`process-dot${
                    index === STEPS.length - 1 ? ' process-dot-ship' : ''
                  }`}
                  aria-hidden="true"
                />
                <h3 className="process-name">{step.name}</h3>
                <p className="process-line">{step.line}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
