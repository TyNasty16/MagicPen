import { useState } from 'react';
import type { Site } from '../db/db';
import { daysBetween } from '../lib/dates';
import { areaOf, BEFORE_EVERY_INJECTION, GUIDE_SOURCE, OZEMPIC_GUIDE, OZEMPIC_GUIDE_SOURCE, SITE_GUIDE } from '../lib/injectionGuide';
import type { DrugId } from '../lib/drugs';
import { siteLabel } from '../lib/injections';
import { BODY_PATH, ZONES } from './bodyFigure';

const STROKE = '#b89c84';
const FILL = '#f6ede3';
const RECENT = { fill: '#e9b9a6', stroke: '#cf8f78' };
const RESTED = { fill: '#bccfa9', stroke: '#8fa87a' };
const RECENT_DAYS = 14;

// Buttons mirror the figures: front (person's right on the left), then back (person's left on the left).
const GRID_ORDER: Site[] = ['abdomen-right', 'abdomen-left', 'thigh-right', 'thigh-left', 'arm-left', 'arm-right'];

interface Props {
  value: Site;
  suggested: Site;
  lastUsed: Map<Site, string>; // ISO datetime of each site's latest use
  onChange: (s: Site) => void;
  now?: Date;
}

export default function BodyMap({ value, suggested, lastUsed, onChange, now = new Date(), drug = 'wegovy' }: Props & { drug?: DrugId }) {
  const recent = (s: Site) => {
    const t = lastUsed.get(s);
    return t !== undefined && daysBetween(new Date(t), now) < RECENT_DAYS;
  };

  const figure = (view: 'front' | 'back', x0: number) => (
    <g transform={`translate(${x0} 0)`}>
      <path d={BODY_PATH} fill={FILL} stroke={STROKE} strokeWidth="1.4" strokeLinejoin="round" />
      <ellipse cx="100" cy="27" rx="18" ry="22" fill={FILL} stroke={STROKE} strokeWidth="1.4" />
      {view === 'front' ? (
        <circle cx="100" cy="176" r="1.8" fill={STROKE} />
      ) : (
        <g fill="none" strokeWidth="1.2">
          <path d="M100 74 V200 M100 214 V238" stroke="#dccab8" />
          <path d="M84 92 q-8 18 2 34 M116 92 q8 18 -2 34" stroke="#e3d3c3" />
        </g>
      )}
      {(Object.keys(ZONES) as Site[])
        .filter((s) => ZONES[s].view === view)
        .map((s) => {
          const [cx, cy, rx, ry, rot] = ZONES[s].g;
          const t = `rotate(${rot} ${cx} ${cy})`;
          const c = recent(s) ? RECENT : RESTED;
          return (
            <g key={s} onClick={() => onChange(s)} className="cursor-pointer">
              <ellipse transform={t} cx={cx} cy={cy} rx={rx + 10} ry={ry + 10} fill="transparent" />
              {s === value ? (
                <>
                  <ellipse transform={t} cx={cx} cy={cy} rx={rx + 5} ry={ry + 5} className="fill-accent" opacity="0.2" />
                  <ellipse transform={t} cx={cx} cy={cy} rx={rx} ry={ry} className="fill-accent" />
                </>
              ) : (
                <ellipse transform={t} cx={cx} cy={cy} rx={rx} ry={ry} fill={c.fill} fillOpacity="0.8" stroke={c.stroke} strokeWidth="1.2" />
              )}
              {s === suggested && (
                <ellipse transform={t} cx={cx} cy={cy} rx={rx + 8} ry={ry + 8} fill="none" strokeWidth="1.6" strokeDasharray="4 3" className="stroke-accent" />
              )}
            </g>
          );
        })}
    </g>
  );

  const label = 'text-[10px] font-semibold fill-muted';
  return (
    <div>
      <svg viewBox="10 0 400 416" className="w-full" aria-hidden>
        {figure('front', 0)}
        {figure('back', 210)}
        <text x="22" y="250" textAnchor="middle" className={label}>Right</text>
        <text x="178" y="250" textAnchor="middle" className={label}>Left</text>
        <text x="232" y="250" textAnchor="middle" className={label}>Left</text>
        <text x="388" y="250" textAnchor="middle" className={label}>Right</text>
        <text x="100" y="410" textAnchor="middle" className="fill-muted text-[11px] font-bold tracking-[0.1em]">FRONT</text>
        <text x="310" y="410" textAnchor="middle" className="fill-muted text-[11px] font-bold tracking-[0.1em]">BACK</text>
      </svg>
      <div className="mt-1 flex justify-center gap-4 text-[11px] text-muted">
        <span className="inline-flex items-center gap-1.5"><i className="inline-block size-2.5 rounded-sm" style={{ background: RECENT.fill }} />Used recently</span>
        <span className="inline-flex items-center gap-1.5"><i className="inline-block size-2.5 rounded-sm" style={{ background: RESTED.fill }} />Rested</span>
        <span className="inline-flex items-center gap-1.5"><i className="inline-block size-2.5 rounded-sm border border-dashed border-accent" />Suggested</span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-1.5" role="group" aria-label="Injection site">
        {GRID_ORDER.map((id) => (
          <button
            key={id}
            type="button"
            aria-pressed={id === value}
            onClick={() => onChange(id)}
            className={`min-h-11 rounded-xl border px-2 text-sm transition ${id === value ? 'border-accent bg-accent font-semibold text-on-accent' : 'border-line bg-bg'}`}
          >
            {siteLabel(id)}
            {id === suggested && <span className={id === value ? '' : 'text-muted'}> · Suggested</span>}
          </button>
        ))}
      </div>
      <InjectionGuide site={value} drug={drug} />
    </div>
  );
}

