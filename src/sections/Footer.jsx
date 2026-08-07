const STUDIO_EMAIL = 'hello@klevonlabs.com';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="shell footer-inner">
        <div className="footer-mark">
          Klevon<span className="footer-mark-dim">Labs</span>
        </div>
        <p className="footer-line">
          A one-person studio building websites and apps to an international
          standard.
        </p>
        {/* Social links omitted rather than pointed at a placeholder profile.
            Add them here once the real handles exist. */}
        <ul className="footer-links mono">
          <li>
            <a href={`mailto:${STUDIO_EMAIL}`}>{STUDIO_EMAIL}</a>
          </li>
        </ul>
        <p className="footer-year mono">{new Date().getFullYear()}</p>
      </div>
    </footer>
  );
}
