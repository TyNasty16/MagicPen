import { CartesianGrid, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipProps } from 'recharts';
import { fromDayKey } from '../lib/dates';
import { doseNotesByPoint, placeDoseMarks } from '../lib/range';
import { BMI_BOUNDARIES, BMI_CATS, bmiCat, bmiCategory, plausibleBmi, type BmiCat } from '../lib/body';

// Validated pair (dataviz validator, light surface #fffaf5): terracotta values, blue 7-day average.
const VALUE = '#a85540';
const AVERAGE = '#2a6fb8';
const GRID = '#eadfd3';
const AXIS_TEXT = '#6f5b4c';
const DOSE = '#8a7464';
const DAY = 864e5;
const AVERAGE_WITH_BMI = '#6f5b4c'; // blue means Overweight when BMI colours are on, so the average turns neutral
export const BMI_NOTE = 'Line colour shows adult BMI category for your height (CDC). BMI is a screening measure, not a diagnosis.';

export interface TrendPoint {
  date: string; // YYYY-MM-DD
  value: number; // already in display units
  avg?: number;
}

export interface DoseMark {
  date: string;
  label: string; // e.g. "0.5 mg" or "Start 0.25 mg"
}

interface Props {
  points: TrendPoint[];
  seriesLabel: string; // legend: "Weigh-ins", "Waist"…
  pointLabel?: string; // tap details for one point: "Weigh-in"; defaults to seriesLabel
  unit: string;
  avgLabel?: string;
  goal?: number;
  goalNearWithin?: number; // draw the goal line only when within this distance of the data
  window?: [string, string]; // fixed x range (range toggle); data-fitted when omitted
  doseMarks?: DoseMark[];
  photoDays?: Map<string, number>; // day → weigh-in id with a photo
  onPhoto?: (weightId: number, date: string) => void;
  /** BMI colours (workflow 15): converts a shown value to BMI and back. Pass only when the profile allows it (height, adult). */
  bmi?: { toBmi: (value: number) => number; valueAt: (bmi: number) => number };
}

type Row = { t: number; date: string; value: number; avg?: number; dose?: string; cat?: BmiCat; cross?: boolean } & Partial<Record<BmiCat, number>>;

const round1 = (v: number) => Math.round(v * 10) / 10;
/**
 * Splits the line by BMI category: each point fills its category's series, and where the line crosses a category
 * boundary between two points an extra (unmarked) point sits exactly on the boundary in both series, so the colour
 * changes right there.
 */
export function bmiRows(rows: Row[], toBmi: (v: number) => number, valueAt: (b: number) => number): Row[] {
  const out: Row[] = [];
  rows.forEach((r, i) => {
    const b = toBmi(r.value);
    const cat = bmiCat(b);
    out.push({ ...r, cat, [cat]: r.value });
    const n = rows[i + 1];
    if (!n) return;
    const nb = toBmi(n.value);
    const crossings = BMI_BOUNDARIES.filter((x) => (round1(b) < x) !== (round1(nb) < x)).map((x) => {
      const v = valueAt(x);
      const f = (v - r.value) / (n.value - r.value || 1);
      return { x, v, t: r.t + (n.t - r.t) * Math.min(1, Math.max(0, f)) };
    });
    crossings.sort((p, q) => p.t - q.t);
    for (const c of crossings) out.push({ t: c.t, date: '', value: c.v, cross: true, [bmiCat(c.x - 0.1)]: c.v, [bmiCat(c.x)]: c.v });
  });
  return out;
}

const fmtDay = (t: number) => new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

/** A tick step from 1/2/5/10… giving at most ~6 ticks. */
function niceStep(span: number): number {
  for (const s of [0.5, 1, 2, 5, 10, 20, 50]) if (span / s <= 6) return s;
  return 100;
}

