import { useEffect, useRef, useState } from 'react';

/**
 * Every destination is a section on this page. Nothing here points at a route
 * that does not exist yet.
 *
 * Past the hero the bar takes a solid ink background, because further down the
 * page it crosses an off-white section and would otherwise be unreadable.
 * Driven by an IntersectionObserver on a sentinel rather than a scroll
 * listener, which would fire on every frame for one boolean.
 */
export default function SiteNav() {
  const sentinel = useRef(null);
  const [solid, setSolid] = useState(false);

  useEffect(() => {
    const node = sentinel.current;
    if (!node) return undefined;
    const io = new IntersectionObserver(
      ([entry]) => setSolid(!entry.isIntersecting),
      { threshold: 0 },
    );
    io.observe(node);
    return () => io.disconnect();
  }, []);

  return (
    <>
      <div ref={sentinel} className="nav-sentinel" aria-hidden="true" />
      <header className={`nav${solid ? ' nav-solid' : ''}`}>
        <div className="nav-inner shell">
          <a href="#top" className="nav-mark" aria-label="Klevon Labs, back to top">
            Klevon<span className="nav-mark-dim">Labs</span>
          </a>
          <nav aria-label="Primary">
            <ul className="nav-links mono">
              <li>
                <a href="#work">Work</a>
              </li>
              <li>
                <a href="#process">Process</a>
              </li>
              <li>
                <a href="#contact" className="nav-cta">
                  Start a project
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </header>
    </>
  );
}
