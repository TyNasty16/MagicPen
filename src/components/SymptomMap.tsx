import { useState } from 'react';
import type { Injection, Symptom } from '../db/db';
import { fromDayKey, dayKey } from '../lib/dates';
import { symptomLabel } from '../lib/symptoms';
import { dailyMaxByType, RAMP, rampText, timingPhrase, trendFor, visibleSymptoms, windowDays, type MapWindow, type Trend } from '../lib/symptomMap';
import Segmented from './Segmented';

const TREND: Record<Trend, { text: string; cls: string }> = {
  better: { text: '↓ Better', cls: 'text-[#4f6b3f]' },
  same: { text: '→ Same', cls: 'text-muted' },
  worse: { text: '↑ Worse', cls: 'text-[#9a4a36]' },
  new: { text: 'New', cls: 'text-muted' },
};

/** Overview grid: one row per recent symptom, one column per day, darker = stronger. Rows open the drill-down. */
export default function SymptomMap({ symptoms, injections }: { symptoms: Symptom[]; injections: Injection[] }) {
  const [n, setN] = useState<MapWindow>(7);
  const now = new Date();
  const days = windowDays(n, now);
  const shotDays = new Set(injections.map((i) => dayKey(new Date(i.datetime))));
  const byType = dailyMaxByType(symptoms, now);
  const { shown, hidden } = visibleSymptoms(symptoms, now);
  const cols = `${n === 3 ? 7.5 : 6.5}rem repeat(${n}, minmax(0, 1fr)) 0.75rem`;

  return (
    <section className="rounded-card bg-surface p-4 shadow-soft" aria-label="Symptom map">
      <Segmented
        label="Map range"
        value={String(n) as '3' | '7'}
        onChange={(v) => setN(Number(v) as MapWindow)}
        options={[
          { id: '3', label: '3 days' },
          { id: '7', label: '7 days' },
        ]}
      />
      <h2 className="mt-3.5 mb-2 text-xs font-semibold uppercase tracking-[0.07em] text-muted">Last {n} days</h2>
      {shown.length === 0 ? (
        <p className="py-3 text-sm text-muted">Nothing logged in the last 3 days.</p>
      ) : (
        <>
          <div className="grid items-end gap-1" style={{ gridTemplateColumns: cols }} aria-hidden>
            <span />
            {days.map((d) => {
              const date = fromDayKey(d);
              return (
                <span key={d} className="text-center text-[11px] leading-tight text-muted">
                  {shotDays.has(d) && <b className="block text-[10px] text-accent">💉 shot</b>}
                  {date.toLocaleDateString(undefined, { weekday: 'short' })}
                  <br />
                  {date.getDate()}
                </span>
              );
            })}
            <span />
          </div>
          <ul className="mt-1.5 space-y-1.5">
            {shown.map((type) => {
              const byDay = byType.get(type);
              const trend = TREND[trendFor(byDay, n, now)];
              const phrase = timingPhrase(byDay, n, shotDays, now);
              return (
                <li key={type}>
                  <a
                    href={`#/symptoms?detail=${type}`}
                    className="grid min-h-11 items-center gap-1 rounded-xl py-1 transition active:bg-track/60"
                    style={{ gridTemplateColumns: cols }}
                    aria-label={`${symptomLabel(type)}: ${phrase}, ${trend.text.replace(/[↓↑→] /, '')}. ${days
                      .map((d) => `${fromDayKey(d).toLocaleDateString(undefined, { weekday: 'short' })}${shotDays.has(d) ? ' (shot)' : ''} ${byDay?.get(d) ?? 'none'}`)
                      .join(', ')}. Open details.`}
                  >
                    <span className="min-w-0 pr-1 leading-tight">
                      <span className="block text-sm font-semibold">{symptomLabel(type)}</span>
                      <span className="block text-[11px] text-muted">{phrase}</span>
                      <span className={`block text-[11px] font-bold ${trend.cls}`}>{trend.text}</span>
                    </span>
                    {days.map((d) => {
                      const v = byDay?.get(d) ?? 0;
                      return (
                        <span
                          key={d}
                          className={`grid place-items-center rounded-lg font-bold ${n === 3 ? 'h-11 text-sm' : 'h-8 text-xs'} ${shotDays.has(d) ? 'ring-2 ring-accent ring-offset-1 ring-offset-surface' : v === 0 ? 'border border-line' : ''}`}
                          style={{ background: RAMP[v], color: rampText(v) }}
                        >
                          {n === 3 && v > 0 ? v : ''}
                        </span>
                      );
                    })}
                    <span className="text-muted" aria-hidden>›</span>
                  </a>
                </li>
              );
            })}
          </ul>
        </>
      )}
      <div className="mt-3 flex items-center gap-1 text-[11px] text-muted" aria-hidden>
        None {RAMP.map((c, i) => <i key={c} className={`inline-block h-2.5 w-5 rounded-sm ${i === 0 ? 'border border-line' : ''}`} style={{ background: c }} />)} Severe
      </div>
      {hidden.length > 0 && (
        <p className="mt-2.5 rounded-xl bg-track px-3 py-2 text-xs text-muted">
          {hidden.length} {hidden.length === 1 ? 'symptom' : 'symptoms'} not logged in over 3 days {hidden.length === 1 ? 'is' : 'are'} hidden ({hidden.map(symptomLabel).join(', ')}).
        </p>
      )}
      <p className="mt-2 text-xs text-muted">
        💉 = injection day.{n === 3 ? ' Numbers = highest severity that day (1–5).' : ''} Trend: these {n} days vs the {n} before. Tap a symptom for details.
      </p>
    </section>
  );
}
