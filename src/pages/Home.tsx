import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useState } from 'react';
import { GearIcon, PlusIcon, SyringeIcon } from '../components/icons';
import { CalorieRing, MacroBar, Tile } from '../components/ui';
import Sparkline from '../components/Sparkline';
import { listInjections, listSymptoms, listWeights, type Injection, type Profile } from '../db/db';
import { symptomLabel } from '../lib/symptoms';
import { daysBetween, shortDate } from '../lib/dates';
import { formatDose } from '../lib/injections';
import { nextDose } from '../lib/nextDose';
import { dailyWeights } from '../lib/weight';
import { weighInStatus } from '../lib/weighIn';
import { effectiveTargets } from '../lib/profileTargets';
import { displayWeight, mlToFlOz, round1, weightUnit } from '../lib/units';
import { currentBmi } from '../lib/body';

// Items without an href are not built yet and show as "Soon".
const QUICK_ADD: { label: string; color: string; href?: string }[] = [
  { label: 'Dose', color: 'bg-clay', href: '#/injections?from=home&add=1' },
  { label: 'Weight', color: 'bg-sage', href: '#/weight?from=home&add=1' },
  { label: 'Symptom', color: 'bg-gold', href: '#/symptoms?from=home&add=1' },
  { label: 'Food', color: 'bg-accent' },
];

