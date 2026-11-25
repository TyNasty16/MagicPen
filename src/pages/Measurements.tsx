import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { PlusIcon } from '../components/icons';
import TrendChart from '../components/TrendChart';
import { Button, Card, Field, inputClass } from '../components/ui';
import { deleteMeasurement, listMeasurements, listWeights, saveMeasurement, type Measurement, type Profile } from '../db/db';
import { bmiCategory, changeSinceFirst, currentBmi, MEASURE_FIELDS, series, waistToHeight, type MeasureField } from '../lib/body';
import { dayKey, fromDayKey, shortDate } from '../lib/dates';
import { displayLength, lengthToCm, lengthUnit, parseNum, round1 } from '../lib/units';

export default function Measurements({ profile }: { profile: Profile }) {
  const entries = useLiveQuery(listMeasurements);
  const weights = useLiveQuery(listWeights);
  const [editing, setEditing] = useState<Measurement | 'new' | null>(null);
  const [selected, setSelected] = useState<MeasureField>('waistCm');
  if (!entries || !weights) return null;

  const u = profile.units;
  const fmt = (field: MeasureField, v: number) => (field === 'bodyFatPct' ? `${round1(v)}%` : `${displayLength(v, u)} ${lengthUnit(u)}`);
  const bmiValue = currentBmi(profile, weights);
  const waist = changeSinceFirst(entries, 'waistCm');
  const whtr = waist && profile.heightCm ? waistToHeight(waist.latest, profile.heightCm) : undefined;
  const fieldInfo = MEASURE_FIELDS.find((f) => f.key === selected)!;
  const selSeries = series(entries, selected);

  if (editing) return <MeasurementForm key={editing === 'new' ? 'new' : editing.id} initial={editing === 'new' ? undefined : editing} profile={profile} onDone={() => setEditing(null)} />;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2.5">
        <div className="rounded-2xl bg-surface p-3 shadow-soft">
          <p className="text-xs text-muted">BMI</p>
          <p className="font-serif text-xl font-semibold">{bmiValue ? round1(bmiValue) : '—'}</p>
          <p className="text-[11px] text-muted">{bmiValue ? bmiCategory(bmiValue) : 'Needs height and weight'}</p>
        </div>
        <div className="rounded-2xl bg-surface p-3 shadow-soft">
          <p className="text-xs text-muted">Waist-to-height</p>
          <p className="font-serif text-xl font-semibold">{whtr ? whtr.toFixed(2) : '—'}</p>
          <p className="text-[11px] text-muted">{whtr ? 'waist ÷ height' : 'Log your waist to see it'}</p>
        </div>
      </div>

      <Button className="flex w-full items-center justify-center gap-2" onClick={() => setEditing('new')}>
        <PlusIcon width={20} height={20} /> Log measurements
      </Button>

      {entries.length > 0 && (
        <>
          <section aria-label="Measurements">
            <div className="grid grid-cols-2 gap-2">
              {MEASURE_FIELDS.map((f) => {
                const c = changeSinceFirst(entries, f.key);
                if (!c) return null;
                // Round first, then take the sign, so tiny changes read "no change" rather than "+0".
                const d = c.change === undefined ? undefined : f.key === 'bodyFatPct' ? round1(c.change) : displayLength(c.change, u);
                const changeText =
                  d === undefined
                    ? 'first entry'
                    : d === 0
                      ? 'no change since first'
                      : `${d < 0 ? '−' : '+'}${Math.abs(d)} ${f.key === 'bodyFatPct' ? 'pts' : lengthUnit(u)} since first`;
                return (
                  <button
                    key={f.key}
                    type="button"
                    aria-pressed={selected === f.key}
                    onClick={() => setSelected(f.key)}
                    className={`min-h-16 rounded-2xl border px-3 py-2.5 text-left transition ${selected === f.key ? 'border-accent bg-surface shadow-soft' : 'border-transparent bg-surface/70'}`}
                  >
                    <span className="block text-xs text-muted">{f.label}</span>
                    <span className="block font-serif text-lg font-semibold">{fmt(f.key, c.latest)}</span>
                    <span className="block text-[11px] text-muted">{changeText}</span>
                  </button>
                );
              })}
            </div>
          </section>

          <Card title={`${fieldInfo.label} trend`}>
            {selSeries.length === 0 ? (
              <p className="text-sm text-muted">No {fieldInfo.label.toLowerCase()} entries yet.</p>
            ) : (
              <TrendChart
                points={selSeries.map((p) => ({ date: p.date, value: selected === 'bodyFatPct' ? round1(p.value) : displayLength(p.value, u) }))}
                seriesLabel={fieldInfo.label}
                unit={selected === 'bodyFatPct' ? '%' : lengthUnit(u)}
              />
            )}
          </Card>

          <Card title="Entries">
            <ul className="-my-2 divide-y divide-line">
              {[...entries].reverse().map((e) => (
                <li key={e.id}>
                  <button className="flex min-h-12 w-full flex-col items-start py-2 text-left" onClick={() => setEditing(e)}>
                    <span className="font-medium">{shortDate(fromDayKey(e.date))}</span>
                    <span className="text-sm text-muted">
                      {MEASURE_FIELDS.filter((f) => e[f.key] !== undefined).map((f) => `${f.label} ${fmt(f.key, e[f.key]!)}`).join(' · ')}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </Card>
        </>
      )}
      <p className="px-1 text-xs text-muted">BMI and waist-to-height are standard calculations, not a diagnosis. Discuss what they mean for you with your clinician.</p>
    </div>
  );
}

function MeasurementForm({ initial, profile, onDone }: { initial?: Measurement; profile: Profile; onDone: () => void }) {
  const u = profile.units;
  const [date, setDate] = useState(initial?.date ?? dayKey(new Date()));
  const [texts, setTexts] = useState<Record<MeasureField, string>>(() => {
    const t = {} as Record<MeasureField, string>;
    for (const f of MEASURE_FIELDS) {
      const v = initial?.[f.key];
      t[f.key] = v === undefined ? '' : String(f.kind === 'percent' ? round1(v) : displayLength(v, u));
    }
    return t;
  });
  const [error, setError] = useState<string>();

  const save = async () => {
    if (!date) return setError('Choose a date.');
    if (date > dayKey(new Date())) return setError('The date can’t be in the future.');
    const entry: Measurement = { ...(initial?.id ? { id: initial.id } : {}), date };
    for (const f of MEASURE_FIELDS) {
      const text = texts[f.key].trim();
      if (!text) continue;
      const unchanged = initial?.[f.key] !== undefined && text === String(f.kind === 'percent' ? round1(initial[f.key]!) : displayLength(initial[f.key]!, u));
      const v = unchanged ? initial![f.key] : f.kind === 'percent' ? parseNum(text) : lengthToCm(text, u);
      const ok = v !== undefined && (f.kind === 'percent' ? v >= 2 && v <= 70 : v >= 10 && v <= 300);
      if (!ok) return setError(f.kind === 'percent' ? 'Enter body fat between 2 and 70%.' : `Check the ${f.label.toLowerCase()} value.`);
      entry[f.key] = v;
    }
    if (MEASURE_FIELDS.every((f) => entry[f.key] === undefined)) return setError('Enter at least one measurement.');
    await saveMeasurement(entry);
    onDone();
  };

  const remove = async () => {
    if (initial?.id && window.confirm('Delete this entry?')) {
      await deleteMeasurement(initial.id);
      onDone();
    }
  };

  return (
    <Card title={initial ? 'Edit measurements' : 'Log measurements'}>
      <div className="space-y-4">
        <Field label="Date" htmlFor="mdate">
          <input id="mdate" type="date" className={inputClass} value={date} max={dayKey(new Date())} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <p className="text-sm text-muted">Fill in any you measured — leave the rest blank.</p>
        <div className="grid grid-cols-2 gap-3">
          {MEASURE_FIELDS.map((f) => (
            <Field key={f.key} label={`${f.label} (${f.kind === 'percent' ? '%' : lengthUnit(u)})`} htmlFor={`m-${f.key}`}>
              <input id={`m-${f.key}`} className={inputClass} inputMode="decimal" value={texts[f.key]} onChange={(e) => setTexts({ ...texts, [f.key]: e.target.value })} />
            </Field>
          ))}
        </div>
        {error && <p role="alert" className="text-sm text-danger">{error}</p>}
        <div className="flex gap-2">
          <Button className="flex-1" onClick={save}>Save</Button>
          <Button variant="quiet" onClick={onDone}>Cancel</Button>
        </div>
        {initial && <button type="button" onClick={remove} className="min-h-11 w-full text-sm font-medium text-danger">Delete entry</button>}
      </div>
    </Card>
  );
}
