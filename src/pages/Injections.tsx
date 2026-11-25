import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import BodyMap from '../components/BodyMap';
import { PlusIcon } from '../components/icons';
import { Button, Card, Field, inputClass, ScreenHeader } from '../components/ui';
import { db, listInjections, saveInjection, type Injection, type Profile } from '../db/db';
import { fromLocalInput, shortDate, toLocalInput } from '../lib/dates';
import { formatDose, siteLabel, suggestSite, WEGOVY_DOSES_MG } from '../lib/injections';
import { nextDose } from '../lib/nextDose';
import { parseNum } from '../lib/units';
import { clearAddParam } from './Weight';

export default function Injections({ profile, backHref, startAdding }: { profile: Profile; backHref?: string; startAdding: boolean }) {
  const injections = useLiveQuery(listInjections);
  const [editing, setEditing] = useState<Injection | 'new' | null>(startAdding ? 'new' : null);
  if (!injections) return null;

  const next = nextDose(injections[0]?.datetime, profile.injectionWeekday);

  return (
    <div className="space-y-4">
      <ScreenHeader title="Doses" backHref={backHref} />
      {editing ? (
        <InjectionForm
          key={editing === 'new' ? 'new' : editing.id}
          initial={editing === 'new' ? undefined : editing}
          history={injections}
          onDone={() => {
            clearAddParam();
            setEditing(null);
          }}
        />
      ) : (
        <>
          {next && (
            <Card>
              <p className="text-sm text-muted">Next injection</p>
              <p className="font-serif text-2xl font-semibold">
                {next.daysAway === 0 ? 'Today' : shortDate(next.date)}
                {next.daysAway !== 0 && <span className="font-sans text-base font-normal text-muted"> · {next.label}</span>}
              </p>
            </Card>
          )}
          <Button className="flex w-full items-center justify-center gap-2" onClick={() => setEditing('new')}>
            <PlusIcon width={20} height={20} /> Log an injection
          </Button>
          <Card title="History">
            {injections.length === 0 ? (
              <p className="text-sm text-muted">No injections logged yet.</p>
            ) : (
              <ul className="-my-2 divide-y divide-line">
                {injections.map((inj) => (
                  <li key={inj.id}>
                    <button className="flex min-h-14 w-full items-center justify-between gap-3 py-2 text-left" onClick={() => setEditing(inj)}>
                      <span>
                        <span className="block font-medium">{shortDate(new Date(inj.datetime))}</span>
                        <span className="block text-sm text-muted">{siteLabel(inj.site)}{inj.notes ? ` · ${inj.notes}` : ''}</span>
                      </span>
                      <span className="rounded-full bg-track px-3 py-1 text-sm font-semibold">{formatDose(inj.doseMg)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

function InjectionForm({ initial, history, onDone }: { initial?: Injection; history: Injection[]; onDone: () => void }) {
  // Rotation suggestion ignores the entry being edited.
  const suggested = suggestSite(history.filter((h) => h.id !== initial?.id));
  const startDose = initial?.doseMg; // never pre-filled for a new entry: the owner always chooses the dose
  const isPreset = startDose !== undefined && WEGOVY_DOSES_MG.includes(startDose);
  const [when, setWhen] = useState(toLocalInput(initial?.datetime ?? new Date().toISOString()));
  const [dose, setDose] = useState<number | 'other' | undefined>(startDose === undefined ? undefined : isPreset ? startDose : 'other');
  const [otherText, setOtherText] = useState(!isPreset && startDose !== undefined ? String(startDose) : '');
  const [site, setSite] = useState(initial?.site ?? suggested);
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [error, setError] = useState<string>();

  const save = async () => {
    const doseMg = dose === 'other' ? parseNum(otherText) : dose;
    if (!when) return setError('Choose a date and time.');
    if (new Date(when).getTime() > Date.now() + 60_000) return setError('The date and time can’t be in the future.');
    if (doseMg === undefined || doseMg <= 0 || doseMg > 20) return setError('Choose a dose, or enter a dose between 0 and 20 mg.');
    await saveInjection({ ...(initial?.id ? { id: initial.id } : {}), datetime: initial && when === toLocalInput(initial.datetime) ? initial.datetime : fromLocalInput(when), doseMg, site, notes: notes.trim() || undefined });
    onDone();
  };

  const remove = async () => {
    if (initial?.id && window.confirm('Delete this injection?')) {
      await db.injections.delete(initial.id);
      onDone();
    }
  };

  return (
    <Card title={initial ? 'Edit injection' : 'Log an injection'}>
      <div className="space-y-5">
        <Field label="Date and time" htmlFor="when">
          <input id="when" type="datetime-local" className={inputClass} max={toLocalInput(new Date().toISOString())} value={when} onChange={(e) => setWhen(e.target.value)} />
        </Field>
        <div>
          <p className="mb-1 text-sm font-medium" id="dose-label">Dose taken</p>
          <div className="grid grid-cols-3 gap-2" role="group" aria-labelledby="dose-label">
            {[...WEGOVY_DOSES_MG, 'other' as const].map((d) => (
              <button
                key={d}
                type="button"
                aria-pressed={dose === d}
                onClick={() => setDose(d)}
                className={`min-h-11 rounded-xl border text-sm font-medium transition ${dose === d ? 'border-accent bg-accent text-on-accent' : 'border-line bg-bg'}`}
              >
                {d === 'other' ? 'Other' : formatDose(d)}
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
          <p className="mb-1 text-sm font-medium">Injection site</p>
          <BodyMap value={site} suggested={suggested} onChange={setSite} />
          <p className="mt-2 text-xs text-muted">Suggested = the site you used longest ago.</p>
        </div>
        <Field label="Notes (optional)" htmlFor="notes">
          <textarea id="notes" rows={2} className={`${inputClass} py-2`} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
        {error && <p role="alert" className="text-sm text-danger">{error}</p>}
        <div className="flex gap-2">
          <Button className="flex-1" onClick={save}>Save</Button>
          <Button variant="quiet" onClick={onDone}>Cancel</Button>
        </div>
        {initial && (
          <button type="button" onClick={remove} className="min-h-11 w-full text-sm font-medium text-danger">Delete injection</button>
        )}
      </div>
    </Card>
  );
}
