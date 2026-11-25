import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useRef, useState } from 'react';
import { CameraIcon, PlusIcon } from '../components/icons';
import PhotoViewer from '../components/PhotoViewer';
import { Button, Card, Field, inputClass, ScreenHeader } from '../components/ui';
import TrendChart from '../components/TrendChart';
import Segmented from '../components/Segmented';
import Measurements from './Measurements';
import { deleteWeight, getPhoto, listInjections, listWeights, saveWeighIn, weightIdsWithPhotos, type Profile, type WeightEntry } from '../db/db';
import { dayKey, fromDayKey, shortDate } from '../lib/dates';
import { doseChanges, doseMarkLabel, filterRange, rangeStart, RANGES, type Range } from '../lib/range';
import { resizeToJpeg } from '../lib/image';
import { clearAddParam } from '../lib/route';
import { displayWeight, weightToKg, weightUnit } from '../lib/units';
import { dailyWeights, movingAverage7, weightStats } from '../lib/weight';

type View = 'weight' | 'measurements';

/** The "Body" tab: weight and measurements. */
export default function Body(props: { profile: Profile; backHref?: string; startAdding: boolean; focusPhoto: boolean; view?: View }) {
  const [view, setView] = useState<View>(props.view ?? 'weight');
  const [range, setRange] = useState<Range>('90d'); // kept here so it survives switching views
  return (
    <div className="space-y-4">
      <ScreenHeader title="Body" backHref={props.backHref} />
      <Segmented
        label="Body section"
        value={view}
        onChange={setView}
        options={[
          { id: 'weight', label: 'Weight' },
          { id: 'measurements', label: 'Measurements' },
        ]}
      />
      {view === 'weight' ? <Weight {...props} range={range} setRange={setRange} /> : <Measurements profile={props.profile} />}
    </div>
  );
}