export default function TrendChart({ points, seriesLabel, pointLabel, unit, avgLabel, goal, goalNearWithin = Infinity, window, doseMarks = [], photoDays, onPhoto, bmi }: Props) {
  const rows: Row[] = points.map((p) => ({ t: fromDayKey(p.date).getTime(), date: p.date, value: p.value, avg: p.avg }));
  // BMI colours need at least 2 points and believable BMIs (a typing slip leaves the plain line).
  const bmiOn = !!bmi && rows.length >= 2 && rows.every((r) => plausibleBmi(bmi.toBmi(r.value)));
  const data = rows.flatMap((r) => (r.avg === undefined ? [r.value] : [r.value, r.avg]));
  const goalNear = goal !== undefined && goal >= Math.min(...data) - goalNearWithin;
  const values = goalNear ? data.concat(goal) : data;
  const step = niceStep(Math.max(...values) - Math.min(...values) + 2);
  const lo = Math.floor((Math.min(...values) - step / 5) / step) * step;
  const hi = Math.ceil((Math.max(...values) + step / 5) / step) * step;
  const ticks = Array.from({ length: Math.round((hi - lo) / step) + 1 }, (_, i) => +(lo + i * step).toFixed(1));
  const single = rows.length === 1;
  const domain: [number, number] = window
    ? [fromDayKey(window[0]).getTime(), fromDayKey(window[1]).getTime()]
    : single ? [rows[0].t - 3 * DAY, rows[0].t + 3 * DAY] : [rows[0].t, rows[rows.length - 1].t];
  const marks = placeDoseMarks(doseMarks, domain[0], domain[1]);
  // Visible dose changes also appear in the tap details of the first point on or after them.
  const notes = doseNotesByPoint(rows.map((r) => r.date), marks);
  for (const r of rows) {
    const n = notes.get(r.date);
    if (n) r.dose = n.join('; ');
  }
  const latest = rows[rows.length - 1];
  const chartRows = bmiOn ? bmiRows(rows, bmi!.toBmi, bmi!.valueAt) : rows;
  const latestBmi = bmiOn ? bmi!.toBmi(latest.value) : undefined;
  const catsShown = bmiOn ? BMI_CATS.filter((c) => rows.some((r) => bmiCat(bmi!.toBmi(r.value)) === c.id)) : [];
  // Classes 2 and 3 share a colour, so they share one key entry.
  const keyEntries = catsShown.filter((c) => c.id !== 'ob3' || !catsShown.some((d) => d.id === 'ob2')).map((c) => ({ colour: c.colour, label: c.id === 'ob2' || c.id === 'ob3' ? 'Obesity, class 2 and above' : c.label }));
  const bmiLines = bmiOn ? [25, 30].map((b) => ({ b, y: round1(bmi!.valueAt(b)) })) : [];
  const avgColour = bmiOn ? AVERAGE_WITH_BMI : AVERAGE;

  return (
    <figure>
      <div className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
        {bmiOn ? (
          keyEntries.map((k) => <LegendItem key={k.label} label={k.label}><svg width="18" height="10" aria-hidden><line x1="0" y1="5" x2="18" y2="5" stroke={k.colour} strokeWidth="3" strokeLinecap="round" /></svg></LegendItem>)
        ) : (
          <LegendItem label={seriesLabel}><svg width="18" height="10" aria-hidden><line x1="0" y1="5" x2="18" y2="5" stroke={VALUE} strokeWidth="1.5" /><circle cx="9" cy="5" r="4" fill={VALUE} stroke="#fffaf5" strokeWidth="2" /></svg></LegendItem>
        )}
        {avgLabel && <LegendItem label={avgLabel}><svg width="18" height="10" aria-hidden><line x1="0" y1="5" x2="18" y2="5" stroke={avgColour} strokeWidth="2.5" strokeDasharray={bmiOn ? '4 3' : undefined} /></svg></LegendItem>}
        {marks.length > 0 && <LegendItem label="Dose change"><svg width="10" height="12" aria-hidden><line x1="5" y1="0" x2="5" y2="12" stroke={DOSE} strokeWidth="1.5" strokeDasharray="2 2" /></svg></LegendItem>}
        {goal !== undefined && (
          <LegendItem label={`Goal ${goal} ${unit}${goalNear ? '' : ' (below chart)'}`}>
            {goalNear && <svg width="18" height="10" aria-hidden><line x1="0" y1="5" x2="18" y2="5" stroke={AXIS_TEXT} strokeWidth="1.5" strokeDasharray="4 3" /></svg>}
          </LegendItem>
        )}
      </div>
      <div
        className="h-56"
        role="img"
        aria-label={`${seriesLabel} graph: ${rows.length} days. Latest ${latest.value} ${unit}${latest.avg !== undefined ? `, 7-day average ${latest.avg} ${unit}` : ''}.${marks.length ? ` Dose changes: ${marks.map((m) => `${m.label} on ${fmtDay(m.t)}`).join(', ')}.` : ''}${latestBmi !== undefined ? ` Latest BMI ${round1(latestBmi).toFixed(1)}, ${bmiCategory(latestBmi)}.` : ''}`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartRows} margin={{ top: 30, right: 12, bottom: 0, left: -12 }}>
            <CartesianGrid vertical={false} stroke={GRID} />
            <XAxis dataKey="t" type="number" scale="time" domain={domain} tickFormatter={fmtDay} tick={{ fill: AXIS_TEXT, fontSize: 11 }} axisLine={{ stroke: GRID }} tickLine={false} minTickGap={24} />
            <YAxis domain={[lo, hi]} ticks={ticks} tick={{ fill: AXIS_TEXT, fontSize: 11 }} axisLine={false} tickLine={false} width={44} />
            {goalNear && <ReferenceLine y={goal} stroke={AXIS_TEXT} strokeDasharray="4 3" strokeWidth={1.5} />}
            {bmiLines.filter((l) => l.y >= lo && l.y <= hi).map((l) => (
              <ReferenceLine key={l.b} y={l.y} stroke={AXIS_TEXT} strokeDasharray="1 3" strokeWidth={1} label={{ value: `BMI ${l.b}`, position: 'insideTopRight', fill: AXIS_TEXT, fontSize: 10 }} />
            ))}
            {marks.map((m) => (
              <ReferenceLine
                key={m.date + m.label}
                x={m.t}
                stroke={DOSE}
                strokeDasharray="2 3"
                strokeWidth={1.5}
                label={m.showLabel ? <DoseLabel text={m.label} nearRight={(m.t - domain[0]) / (domain[1] - domain[0] || 1) > 0.75} /> : undefined}
              />
            ))}
            <Tooltip content={<ChartTooltip unit={unit} seriesLabel={pointLabel ?? seriesLabel} avgLabel={avgLabel} toBmi={bmiOn ? bmi!.toBmi : undefined} />} cursor={{ stroke: AXIS_TEXT, strokeWidth: 1 }} />
            {avgLabel && !single && <Line dataKey="avg" stroke={avgColour} strokeWidth={bmiOn ? 2 : 2.5} strokeDasharray={bmiOn ? '4 3' : undefined} dot={false} activeDot={false} isAnimationActive={false} connectNulls />}
            {bmiOn && BMI_CATS.filter((c) => chartRows.some((r) => r[c.id] !== undefined)).map((c) => (
              <Line
                key={c.id}
                dataKey={c.id}
                stroke={c.colour}
                strokeWidth={3}
                connectNulls={false}
                dot={(p: { cx?: number; cy?: number; payload?: Row }) => (p.payload?.cross || p.payload?.cat !== c.id ? <g key={`${c.id}-${p.payload?.t}`} /> : <ValueDot key={`${c.id}-${p.payload?.date}`} cx={p.cx} cy={p.cy} date={p.payload?.date} photoDays={photoDays} onPhoto={onPhoto} colour={c.colour} />)}
                activeDot={false}
                isAnimationActive={false}
              />
            ))}
            {!bmiOn && <Line
              dataKey="value"
              stroke={VALUE}
              strokeWidth={1.5}
              dot={(p: { cx?: number; cy?: number; payload?: Row }) => <ValueDot key={p.payload?.date} cx={p.cx} cy={p.cy} date={p.payload?.date} photoDays={photoDays} onPhoto={onPhoto} />}
              activeDot={{ r: 6, fill: VALUE, stroke: '#fffaf5', strokeWidth: 2 }}
              isAnimationActive={false}
            />}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      {bmiOn && <figcaption className="mt-2 text-[11px] leading-snug text-muted">{BMI_NOTE}</figcaption>}
    </figure>
  );
}

