import type { Site } from '../db/db';
import { siteLabel, SITES } from '../lib/injections';

// Front view: the person's right side is on the viewer's left.
const SPOTS: Record<Site, { x: number; y: number }> = {
  'arm-right': { x: 47, y: 92 },
  'arm-left': { x: 153, y: 92 },
  'abdomen-right': { x: 88, y: 122 },
  'abdomen-left': { x: 112, y: 122 },
  'thigh-right': { x: 84, y: 186 },
  'thigh-left': { x: 116, y: 186 },
};

const GRID_ORDER: Site[] = ['arm-right', 'arm-left', 'abdomen-right', 'abdomen-left', 'thigh-right', 'thigh-left'];

export default function BodyMap({ value, suggested, onChange }: { value: Site; suggested: Site; onChange: (s: Site) => void }) {
  return (
    <div>
      <svg viewBox="0 0 200 250" className="mx-auto h-56 w-auto" aria-hidden>
        <g className="fill-track">
          <circle cx="100" cy="26" r="17" />
          <rect x="66" y="48" width="68" height="104" rx="22" />
          <rect x="37" y="54" width="22" height="96" rx="11" />
          <rect x="141" y="54" width="22" height="96" rx="11" />
          <rect x="70" y="140" width="27" height="100" rx="13" />
          <rect x="103" y="140" width="27" height="100" rx="13" />
        </g>
        <text x="14" y="30" className="fill-muted text-[13px] font-semibold">R</text>
        <text x="178" y="30" className="fill-muted text-[13px] font-semibold">L</text>
        {SITES.map(({ id }) => {
          const { x, y } = SPOTS[id];
          const selected = id === value;
          return (
            <g key={id} onClick={() => onChange(id)} className="cursor-pointer">
              <circle cx={x} cy={y} r="18" fill="transparent" />
              {id === suggested && !selected && <circle cx={x} cy={y} r="13" fill="none" strokeWidth="2" strokeDasharray="3 3" className="stroke-accent" />}
              <circle cx={x} cy={y} r="9" className={selected ? 'fill-accent' : 'fill-surface stroke-muted'} strokeWidth={selected ? 0 : 1.5} />
            </g>
          );
        })}
      </svg>
      {/* Buttons mirror the figure: the person's right side in the left column. */}
      <div className="mt-2 grid grid-cols-2 gap-2" role="group" aria-label="Injection site">
        {GRID_ORDER.map((id) => (
          <button
            key={id}
            type="button"
            aria-pressed={id === value}
            onClick={() => onChange(id)}
            className={`min-h-11 rounded-xl border px-2 text-sm transition ${id === value ? 'border-accent bg-accent text-on-accent' : 'border-line bg-bg'}`}
          >
            {siteLabel(id)}
            {id === suggested && <span className={`block text-[11px] ${id === value ? 'text-on-accent' : 'text-muted'}`}>Suggested</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
