import { CartesianGrid, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipProps } from 'recharts';
import type { DailyWeight } from '../lib/weight';
import { fromDayKey } from '../lib/dates';
import { displayWeight, weightUnit, type UnitSystem } from '../lib/units';

// Validated pair (dataviz validator, light surface #fffaf5): terracotta weigh-ins, blue 7-day average.
const WEIGH_IN = '#a85540';
const AVERAGE = '#2a6fb8';
const GRID = '#eadfd3';
const AXIS_TEXT = '#6f5b4c';

interface Row { t: number; date: string; weight: number; avg: number }

const fmtDay = (t: number) => new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

interface ChartProps {
  daily: DailyWeight[];
  average: DailyWeight[];
  goalKg?: number;
  units: UnitSystem;
  photoDays?: Map<string, number>; // day → weigh-in id with a photo
  onPhoto?: (weightId: number, date: string) => void;
}

export default function WeightChart({ daily, average, goalKg, units, photoDays, onPhoto }: ChartProps) {
  const rows: Row[] = daily.map((d, i) => ({ t: fromDayKey(d.date).getTime(), date: d.date, weight: displayWeight(d.kg, units), avg: displayWeight(average[i].kg, units) }));
  const goal = goalKg === undefined ? undefined : displayWeight(goalKg, units);
  const data = rows.flatMap((r) => [r.weight, r.avg]);
  // Draw the goal line only when it is near the data; a distant goal would flatten the trend. The legend always states it.
  const goalNear = goal !== undefined && goal >= Math.min(...data) - (units === 'imperial' ? 15 : 7);
  const values = goalNear ? data.concat(goal) : data;
  // Round the axis to multiples of 5 so the tick labels read cleanly.
  const lo = Math.floor((Math.min(...values) - 1) / 5) * 5;
  const hi = Math.ceil((Math.max(...values) + 1) / 5) * 5;
  const ticks = Array.from({ length: (hi - lo) / 5 + 1 }, (_, i) => lo + i * 5).filter((_, i, all) => all.length <= 6 || i % 2 === 0 || i === all.length - 1);
  const single = rows.length === 1;
  const unit = weightUnit(units);

  return (
    <figure>
      <div className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
        <LegendItem label="Weigh-ins"><svg width="18" height="10" aria-hidden><line x1="0" y1="5" x2="18" y2="5" stroke={WEIGH_IN} strokeWidth="1.5" /><circle cx="9" cy="5" r="4" fill={WEIGH_IN} stroke="#fffaf5" strokeWidth="2" /></svg></LegendItem>
        <LegendItem label="7-day average"><svg width="18" height="10" aria-hidden><line x1="0" y1="5" x2="18" y2="5" stroke={AVERAGE} strokeWidth="2.5" /></svg></LegendItem>
        {goal !== undefined && (
          <LegendItem label={`Goal ${goal} ${unit}${goalNear ? '' : ' (below chart)'}`}>
            {goalNear && <svg width="18" height="10" aria-hidden><line x1="0" y1="5" x2="18" y2="5" stroke={AXIS_TEXT} strokeWidth="1.5" strokeDasharray="4 3" /></svg>}
          </LegendItem>
        )}
      </div>
      <div className="h-56" role="img" aria-label={`Weight graph: ${rows.length} days of weigh-ins. Latest ${rows.at(-1)!.weight} ${unit}, 7-day average ${rows.at(-1)!.avg} ${unit}.`}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={rows} margin={{ top: 30, right: 12, bottom: 0, left: -12 }}>
            <CartesianGrid vertical={false} stroke={GRID} />
            <XAxis
              dataKey="t"
              type="number"
              scale="time"
              domain={single ? [rows[0].t - 3 * 864e5, rows[0].t + 3 * 864e5] : ['dataMin', 'dataMax']}
              tickFormatter={fmtDay}
              tick={{ fill: AXIS_TEXT, fontSize: 11 }}
              axisLine={{ stroke: GRID }}
              tickLine={false}
              minTickGap={24}
            />
            <YAxis domain={[lo, hi]} ticks={ticks} tick={{ fill: AXIS_TEXT, fontSize: 11 }} axisLine={false} tickLine={false} width={44} allowDecimals={false} />
            {goalNear && <ReferenceLine y={goal} stroke={AXIS_TEXT} strokeDasharray="4 3" strokeWidth={1.5} />}
            <Tooltip content={<ChartTooltip unit={unit} />} cursor={{ stroke: AXIS_TEXT, strokeWidth: 1 }} />
            {!single && <Line dataKey="avg" stroke={AVERAGE} strokeWidth={2.5} dot={false} activeDot={false} isAnimationActive={false} />}
            <Line
              dataKey="weight"
              stroke={WEIGH_IN}
              strokeWidth={1.5}
              dot={(p: { cx?: number; cy?: number; payload?: Row }) => <WeighInDot key={p.payload?.date} cx={p.cx} cy={p.cy} date={p.payload?.date} photoDays={photoDays} onPhoto={onPhoto} />}
              activeDot={{ r: 6, fill: WEIGH_IN, stroke: '#fffaf5', strokeWidth: 2 }}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </figure>
  );
}

/** Weigh-in point; on days with a photo, a camera badge above it opens the photo (44px tap area). */
function WeighInDot({ cx, cy, date, photoDays, onPhoto }: { cx?: number; cy?: number; date?: string; photoDays?: Map<string, number>; onPhoto?: (id: number, date: string) => void }) {
  if (cx === undefined || cy === undefined) return null;
  const photoId = date ? photoDays?.get(date) : undefined;
  return (
    <g>
      <circle cx={cx} cy={cy} r={4} fill={WEIGH_IN} stroke="#fffaf5" strokeWidth={2} />
      {photoId !== undefined && date && (
        <g
          className="cursor-pointer"
          onClick={() => onPhoto?.(photoId, date)}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onPhoto?.(photoId, date))}
          role="button"
          tabIndex={0}
          aria-label="Open progress photo"
        >
          <circle cx={cx} cy={cy - 20} r={22} fill="transparent" />
          <circle cx={cx} cy={cy - 20} r={10} fill="#fffaf5" stroke={WEIGH_IN} strokeWidth={1.5} />
          <path transform={`translate(${cx - 6} ${cy - 26}) scale(0.5)`} d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z M12 10a3.5 3.5 0 1 0 0 7a3.5 3.5 0 1 0 0-7" fill="none" stroke={WEIGH_IN} strokeWidth={2.4} />
        </g>
      )}
    </g>
  );
}

function LegendItem({ label, children }: { label: string; children: React.ReactNode }) {
  return <span className="inline-flex items-center gap-1.5">{children}{label}</span>;
}

function ChartTooltip({ active, payload, unit }: TooltipProps<number, string> & { unit: string }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload as Row;
  return (
    <div className="rounded-xl border border-line bg-surface px-3 py-2 text-xs text-ink shadow-soft">
      <p className="mb-1 font-semibold">{fmtDay(row.t)}</p>
      <p>Weigh-in: {row.weight} {unit}</p>
      <p>7-day average: {row.avg} {unit}</p>
    </div>
  );
}
