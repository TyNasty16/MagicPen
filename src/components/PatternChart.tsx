import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipProps } from 'recharts';
import type { DayBucket } from '../lib/symptoms';

const BAR = '#a85540';
const GRID = '#eadfd3';
const AXIS_TEXT = '#6f5b4c';

/** Average severity (0–5) by days after an injection, with the number of entries per day. */
export default function PatternChart({ buckets, label }: { buckets: DayBucket[]; label: string }) {
  const rows = buckets.map((b) => ({ ...b, name: `Day ${b.day}`, value: b.average ?? 0 }));
  const summary = buckets.filter((b) => b.count).map((b) => `day ${b.day}: ${b.average} from ${b.count}`).join('; ');
  return (
    <div className="h-48" role="img" aria-label={`${label} by days after injection. ${summary || 'No entries yet.'}`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 18, right: 4, bottom: 0, left: -24 }}>
          <CartesianGrid vertical={false} stroke={GRID} />
          <XAxis dataKey="day" tickFormatter={(d) => `D${d}`} tick={{ fill: AXIS_TEXT, fontSize: 11 }} axisLine={{ stroke: GRID }} tickLine={false} />
          <YAxis domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} tick={{ fill: AXIS_TEXT, fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip content={<Tip />} cursor={{ fill: 'rgb(168 85 64 / 0.08)' }} />
          <Bar
            dataKey="value"
            fill={BAR}
            radius={[4, 4, 0, 0]}
            maxBarSize={28}
            isAnimationActive={false}
            label={{ position: 'top', fill: AXIS_TEXT, fontSize: 10, formatter: (v: number) => (v ? v : '') }}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function Tip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  const b = payload[0].payload as DayBucket & { name: string };
  return (
    <div className="rounded-xl border border-line bg-surface px-3 py-2 text-xs text-ink shadow-soft">
      <p className="font-semibold">{b.day === 0 ? 'Injection day' : `${b.day} day${b.day === 1 ? '' : 's'} after`}</p>
      <p>{b.count ? `Average ${b.average} of 5 · ${b.count} ${b.count === 1 ? 'entry' : 'entries'}` : 'No entries'}</p>
    </div>
  );
}