function greeting(now: Date) {
  const h = now.getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

export default function Home({ profile }: { profile: Profile }) {
  const now = useNow();
  const targets = effectiveTargets(profile);
  const imperial = profile.units === 'imperial';
  const injections = useLiveQuery(listInjections);
  const weights = useLiveQuery(listWeights);
  const lastSymptom = useLiveQuery(async () => (await listSymptoms())[0] ?? null);
  if (!injections || !weights || lastSymptom === undefined) return null;
  const daily = dailyWeights(weights);
  const latest = daily.at(-1);
  const unit = weightUnit(profile.units);
  const bmiNow = currentBmi(profile, weights);

  return (
    <div className="space-y-3.5">
      <header className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted">{now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
          <h1 className="mt-0.5 font-serif text-[30px] font-semibold">{greeting(now)}</h1>
        </div>
        <a href="#/settings" aria-label="Settings" className="grid size-11 place-items-center rounded-2xl bg-surface text-muted shadow-soft">
          <GearIcon width={22} height={22} />
        </a>
      </header>

      {!targets ? (
        <a href="#/profile" className="block rounded-card bg-gradient-to-br from-hero-from to-hero-to p-5 text-white shadow-soft">
          <p className="text-sm">Welcome to Steady</p>
          <p className="mt-1 font-serif text-2xl font-semibold">Set up your profile</p>
          <p className="mt-2 text-sm">Add your details to see your daily targets and injection day.</p>
        </a>
      ) : (
        <>
          <WeighInCard dayKeys={weights.map((w) => w.date)} now={now} />
          <DoseHero last={injections[0]} weekday={profile.injectionWeekday} now={now} />

          <Tile title="Today's nutrition" href="#/profile?from=home&section=targets">
            <div className="flex items-center gap-4">
              <CalorieRing eaten={0} target={targets.calories} />
              <div className="flex-1 space-y-2.5">
                <MacroBar label="Protein" value={0} target={targets.proteinG} color="bg-accent" />
                <MacroBar label="Carbs" value={0} target={targets.carbsG} color="bg-sage" />
                <MacroBar label="Fat" value={0} target={targets.fatG} color="bg-gold" />
              </div>
            </div>
          </Tile>

          <div className="grid grid-cols-2 gap-3.5">
            <Tile title="Weight" href="#/weight?from=home">
              {latest ? (
                <>
                  <p className="font-serif text-2xl font-semibold">{displayWeight(latest.kg, profile.units)} <span className="font-sans text-xs text-muted">{unit}</span></p>
                  {profile.startWeightKg && <p className="text-xs text-muted">{changeText(latest.kg - profile.startWeightKg, profile.units)}</p>}
                  {bmiNow !== undefined && <p className="text-xs text-muted">BMI {round1(bmiNow)}</p>}
                  <Sparkline values={daily.slice(-30).map((d) => d.kg)} />
                </>
              ) : (
                <>
                  <p className="font-serif text-2xl font-semibold">
                    {Math.round(displayWeight(profile.startWeightKg!, profile.units))} <span aria-label="to">→</span> {Math.round(displayWeight(profile.goalWeightKg!, profile.units))}
                  </p>
                  <p className="text-xs text-muted">{unit} · start → goal</p>
                  <p className="mt-2 text-xs font-medium text-accent">Log your first weigh-in</p>
                </>
              )}
            </Tile>
            <Tile title="Water">
              <p className="font-serif text-2xl font-semibold">
                {imperial ? Math.round(mlToFlOz(targets.waterMl)) : (targets.waterMl / 1000).toFixed(1)}{' '}
                <span className="font-sans text-xs text-muted">{imperial ? 'fl oz' : 'L'}</span>
              </p>
              <p className="text-xs text-muted">daily target</p>
              <span className="mt-2 inline-block rounded-full bg-track px-2.5 py-1 text-[11px] text-muted">Logging soon</span>
            </Tile>
          </div>

          <section aria-label="Quick add">
            <h2 className="mx-0.5 mt-4 mb-2 text-xs font-semibold uppercase tracking-[0.07em] text-muted">Quick add</h2>
            <div className="grid grid-cols-4 gap-2.5">
              {QUICK_ADD.map((q) =>
                q.href ? (
                  <a key={q.label} href={q.href} className="rounded-2xl bg-surface px-1 pt-3 pb-2 text-center text-xs font-medium shadow-soft transition active:scale-95">
                    <div className={`mx-auto mb-1.5 grid size-9 place-items-center rounded-xl text-white ${q.color}`}><PlusIcon width={18} height={18} /></div>
                    {q.label}
                    <span className="mt-0.5 block text-[10px] font-normal text-muted">Add</span>
                  </a>
                ) : (
                  <div key={q.label} aria-disabled="true" className="rounded-2xl bg-surface/70 px-1 pt-3 pb-2 text-center text-xs shadow-soft">
                    <div className={`mx-auto mb-1.5 grid size-9 place-items-center rounded-xl text-white opacity-45 ${q.color}`}><PlusIcon width={18} height={18} /></div>
                    {q.label}
                    <span className="mt-0.5 block text-[10px] text-muted">Soon</span>
                  </div>
                ),
              )}
            </div>
            {lastSymptom && (
              <a href="#/symptoms?from=home" className="mt-2 flex min-h-11 items-center px-1 text-sm text-muted">
                Last logged: {symptomLabel(lastSymptom.type).toLowerCase()} {lastSymptom.severity}/5 · {relDays(lastSymptom.datetime, now)}
              </a>
            )}
          </section>
        </>
      )}
    </div>
  );
}

/** Current time, refreshed when the app comes back to the foreground (e.g. the next morning). */
function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const refresh = () => document.visibilityState === 'visible' && setNow(new Date());
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('focus', refresh);
    return () => {
      document.removeEventListener('visibilitychange', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, []);
  return now;
}

/** Weekly weigh-in prompt: shown until this week's weigh-in is logged (weeks run from the first weigh-in). */
function WeighInCard({ dayKeys, now }: { dayKeys: string[]; now: Date }) {
  const s = weighInStatus(dayKeys, now);
  if (s.state === 'done') return null;
  const copy = {
    first: { label: 'Weekly weigh-in', title: 'Start your weekly weigh-ins', body: 'Log your first weigh-in today. Every 7 days after that, this card will remind you.' },
    due: { label: 'Weigh-in day', title: 'Time for your weekly weigh-in', body: 'Once a week, same morning, same scale — this is how you see your real progress.' },
    still: {
      label: 'This week’s weigh-in',
      title: 'Still time this week',
      body: `You missed weigh-in day, but there ${s.daysLeft === 1 ? 'is 1 day' : `are ${s.daysLeft} days`} left this week. Keep your streak going.`,
    },
  }[s.state];
  return (
    <section className="rounded-card bg-gradient-to-br from-weigh-from to-weigh-to p-4.5 text-white shadow-soft" aria-label="Weekly weigh-in">
      <p className="text-xs font-bold tracking-[0.06em] uppercase">{copy.label}</p>
      <p className="mt-1 font-serif text-2xl leading-tight font-semibold">{copy.title}</p>
      <p className="mt-1.5 text-sm leading-snug">{copy.body}</p>
      {s.weeks.length > 0 && (
        <div className="mt-3 flex items-center gap-1.5 text-xs">
          {s.weeks.map((done, i) => {
            const isCurrent = i === s.weeks.length - 1;
            return (
              <span key={i} aria-hidden className={`grid size-6 place-items-center rounded-full text-[11px] font-bold ${done ? 'bg-white text-weigh-from' : 'bg-white/25'}`}>
                {done ? '✓' : isCurrent ? '?' : ''}
              </span>
            );
          })}
          <span className="ml-1.5">{s.streak > 0 ? `${s.streak} week${s.streak === 1 ? '' : 's'} in a row` : 'Start a new streak'}</span>
        </div>
      )}
      <div className="mt-3.5 grid grid-cols-2 gap-2">
        <a href="#/weight?from=home&add=1" className="grid min-h-11 place-items-center rounded-2xl bg-white font-semibold text-weigh-from">Log weigh-in</a>
        <a href="#/weight?from=home&add=1&photo=1" className="grid min-h-11 place-items-center rounded-2xl bg-black/15 font-semibold">+ Add photo</a>
      </div>
    </section>
  );
}

function relDays(iso: string, now: Date) {
  const d = daysBetween(new Date(iso), now);
  return d <= 0 ? 'today' : d === 1 ? 'yesterday' : `${d} days ago`;
}

function changeText(diffKg: number, units: Profile['units']) {
  const v = displayWeight(Math.abs(diffKg), units);
  if (v === 0) return 'same as start';
  return `${diffKg < 0 ? '−' : '+'}${v} ${weightUnit(units)} since start`;
}

function DoseHero({ last, weekday, now }: { last?: Injection; weekday?: number; now: Date }) {
  const next = nextDose(last?.datetime, weekday, now);
  if (!next) return null;
  const title = next.daysAway === 0 ? 'Today' : next.daysAway < 0 || next.daysAway > 6 ? shortDate(next.date) : next.date.toLocaleDateString(undefined, { weekday: 'long' });
  return (
    <a href="#/injections?from=home" className="flex items-center gap-3.5 rounded-card bg-gradient-to-br from-hero-from to-hero-to p-4.5 text-white shadow-soft transition active:scale-[0.98]">
      <div className="grid size-12 flex-none place-items-center rounded-2xl bg-white/20"><SyringeIcon /></div>
      <div className="min-w-0">
        <p className="text-sm">Next injection</p>
        <p className="font-serif text-[22px] leading-tight font-semibold">{title}</p>
        {last && <p className="mt-0.5 text-xs">Last: {formatDose(last.doseMg)} on {shortDate(new Date(last.datetime))}</p>}
      </div>
      {next.daysAway !== 0 && <span className="ml-auto whitespace-nowrap rounded-full bg-black/15 px-3 py-1.5 text-sm font-semibold">{next.label}</span>}
    </a>
  );
}
