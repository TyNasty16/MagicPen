import type { Site } from '../db/db';
import { BODY_PATH, ZONES } from './bodyFigure';

/** Tiny white figure (front or back, whichever shows the site) with the site marked. Decorative. */
export default function BodyThumb({ site }: { site: Site }) {
  const { g } = ZONES[site];
  const [cx, cy, rx, ry, rot] = g;
  return (
    <svg viewBox="28 0 144 396" className="h-14 w-auto flex-none" aria-hidden>
      <path d={BODY_PATH} fill="white" fillOpacity="0.3" />
      <ellipse cx="100" cy="27" rx="18" ry="22" fill="white" fillOpacity="0.3" />
      <ellipse transform={`rotate(${rot} ${cx} ${cy})`} cx={cx} cy={cy} rx={rx + 4} ry={ry + 4} fill="white" />
    </svg>
  );
}
