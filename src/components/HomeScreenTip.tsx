import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { getBackupState } from '../lib/backup/run';
import { readDevice, shouldShowTip, TIP_DISMISSED_KEY } from '../lib/homeScreenTip';

const isDismissed = () => { try { return localStorage.getItem(TIP_DISMISSED_KEY) === '1'; } catch { return false; } };

export default function HomeScreenTip({ firstUse, now }: { firstUse?: string; now: Date }) {
  const backup = useLiveQuery(getBackupState);
  const [dismissed, setDismissed] = useState(isDismissed);
  if (!backup || !shouldShowTip(readDevice(), now, firstUse, backup.lastBackupAt, dismissed)) return null;
  const hide = () => {
    try { localStorage.setItem(TIP_DISMISSED_KEY, '1'); } catch { /* storage blocked: hidden for this visit */ }
    setDismissed(true);
  };
  return (
    <section aria-labelledby="hs-tip" className="rounded-card bg-surface p-4 shadow-soft">
      <h2 id="hs-tip" className="font-semibold">Keep your entries safe</h2>
      <p className="mt-1 text-sm leading-relaxed">You are using Steady in a browser tab. Your browser may clear its saved data if you do not open it for a week. Open Steady from your Home Screen instead: tap Share, then Add to Home Screen. Backing up to Dropbox also protects your entries.</p>
      <button type="button" onClick={hide} className="mt-3 min-h-11 w-full rounded-2xl border border-line bg-surface font-semibold text-accent">Got it</button>
    </section>
  );
}
