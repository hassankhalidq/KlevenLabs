import { useEffect, useRef } from 'react';
import { gsap, DESKTOP, MOBILE } from '../lib/motion';

const SERVICES = [
  {
    name: 'Websites',
    line: 'Hand-coded and animation-driven, for brands that need to look like the biggest player in their category before they are.',
    tag: 'Web',
    tone: 'ink',
  },
  {
    name: 'E-commerce',
    line: 'Stores built for conversion and craft at the same time, not a Shopify theme wearing a new logo.',
    tag: 'Commerce',
    tone: 'paper',
  },
  {
    name: 'Mobile apps',
    line: 'Product-minded builds, from the first flow to a shipped app.',
    // One-word category, matching Web and Commerce. "iOS / Android" would
    // render as "IOS / ANDROID" under the uppercase treatment, and a studio
    // selling craft should not be the one miscapitalising Apple's product.
    tag: 'Mobile',
    tone: 'ink',
  },
];

/**
 * Desktop: the section pins and each service wipes over the one before it via
 * clip-path, carrying a tone change with it. clip-path is the sanctioned
 * exception to the transform/opacity rule here: it composites without
 * triggering layout, and there is no transform that reveals a panel in place.
 *
 * Deliberately a wipe, not a stack of dimmed pillars that highlight in turn.
 * The panels replace each other; they do not sit there fading.
 *
 * Mobile: no pin, no cycling. Three ordinary stacked sections that slide in.
 */
export default function Services() {
  const root = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const panels = gsap.utils.toArray('.service-panel');
      const mm = gsap.matchMedia();

      mm.add(DESKTOP, () => {
        // One unit of timeline per service, so each gets an equal share of the
        // scroll. Panel 1 holds for its unit, then 2 and 3 wipe over in turn.
        const tl = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            trigger: root.current,
            start: 'top top',
            end: '+=200%',
            pin: '.services-pin',
            pinSpacing: true,
            // Pin by transform, not position:fixed. Fixed pinning is visually
            // identical here but takes the element out of flow, and Chrome
            // scores that collapsing box as layout shift: it was worth ~1.0 CLS
            // on its own. Scrolling does not count as "recent input", so those
            // shifts land in real Core Web Vitals rather than being excused.
            pinType: 'transform',
            scrub: true,
            invalidateOnRefresh: true,
          },
        });

        panels.slice(1).forEach((panel, i) => {
          tl.fromTo(
            panel,
            { clipPath: 'inset(100% 0% 0% 0%)' },
            { clipPath: 'inset(0% 0% 0% 0%)', duration: 1 },
            i + 1,
          );
          // Content lags the wipe slightly so it arrives with the panel rather
          // than sliding in already-formed behind the edge.
          tl.from(
            panel.querySelectorAll('.service-anim'),
            { yPercent: 40, opacity: 0, duration: 0.55, stagger: 0.08 },
            i + 1.25,
          );
        });

        return () => tl.scrollTrigger?.kill();
      });

      mm.add(MOBILE, () => {
        gsap.set(panels, { clearProps: 'clipPath' });
        const tweens = panels.map((panel) =>
          gsap.from(panel.querySelectorAll('.service-anim'), {
            y: 24,
            opacity: 0,
            duration: 0.55,
            ease: 'power3.out',
            stagger: 0.07,
            scrollTrigger: { trigger: panel, start: 'top 78%', once: true },
          }),
        );
        return () => tweens.forEach((t) => {
          t.scrollTrigger?.kill();
          t.kill();
        });
      });

      return () => mm.revert();
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <section className="services" id="services" ref={root}>
      <div className="services-pin">
        {SERVICES.map((service, i) => (
          <article
            className={`service-panel service-panel-${service.tone}`}
            key={service.name}
            style={{ zIndex: i + 1 }}
          >
            {/* A full-viewport panel needs a composition, not a headline
                floating in a void: the name carries the panel, the meta column
                bottom-aligns against it and gives the right side something to
                hold. */}
            <div className="shell service-inner">
              <h2 className="service-name service-anim">{service.name}</h2>
              <div className="service-meta">
                <p className="service-tag mono service-anim">{service.tag}</p>
                <p className="service-line service-anim">{service.line}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
