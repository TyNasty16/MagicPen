import { useEffect, useRef, useState } from 'react';
import type { Symptom } from '../db/db';
import { ALERT_FOOTER, ALERT_TITLE, symptomAlerts, visibleAlerts, type SymptomAlert } from '../lib/symptomAlerts';
import { useOverlay } from '../lib/useOverlay';
import HelpPopup from './HelpPopup';
import { Button } from './ui';

// Per-device convenience only (not health data).
const HIDDEN_KEY = 'steady.alertsHidden'; // "Hide for now": type → newest entry covered
const SEEN_KEY = 'steady.alertsSeen'; // pop-up already shown: type → newest entry seen
function readMap(key: string): Record<string, string> {
  try {
    const v: unknown = JSON.parse(localStorage.getItem(key) ?? '{}');
    return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, string>) : {};
  } catch {
    return {};
  }
}
function writeMap(key: string, m: Record<string, string>) {
  try {
    localStorage.setItem(key, JSON.stringify(m));
  } catch {
    /* storage unavailable: cards simply show again next time */
  }
}

/**
 * "Take a closer look" cards for strong or long-lasting symptoms. Not medical advice.
 * inline: cards in the page (Symptoms). popup: a pop-up over the page that opens for alerts not seen yet,
 * plus a floating pill to reopen it (Home) — the page layout never moves.
 */
export default function AlertCards({
  symptoms,
  now,
  mode = 'inline',
  layout,
}: {
  symptoms: Symptom[];
  now?: Date;
  mode?: 'inline' | 'popup';
  /** inline only: place the cards within surrounding content; `hasAlerts` lets the page show a fallback (04d). */
  layout?: (cards: React.ReactNode, hasAlerts: boolean) => React.ReactNode;
}) {
  const [hidden, setHidden] = useState(() => readMap(HIDDEN_KEY));
  const [helpOpen, setHelpOpen] = useState(false);
  const alerts = visibleAlerts(symptomAlerts(symptoms, now), hidden);
  const unseen = alerts.some((a) => !(readMap(SEEN_KEY)[a.type] >= a.latest));
  const [popupOpen, setPopupOpen] = useState(mode === 'popup' && unseen);
  useEffect(() => {
    if (mode === 'popup' && unseen) setPopupOpen(true); // a new qualifying entry arrived while on the page
  }, [mode, unseen]);

  if (alerts.length === 0) return layout ? <>{layout(null, false)}</> : null;

  const hide = (a: SymptomAlert) => {
    const next = { ...hidden, [a.type]: a.latest };
    writeMap(HIDDEN_KEY, next);
    setHidden(next);
  };
  const closePopup = () => {
    writeMap(SEEN_KEY, { ...readMap(SEEN_KEY), ...Object.fromEntries(alerts.map((a) => [a.type, a.latest])) });
    setPopupOpen(false);
  };
  const cards = alerts.map((a) => <AlertCard key={a.type} alert={a} onHelp={() => setHelpOpen(true)} onHide={() => hide(a)} />);
  const help = helpOpen && <HelpPopup onClose={() => setHelpOpen(false)} />;

  if (mode === 'inline') {
    const block = <div className="space-y-2.5">{cards}</div>;
    return (
      <>
        {layout ? layout(block, true) : block}
        {help}
      </>
    );
  }
  return (
    <>
      {popupOpen ? (
        <AlertPopup onClose={closePopup}>{cards}</AlertPopup>
      ) : (
        <button
          type="button"
          onClick={() => setPopupOpen(true)}
          className="fixed right-4 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-20 flex min-h-11 items-center gap-2 rounded-full border border-gold/70 bg-[#fbf3e2] px-4 text-sm font-semibold shadow-soft"
        >
          <span className="size-2.5 rounded-full bg-gold" aria-hidden />
          {alerts.length} to look at
        </button>
      )}
      {help}
    </>
  );
}

function AlertCard({ alert: a, onHelp, onHide }: { alert: SymptomAlert; onHelp: () => void; onHide: () => void }) {
  return (
    <section className="rounded-card border border-gold/60 bg-[#fbf3e2] p-4" aria-label={`${ALERT_TITLE}: ${a.reason}`}>
      <p className="font-serif text-lg font-semibold">{ALERT_TITLE}</p>
      <p className="mt-0.5 text-sm">{a.reason}</p>
      {a.extra && <p className="mt-1.5 text-sm">{a.extra}</p>}
      <div className="mt-2 flex gap-2">
        <button type="button" onClick={onHelp} className="min-h-11 flex-1 rounded-xl bg-white/70 px-3 text-sm font-semibold text-accent">When to get help</button>
        <button type="button" onClick={onHide} className="min-h-11 flex-1 rounded-xl px-3 text-sm font-semibold text-muted">Hide for now</button>
      </div>
      <p className="mt-1.5 text-xs text-muted">{ALERT_FOOTER}</p>
    </section>
  );
}

function AlertPopup({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  useOverlay(onClose);
  const btn = useRef<HTMLButtonElement>(null);
  useEffect(() => btn.current?.focus(), []);
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={ALERT_TITLE}>
      <div className="absolute inset-0 bg-ink/40 animate-[fade_.2s_ease-out]" onClick={onClose} />
      <div className="relative flex max-h-[88dvh] w-full max-w-md flex-col overflow-hidden rounded-card bg-surface shadow-[0_10px_40px_rgb(0_0_0/0.25)] animate-[fade_.2s_ease-out]">
        <div className="space-y-2.5 overflow-y-auto overscroll-contain p-3">{children}</div>
        <div className="border-t border-line p-3">
          <Button ref={btn} className="w-full" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
}
