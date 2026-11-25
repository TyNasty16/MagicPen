import { useLiveQuery } from 'dexie-react-hooks';
import { useCallback, useState } from 'react';
import AlertCards from '../components/AlertCards';
import HelpPopup from '../components/HelpPopup';
import { PlusIcon } from '../components/icons';
import PatternChart from '../components/PatternChart';
import SymptomSheet from '../components/SymptomSheet';
import { Button, Card, Field, inputClass, ScreenHeader } from '../components/ui';
import { listInjections, listSymptoms, type Symptom } from '../db/db';
import { dayKey, shortDate } from '../lib/dates';
import { clearAddParam } from '../lib/route';
import { tipFor } from '../lib/sideEffectText';
import { patternByDay, symptomLabel, SYMPTOM_TYPES } from '../lib/symptoms';

export default function Symptoms({ backHref, startAdding }: { backHref?: string; startAdding: boolean }) {
  const symptoms = useLiveQuery(listSymptoms);
  const injections = useLiveQuery(listInjections);
  const [editing, setEditing] = useState<Symptom | 'new' | null>(startAdding ? 'new' : null);
  const [chosen, setChosen] = useState<string>();
  const [showAll, setShowAll] = useState(false);
  // "When to get help" pops up the first time the screen is opened each day (not over the log panel).
  const [helpOpen, setHelpOpen] = useState(() => !startAdding && !helpShownToday());
  const closeHelp = useCallback(() => {
    markHelpShown();
    setHelpOpen(false);
  }, []);
  const close = useCallback(() => {
    clearAddParam();
    setEditing(null);
  }, []);
  if (!symptoms || !injections) return null;

  const type = chosen ?? symptoms[0]?.type ?? 'nausea';
  const tip = tipFor(type);
  const buckets = patternByDay(symptoms, injections, type);
  const charted = buckets.reduce((n, b) => n + b.count, 0);
  const time = (iso: string) => new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

  return (
    <div className="space-y-4">
      <ScreenHeader title="Symptoms" backHref={backHref} />
      <AlertCards symptoms={symptoms} />
      <Button className="flex w-full items-center justify-center gap-2" onClick={() => setEditing('new')}>
        <PlusIcon width={20} height={20} /> Log symptoms
      </Button>

      <button
        type="button"
        onClick={() => setHelpOpen(true)}
        className="flex min-h-11 w-full items-center gap-2 rounded-2xl border border-danger/30 bg-[#fbeeea] px-3.5 text-left text-sm font-semibold text-danger"
      >
        <span className="grid size-6 flex-none place-items-center rounded-full bg-danger text-white" aria-hidden>!</span>
        When to get help
        <span className="ml-auto font-normal text-muted">Read</span>
      </button>

      <Card>
        <Field label="Show symptom" htmlFor="sym-pick">
          <select id="sym-pick" className={inputClass} value={type} onChange={(e) => setChosen(e.target.value)}>
            {SYMPTOM_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
        </Field>
        <div className="mt-3 rounded-2xl bg-track/60 p-3 text-sm leading-relaxed">
          <p className="mb-1 font-semibold">Tips: {symptomLabel(type).toLowerCase()}</p>
          <p>{tip.text}</p>
          {tip.seeHelp && <button type="button" onClick={() => setHelpOpen(true)} className="mt-1 inline-flex min-h-11 items-center font-semibold text-danger">See “When to get help”</button>}
          <p className="mt-1.5 text-[11px] text-muted">Source: {tip.source}</p>
        </div>
        <h3 className="mt-4 mb-1 text-xs font-semibold uppercase tracking-[0.07em] text-muted">Days after injection</h3>
        {injections.length === 0 ? (
          <p className="py-4 text-sm text-muted">Log your injections to see which days {symptomLabel(type).toLowerCase()} tends to show up.</p>
        ) : charted === 0 ? (
          <p className="py-4 text-sm text-muted">No {symptomLabel(type).toLowerCase()} entries within a week of an injection yet.</p>
        ) : (
          <>
            <PatternChart buckets={buckets} label={symptomLabel(type)} />
            <p className="mt-1 text-[11px] text-muted">Average severity (0–5) · based on {charted} {charted === 1 ? 'entry' : 'entries'}. A few entries can be misleading.</p>
          </>
        )}
      </Card>

      {symptoms.length > 0 && (
        <Card title="Recent">
          <ul className="-my-2 divide-y divide-line">
            {(showAll ? symptoms : symptoms.slice(0, 10)).map((s) => (
              <li key={s.id}>
                <button className="flex min-h-12 w-full items-center gap-3 py-2 text-left" onClick={() => setEditing(s)}>
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">{symptomLabel(s.type)}</span>
                    <span className="block truncate text-sm text-muted">{shortDate(new Date(s.datetime))}, {time(s.datetime)}{s.notes ? ` · ${s.notes}` : ''}</span>
                  </span>
                  <span className="rounded-full bg-track px-3 py-1 text-sm font-semibold" aria-label={`Severity ${s.severity} of 5`}>{s.severity}/5</span>
                </button>
              </li>
            ))}
          </ul>
          {symptoms.length > 10 && (
            <button type="button" onClick={() => setShowAll(!showAll)} className="mt-2 min-h-11 w-full text-sm font-semibold text-accent">
              {showAll ? 'Show fewer' : `Show all ${symptoms.length}`}
            </button>
          )}
        </Card>
      )}

      {helpOpen && <HelpPopup onClose={closeHelp} />}
      {editing && <SymptomSheet key={editing === 'new' ? 'new' : editing.id} initial={editing === 'new' ? undefined : editing} onDone={close} />}
    </div>
  );
}

// Per-device convenience only (not health data): remembers the day the pop-up was last shown.
const HELP_KEY = 'steady.helpShownOn';
function helpShownToday(): boolean {
  try {
    return localStorage.getItem(HELP_KEY) === dayKey(new Date());
  } catch {
    return false;
  }
}
function markHelpShown() {
  try {
    localStorage.setItem(HELP_KEY, dayKey(new Date()));
  } catch {
    /* storage unavailable: the pop-up simply shows again next time */
  }
}
