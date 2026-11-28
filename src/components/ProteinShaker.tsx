import { useId } from 'react';
import { useFillAnimation } from '../lib/useFillAnimation';
import type { ShakerPlay } from '../lib/shaker';

// Protein shaker (workflow 16): an original drawing (faceted tinted bottle, rounded lid with grip band,
// terracotta spout cover). It fills toward the day's protein goal.

const W = 96, H = 186, TOP = 62, BOT = 174, L0 = 20, R0 = 76, L1 = 25, R1 = 71, CH = 7;
const BODY = `M${L0},${TOP} L${R0},${TOP} L${R1},${BOT - CH} L${R1 - CH},${BOT} L${L1 + CH},${BOT} L${L1},${BOT - CH} Z`;
const FACET_TOP = [L0, 34, 48, 62, R0];
const FACET_BOT = [L1, 36, 48, 60, R1];
const FACET_SHADE = [0.1, 0, 0.05, 0.16];

export interface ShakerPose { level: number; angle: number; slosh: number; cover: number; drink: boolean }
const REST = (level: number): ShakerPose => ({ level, angle: 0, slosh: 0, cover: 0, drink: false });

/** The drawing for one moment: fill 0..1, tilt (degrees), slosh (-1..1), spout cover open (0..1), drinking (shake runs to the lid). */
export function ShakerDrawing({ pose, goal, width = 72 }: { pose: ShakerPose; goal: number; width?: number }) {
  const id = useId().replace(/:/g, '');
  const { level, angle, slosh, cover, drink } = pose;
  const lvl = BOT - 3 - (BOT - TOP - 8) * Math.min(1, Math.max(0, level));
  const tilt = slosh * 7;
  const surf = `M0,${lvl - tilt} C30,${lvl - tilt * 0.4 - 2} 66,${lvl + tilt * 0.4 + 2} 96,${lvl + tilt}`;
  const drinkEdge = TOP + (BOT - TOP) * level;
  // The pivot moves smoothly from the base to the middle as the bottle tips, so it never jumps.
  const pivotY = BOT + ((TOP + BOT) / 2 - 10 - BOT) * Math.min(1, Math.abs(angle) / 26);
  const marks: number[] = [];
  for (let g = 20; g < goal; g += 20) marks.push(g);
  const u = (n: string) => `url(#${id}${n})`;
  return (
    <svg width={width} height={(width * (H + 8)) / W} viewBox={`0 -4 ${W} ${H + 8}`} overflow="visible" className="shrink-0" aria-hidden>
      <defs>
        <clipPath id={`${id}b`}><path d={BODY} /></clipPath>
        <linearGradient id={`${id}tint`} x1="0" x2="1"><stop offset="0" stopColor="#e7d9cf" stopOpacity=".85" /><stop offset=".5" stopColor="#efe5dc" stopOpacity=".7" /><stop offset="1" stopColor="#d7c6b9" stopOpacity=".9" /></linearGradient>
        <linearGradient id={`${id}shake`} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#9a6646" /><stop offset="1" stopColor="#6a3f26" /></linearGradient>
        <linearGradient id={`${id}lid`} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#4b4542" /><stop offset=".55" stopColor="#2b2725" /><stop offset="1" stopColor="#1e1b1a" /></linearGradient>
        <linearGradient id={`${id}lidSide`} x1="0" x2="1"><stop offset="0" stopColor="#fff" stopOpacity=".18" /><stop offset=".3" stopColor="#fff" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity=".25" /></linearGradient>
        <linearGradient id={`${id}cover`} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#b9634c" /><stop offset="1" stopColor="#8f4230" /></linearGradient>
        <radialGradient id={`${id}floor`}><stop offset="0" stopColor="#3a2a22" stopOpacity=".22" /><stop offset="1" stopColor="#3a2a22" stopOpacity="0" /></radialGradient>
      </defs>
      <ellipse cx="48" cy={BOT + 4} rx="30" ry="4.5" fill={u('floor')} />
      <g transform={`rotate(${angle} 48 ${pivotY})`}>
        <path d={BODY} fill={u('tint')} />
        <g clipPath={u('b')}>
          {drink ? (
            <path d={`M0,0 L96,0 L96,${drinkEdge + 6} C66,${drinkEdge + 2} 30,${drinkEdge + 10} 0,${drinkEdge + 6} Z`} fill={u('shake')} />
          ) : (
            level > 0 && <path d={`${surf} L96,${H} L0,${H} Z`} fill={u('shake')} />
          )}
          {!drink && level > 0 && (
            <path d={`${surf} L96,${lvl + tilt + 4} C66,${lvl + tilt * 0.4 + 6} 30,${lvl - tilt * 0.4 + 2} 0,${lvl - tilt + 4} Z`} fill="#d8bfa3" />
          )}
          {!drink && level > 0 && [[38, 0.4, 1.3], [55, 0.25, 1], [64, 0.6, 1.2]].map(([x, f, r]) => (
            <circle key={x} cx={x} cy={lvl + 7 + f * (BOT - lvl - 12)} r={r} fill="#fff" opacity=".2" />
          ))}
          {FACET_SHADE.map((a, i) => (
            <path key={i} d={`M${FACET_TOP[i]},${TOP} L${FACET_TOP[i + 1]},${TOP} L${FACET_BOT[i + 1]},${BOT} L${FACET_BOT[i]},${BOT} Z`} fill="#1d1a2b" opacity={a} />
          ))}
          {[34, 48, 62].map((x, i) => <line key={x} x1={x} y1={TOP + 2} x2={FACET_BOT[i + 1]} y2={BOT - 2} stroke="#fff" strokeOpacity=".35" strokeWidth=".8" />)}
        </g>
        <path d={BODY} fill="none" stroke="#2a2433" strokeOpacity=".3" strokeWidth="1" />
        {marks.map((g) => {
          const y = BOT - 3 - (BOT - TOP - 8) * (g / goal), x = 30 + ((y - TOP) / (BOT - TOP)) * 2;
          return (
            <g key={g}>
              <line x1={x} x2={x + (g % 40 ? 5 : 9)} y1={y} y2={y} stroke="#fff" strokeWidth="1.2" opacity=".75" />
              <text x={x + 11} y={y + 3.4} fontSize="10" fontWeight="700" fill="#fff" stroke="#2a2433" strokeOpacity=".55" strokeWidth="1.4" paintOrder="stroke">{g}</text>
            </g>
          );
        })}
        <path d={`M${L0 + 4},${TOP + 6} L${L1 + 3},${BOT - 12}`} stroke="#fff" strokeWidth="2.6" strokeLinecap="round" opacity=".65" />
        {/* Lid: rounded cap with a grip band */}
        <path d="M15,68 L15,52 C15,40 24,32 36,32 L60,32 C72,32 81,40 81,52 L81,68 Z" fill={u('lid')} />
        <path d="M15,68 L15,52 C15,40 24,32 36,32 L60,32 C72,32 81,40 81,52 L81,68 Z" fill={u('lidSide')} />
        {Array.from({ length: 16 }, (_, i) => <rect key={i} x={17 + i * 4} y="56" width="1.3" height="10" fill="#000" opacity=".22" />)}
        <rect x="15" y="54" width="66" height="1.2" fill="#000" opacity=".35" />
        {cover > 0 && (
          <>
            <ellipse cx="48" cy="33" rx="9" ry="3" fill="#120f0e" />
            <ellipse cx="48" cy="32.4" rx="7" ry="2" fill="#000" />
          </>
        )}
        {/* Spout cover, hinged at the back */}
        <g transform={`rotate(${cover * 118} 63 33)`}>
          <path d="M33,34 L35,24 Q36,20 40,20 L56,20 Q60,20 61,24 L63,34 Z" fill={u('cover')} />
          <rect x="41.5" y="23" width="13" height="6" rx="3" fill="#2b2725" />
          <path d="M36,21.5 L60,21.5" stroke="#fff" strokeOpacity=".3" strokeWidth=".9" />
        </g>
      </g>
    </svg>
  );
}

