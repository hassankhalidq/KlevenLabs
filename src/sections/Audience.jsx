import Reveal from '../components/Reveal';

const REGIONS = ['Gulf', 'United Kingdom', 'Australia', 'Southeast Asia'];

export default function Audience() {
  return (
    <section className="section audience" id="fit">
      <div className="shell audience-grid">
        <Reveal className="audience-main">
          <h2 className="audience-title">
            A small number of clients at a time.
          </h2>
          {/* Contractions kept as the brief wrote them. Expanding them reads
              stiffer than the voice this studio is going for. */}
          <p className="audience-body">
            Klevon Labs works with clients who want a website or app that
            performs at an international standard. This isn&rsquo;t the right
            fit for a five-page brochure site on a tight local budget, and
            that&rsquo;s by design.
          </p>
        </Reveal>

        <Reveal className="audience-regions" delay={0.08}>
          <h3 className="audience-regions-label mono">Working from</h3>
          <ul className="audience-list">
            {REGIONS.map((region) => (
              <li key={region}>{region}</li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
