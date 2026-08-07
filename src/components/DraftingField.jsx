import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';

/**
 * The page signature.
 *
 * A field of drafted vertical lines displaced by two counter-rotating sine
 * families, so they weave into a slow interference pattern, with a soft light
 * sweep travelling across it. Geometry generated at runtime rather than
 * exported from a design tool, which is the argument the page is making.
 *
 * Placeholder note: in the hero this stands in for the motion-graphics loop
 * described in the brief. Swapping in a real <video> means replacing the
 * <canvas> inside Hero's .hero-media wrapper. Nothing else moves.
 *
 * @param {boolean} animated  Run the rAF loop. False renders one static frame.
 * @param {number}  variant   Picks a distinct geometry, so no two fields match.
 * @param {number}  intensity Line alpha multiplier.
 */
export default function DraftingField({
  animated = true,
  variant = 0,
  intensity = 1,
  className = '',
}) {
  const canvasRef = useRef(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    // Reduced motion still gets the artwork, just held still.
    const shouldAnimate = animated && !reduce;

    let raf = 0;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let visible = true;
    let start = 0;

    // Per-variant geometry. Prime-ish multipliers keep the families from
    // locking into a repeating pattern.
    const v = variant % 4;
    const cfg = [
      { a1: 0.045, f1: 0.0042, a2: 0.018, f2: 0.0110, p1: 1.0, p2: 2.6, s1: 0.16, s2: -0.11, lines: 110 },
      { a1: 0.062, f1: 0.0031, a2: 0.014, f2: 0.0157, p1: 1.7, p2: 3.4, s1: -0.13, s2: 0.19, lines: 84 },
      { a1: 0.034, f1: 0.0058, a2: 0.026, f2: 0.0089, p1: 2.3, p2: 1.4, s1: 0.21, s2: -0.15, lines: 96 },
      { a1: 0.055, f1: 0.0037, a2: 0.021, f2: 0.0131, p1: 0.7, p2: 4.1, s1: -0.18, s2: 0.12, lines: 72 },
    ][v];

    const draw = (elapsed) => {
      ctx.clearRect(0, 0, width, height);

      // Narrow viewports get fewer lines: the weave still reads and the
      // per-frame path cost stays sane on a phone GPU.
      const lineCount = width < 720 ? Math.round(cfg.lines * 0.55) : cfg.lines;
      const ampScale = width;
      const a1 = ampScale * cfg.a1;
      const a2 = ampScale * cfg.a2;

      // Light sweep: a travelling gaussian that lifts alpha where it passes.
      // Wide enough to light a broad band, so the field reads as one moving
      // surface rather than a thin bright seam crossing a dark rectangle.
      const sweep = ((elapsed * 0.085) % 1.7) - 0.35; // overshoots both edges
      const sigma = 0.3;

      const step = height < 600 ? 16 : 12;
      const TAU = Math.PI * 2;

      for (let i = 0; i < lineCount; i += 1) {
        const u = i / (lineCount - 1);
        const baseX = u * width;

        const falloff = Math.exp(-((u - sweep) ** 2) / (2 * sigma * sigma));
        const alpha = (0.17 + falloff * 0.42) * intensity;

        ctx.beginPath();
        ctx.strokeStyle = `rgba(242, 194, 48, ${alpha.toFixed(4)})`;
        ctx.lineWidth = 0.7 + falloff * 0.9;

        for (let y = -step; y <= height + step; y += step) {
          const x =
            baseX +
            a1 * Math.sin(y * cfg.f1 + elapsed * cfg.s1 + u * TAU * cfg.p1) +
            a2 * Math.sin(y * cfg.f2 - elapsed * cfg.s2 + u * TAU * cfg.p2);
          if (y <= -step) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    };

    const frame = (now) => {
      if (!start) start = now;
      if (visible) draw((now - start) / 1000);
      raf = requestAnimationFrame(frame);
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      // Cap DPR at 2. A 3x phone would triple the fill cost for no visible gain.
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // Still frames are held at a moment where the sweep sits mid-field, so a
      // static card never lands on a dark trough. Offset per variant so no two
      // are identical.
      if (!shouldAnimate) draw(9.4 + variant * 1.35);
    };

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    // Stop drawing entirely when the field is off screen.
    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
      },
      { rootMargin: '120px' },
    );
    io.observe(canvas);

    if (shouldAnimate) raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
    };
  }, [animated, variant, intensity, reduce]);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