/** Data point; on days with a photo, a camera badge above it opens the photo (44px tap area). */
function ValueDot({ cx, cy, date, photoDays, onPhoto, colour = VALUE }: { cx?: number; cy?: number; date?: string; photoDays?: Map<string, number>; onPhoto?: (id: number, date: string) => void; colour?: string }) {
  if (cx === undefined || cy === undefined) return null;
  const photoId = date ? photoDays?.get(date) : undefined;
  return (
    <g>
      <circle cx={cx} cy={cy} r={4} fill={colour} stroke="#fffaf5" strokeWidth={2} />
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
          <circle cx={cx} cy={cy - 20} r={10} fill="#fffaf5" stroke={VALUE} strokeWidth={1.5} />
          <path transform={`translate(${cx - 6} ${cy - 26}) scale(0.5)`} d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z M12 10a3.5 3.5 0 1 0 0 7a3.5 3.5 0 1 0 0-7" fill="none" stroke={VALUE} strokeWidth={2.4} />
        </g>
      )}
    </g>
  );
}

/** Dose label drawn just above the plot (in the top margin), beside its line; flips left near the right edge. */
function DoseLabel({ text, nearRight, viewBox }: { text: string; nearRight: boolean; viewBox?: { x?: number; y?: number } }) {
  if (viewBox?.x === undefined || viewBox.y === undefined) return null;
  return (
    <text x={viewBox.x + (nearRight ? -4 : 4)} y={viewBox.y - 8} textAnchor={nearRight ? 'end' : 'start'} fill={AXIS_TEXT} fontSize={10} fontWeight={600}>
      {text}
    </text>
  );
}

function LegendItem({ label, children }: { label: string; children: React.ReactNode }) {
  return <span className="inline-flex items-center gap-1.5">{children}{label}</span>;
}

function ChartTooltip({ active, payload, unit, seriesLabel, avgLabel, toBmi }: TooltipProps<number, string> & { unit: string; seriesLabel: string; avgLabel?: string; toBmi?: (v: number) => number }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload as Row;
  if (row.cross) return null; // a boundary point, not a weigh-in
  const b = toBmi?.(row.value);
  return (
    <div className="rounded-xl border border-line bg-surface px-3 py-2 text-xs text-ink shadow-soft">
      <p className="mb-1 font-semibold">{fmtDay(row.t)}</p>
      <p>{seriesLabel}: {row.value} {unit}</p>
      {b !== undefined && <p>BMI {round1(b).toFixed(1)} · {bmiCategory(b)}</p>}
      {avgLabel && row.avg !== undefined && <p>{avgLabel}: {row.avg} {unit}</p>}
      {row.dose && <p className="mt-1 text-muted">Dose changed: {row.dose}</p>}
    </div>
  );
}
