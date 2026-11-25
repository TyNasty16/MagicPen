import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipProps } from 'recharts';
import { fromDayKey } from '../lib/dates';
import { formatDose } from '../lib/injections';
import type { InjectionWeek } from '../lib/symptomMap';

const LINE = '#a85540';
const GRID = '#eadfd3';
const AXIS = '#6f5b4c';
const DOSE = '#8a7464';

/** Average severity per injection week, with dashed lines where the logged dose changed (facts only). */
export default function InjectionWeekChart({ weeks, label }: { weeks: InjectionWeek[]; label: string }) {
  const rows = weeks.map((w, i) => ({
    ...w,
    name: fromDayKey(w.start).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    changed: i > 0 && w.doseMg !== weeks[i - 1].doseMg,
  }));
  const summary = rows.map((r) => `${r.name} ${r.average ?? 'none'}`).join(', ');
  return (
    <div className="h-44" role="img" aria-label={`${label}, average severity per injection week: ${summary}.`}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={rows} margin={{ top: 22, right: 10, bottom: 0, left: -24 }}>
          <CartesianGrid vertical={false} stroke={GRID} />
          <XAxis dataKey="name" tick={{ fill: AXIS, fontSize: 10 }} axisLine={{ stroke: GRID }} tickLine={false} interval="preserveStartEnd" minTickGap={6} />
          <YAxis domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} tick={{ fill: AXIS, fontSize: 11 }} axisLine={false} tickLine={false} />
          {rows.filter((r) => r.changed).map((r) => (
            <ReferenceLine key={r.name} x={r.name} stroke={DOSE} strokeDasharray="3 3" strokeWidth={1.5} label={{ value: formatDose(r.doseMg), position: 'top', fill: AXIS, fontSize: 10, fontWeight: 600 }} />
          ))}
          <Tooltip content={<Tip />} cursor={{ stroke: AXIS, strokeWidth: 1 }} />
          <Line dataKey="average" stroke={LINE} strokeWidth={2} connectNulls dot={{ r: 4, fill: LINE, stroke: '#fffaf5', strokeWidth: 2 }} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function Tip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  const w = payload[0].payload as InjectionWeek & { name: string };
  return (
    <div className="rounded-xl border border-line bg-surface px-3 py-2 text-xs text-ink shadow-soft">
      <p className="font-semibold">Week of {fromDayKey(w.start).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} · {formatDose(w.doseMg)}</p>
      <p>{w.count ? `Average ${w.average} of 5 · ${w.count} ${w.count === 1 ? 'entry' : 'entries'}` : 'No entries'}</p>
    </div>
  );
}
