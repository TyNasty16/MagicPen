import { useId } from 'react';
import type { ShakerPlay } from '../lib/shaker';
import { useFillAnimation, type Step } from '../lib/useFillAnimation';

// Water glass (workflow 17): an original drawing of a tall glass with ice. It fills toward the day's water target;
// adding water pours a stream in from above; at the goal it is drunk, leaving a few cubes behind.

const TOP = 40, BOT = 168;
const BODY = `M16,${TOP} L80,${TOP} L72,${BOT - 6} Q71,${BOT} 65,${BOT} L31,${BOT} Q25,${BOT} 24,${BOT - 6} Z`;
// Ice: x, depth below the surface (negative pokes out), size, tilt.
const ICE: [number, number, number, number][] = [[30, -4, 14, -12], [47, -3, 13, 10], [62, -2, 12, -6], [38, 9, 12, 22], [55, 13, 11, -18], [44, 24, 10, 8]];
const LEFTOVER: [number, number, number][] = [[33, 12, -14], [46, 12, 9], [58, 11, -4], [40, 11, 25]];
const STREAM_X = 50, STREAM_TOP = -14;

export interface GlassPose { level: number; angle: number; ripple: number; bob: number; stream: { top: number; bottom: number } | null; ft: number; drink: boolean }
const REST = (level: number): GlassPose => ({ level, angle: 0, ripple: 0, bob: 0, stream: null, ft: 0, drink: false });

function Cube({ x, y, s, r, opacity }: { x: number; y: number; s: number; r: number; opacity: number }) {
  return (
    <g transform={`rotate(${r} ${x + s / 2} ${y + s / 2})`}>
      <rect x={x} y={y} width={s} height={s} rx="3" fill="#f4fbff" opacity={opacity} stroke="#a9cfe6" strokeWidth=".9" />
      <path d={`M${x + 3},${y + 3} l${s * 0.35},0`} stroke="#fff" strokeWidth="1.4" strokeLinecap="round" opacity=".9" />
    </g>
  );
}

