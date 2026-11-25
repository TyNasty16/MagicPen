import type { ReactNode } from 'react';
import { useOverlay } from '../lib/useOverlay';

/** Panel that slides up over the screen. Locks page scrolling while open. */
export default function BottomSheet({ title, onClose, children, footer }: { title: string; onClose: () => void; children: ReactNode; footer: ReactNode }) {
  useOverlay(onClose);

  return (
    <div className="fixed inset-0 z-30" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-ink/35 animate-[fade_.2s_ease-out]" onClick={onClose} />
      <div className="absolute inset-x-0 bottom-0 mx-auto flex max-h-[92dvh] max-w-md flex-col rounded-t-[28px] bg-surface shadow-[0_-10px_30px_rgb(0_0_0/0.12)] animate-[rise_.25s_ease-out]">
        <div className="mx-auto mt-2.5 h-1.5 w-10 rounded-full bg-line" aria-hidden />
        <header className="flex items-center justify-between px-5 pt-2 pb-1">
          <h2 className="font-serif text-2xl font-semibold">{title}</h2>
          <button type="button" onClick={onClose} className="min-h-11 px-1 font-semibold text-accent">Cancel</button>
        </header>
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-4">{children}</div>
        <div className="border-t border-line px-5 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">{footer}</div>
      </div>
    </div>
  );
}
