// Runs a fill animation once (workflows 16 and 17): a list of timed steps drawn with requestAnimationFrame,
// then rests. Goal moments take turns (protein first, then water, about 1 s apart) and wait for any milestone pop-up.
import { useEffect, useRef, useState } from 'react';
import { reducedMotion } from '../components/confetti';
import type { ShakerPlay } from './shaker';

export type Step<P> = { ms: number; pose: (t: number) => P };

let queue: Promise<void> = Promise.resolve();
/** Waits for this goal moment's turn; call the returned function when done (the next one starts about 1 s later, or at once if nothing played). */
export function goalTurn(): Promise<(played?: boolean) => void> {
  let release!: () => void;
  const mine = new Promise<void>((r) => (release = r));
  const before = queue;
  queue = before.then(() => mine);
  let released = false;
  return before.then(() => (played = true) => {
    if (released) return;
    released = true;
    if (played) setTimeout(release, 1000);
    else release();
  });
}

const popupOpen = () => typeof document !== 'undefined' && document.body.dataset.milestone === 'open';

/** `start` is drawn until the animation begins (the old level), `rest` once it ends. */
export function useFillAnimation<P>(play: ShakerPlay, start: P, rest: P, steps: () => Step<P>[], deps: unknown[], onSettled?: () => void): P {
  const [pose, setPose] = useState<P>(play === 'none' ? rest : start);
  const settled = useRef(onSettled);
  settled.current = onSettled;
  const restRef = useRef(rest);
  restRef.current = rest;
  useEffect(() => {
    if (play === 'none' || reducedMotion()) {
      setPose(restRef.current);
      settled.current?.();
      return;
    }
    setPose(start);
    const list = steps();
    let frame = 0, wait = 0, cancelled = false;
    let done: ((played?: boolean) => void) | undefined;
    const finish = () => { setPose(restRef.current); settled.current?.(); done?.(); };
    const run = () => {
      if (cancelled) return;
      if (play === 'goal' && popupOpen()) { wait = window.setTimeout(run, 250); return; }
      let i = 0, t0 = performance.now();
      const tick = (now: number) => {
        if (cancelled) return;
        let t = (now - t0) / list[i].ms;
        while (t >= 1 && i < list.length - 1) { t0 += list[i].ms; i++; t = (now - t0) / list[i].ms; }
        if (t >= 1) return finish();
        setPose(list[i].pose(Math.max(0, t)));
        frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    };
    if (play === 'goal') void goalTurn().then((release) => { done = release; if (cancelled) release(false); else run(); });
    else run();
    return () => { cancelled = true; cancelAnimationFrame(frame); clearTimeout(wait); done?.(false); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return pose;
}
