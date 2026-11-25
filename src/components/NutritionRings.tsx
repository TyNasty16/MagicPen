import type { Targets } from '../lib/targets';
import { whole, type Totals } from '../lib/nutrition';

const SIZE = 128;
const C = SIZE / 2;

function Arc({ r, width, frac, className }: { r: number; width: number; frac: number; className: string }) {
  const len = 2 * Math.PI * r;
  const f = Math.min(Math.max(frac, 0), 1); // ring caps at 100%; the number shows the true total
  return (
    <>
      <circle cx={C} cy={C} r={r} strokeWidth={width} fill="none" className="stroke-track" />
      {f > 0 && <circle cx={C} cy={C} r={r} strokeWidth={width} fill="none" strokeLinecap="round" className={className} strokeDasharray={len} strokeDashoffset={len * (1 - f)} />}
    </>
  );
}

const frac = (v: number, t: number) => (t > 0 ? v / t : 0);

const MACROS = [
  { key: 'proteinG', label: 'Protein', r: 58, stroke: 'stroke-accent', dot: 'bg-accent' },
  { key: 'carbsG', label: 'Carbs', r: 47, stroke: 'stroke-sage', dot: 'bg-sage' },
  { key: 'fatG', label: 'Fat', r: 36, stroke: 'stroke-gold', dot: 'bg-gold' },
] as const;

/** Macro ring (protein outside, carbs, fat inside; protein grams in the centre) beside a calorie ring, with a legend. */
export default function NutritionRings({ totals, targets }: { totals: Totals; targets: Targets }) {
  const summary = `Protein ${whole(totals.proteinG)} of ${targets.proteinG} g, carbs ${whole(totals.carbsG)} of ${targets.carbsG} g, fat ${whole(totals.fatG)} of ${targets.fatG} g, calories ${whole(totals.kcal)} of ${targets.calories.toLocaleString()}.`;
  return (
    <div>
      <div className="flex justify-around" role="img" aria-label={summary}>
        <div className="text-center">
          <div className="relative" style={{ width: SIZE, height: SIZE }}>
            <svg width={SIZE} height={SIZE} className="-rotate-90" aria-hidden>
              {MACROS.map((m) => <Arc key={m.key} r={m.r} width={9} frac={frac(totals[m.key], targets[m.key])} className={m.stroke} />)}
            </svg>
            <div className="absolute inset-0 grid place-items-center">
              <div>
                <div className="font-serif text-xl leading-none font-semibold">{whole(totals.proteinG)} g</div>
                <div className="mt-1 text-[11px] text-muted">protein</div>
              </div>
            </div>
          </div>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.07em] text-muted" aria-hidden>Macros</p>
        </div>
        <div className="text-center">
          <div className="relative" style={{ width: SIZE, height: SIZE }}>
            <svg width={SIZE} height={SIZE} className="-rotate-90" aria-hidden>
              <Arc r={56} width={12} frac={frac(totals.kcal, targets.calories)} className="stroke-clay" />
            </svg>
            <div className="absolute inset-0 grid place-items-center">
              <div>
                <div className="font-serif text-xl leading-none font-semibold">{whole(totals.kcal)}</div>
                <div className="mt-1 text-[11px] leading-tight text-muted">of {targets.calories.toLocaleString()}<br />kcal</div>
              </div>
            </div>
          </div>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.07em] text-muted" aria-hidden>Calories</p>
        </div>
      </div>
      <ul className="mt-3 space-y-1 text-sm" aria-hidden>
        {MACROS.map((m) => (
          <li key={m.key} className="flex items-center gap-2 text-muted">
            <span className={`size-2.5 rounded-full ${m.dot}`} />
            {m.label}
            <span className="ml-auto"><b className="font-semibold text-ink">{whole(totals[m.key])}</b> / {targets[m.key]} g</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
