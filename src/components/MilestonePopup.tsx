import { useEffect, useRef, useState } from 'react';
import type { Celebration } from '../lib/milestoneCheck';
import { confettiBurst } from './confetti';

const SHOW_MS = 5000;

/** Milestone pop-up (workflow 12): a title that slams in, the factual lines, a confetti burst. Closes after 5 s or on any tap. */
export default function MilestonePopup({ celebration, onClose }: { celebration: Celebration; onClose: () => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [leaving, setLeaving] = useState(false);
  useEffect(() => {
    setLeaving(false);
    const stop = canvas.current ? confettiBurst(canvas.current) : () => undefined;
    const fade = setTimeout(() => setLeaving(true), SHOW_MS - 400);
    const done = setTimeout(onClose, SHOW_MS);
    return () => { stop(); clearTimeout(fade); clearTimeout(done); };
  }, [celebration, onClose]);

  return (
    // A tap anywhere, on the card or away from it, closes it.
    <div className={`fixed inset-0 z-50 ${leaving ? 'milestone-leave' : ''}`} onClick={onClose}>
      <canvas ref={canvas} aria-hidden="true" className="pointer-events-none absolute inset-0 size-full" />
      <div className="mx-auto mt-[max(1.25rem,env(safe-area-inset-top))] max-w-md px-4">
        <div role="status" aria-live="polite" className="milestone-card rounded-card bg-surface p-5 text-center shadow-soft">
          <p className="sr-only">Milestone reached</p>
          <p className="milestone-title font-sans text-[34px] leading-none font-black tracking-tight text-accent uppercase italic">{celebration.title}</p>
          <ul className="mt-3 space-y-1 text-sm font-medium">
            {celebration.lines.map((l) => <li key={`${l.series}-${l.n}`}>{l.text}</li>)}
          </ul>
          <p className="mt-3 text-xs text-muted">Tap to close</p>
          <button type="button" className="sr-only focus:not-sr-only focus:mt-2 focus:underline" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
