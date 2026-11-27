// A short confetti burst for milestone pop-ups (workflow 12). No library. Skipped when Reduce Motion is on.
const COLOURS = ['#a85540', '#c8735a', '#d8a750', '#8fa37a']; // accent, clay, gold, sage

export const reducedMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

export function confettiBurst(canvas: HTMLCanvasElement, ms = 1500): () => void {
  if (reducedMotion()) return () => undefined;
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => undefined;
  const w = (canvas.width = canvas.clientWidth * devicePixelRatio);
  const h = (canvas.height = canvas.clientHeight * devicePixelRatio);
  const s = devicePixelRatio;
  const bits = Array.from({ length: 40 }, (_, i) => ({
    x: w / 2, y: h * 0.42, vx: (Math.random() - 0.5) * 14 * s, vy: (-Math.random() * 10 - 4) * s,
    r: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.4, c: COLOURS[i % COLOURS.length], size: (5 + Math.random() * 5) * s,
  }));
  const start = performance.now();
  let frame = 0;
  const draw = (t: number) => {
    const k = (t - start) / ms;
    ctx.clearRect(0, 0, w, h);
    if (k >= 1) return;
    ctx.globalAlpha = 1 - k * k;
    for (const b of bits) {
      b.x += b.vx; b.y += b.vy; b.vy += 0.45 * s; b.vx *= 0.99; b.r += b.vr;
      ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.r); ctx.fillStyle = b.c; ctx.fillRect(-b.size / 2, -b.size / 4, b.size, b.size / 2); ctx.restore();
    }
    frame = requestAnimationFrame(draw);
  };
  frame = requestAnimationFrame(draw);
  return () => { cancelAnimationFrame(frame); ctx.clearRect(0, 0, w, h); };
}