function InjectionGuide({ site, drug }: { site: Site; drug: DrugId }) {
  const [open, setOpen] = useState(false);
  const guide = SITE_GUIDE[areaOf(site)];
  // Ozempic: only its Medication Guide's own lines (the Wegovy per-area tips and pen steps are not used).
  if (drug === 'ozempic') {
    return (
      <section className="mt-3 rounded-2xl border border-line bg-white/60 p-3.5" aria-label="How to inject">
        <h3 className="mb-2 flex items-center gap-2 font-serif text-lg font-semibold">
          <span className="grid size-6 place-items-center rounded-lg bg-track font-sans text-sm text-accent" aria-hidden>i</span>
          How to inject
        </h3>
        <ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed">
          {OZEMPIC_GUIDE.map((t) => <li key={t}>{t}</li>)}
        </ul>
        <p className="mt-2 text-[11px] text-muted">{OZEMPIC_GUIDE_SOURCE}</p>
      </section>
    );
  }
  return (
    <section className="mt-3 rounded-2xl border border-line bg-white/60 p-3.5" aria-label="How to inject here">
      <h3 className="mb-2 flex items-center gap-2 font-serif text-lg font-semibold">
        <span className="grid size-6 place-items-center rounded-lg bg-track font-sans text-sm text-accent" aria-hidden>i</span>
        How to inject: {guide.title}
      </h3>
      <ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed">
        {guide.tips.map((t) => <li key={t}>{t}</li>)}
      </ul>
      <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className="mt-2.5 flex min-h-11 w-full items-center justify-between border-t border-line pt-2 text-sm font-semibold">
        Before every injection ({BEFORE_EVERY_INJECTION.length} steps)
        <span aria-hidden className={`transition ${open ? 'rotate-90' : ''}`}>›</span>
      </button>
      {open && (
        <ol className="list-decimal space-y-1 pl-5 text-sm leading-relaxed">
          {BEFORE_EVERY_INJECTION.map((t) => <li key={t}>{t}</li>)}
        </ol>
      )}
      <p className="mt-2 text-[11px] text-muted">{GUIDE_SOURCE}</p>
    </section>
  );
}
