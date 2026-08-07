import Reveal from '../components/Reveal';

const SERVICES = [
  {
    name: 'Websites',
    line: 'Hand-coded and animation-driven, for brands that need to look like the biggest player in their category before they are.',
    tag: 'Web',
  },
  {
    name: 'E-commerce',
    line: 'Stores built for conversion and craft at the same time, not a Shopify theme wearing a new logo.',
    tag: 'Commerce',
  },
  {
    name: 'Mobile apps',
    line: 'Product-minded builds, from the first flow to a shipped app.',
    tag: 'iOS / Android',
  },
];

export default function Services() {
  return (
    <section className="section services" id="services">
      <div className="shell">
        <Reveal>
          <h2 className="services-title">
            Three services.
            <br />
            All of it hand-built.
          </h2>
        </Reveal>

        <Reveal delay={0.08}>
          <ul className="services-list">
            {SERVICES.map((service) => (
              <li className="service" key={service.name}>
                {/* The section's single red moment: a marker that arrives on
                    hover. Transform only, so it costs nothing to paint. */}
                <span className="service-marker" aria-hidden="true" />
                <h3 className="service-name">{service.name}</h3>
                <p className="service-line">{service.line}</p>
                <span className="service-tag mono">{service.tag}</span>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
