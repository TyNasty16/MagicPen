import { useState } from 'react';
import InjectionWeekChart from '../components/InjectionWeekChart';
import PatternChart from '../components/PatternChart';
import SymptomSheet from '../components/SymptomSheet';
import { Card, ScreenHeader } from '../components/ui';
import type { Injection, Symptom } from '../db/db';
import { shortDate } from '../lib/dates';
import { tipFor } from '../lib/sideEffectText';
import { useDrug } from '../lib/useDrug';
import { injectionWeekAverages, recentCount, weeklyTrend } from '../lib/symptomMap';
import { patternByDay, symptomLabel } from '../lib/symptoms';

/** Drill-down for one symptom (Workflow 04c). */
export default function SymptomDetail({ type, symptoms, injections, onOpenHelp }: { type: string; symptoms: Symptom[]; injections: Injection[]; onOpenHelp: () => void }) {
  const drug = useDrug();
  const [editing, setEditing] = useState<Symptom>();
  const [tipOpen, setTipOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const label = symptomLabel(type);
  const entries = symptoms.filter((s) => s.type === type && s.severity >= 1);
  const buckets = patternByDay(symptoms, injections, type);
  const peak = buckets.reduce<(typeof buckets)[number] | undefined>((best, b) => (b.average !== undefined && (!best || b.average > best.average!) ? b : best), undefined);
  const weeks = injectionWeekAverages(symptoms, type, injections);
  const trend = weeklyTrend(weeks);
  const tip = tipFor(type, drug);
  const time = (iso: string) => new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

  return (
    <div className="space-y-4">
      <ScreenHeader title={label} backHref="#/symptoms" />
      <div className="grid grid-cols-3 gap-2">
        <Stat value={String(recentCount(symptoms, type))} label="entries · 8 wks" />
        <Stat value={peak ? `Day ${peak.day}` : '—'} label={peak ? 'usual peak' : 'not enough data'} />
        <Stat
          value={`${trend === 'milder lately' ? '↓ ' : trend === 'stronger lately' ? '↑ ' : trend === 'about the same' ? '→ ' : ''}${trend}`}
          label="last 2 injection weeks"
          small
          tone={trend === 'milder lately' ? 'text-[#4f6b3f]' : trend === 'stronger lately' ? 'text-[#9a4a36]' : ''}
        />
      </div>

      <Card title="Days after injection">
        {injections.length === 0 || !peak ? (
          <p className="text-sm text-muted">Log your injections to see which days {label.toLowerCase()} tends to show up.</p>
        ) : (
          <PatternChart buckets={buckets} label={label} />
        )}
      </Card>

      <Card title="Each injection week">
        {weeks.length === 0 ? (
          <p className="text-sm text-muted">No injections logged in the last 8 weeks.</p>
        ) : (
          <>
            <InjectionWeekChart weeks={weeks} label={label} />
            <p className="mt-1 text-xs text-muted">Average severity per week · dashed line = dose change · the trend above compares your last 2 injection weeks with the 2 before</p>
          </>
        )}
      </Card>

      <Card title="Tips">
        <div className="rounded-2xl bg-track/60 p-3 text-sm leading-relaxed">
          <p className={tipOpen ? '' : 'line-clamp-2'}>{tip.text}</p>
          <button type="button" onClick={() => setTipOpen(!tipOpen)} className="min-h-11 min-w-11 pr-2 font-semibold text-accent">{tipOpen ? 'Less' : 'More'}</button>
          {tipOpen && <p className="text-[11px] text-muted">Source: {tip.source}</p>}
          {tip.seeHelp && <button type="button" onClick={onOpenHelp} className="block min-h-11 font-semibold text-danger">See “When to get help”</button>}
        </div>
      </Card>

      <Card title="Entries">
        <ul className="-my-2 divide-y divide-line">
          {(showAll ? entries : entries.slice(0, 10)).map((s) => (
            <li key={s.id}>
              <button className="flex min-h-12 w-full items-center justify-between gap-3 py-2 text-left" onClick={() => setEditing(s)}>
                <span className="min-w-0">
                  <span className="block">{shortDate(new Date(s.datetime))} · {time(s.datetime)}</span>
                  {s.notes && <span className="block truncate text-sm text-muted">{s.notes}</span>}
                </span>
                <span className="rounded-full bg-track px-3 py-1 text-sm font-semibold">{s.severity}/5</span>
              </button>
            </li>
          ))}
        </ul>
        {entries.length > 10 && (
          <button type="button" onClick={() => setShowAll(!showAll)} className="mt-2 min-h-11 w-full text-sm font-semibold text-accent">
            {showAll ? 'Show fewer' : `Show all ${entries.length}`}
          </button>
        )}
      </Card>
      {editing && <SymptomSheet key={editing.id} initial={editing} onDone={() => setEditing(undefined)} />}
    </div>
  );
}

function Stat({ value, label, tone = '', small = false }: { value: string; label: string; tone?: string; small?: boolean }) {
  return (
    <div className="rounded-2xl bg-surface p-3 shadow-soft">
      <p className={`font-serif font-semibold ${small ? 'text-sm leading-snug' : 'text-xl'} ${tone}`}>{value}</p>
      <p className="text-[11px] text-muted">{label}</p>
    </div>
  );
}
