import { useLiveQuery } from 'dexie-react-hooks';
import { useCallback, useState } from 'react';
import BodyMap from '../components/BodyMap';
import BodyThumb from '../components/BodyThumb';
import BottomSheet from '../components/BottomSheet';
import { PlusIcon } from '../components/icons';
import { Button, Field, inputClass, ScreenHeader } from '../components/ui';
import { db, listInjections, saveInjection, type Injection, type Profile, type Site } from '../db/db';
import { fromLocalInput, shortDate, toLocalInput } from '../lib/dates';
import { areaOf } from '../lib/injectionGuide';
import { formatDose, siteLabel, suggestSite, WEGOVY_DOSES_MG } from '../lib/injections';
import { nextDose } from '../lib/nextDose';
import { parseNum } from '../lib/units';
import { clearAddParam } from '../lib/route';

const AREA_DOT = { stomach: 'bg-accent', thigh: 'bg-sage', arm: 'bg-gold' } as const;

export default function Injections({ profile, backHref, startAdding }: { profile: Profile; backHref?: string; startAdding: boolean }) {
  const injections = useLiveQuery(listInjections);
  const [editing, setEditing] = useState<Injection | 'new' | null>(startAdding ? 'new' : null);
  const close = useCallback(() => {
    clearAddParam();
    setEditing(null);
  }, []);
  if (!injections) return null;

  const last = injections[0];
  const next = nextDose(last?.datetime, profile.injectionWeekday);

  return (
    <div className="space-y-4">
      <ScreenHeader title="Doses" backHref={backHref} />

      <section className="rounded-card bg-gradient-to-br from-hero-from to-hero-to p-4.5 text-white shadow-soft">
        <p className="text-sm">Next injection</p>
        <p className="mt-0.5 font-serif text-2xl leading-tight font-semibold">
          {next ? (next.daysAway === 0 ? 'Today' : `${shortDate(next.date)} · ${next.label}`) : 'Set your injection day in Profile'}
        </p>
        {last ? (
          <div className="mt-3.5 grid grid-cols-2 gap-2.5">
            <div className="rounded-2xl bg-black/15 px-3 py-2.5">
              <p className="text-[11px]">Last dose</p>
              <p className="font-semibold">{formatDose(last.doseMg)}</p>
              <p className="text-[11px]">{shortDate(new Date(last.datetime))}</p>
            </div>
            <div className="flex items-center gap-2 rounded-2xl bg-black/15 px-2.5 py-2">
              <BodyThumb site={last.site} />
              <div className="min-w-0">
                <p className="text-[11px]">Last site</p>
                <p className="font-semibold leading-tight">{siteLabel(last.site)}</p>
              </div>
            </div>
          </div>
        ) : (
          <p className="mt-2 text-sm">No injections logged yet.</p>
        )}
      </section>

      <Button className="flex w-full items-center justify-center gap-2" onClick={() => setEditing('new')}>
        <PlusIcon width={20} height={20} /> Log injection
      </Button>

      {injections.length > 0 && (
        <section aria-label="History">
          <h2 className="mx-1 mb-2.5 text-xs font-semibold uppercase tracking-[0.07em] text-muted">History</h2>
          <ol className="relative space-y-2.5 pl-6 before:absolute before:top-2 before:bottom-2 before:left-2 before:w-0.5 before:bg-line">
            {injections.map((inj) => (
              <li key={inj.id} className="relative">
                <span className={`absolute top-5 -left-[22px] size-3 rounded-full border-2 border-bg ${AREA_DOT[areaOf(inj.site)]}`} aria-hidden />
                <button className="flex min-h-14 w-full items-center gap-3 rounded-2xl bg-surface px-3.5 py-3 text-left shadow-soft" onClick={() => setEditing(inj)}>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">{shortDate(new Date(inj.datetime))}</span>
                    <span className="block truncate text-sm text-muted">{siteLabel(inj.site)}{inj.notes ? ` · ${inj.notes}` : ''}</span>
                  </span>
                  <span className="rounded-full bg-track px-3 py-1 text-sm font-semibold">{formatDose(inj.doseMg)}</span>
                </button>
              </li>
            ))}
          </ol>
        </section>
      )}

      {editing && <InjectionSheet key={editing === 'new' ? 'new' : editing.id} initial={editing === 'new' ? undefined : editing} history={injections} onDone={close} />}
    </div>
  );
}