export function GlassDrawing({ pose, width = 66 }: { pose: GlassPose; width?: number }) {
  const id = useId().replace(/:/g, '');
  const { level, angle, ripple, bob, stream, ft, drink } = pose;
  const u = (n: string) => `url(#${id}${n})`;
  const y = BOT - 6 - (BOT - TOP - 12) * Math.min(1, Math.max(0, level));
  const amp = 2.5 + ripple * 3, ph = ripple * Math.PI * 4;
  const surf = `M0,${y + Math.sin(ph) * amp * 0.4} C29,${y - amp * Math.cos(ph)} 62,${y + amp * Math.cos(ph)} 96,${y - Math.sin(ph) * amp * 0.4}`;
  const iceY = (d: number) => y + d + bob * (d < 6 ? 1 : 0.4);
  const drinkEdge = TOP + (BOT - TOP) * level;
  let streamEl = null;
  if (stream) {
    const y0 = STREAM_TOP + (y - STREAM_TOP) * stream.top, y1 = STREAM_TOP + (y - STREAM_TOP) * stream.bottom;
    if (y1 > y0 + 1) {
      const pts = Array.from({ length: 9 }, (_, k) => [y0 + ((y1 - y0) * k) / 8, Math.sin(ft * 18 + k * 1.3) * 0.7 * (k / 8)]);
      const w = 2.6 + (1 - stream.top) * 0.6;
      const left = pts.map(([yy, o]) => `${STREAM_X - w + o},${yy}`).join(' L'), right = [...pts].reverse().map(([yy, o]) => `${STREAM_X + w + o},${yy}`).join(' L');
      streamEl = (
        <>
          <path d={`M${left} L${right} Z`} fill={u('sw')} />
          {stream.bottom >= 1 && stream.top < 1 && (
            <>
              {[0, 1, 2, 3, 4, 5].map((k) => { const a = ft * 9 + k * 1.1; return <circle key={k} cx={STREAM_X + Math.cos(a * 1.3 + k) * (4 + k)} cy={y - 1.5 - Math.abs(Math.sin(a)) * 4} r={0.8 + (k % 3) * 0.4} fill="#fff" opacity=".85" />; })}
              <ellipse cx={STREAM_X} cy={y + 0.5} rx="8" ry="1.8" fill="#fff" opacity=".55" />
            </>
          )}
        </>
      );
    }
  }
  const rings = ripple > 0 && ripple < 1 && !drink
    ? [0, 0.35].map((o) => { const k = Math.max(0, ripple - o) / (1 - o); return k > 0 ? <ellipse key={o} cx="48" cy={y} rx={4 + k * 26} ry={1 + k * 3} fill="none" stroke="#fff" strokeWidth={1.6 * (1 - k)} opacity={0.9 * (1 - k)} /> : null; })
    : null;
  return (
    <svg width={width} height={(width * 162) / 96} viewBox="0 18 96 162" overflow="visible" className="shrink-0" aria-hidden>
      <defs>
        <linearGradient id={`${id}w`} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#8fd0ef" stopOpacity=".85" /><stop offset="1" stopColor="#2f7fbf" stopOpacity=".95" /></linearGradient>
        <linearGradient id={`${id}g`} x1="0" x2="1"><stop offset="0" stopColor="#fff" stopOpacity=".8" /><stop offset=".2" stopColor="#eef3f6" stopOpacity=".45" /><stop offset=".8" stopColor="#e6edf2" stopOpacity=".45" /><stop offset="1" stopColor="#cfd9e0" stopOpacity=".8" /></linearGradient>
        <linearGradient id={`${id}sw`} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#8fd0ef" stopOpacity="0" /><stop offset=".3" stopColor="#8fd0ef" stopOpacity=".9" /><stop offset="1" stopColor="#3b8cc8" stopOpacity=".95" /></linearGradient>
        <radialGradient id={`${id}f`}><stop offset="0" stopColor="#3a2a22" stopOpacity=".2" /><stop offset="1" stopColor="#3a2a22" stopOpacity="0" /></radialGradient>
        <clipPath id={`${id}c`}><path d={BODY} /></clipPath>
      </defs>
      <ellipse cx="48" cy={BOT + 3} rx="30" ry="4" fill={u('f')} />
      {/* The pivot moves smoothly from the base to the middle as the glass tips, so it never jumps. */}
      <g transform={`rotate(${angle} 48 ${BOT + (96 - BOT) * Math.min(1, Math.abs(angle) / 20)})`}>
        <path d={BODY} fill={u('g')} />
        <g clipPath={u('c')}>
          {drink ? (
            <path d={`M0,0 L96,0 L96,${drinkEdge + 4} C64,${drinkEdge} 32,${drinkEdge + 8} 0,${drinkEdge + 4} Z`} fill={u('w')} />
          ) : (
            level > 0 && (
              <>
                <path d={`${surf} L96,200 L0,200 Z`} fill={u('w')} />
                <path d={`${surf} L96,${y + 3} C64,${y + 5} 30,${y + 1} 0,${y + 3} Z`} fill="#fff" opacity=".45" />
              </>
            )
          )}
          {level > 0.06 && !drink && ICE.filter(([, d]) => iceY(d) < BOT - 10).map(([x, d, s, r]) => <Cube key={x} x={x} y={iceY(d)} s={s} r={r + bob * 6} opacity={d < 0 ? 0.8 : 0.5} />)}
          {(level <= 0.06 || drink) && LEFTOVER.map(([x, s, r], k) => <Cube key={x} x={x} y={BOT - 8 - s - (k === 3 ? 9 : 0)} s={s} r={r} opacity={0.85} />)}
          {rings}
          {!drink && level > 0 && [[30, 0.5], [58, 0.3], [44, 0.78]].map(([x, k]) => <circle key={x} cx={x} cy={y + 12 + k * (BOT - y - 20)} r="1.4" fill="#fff" opacity=".6" />)}
        </g>
        <path d={BODY} fill="none" stroke="#2a4a60" strokeOpacity=".3" />
        <ellipse cx="48" cy={TOP} rx="32" ry="3.5" fill="none" stroke="#2a4a60" strokeOpacity=".25" />
        <path d={`M22,${TOP + 8} L29,${BOT - 14}`} stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity=".75" />
      </g>
      {streamEl}
    </svg>
  );
}

/** A stream pours in from above: it reaches down, splashes while the level rises, then tapers off (about 1.4 s). */
function pourSteps(from: number, to: number): Step<GlassPose>[] {
  const lvl = (t: number) => from + (to - from) * t;
  return [
    { ms: 160, pose: (t) => ({ ...REST(from), stream: { top: 0, bottom: t }, ft: t * 0.16 }) },
    { ms: 1000, pose: (t) => ({ ...REST(lvl(t)), stream: { top: 0, bottom: 1 }, ft: 0.16 + t, ripple: (t * 2.4) % 1, bob: Math.sin(t * Math.PI * 4) * 1.8 }) },
    { ms: 220, pose: (t) => ({ ...REST(to), stream: { top: t, bottom: 1 }, ft: 1.2 + t * 0.2, ripple: 0.6 + t * 0.4 }) },
  ];
}

/** Goal: pour to the top, then the glass tips and is drunk, leaving the ice. */
function goalSteps(from: number): Step<GlassPose>[] {
  return [
    ...pourSteps(from, 1),
    { ms: 200, pose: () => REST(1) },
    { ms: 320, pose: (t) => ({ ...REST(1), angle: -38 * t, drink: true }) },
    { ms: 900, pose: (t) => ({ ...REST(1 - t), angle: -38 - 6 * t, drink: true }) },
    { ms: 380, pose: (t) => ({ ...REST(0), angle: -44 * (1 - t) }) },
  ];
}

/** The glass with its animation: plays `play` once when shown, then rests at `level`. Reduce Motion: no movement, same end. */
export default function WaterGlass({ from, level, play, onSettled }: { from: number; level: number; play: ShakerPlay; onSettled?: () => void }) {
  const pose = useFillAnimation<GlassPose>(play, REST(from), REST(level), () => (play === 'goal' ? goalSteps(from) : pourSteps(from, level)), [play, from, level], onSettled);
  return <GlassDrawing pose={pose} />;
}