type Step = { ms: number; pose: (t: number) => ShakerPose };

/** A quick shake while the level rises (about 0.8 s). */
function shakeSteps(from: number, to: number): Step[] {
  return [{ ms: 800, pose: (t) => { const d = Math.exp(-3.2 * t); return { level: from + (to - from) * Math.min(1, t * 1.6), angle: 14 * Math.sin(t * Math.PI * 5) * d, slosh: -Math.sin(t * Math.PI * 5 - 0.6) * d, cover: 0, drink: false }; } }];
}

/** Goal: one big shake to full, the lid pops open, the shake is drunk, back upright, lid shut (about 4 s). */
function goalSteps(from: number): Step[] {
  const bounce = [0.25, 0.6, 0.95, 1.12, 1.04, 0.98, 1];
  const shut = [1, 0.7, 0.3, 0];
  return [
    { ms: 1200, pose: (t) => { const d = Math.exp(-2.4 * t); return { level: from + (1 - from) * Math.min(1, t * 1.5), angle: 24 * Math.sin(t * Math.PI * 4) * d, slosh: -Math.sin(t * Math.PI * 4 - 0.6) * d * 1.3, cover: 0, drink: false }; } },
    { ms: 240, pose: () => REST(1) },
    { ms: 320, pose: (t) => ({ ...REST(1), cover: bounce[Math.min(bounce.length - 1, Math.floor(t * bounce.length))] }) },
    { ms: 320, pose: (t) => ({ level: 1, angle: -40 * t, slosh: 0, cover: 1, drink: true }) },
    { ms: 900, pose: (t) => ({ level: 1 - t, angle: -40 - 6 * t, slosh: 0, cover: 1, drink: true }) },
    { ms: 420, pose: (t) => ({ level: 0, angle: -46 * (1 - t), slosh: 0, cover: 1, drink: false }) },
    { ms: 170, pose: (t) => ({ ...REST(0), cover: shut[Math.min(shut.length - 1, Math.floor(t * shut.length))] }) },
  ];
}

/** The shaker with its animation: plays `play` once when shown, then rests at `level`. Reduce Motion: no movement, same end. */
export default function ProteinShaker({ from, level, play, goal, onSettled }: { from: number; level: number; play: ShakerPlay; goal: number; onSettled?: () => void }) {
  const pose = useFillAnimation<ShakerPose>(play, REST(from), REST(level), () => (play === 'goal' ? goalSteps(from) : shakeSteps(from, level)), [play, from, level], onSettled);
  return <ShakerDrawing pose={pose} goal={goal} />;
}
