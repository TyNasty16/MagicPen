import { Card } from '../components/ui';
import type { Profile } from '../db/db';
import { effectiveTargets } from '../lib/profileTargets';
import { mlToFlOz } from '../lib/units';

export default function Today({ profile }: { profile: Profile }) {
  const targets = effectiveTargets(profile);
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Today</h1>
      {targets ? (
        <Card title="Daily targets">
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <Stat label="Calories" value={`${targets.calories} kcal`} />
            <Stat label="Protein" value={`${targets.proteinG} g`} />
            <Stat label="Carbs" value={`${targets.carbsG} g`} />
            <Stat label="Fat" value={`${targets.fatG} g`} />
            <Stat label="Fiber" value={`${targets.fiberG} g`} />
            <Stat
              label="Water"
              value={profile.units === 'imperial' ? `${Math.round(mlToFlOz(targets.waterMl))} fl oz` : `${(targets.waterMl / 1000).toFixed(1)} L`}
            />
          </dl>
        </Card>
      ) : (
        <Card>
          <p className="text-sm">
            Complete your <a href="#/profile" className="text-accent underline">profile</a> to see your daily targets.
          </p>
        </Card>
      )}
      <p className="text-sm text-muted">Injection, weight, food and symptom tracking arrive in the next milestones.</p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted">{label}</dt>
      <dd className="text-lg font-semibold">{value}</dd>
    </div>
  );
}
