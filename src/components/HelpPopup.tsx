import { useEffect, useRef } from 'react';
import { useOverlay } from '../lib/useOverlay';
import HelpBox from './HelpBox';
import { Button } from './ui';

/** "When to get help" as a dismissible pop-up: tap "Got it", the backdrop, or press Escape. */
export default function HelpPopup({ onClose }: { onClose: () => void }) {
  useOverlay(onClose);
  const btn = useRef<HTMLButtonElement>(null);
  useEffect(() => btn.current?.focus(), []);
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="When to get help">
      <div className="absolute inset-0 bg-ink/40 animate-[fade_.2s_ease-out]" onClick={onClose} />
      <div className="relative flex max-h-[88dvh] w-full max-w-md flex-col overflow-hidden rounded-card bg-surface shadow-[0_10px_40px_rgb(0_0_0/0.25)] animate-[fade_.2s_ease-out]">
        <div className="overflow-y-auto overscroll-contain p-3">
          <HelpBox id="popup-help" />
        </div>
        <div className="border-t border-line p-3">
          <Button ref={btn} className="w-full" onClick={onClose}>Got it</Button>
        </div>
      </div>
    </div>
  );
}
