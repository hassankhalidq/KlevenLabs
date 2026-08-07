import Reveal from '../components/Reveal';

export default function Why() {
  return (
    <section className="section why" id="studio">
      <div className="shell why-grid">
        <Reveal>
          <h2 className="why-title">
            Most studios think in pages.
            <br />
            Klevon Labs thinks in{' '}
            {/* The section's one red moment. A rule under the word the whole
                section is about, drawn rather than decorated. */}
            <span className="why-mark">products</span>.
          </h2>
        </Reveal>

        <Reveal delay={0.08}>
          <p className="why-body">
            That difference comes from a background in product management, not
            design school. It shows in how projects get scoped, built, and
            shipped.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
