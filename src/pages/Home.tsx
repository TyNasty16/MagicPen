import { useEffect, useState } from 'react';
import { GearIcon, PlusIcon, SyringeIcon } from '../components/icons';
import { CalorieRing, MacroBar, Tile } from '../components/ui';
import type { Profile } from '../db/db';
import { nextInjectionDay } from '../lib/nextDose';
import { effectiveTargets } from '../lib/profileTargets';
import { kgToLb, mlToFlOz } from '../lib/units';

const QUICK_ADD = [
  { label: 'Food', color: 'bg-accent' },
  { label: 'Weight', color: 'bg-sage' },
  { label: 'Symptom', color: 'bg-gold' },
  { label: 'Dose', color: 'bg-clay' },
];

function greeting(now: Date) {
  const h = now.getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

export default function Home({ profile }: { profile: Profile }) {
  const now = useNow();
  const targets = effectiveTargets(profile);
  const imperial = profile.units === 'imperial';
  const weight = (kg: number) => Math.round(imperial ? kgToLb(kg) : kg);

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
          {profile.injectionWeekday !== undefined && <DoseHero weekday={profile.injectionWeekday} now={now} />}

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
            <Tile title="Weight" href="#/profile?from=home&section=about">
              <p className="font-serif text-2xl font-semibold">
                {weight(profile.startWeightKg!)} <span aria-label="to">→</span> {weight(profile.goalWeightKg!)}
              </p>
              <p className="text-xs text-muted">{imperial ? 'lb' : 'kg'} · start → goal</p>
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
              {QUICK_ADD.map((q) => (
                <div key={q.label} aria-disabled="true" className="rounded-2xl bg-surface/70 px-1 pt-3 pb-2 text-center text-xs shadow-soft">
                  <div className={`mx-auto mb-1.5 grid size-9 place-items-center rounded-xl text-white opacity-45 ${q.color}`}><PlusIcon width={18} height={18} /></div>
                  {q.label}
                  <span className="mt-0.5 block text-[10px] text-muted">Soon</span>
                </div>
              ))}
            </div>
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

function DoseHero({ weekday, now }: { weekday: number; now: Date }) {
  const next = nextInjectionDay(weekday, now);
  return (
    <section className="flex items-center gap-3.5 rounded-card bg-gradient-to-br from-hero-from to-hero-to p-4.5 text-white shadow-soft">
      <div className="grid size-12 flex-none place-items-center rounded-2xl bg-white/20"><SyringeIcon /></div>
      <div>
        <p className="text-sm">Next injection</p>
        <p className="font-serif text-[22px] font-semibold">{next.daysAway === 0 ? 'Today' : next.dayName}</p>
      </div>
      {next.daysAway > 0 && <span className="ml-auto whitespace-nowrap rounded-full bg-black/15 px-3 py-1.5 text-sm font-semibold">{next.label}</span>}
    </section>
  );
}
