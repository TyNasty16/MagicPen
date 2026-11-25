import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { PlusIcon } from '../components/icons';
import { Button, Card, Field, inputClass, ScreenHeader } from '../components/ui';
import WeightChart from '../components/WeightChart';
import { db, listWeights, saveWeight, type Profile, type WeightEntry } from '../db/db';
import { dayKey, fromDayKey, shortDate } from '../lib/dates';
import { displayWeight, weightToKg, weightUnit } from '../lib/units';
import { dailyWeights, movingAverage7, weightStats } from '../lib/weight';

export default function Weight({ profile, backHref, startAdding }: { profile: Profile; backHref?: string; startAdding: boolean }) {
  const entries = useLiveQuery(listWeights);
  const [editing, setEditing] = useState<WeightEntry | 'new' | null>(startAdding ? 'new' : null);
  if (!entries) return null;

  const u = profile.units;
  const unit = weightUnit(u);
  const daily = dailyWeights(entries);
  const stats = weightStats(daily, profile.startWeightKg, profile.goalWeightKg);

  return (
    <div className="space-y-4">
      <ScreenHeader title="Weight" backHref={backHref} />
      {editing ? (
        <WeightForm key={editing === 'new' ? 'new' : editing.id} initial={editing === 'new' ? undefined : editing} profile={profile} onDone={() => { clearAddParam(); setEditing(null); }} />
      ) : (
        <>
          {stats && (
            <div className="grid grid-cols-3 gap-2.5">
              <Stat label="Current" value={displayWeight(stats.currentKg, u)} unit={unit} />
              {stats.lostKg !== undefined && (
                <Stat label={stats.lostKg >= 0 ? 'Lost' : 'Gained'} value={displayWeight(Math.abs(stats.lostKg), u)} unit={`${unit} · ${Math.abs(stats.lostPct ?? 0)}%`} />
              )}
              {stats.toGoalKg !== undefined && <Stat label="To goal" value={displayWeight(stats.toGoalKg, u)} unit={stats.toGoalKg === 0 ? 'Goal reached' : unit} />}
            </div>
          )}
          <Card title="Trend">
            {daily.length === 0 ? (
              <p className="text-sm text-muted">Log your first weigh-in to start your graph.</p>
            ) : (
              <WeightChart daily={daily} average={movingAverage7(daily)} goalKg={profile.goalWeightKg} units={u} />
            )}
          </Card>
          <Button className="flex w-full items-center justify-center gap-2" onClick={() => setEditing('new')}>
            <PlusIcon width={20} height={20} /> Log weight
          </Button>
          {entries.length > 0 && (
            <Card title="Weigh-ins">
              <ul className="-my-2 divide-y divide-line">
                {[...entries].reverse().map((e) => (
                  <li key={e.id}>
                    <button className="flex min-h-12 w-full items-center justify-between py-2 text-left" onClick={() => setEditing(e)}>
                      <span>{shortDate(fromDayKey(e.date))}</span>
                      <span className="font-semibold">{displayWeight(e.weightKg, u)} {unit}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

/** After a quick-add, drop `add=1` from the address so a reload doesn't reopen the form. */
export function clearAddParam() {
  const h = window.location.hash.replace(/([?&])add=1&?/, '$1').replace(/[?&]$/, '');
  if (h !== window.location.hash) history.replaceState(null, '', h || '#/home');
}

function Stat({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <div className="rounded-2xl bg-surface p-3 shadow-soft">
      <p className="text-xs text-muted">{label}</p>
      <p className="font-serif text-xl font-semibold">{value}</p>
      <p className="text-[11px] text-muted">{unit}</p>
    </div>
  );
}

function WeightForm({ initial, profile, onDone }: { initial?: WeightEntry; profile: Profile; onDone: () => void }) {
  const u = profile.units;
  const [date, setDate] = useState(initial?.date ?? dayKey(new Date()));
  const [text, setText] = useState(initial ? String(displayWeight(initial.weightKg, u)) : '');
  const [error, setError] = useState<string>();

  const save = async () => {
    const weightKg = weightToKg(text, u);
    if (!date) return setError('Choose a date.');
    if (weightKg === undefined || weightKg < 35 || weightKg > 350) return setError(`Enter a weight between ${u === 'imperial' ? '77 and 770 lb' : '35 and 350 kg'}.`);
    // Keep the stored value when the displayed number was not changed (avoids rounding drift).
    const unchanged = initial && text === String(displayWeight(initial.weightKg, u));
    await saveWeight({ ...(initial?.id ? { id: initial.id } : {}), date, weightKg: unchanged ? initial.weightKg : weightKg });
    onDone();
  };

  const remove = async () => {
    if (initial?.id && window.confirm('Delete this weigh-in?')) {
      await db.weights.delete(initial.id);
      onDone();
    }
  };

  return (
    <Card title={initial ? 'Edit weigh-in' : 'Log weight'}>
      <div className="space-y-4">
        <Field label="Date" htmlFor="wdate">
          <input id="wdate" type="date" className={inputClass} value={date} max={dayKey(new Date())} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label={`Weight (${weightUnit(u)})`} htmlFor="wvalue">
          <input id="wvalue" className={inputClass} inputMode="decimal" autoFocus value={text} onChange={(e) => setText(e.target.value)} />
        </Field>
        {error && <p role="alert" className="text-sm text-danger">{error}</p>}
        <div className="flex gap-2">
          <Button className="flex-1" onClick={save}>Save</Button>
          <Button variant="quiet" onClick={onDone}>Cancel</Button>
        </div>
        {initial && <button type="button" onClick={remove} className="min-h-11 w-full text-sm font-medium text-danger">Delete weigh-in</button>}
      </div>
    </Card>
  );
}