function Weight({ profile, startAdding, focusPhoto, range, setRange }: { profile: Profile; startAdding: boolean; focusPhoto: boolean; range: Range; setRange: (r: Range) => void }) {
  const entries = useLiveQuery(listWeights);
  const photoIds = useLiveQuery(weightIdsWithPhotos);
  const injections = useLiveQuery(listInjections);
  const [editing, setEditing] = useState<WeightEntry | 'new' | null>(startAdding ? 'new' : null);
  const [viewing, setViewing] = useState<{ id: number; caption: string }>();
  if (!entries || !photoIds || !injections) return null;

  const u = profile.units;
  const unit = weightUnit(u);
  const daily = dailyWeights(entries);
  const stats = weightStats(daily, profile.startWeightKg, profile.goalWeightKg);
  const byId = new Map(entries.map((e) => [e.id!, e]));
  const photoDays = new Map<string, number>();
  for (const e of entries) if (photoIds.has(e.id!) && !photoDays.has(e.date)) photoDays.set(e.date, e.id!);
  const caption = (e: WeightEntry) => `${shortDate(fromDayKey(e.date))} · ${displayWeight(e.weightKg, u)} ${unit}`;

  // Average over all data first, then cut to the range, so the first points in range have a true 7-day average.
  const avg = movingAverage7(daily);
  const points = filterRange(
    daily.map((d, i) => ({ date: d.date, value: displayWeight(d.kg, u), avg: displayWeight(avg[i].kg, u) })),
    range,
  );
  const today = dayKey(new Date());
  const from = rangeStart(range);
  const doseMarks = doseChanges(injections).map((c) => ({ date: c.date, label: doseMarkLabel(c) }));

  return (
    <div className="space-y-4">
      {editing ? (
        <WeightForm
          key={editing === 'new' ? 'new' : editing.id}
          initial={editing === 'new' ? undefined : editing}
          profile={profile}
          focusPhoto={focusPhoto && editing === 'new'}
          onDone={() => {
            clearAddParam();
            setEditing(null);
          }}
        />
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
            {daily.length > 0 && (
              <div className="mb-3">
                <Segmented label="Graph range" value={range} onChange={setRange} options={RANGES} small />
              </div>
            )}
            {daily.length === 0 ? (
              <p className="text-sm text-muted">Log your first weigh-in to start your graph.</p>
            ) : points.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted">No weigh-ins in the last {range === '30d' ? '30' : '90'} days. Choose “All” to see earlier ones.</p>
            ) : (
              <TrendChart
                points={points}
                seriesLabel="Weigh-ins"
                pointLabel="Weigh-in"
                avgLabel="7-day average"
                unit={unit}
                goal={profile.goalWeightKg === undefined ? undefined : displayWeight(profile.goalWeightKg, u)}
                goalNearWithin={u === 'imperial' ? 15 : 7}
                window={from ? [from, today] : undefined}
                doseMarks={doseMarks}
                photoDays={photoDays}
                onPhoto={(id) => setViewing({ id, caption: caption(byId.get(id)!) })}
              />
            )}
          </Card>
          <Button className="flex w-full items-center justify-center gap-2" onClick={() => setEditing('new')}>
            <PlusIcon width={20} height={20} /> Log weight
          </Button>
          {entries.length > 0 && (
            <Card title="Weigh-ins">
              <ul className="-my-2 divide-y divide-line">
                {[...entries].reverse().map((e) => (
                  <li key={e.id} className="flex items-center">
                    <button className="flex min-h-12 flex-1 items-center justify-between py-2 text-left" onClick={() => setEditing(e)}>
                      <span>{shortDate(fromDayKey(e.date))}</span>
                      <span className="font-semibold">{displayWeight(e.weightKg, u)} {unit}</span>
                    </button>
                    {photoIds.has(e.id!) && (
                      <button aria-label={`Open photo, ${caption(e)}`} className="-mr-2 ml-1 grid size-11 place-items-center text-accent" onClick={() => setViewing({ id: e.id!, caption: caption(e) })}>
                        <CameraIcon width={20} height={20} />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </>
      )}
      {viewing && <PhotoViewer weightId={viewing.id} caption={viewing.caption} onClose={() => setViewing(undefined)} />}
    </div>
  );
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

type PhotoChange = { kind: 'keep' } | { kind: 'new'; blob: Blob } | { kind: 'remove' };

function WeightForm({ initial, profile, focusPhoto, onDone }: { initial?: WeightEntry; profile: Profile; focusPhoto: boolean; onDone: () => void }) {
  const u = profile.units;
  const [date, setDate] = useState(initial?.date ?? dayKey(new Date()));
  const [text, setText] = useState(initial ? String(displayWeight(initial.weightKg, u)) : '');
  const [error, setError] = useState<string>();
  const existing = useLiveQuery(async () => (initial?.id ? await getPhoto(initial.id) : undefined), [initial?.id]);
  const [photo, setPhotoChange] = useState<PhotoChange>({ kind: 'keep' });
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const photoBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (focusPhoto) photoBtnRef.current?.focus();
  }, [focusPhoto]);

  const previewBlob = photo.kind === 'new' ? photo.blob : photo.kind === 'keep' ? existing?.blob : undefined;
  const [previewUrl, setPreviewUrl] = useState<string>();
  useEffect(() => {
    if (!previewBlob) return setPreviewUrl(undefined);
    const url = URL.createObjectURL(previewBlob);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [previewBlob]);

  const pick = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    try {
      setPhotoChange({ kind: 'new', blob: await resizeToJpeg(file) });
      setError(undefined);
    } catch {
      setError('That photo could not be used. Try another one.');
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const save = async () => {
    const weightKg = weightToKg(text, u);
    if (!date) return setError('Choose a date.');
    if (weightKg === undefined || weightKg < 35 || weightKg > 350) return setError(`Enter a weight between ${u === 'imperial' ? '77 and 770 lb' : '35 and 350 kg'}.`);
    // Keep the stored value when the displayed number was not changed (avoids rounding drift).
    const unchanged = initial && text === String(displayWeight(initial.weightKg, u));
    try {
      await saveWeighIn({ ...(initial?.id ? { id: initial.id } : {}), date, weightKg: unchanged ? initial.weightKg : weightKg }, photo);
      onDone();
    } catch {
      setError('Could not save — your phone may be low on storage. Nothing was changed.');
    }
  };

  const remove = async () => {
    if (initial?.id && window.confirm('Delete this weigh-in (and its photo, if any)?')) {
      await deleteWeight(initial.id);
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
          <input id="wvalue" className={inputClass} inputMode="decimal" autoFocus={!focusPhoto} value={text} onChange={(e) => setText(e.target.value)} />
        </Field>
        <div>
          <p className="mb-1 text-sm font-medium">Progress photo <span className="font-normal text-muted">(optional)</span></p>
          <input ref={fileRef} id="wphoto" type="file" accept="image/*" className="sr-only" onChange={(e) => pick(e.target.files?.[0])} />
          {previewUrl ? (
            <div className="flex items-center gap-3">
              <img src={previewUrl} alt="Selected progress photo" className="size-20 rounded-xl object-cover" />
              <div className="flex flex-col">
                <button type="button" className="min-h-11 text-left text-sm font-semibold text-accent" onClick={() => fileRef.current?.click()}>Replace photo</button>
                <button type="button" className="min-h-11 text-left text-sm font-semibold text-danger" onClick={() => setPhotoChange({ kind: 'remove' })}>Remove photo</button>
              </div>
            </div>
          ) : (
            <button
              ref={photoBtnRef}
              type="button"
              disabled={busy}
              onClick={() => fileRef.current?.click()}
              className={`flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-dashed text-sm font-semibold text-accent ${focusPhoto ? 'border-accent bg-accent/5' : 'border-line'}`}
            >
              <CameraIcon width={20} height={20} /> {busy ? 'Preparing photo…' : 'Add a photo'}
            </button>
          )}
          <p className="mt-1 text-xs text-muted">Photos stay on this device.</p>
        </div>
        {error && <p role="alert" className="text-sm text-danger">{error}</p>}
        <div className="flex gap-2">
          <Button className="flex-1" disabled={busy} onClick={save}>Save</Button>
          <Button variant="quiet" onClick={onDone}>Cancel</Button>
        </div>
        {initial && <button type="button" onClick={remove} className="min-h-11 w-full text-sm font-medium text-danger">Delete weigh-in</button>}
      </div>
    </Card>
  );
}
