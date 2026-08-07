import Reveal from '../components/Reveal';
import DraftingField from '../components/DraftingField';

/**
 * `image` is the real project still. While it is null the slot falls back to a
 * generated field, which is honest about being a graphic treatment rather than
 * pretending to be a screenshot of work that is not there yet.
 *
 * To ship a real still: drop the file in /public/work and set
 * image: '/work/sable.jpg', alt: '...'. Nothing else changes.
 */
const PROJECTS = [
  {
    id: 'sable',
    name: 'Sable',
    line: 'A fashion house index that behaves like a lookbook, not a catalogue.',
    tag: 'Fashion',
    detail: 'Editorial grid, scroll-linked lookbook, zero stock photography',
    image: null,
    alt: null,
    span: 'work-a',
  },
  {
    id: 'meridian',
    name: 'Meridian',
    line: 'A resort site that sells the room by selling the view.',
    tag: 'Hospitality',
    detail: 'Full-bleed media, booking flow, four languages',
    image: null,
    alt: null,
    span: 'work-b',
  },
  {
    id: 'cadence',
    name: 'Cadence',
    line: 'A training platform where the timer is the interface.',
    tag: 'Fitness',
    detail: 'Session engine, offline state, haptics',
    image: null,
    alt: null,
    span: 'work-c',
  },
  {
    id: 'ballast',
    name: 'Ballast',
    line: 'A fintech dashboard that stays legible when the numbers get ugly.',
    tag: 'Fintech',
    detail: 'Dense data, live positions, built to be read at a glance',
    image: null,
    alt: null,
    span: 'work-d',
  },
];

export default function Work() {
  return (
    <section className="section work" id="work">
      <div className="shell">
        <Reveal>
          <h2 className="work-title">Selected work</h2>
        </Reveal>

        <div className="work-grid">
          {PROJECTS.map((project, index) => (
            <Reveal
              as="article"
              className={`work-item ${project.span}`}
              key={project.id}
              delay={index * 0.05}
            >
              <div className="work-frame">
                {project.image ? (
                  <img
                    className="work-media"
                    src={project.image}
                    alt={project.alt}
                    loading="lazy"
                    decoding="async"
                    width="1200"
                    height="1500"
                  />
                ) : (
                  <DraftingField
                    className="work-media"
                    animated={false}
                    variant={index}
                    intensity={1.45}
                  />
                )}
                <p className="work-detail mono">{project.detail}</p>
              </div>

              <div className="work-meta">
                <h3 className="work-name">{project.name}</h3>
                <p className="work-line">{project.line}</p>
                <p className="work-tags mono">
                  <span>{project.tag}</span>
                  <span className="work-concept">Concept</span>
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
