import { useState } from 'react';
import { Card, ScreenHeader } from '../components/ui';
import BottomSheet from '../components/BottomSheet';
import { resetAllData } from '../db/db';
import { DISCLAIMER } from '../lib/disclaimer';

const CONFIRM_WORD = 'RESET';

export default function Settings() {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const close = () => { if (busy) return; setOpen(false); setTyped(''); setError(''); };
  const confirm = async () => {
    setBusy(true);
    setError('');
    try {
      await resetAllData();
      location.replace(location.pathname + location.search); // fresh start on Home, not Settings
    } catch {
      setBusy(false);
      setError('Something went wrong and nothing was deleted. Please try again.');
    }
  };

  return (
    <div className="space-y-4">
      <ScreenHeader title="Settings" backHref="#/home" />
      <Card title="About Steady">
        <div className="space-y-2 text-sm leading-relaxed">
          {DISCLAIMER.map((p) => <p key={p}>{p}</p>)}
        </div>
      </Card>
      <p className="px-1 text-sm text-muted">All of your data is stored only on this device.</p>

      <Card title="Reset all data">
        <p className="text-sm leading-relaxed text-muted">Erase everything you have entered and start again from the beginning.</p>
        <button type="button" onClick={() => setOpen(true)}
          className="mt-3 min-h-11 w-full rounded-2xl border border-reset/40 px-4 font-semibold text-reset">
          Reset all data…
        </button>
      </Card>

      {open && (
        <BottomSheet title="Reset all data" onClose={close}
          footer={
            <button type="button" onClick={confirm} disabled={typed !== CONFIRM_WORD || busy}
              className="min-h-12 w-full rounded-2xl bg-reset px-4 font-semibold text-white disabled:opacity-40">
              {busy ? 'Erasing…' : 'Erase everything'}
            </button>
          }>
          <div className="space-y-3 text-sm leading-relaxed">
            <p>This permanently erases:</p>
            <ul className="list-disc space-y-0.5 pl-5">
              <li>Your profile and targets</li>
              <li>All injections</li>
              <li>All weigh-ins and their photos</li>
              <li>All measurements</li>
              <li>All symptoms</li>
              <li>Saved screen preferences</li>
            </ul>
            <p className="font-semibold">There is no backup, and this cannot be undone.</p>
            <p>The app will restart at the welcome notice and first-time setup.</p>
            <label htmlFor="reset-confirm" className="block pt-1 font-semibold">Type {CONFIRM_WORD} to confirm</label>
            <input id="reset-confirm" value={typed} onChange={(e) => setTyped(e.target.value)}
              autoComplete="off" autoCapitalize="characters" autoCorrect="off" spellCheck={false}
              className="min-h-11 w-full rounded-xl border border-line bg-bg px-3 text-base tracking-wide" />
            {error && <p role="alert" className="text-danger">{error}</p>}
          </div>
        </BottomSheet>
      )}
    </div>
  );
}
