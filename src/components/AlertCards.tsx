import { useState } from 'react';
import type { Symptom } from '../db/db';
import { ALERT_FOOTER, ALERT_TITLE, symptomAlerts, visibleAlerts } from '../lib/symptomAlerts';
import HelpPopup from './HelpPopup';

// Per-device convenience only: which alerts were hidden, and the newest entry they covered.
const HIDDEN_KEY = 'steady.alertsHidden';
function readHidden(): Record<string, string> {
  try {
    const v: unknown = JSON.parse(localStorage.getItem(HIDDEN_KEY) ?? '{}');
    return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, string>) : {};
  } catch {
    return {};
  }
}
function writeHidden(h: Record<string, string>) {
  try {
    localStorage.setItem(HIDDEN_KEY, JSON.stringify(h));
  } catch {
    /* storage unavailable: the card shows again next time */
  }
}

/** "Take a closer look" cards for strong or long-lasting symptoms. Not medical advice. */
export default function AlertCards({ symptoms, now }: { symptoms: Symptom[]; now?: Date }) {
  const [hidden, setHidden] = useState(readHidden);
  const [helpOpen, setHelpOpen] = useState(false);
  const alerts = visibleAlerts(symptomAlerts(symptoms, now), hidden);
  if (alerts.length === 0) return null;

  const hide = (type: string, latest: string) => {
    const next = { ...hidden, [type]: latest };
    writeHidden(next);
    setHidden(next);
  };

  return (
    <div className="space-y-2.5">
      {alerts.map((a) => (
        <section key={a.type} className="rounded-card border border-gold/60 bg-[#fbf3e2] p-4" aria-label={`${ALERT_TITLE}: ${a.reason}`}>
          <p className="font-serif text-lg font-semibold">{ALERT_TITLE}</p>
          <p className="mt-0.5 text-sm">{a.reason}</p>
          {a.extra && <p className="mt-1.5 text-sm">{a.extra}</p>}
          <div className="mt-2 flex gap-2">
            <button type="button" onClick={() => setHelpOpen(true)} className="min-h-11 flex-1 rounded-xl bg-white/70 px-3 text-sm font-semibold text-accent">When to get help</button>
            <button type="button" onClick={() => hide(a.type, a.latest)} className="min-h-11 flex-1 rounded-xl px-3 text-sm font-semibold text-muted">Hide for now</button>
          </div>
          <p className="mt-1.5 text-xs text-muted">{ALERT_FOOTER}</p>
        </section>
      ))}
      {helpOpen && <HelpPopup onClose={() => setHelpOpen(false)} />}
    </div>
  );
}
