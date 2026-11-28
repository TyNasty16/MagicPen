import { useEffect, useRef, useState } from 'react';
import WaterGlass from './WaterGlass';
import { addWater } from '../db/db';
import { fillState, loadShakerMemory, saveShakerMemory, WATER_GLASS_KEY, type ShakerState } from '../lib/shaker';
import { waterAmount, waterQuickAdds, waterUnit } from '../lib/water';
import type { UnitSystem } from '../lib/units';

/** Home's water tile (workflow 17): the glass fills toward the day's target; the quick-add button stays below it. */
export default function WaterTile({ ml, targetMl, units, today }: { ml: number; targetMl: number; units: UnitSystem; today: string }) {
  const total = Math.round(ml), target = Math.round(targetMl);
  const key = `${today}|${total}|${target}`;
  const handled = useRef<string>();
  const [state, setState] = useState<ShakerState>(() => fillState(today, total, target, loadShakerMemory(WATER_GLASS_KEY)));
  const [settledKey, setSettledKey] = useState<string>();
  // Work out (and remember) what to show once per change, so the pour plays once and not on every visit.
  useEffect(() => {
    if (handled.current === key) return;
    handled.current = key;
    const s = fillState(today, total, target, loadShakerMemory(WATER_GLASS_KEY));
    saveShakerMemory(s.next, WATER_GLASS_KEY);
    setState((cur) => (cur.play === s.play && cur.from === s.from && cur.level === s.level && cur.reached === s.reached ? cur : s));
  }, [key, today, total, target]);
  const reachedShown = state.reached && (state.play !== 'goal' || settledKey === key);
  const amount = waterAmount(ml, units), of = `of ${waterAmount(targetMl, units)} ${waterUnit(units)}`;
  const quick = waterQuickAdds(units)[0];
  return (
    <section className="rounded-card bg-surface p-4 shadow-soft" aria-label="Water">
      <h2 className="mb-1 text-xs font-semibold uppercase tracking-[0.07em] text-muted">Water</h2>
      <div role="img" aria-label={`Water ${amount} ${of}.${state.reached ? ' Goal reached.' : ''}`}>
        <div className="flex items-end justify-between gap-1" aria-hidden>
          <div className="min-w-0">
            <p className="font-serif text-2xl leading-none font-semibold whitespace-nowrap">{amount}</p>
            <p className="mt-1 text-xs whitespace-nowrap text-muted">{of}</p>
            <p className={`mt-1 text-xs font-semibold whitespace-nowrap text-[#3b7a57] ${reachedShown ? '' : 'invisible'}`}>Goal reached ✓</p>
          </div>
          <WaterGlass from={state.from} level={state.level} play={state.play} onSettled={() => setSettledKey(key)} />
        </div>
      </div>
      <button type="button" aria-label={`Add ${quick.label.slice(2)} water`} onClick={() => addWater(today, quick.ml)} className="mt-2.5 min-h-11 w-full rounded-2xl border border-line font-semibold text-accent">
        {quick.label}
      </button>
    </section>
  );
}
