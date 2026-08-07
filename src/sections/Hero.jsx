import { motion, useReducedMotion } from 'framer-motion';
import DraftingField from '../components/DraftingField';
import MagneticCTA from '../components/MagneticCTA';

const LINES = ['Built like a product.', 'Designed like art.', 'Coded by hand.'];

export default function Hero() {
  const reduce = useReducedMotion();

  // Load sequence. Purpose: storytelling. The three clauses are an argument,
  // so they arrive in the order you are meant to read them rather than all at
  // once. Everything after the headline follows on one beat, not three, or the
  // hero turns into a slideshow.
  const line = {
    hidden: reduce ? { opacity: 0 } : { transform: 'translateY(105%)' },
    show: {
      opacity: 1,
      transform: 'translateY(0%)',
      transition: { duration: 0.78, ease: [0.23, 1, 0.32, 1] },
    },
  };

  const fade = {
    hidden: reduce ? { opacity: 0 } : { opacity: 0, transform: 'translateY(14px)' },
    show: {
      opacity: 1,
      transform: 'translateY(0px)',
      transition: { duration: 0.6, ease: [0.23, 1, 0.32, 1] },
    },
  };

  return (
    <section className="hero" id="top">
      {/* PLACEHOLDER: stands in for the motion-graphics loop described in the
          brief. To ship real footage, replace this canvas with a <video muted
          loop playsInline poster="..."> here. The scrim, layout and load
          sequence all stay as they are. */}
      <div className="hero-media" aria-hidden="true">
        <DraftingField animated variant={0} />
        <div className="hero-scrim" />
      </div>

      <motion.div
        className="hero-body shell"
        initial="hidden"
        animate="show"
        transition={{ delayChildren: 0.62, staggerChildren: 0.085 }}
      >
        <motion.p className="hero-eyebrow mono" variants={fade}>
          Karachi-built. Globally shipped.
        </motion.p>

        <h1 className="hero-title">
          {LINES.map((text) => (
            <span className="hero-line" key={text}>
              <motion.span className="hero-line-inner" variants={line}>
                {text}
              </motion.span>
            </span>
          ))}
        </h1>

        <motion.div className="hero-tail" variants={fade}>
          <p className="hero-sub">
            Klevon Labs designs and builds websites, stores, and apps for
            clients who don&rsquo;t want the regional default. No templates, no
            drag-and-drop, no shortcuts.
          </p>
          <MagneticCTA href="#contact">Start a project</MagneticCTA>
        </motion.div>
      </motion.div>

      {/* Scroll cue: a hairline with a travelling segment. No label, because
          anyone looking at a hero already knows what scrolling is. */}
      <div className="hero-cue" aria-hidden="true">
        <span className="hero-cue-track">
          <span className="hero-cue-run" />
        </span>
      </div>
    </section>
  );
}
