const TAGS = [
  'Websites',
  'E-commerce',
  'Mobile apps',
  'Hand-coded',
  'Product thinking',
  'Animation',
];

/**
 * Continuous band, independent of scroll. Plain CSS animation rather than
 * GSAP: it is predetermined motion, so it runs off the main thread and keeps
 * moving smoothly while the rest of the page is busy pinning and scrubbing.
 * A rAF-driven marquee would stutter in exactly those moments.
 *
 * The strip is rendered twice and translated by exactly -50%, which is what
 * makes the loop seamless. `aria-hidden` on the duplicate keeps a screen
 * reader from hearing the list twice.
 */
export default function Marquee() {
  const strip = (hidden) => (
    <ul className="marquee-strip mono" aria-hidden={hidden || undefined}>
      {TAGS.map((tag) => (
        <li key={tag}>
          <span>{tag}</span>
          <span className="marquee-dot" aria-hidden="true">
            &bull;
          </span>
        </li>
      ))}
    </ul>
  );

  return (
    <section className="marquee" aria-label="What the studio builds">
      <div className="marquee-track">
        {strip(false)}
        {strip(true)}
      </div>
    </section>
  );
}
