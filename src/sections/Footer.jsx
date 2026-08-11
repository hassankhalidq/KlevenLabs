import { LogoSymbol } from '../components/Logo';

const STUDIO_EMAIL = 'hassankhalidq@gmail.com';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="shell footer-inner">
        <div className="footer-brand">
          <div className="footer-mark">
            <LogoSymbol />
            <span className="footer-mark-word">
              <span className="footer-mark-name">Klevon</span>
              <span className="footer-mark-sub">Labs</span>
            </span>
          </div>
          {/* The official brand promise, guide p.06. */}
          <p className="footer-promise">Clear thinking. Crafted delivery.</p>
        </div>

        <div className="footer-meta">
          <p className="footer-line">
            A one-person studio building websites and apps to an international
            standard.
          </p>
          <p className="footer-person">
            Hassan, <span className="footer-role">Founder &amp; Product Lead</span>
          </p>
        </div>

        {/* Social links omitted rather than pointed at a placeholder profile.
            Add them here once the real handles exist. */}
        <ul className="footer-links label">
          <li>
            <a href={`mailto:${STUDIO_EMAIL}`}>{STUDIO_EMAIL}</a>
          </li>
        </ul>

        <p className="footer-year label">{new Date().getFullYear()}</p>
      </div>
    </footer>
  );
}
