import Reveal from '../components/Reveal';

/**
 * Palate cleanser. Round 1 gave this a scroll-linked horizontal drift; that
 * came out once the marquee band arrived directly above it, because two
 * sideways-moving things in the same stretch of page is one too many. This is
 * now a still statement, which is what a manifesto should be anyway.
 */
export default function Manifesto() {
  return (
    <section className="manifesto" aria-label="Positioning">
      <Reveal as="p" className="manifesto-line" y={18}>
        Most agencies sell hours. We sell{' '}
        <em className="manifesto-em">judgment</em>.
      </Reveal>
    </section>
  );
}
