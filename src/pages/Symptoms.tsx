import { useLiveQuery } from 'dexie-react-hooks';
import { useCallback, useState } from 'react';
import AlertCards from '../components/AlertCards';
import HelpPopup from '../components/HelpPopup';
import { PlusIcon } from '../components/icons';
import SymptomMap from '../components/SymptomMap';
import SymptomSheet from '../components/SymptomSheet';
import { Button, Card, ScreenHeader } from '../components/ui';
import { listInjections, listSymptoms, type Symptom } from '../db/db';
import { dayKey, shortDate } from '../lib/dates';
import { clearAddParam } from '../lib/route';
import { symptomLabel, SYMPTOM_TYPES } from '../lib/symptoms';
import SymptomDetail from './SymptomDetail';

export default function Symptoms({ backHref, startAdding, detail }: { backHref?: string; startAdding: boolean; detail?: string }) {
  const symptoms = useLiveQuery(listSymptoms);
  const injections = useLiveQuery(listInjections);
  const [editing, setEditing] = useState<Symptom | 'new' | null>(startAdding ? 'new' : null);
  const [showAll, setShowAll] = useState(false);
  // "When to get help" pops up the first time the screen is opened each day (not over the log panel or a drill-down).
  const [helpOpen, setHelpOpen] = useState(() => !startAdding && !detail && !helpShownToday());
  const closeHelp = useCallback(() => {
    markHelpShown();
    setHelpOpen(false);
  }, []);
  const close = useCallback(() => {
    clearAddParam();
    setEditing(null);
  }, []);
  if (!symptoms || !injections) return null;

  const help = helpOpen && <HelpPopup onClose={closeHelp} />;
  if (detail && SYMPTOM_TYPES.some((t) => t.id === detail)) {
    return (
      <>
        <SymptomDetail type={detail} symptoms={symptoms} injections={injections} onOpenHelp={() => setHelpOpen(true)} />
        {help}
      </>
    );
  }

  const logged = symptoms.filter((s) => s.severity >= 1);
  const time = (iso: string) => new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

  return (
    <div className="space-y-4">
      <ScreenHeader title="Symptoms" backHref={backHref} />
      {/* Alert cards above Log symptoms; the red help row only when no card is showing (one help entry point at a time). */}
      <AlertCards
        symptoms={symptoms}
        layout={(cards, hasAlerts) => (
          <>
            {cards}
            <Button className="flex w-full items-center justify-center gap-2" onClick={() => setEditing('new')}>
              <PlusIcon width={20} height={20} /> Log symptoms
            </Button>
            {!hasAlerts && (
            <button
              type="button"
              onClick={() => setHelpOpen(true)}
              className="flex min-h-11 w-full items-center gap-2 rounded-2xl border border-danger/30 bg-[#fbeeea] px-3.5 text-left text-sm font-semibold text-danger"
            >
              <span className="grid size-6 flex-none place-items-center rounded-full bg-danger text-white" aria-hidden>!</span>
              When to get help
              <span className="ml-auto font-normal text-muted">Read</span>
            </button>
            )}
          </>
        )}
      />

      <SymptomMap symptoms={symptoms} injections={injections} />

      {logged.length > 0 && (
        <Card title="Recent">
          <ul className="-my-2 divide-y divide-line">
            {(showAll ? logged : logged.slice(0, 10)).map((s) => (
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
          {logged.length > 10 && (
            <button type="button" onClick={() => setShowAll(!showAll)} className="mt-2 min-h-11 w-full text-sm font-semibold text-accent">
              {showAll ? 'Show fewer' : `Show all ${logged.length}`}
            </button>
          )}
        </Card>
      )}

      {help}
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
