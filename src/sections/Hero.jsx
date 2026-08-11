import { Fragment, useEffect, useRef } from 'react';
import DraftingField from '../components/DraftingField';
import MagneticCTA from '../components/MagneticCTA';
import { gsap, ScrollTrigger, DESKTOP, MOBILE } from '../lib/motion';

const LINES = [
  ['Built', 'like', 'a', 'product.'],
  ['Designed', 'like', 'art.'],
  ['Coded', 'by', 'hand.'],
];

export default function Hero() {
  const root = useRef(null);
  const body = useRef(null);
  const progress = useRef(0);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const words = gsap.utils.toArray('.hero-word-inner');
      const tail = '.hero-tail';
      const eyebrow = '.hero-eyebrow';

      // The headline assembles on LOAD, not on scroll. See the note in the
      // section comment below for why.
      const intro = gsap.timeline({ delay: 0.62 });
      intro
        .from(eyebrow, { opacity: 0, duration: 0.5, ease: 'power2.out' })
        .from(
          words,
          {
            yPercent: 108,
            duration: 0.82,
            ease: 'power3.out',
            stagger: 0.055,
          },
          '-=0.25',
        )
        .from(
          tail,
          { opacity: 0, y: 16, duration: 0.6, ease: 'power3.out' },
          '-=0.45',
        );

      const mm = gsap.matchMedia();

      // Desktop: pin the hero and let scroll drive the canvas and the handoff.
      mm.add(DESKTOP, () => {
        const st = ScrollTrigger.create({
          trigger: root.current,
          start: 'top top',
          end: '+=150%',
          pin: true,
          pinSpacing: true,
          pinType: 'transform', // see the note in Services: avoids CLS
          scrub: true,
          onUpdate: (self) => {
            progress.current = self.progress;
          },
          onLeave: () => {
            progress.current = 1;
          },
        });

        // The hero departs rather than simply scrolling away: it recedes as the
        // canvas tightens, which is what makes the pin feel like a handoff
        // instead of a stuck page.
        const out = gsap.to(body.current, {
          opacity: 0,
          scale: 0.94,
          yPercent: -8,
          ease: 'none',
          scrollTrigger: {
            trigger: root.current,
            start: 'top top',
            end: '+=150%',
            scrub: true,
          },
        });

        return () => {
          st.kill();
          out.scrollTrigger?.kill();
          out.kill();
          progress.current = 0;
        };
      });

      // Mobile and reduced motion: no pin, no scrub. Touch-scroll pinning is
      // unreliable once the address bar starts resizing mid-gesture, so the
      // hero is simply a hero.
      mm.add(MOBILE, () => {
        progress.current = 0;
        return () => {};
      });

      return () => mm.revert();
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <section className="hero" id="top" ref={root}>
      <div className="hero-media" aria-hidden="true">
        <DraftingField animated variant={0} progressRef={progress} />
        <div className="hero-scrim" />
      </div>

      <div className="hero-body shell" ref={body}>
        <p className="hero-eyebrow mono">Karachi-built. Globally shipped.</p>

        {/* Real space text nodes between the word spans, not a CSS margin.
            A margin looks identical but leaves the accessible name as
            "Builtlikeaproduct", which is what a screen reader announces and
            what the visitor gets if they copy the headline. */}
        <h1 className="hero-title">
          {LINES.map((line) => (
            <span className="hero-line" key={line.join(' ')}>
              {line.map((word, i) => (
                <Fragment key={word}>
                  <span className="hero-word">
                    <span className="hero-word-inner">{word}</span>
                  </span>
                  {i < line.length - 1 ? ' ' : null}
                </Fragment>
              ))}
            </span>
          ))}
        </h1>

        <div className="hero-tail">
          <p className="hero-sub">
            Klevon Labs designs and builds websites, stores, and apps for
            clients who don&rsquo;t want the regional default. No templates, no
            drag-and-drop, no shortcuts.
          </p>
          <MagneticCTA href="#contact">Start a project</MagneticCTA>
        </div>
      </div>

      <div className="hero-cue" aria-hidden="true">
        <span className="hero-cue-track">
          <span className="hero-cue-run" />
        </span>
      </div>
    </section>
  );
}
