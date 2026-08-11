/**
 * Klevon Labs symbol, reconstructed from the brand guidelines (p.09-13).
 *
 * Geometry: a K built on a square module grid. The stem is broken into two
 * squares; the two arms converge on a point just right of them, leaving the
 * central aperture the guide calls out on p.14 ("do not crop the central
 * aperture"). Drawn on a 100x100 grid so every vertex lands on a round number
 * and the proportions can be checked against the guide.
 *
 * Reconstructed at the brand owner's instruction. If the original vector ever
 * surfaces, replace the paths here and everything on the page follows.
 */

const STEM_X = 8;
const STEM_W = 26;
const ARM_X = 42;
const ARM_R = 92;
const TIP_X = 34;

export function LogoSymbol({ className = '', title }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={`logo-symbol ${className}`}
      role={title ? 'img' : 'presentation'}
      aria-label={title || undefined}
      aria-hidden={title ? undefined : 'true'}
      focusable="false"
    >
      {/* Stem: two squares, split by the aperture. */}
      <rect x={STEM_X} y="8" width={STEM_W} height={30} />
      <rect x={STEM_X} y="62" width={STEM_W} height={30} />
      {/* Upper arm: flat top and right edge, tapering back to the centre tip. */}
      <path d={`M${ARM_X} 8 H${ARM_R} V38 L${TIP_X} 50 Z`} />
      {/* Lower arm: the mirror of it. */}
      <path d={`M${ARM_X} 92 H${ARM_R} V62 L${TIP_X} 50 Z`} />
    </svg>
  );
}

/**
 * Full horizontal signature: symbol plus the stacked KLEVON / LABS wordmark,
 * placed as one locked asset (guide p.09).
 */
export default function Logo({ className = '', title = 'Klevon Labs' }) {
  return (
    <span className={`logo ${className}`}>
      <LogoSymbol title={title} />
      <span className="logo-word">
        <span className="logo-name">Klevon</span>
        <span className="logo-sub">Labs</span>
      </span>
    </span>
  );
}
