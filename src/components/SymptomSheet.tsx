import { useState } from 'react';
import { saveSymptoms, deleteSymptom, type Symptom } from '../db/db';
import { fromLocalInput, toLocalInput } from '../lib/dates';
import { isValidSeverity, symptomLabel, SYMPTOM_TYPES } from '../lib/symptoms';
import BottomSheet from './BottomSheet';
import HelpBox from './HelpBox';
import { Button, Field, inputClass } from './ui';

const DEFAULT_SEVERITY = 2;

/** Log one or more symptoms at once (new), or edit a single entry. */
export default function SymptomSheet({ initial, onDone }: { initial?: Symptom; onDone: () => void }) {
  const [when, setWhen] = useState(toLocalInput(initial?.datetime ?? new Date().toISOString()));
  const [picked, setPicked] = useState<Map<string, number>>(() => new Map(initial ? [[initial.type, initial.severity]] : []));
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [error, setError] = useState<string>();

  const toggle = (id: string) => {
    // Editing: one entry, so picking another symptom changes its type and keeps the chosen severity.
    if (initial) return setPicked(new Map([[id, [...picked.values()][0] ?? initial.severity]]));
    const next = new Map(picked);
    if (next.has(id)) next.delete(id);
    else next.set(id, DEFAULT_SEVERITY);
    setPicked(next);
  };

  const save = async () => {
    if (!when) return setError('Choose a date and time.');
    if (new Date(when).getTime() > Date.now() + 60_000) return setError('The date and time can’t be in the future.');
    if (![...picked.values()].every(isValidSeverity)) return setError('Choose a severity from 1 to 5.');
    const datetime = initial && when === toLocalInput(initial.datetime) ? initial.datetime : fromLocalInput(when);
    await saveSymptoms([...picked].map(([type, severity]) => ({ ...(initial?.id ? { id: initial.id } : {}), datetime, type, severity, notes: notes.trim() || undefined })));
    onDone();
  };

  const remove = async () => {
    if (initial?.id && window.confirm('Delete this entry?')) {
      await deleteSymptom(initial.id);
      onDone();
    }
  };

  return (
    <BottomSheet
      title={initial ? 'Edit symptom' : 'Log symptoms'}
      onClose={onDone}
      footer={
        <>
          {error && <p role="alert" className="mb-2 text-sm text-danger">{error}</p>}
          <Button className="w-full" disabled={picked.size === 0} onClick={save}>
            {picked.size > 1 ? `Save ${picked.size} symptoms` : 'Save'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="When" htmlFor="swhen">
          <input id="swhen" type="datetime-local" className={inputClass} max={toLocalInput(new Date().toISOString())} value={when} onChange={(e) => setWhen(e.target.value)} />
        </Field>
        <div>
          <p className="mb-1 text-sm font-medium">{initial ? 'Symptom' : 'How are you feeling? Tap all that apply'}</p>
          <div className="grid grid-cols-3 gap-1.5" role="group" aria-label="Symptoms">
            {SYMPTOM_TYPES.map((t) => (
              <button
                key={t.id}
                type="button"
                aria-pressed={picked.has(t.id)}
                onClick={() => toggle(t.id)}
                className={`min-h-11 rounded-xl border px-1.5 text-[13px] leading-tight transition ${picked.has(t.id) ? 'border-accent bg-accent font-semibold text-on-accent' : 'border-line bg-bg'}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
        {[...picked].map(([type, sev]) => (
          <div key={type}>
            <p className="mb-1 text-sm font-medium" id={`sev-${type}`}>
              {symptomLabel(type)} <span className="font-normal text-muted">· 1 mild – 5 severe</span>
            </p>
            <div className="flex gap-1" role="group" aria-labelledby={`sev-${type}`}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  aria-pressed={sev === n}
                  aria-label={`Severity ${n}`}
                  onClick={() => setPicked(new Map(picked).set(type, n))}
                  className={`h-11 flex-1 rounded-lg border text-sm font-semibold transition ${sev === n ? 'border-accent bg-accent text-on-accent' : 'border-line bg-bg text-muted'}`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        ))}
        <Field label="Notes (optional)" htmlFor="snotes">
          <textarea id="snotes" rows={2} className={`${inputClass} py-2`} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
        {initial && <button type="button" onClick={remove} className="min-h-11 w-full text-sm font-medium text-danger">Delete entry</button>}
        <HelpBox id="sheet-help" />
      </div>
    </BottomSheet>
  );
}
