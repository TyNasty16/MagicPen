import { useLiveQuery } from 'dexie-react-hooks';
import { useCallback, useEffect, useState } from 'react';
import { db } from '../db/db';
import { checkMilestones, type Celebration } from './milestoneCheck';
import { titleFor } from './milestones';

/**
 * Milestone checks (workflow 12): on open, when the app comes back to the screen, and shortly after anything is
 * logged (so a sheet can close first). Returns the pop-up to show, if any.
 */
export function useMilestones(ready: boolean): [Celebration | null, () => void] {
  const [shown, setShown] = useState<Celebration | null>(null);
  // Changes whenever an injection, weigh-in, symptom, food or water entry is added or removed.
  const sig = useLiveQuery(async () => (await Promise.all([db.injections.count(), db.weights.count(), db.symptoms.count(), db.foodLog.count(), db.water.count()])).join(','), []);
  const run = useCallback(() => {
    void checkMilestones().then((c) => {
      if (!c) return;
      // A pop-up already open gains the new lines (and starts its 5 seconds again).
      setShown((cur) => {
        if (!cur) return c;
        const lines = [...cur.lines, ...c.lines];
        return { title: titleFor(Math.max(...lines.map((l) => l.step))), lines };
      });
    });
  }, []);
  useEffect(() => {
    if (!ready || sig === undefined) return;
    const t = setTimeout(run, 600);
    return () => clearTimeout(t);
  }, [ready, sig, run]);
  useEffect(() => {
    if (!ready) return;
    const onVisible = () => document.visibilityState === 'visible' && run();
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [ready, run]);
  return [shown, useCallback(() => setShown(null), [])];
}