function InjectionSheet({ initial, history, onDone }: { initial?: Injection; history: Injection[]; onDone: () => void }) {
  // Rotation ignores the entry being edited.
  const others = history.filter((h) => h.id !== initial?.id);
  const suggested = suggestSite(others);
  const lastUsed = new Map<Site, string>();
  for (const h of others) if (!lastUsed.has(h.site) || h.datetime > lastUsed.get(h.site)!) lastUsed.set(h.site, h.datetime);

  const startDose = initial?.doseMg; // never pre-filled for a new entry: the owner always chooses the dose
  const isPreset = startDose !== undefined && WEGOVY_DOSES_MG.includes(startDose);
  const [when, setWhen] = useState(toLocalInput(initial?.datetime ?? new Date().toISOString()));
  const [dose, setDose] = useState<number | 'other' | undefined>(startDose === undefined ? undefined : isPreset ? startDose : 'other');
  const [otherText, setOtherText] = useState(!isPreset && startDose !== undefined ? String(startDose) : '');
  const [site, setSite] = useState<Site>(initial?.site ?? suggested);
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [error, setError] = useState<string>();

  const save = async () => {
    const doseMg = dose === 'other' ? parseNum(otherText) : dose;
    if (!when) return setError('Choose a date and time.');
    if (new Date(when).getTime() > Date.now() + 60_000) return setError('The date and time can’t be in the future.');
    if (doseMg === undefined || doseMg <= 0 || doseMg > 20) return setError('Choose a dose, or enter a dose between 0 and 20 mg.');
    await saveInjection({
      ...(initial?.id ? { id: initial.id } : {}),
      datetime: initial && when === toLocalInput(initial.datetime) ? initial.datetime : fromLocalInput(when),
      doseMg,
      site,
      notes: notes.trim() || undefined,
    });
    onDone();
  };

  const remove = async () => {
    if (initial?.id && window.confirm('Delete this injection?')) {
      await db.injections.delete(initial.id);
      onDone();
    }
  };

  return (
    <BottomSheet
      title={initial ? 'Edit injection' : 'Log injection'}
      onClose={onDone}
      footer={
        <>
          {error && <p role="alert" className="mb-2 text-sm text-danger">{error}</p>}
          <Button className="w-full" onClick={save}>Save injection</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="When" htmlFor="when">
          <input id="when" type="datetime-local" className={inputClass} max={toLocalInput(new Date().toISOString())} value={when} onChange={(e) => setWhen(e.target.value)} />
        </Field>
        <div>
          <p className="mb-1 text-sm font-medium" id="dose-label">Dose taken (mg)</p>
          <div className="flex gap-0.5 rounded-xl border border-line bg-bg p-1" role="group" aria-labelledby="dose-label">
            {[...WEGOVY_DOSES_MG, 'other' as const].map((d) => (
              <button
                key={d}
                type="button"
                aria-pressed={dose === d}
                aria-label={d === 'other' ? 'Other dose' : `${d} mg`}
                onClick={() => setDose(d)}
                className={`h-11 flex-1 rounded-lg text-sm font-semibold transition ${dose === d ? 'bg-accent text-on-accent shadow-[0_2px_6px_rgb(168_85_64/0.35)]' : 'text-muted'}`}
              >
                {d === 'other' ? 'Other' : d}
              </button>
            ))}
          </div>
          {dose === 'other' && (
            <div className="mt-2 flex items-center gap-2">
              <input aria-label="Other dose in mg" className={inputClass} inputMode="decimal" value={otherText} onChange={(e) => setOtherText(e.target.value)} />
              <span className="text-muted">mg</span>
            </div>
          )}
        </div>
        <div>
          <p className="mb-1 text-sm font-medium">Site</p>
          <BodyMap value={site} suggested={suggested} lastUsed={lastUsed} onChange={setSite} />
        </div>
        <Field label="Notes (optional)" htmlFor="notes">
          <textarea id="notes" rows={2} className={`${inputClass} py-2`} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
        {initial && <button type="button" onClick={remove} className="min-h-11 w-full text-sm font-medium text-danger">Delete injection</button>}
      </div>
    </BottomSheet>
  );
}
