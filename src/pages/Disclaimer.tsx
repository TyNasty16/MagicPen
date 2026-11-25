import { useState } from 'react';
import { Button } from '../components/ui';
import { saveProfile } from '../db/db';
import { DISCLAIMER } from '../lib/disclaimer';

export default function Disclaimer() {
  const [checked, setChecked] = useState(false);
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-5 px-4 py-10">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.07em] text-accent">Steady</p>
        <h1 className="mt-1 font-serif text-[30px] font-semibold">Before you start</h1>
      </div>
      <div className="space-y-3 rounded-card bg-surface p-5 text-base leading-relaxed shadow-soft">
        {DISCLAIMER.map((p) => <p key={p}>{p}</p>)}
      </div>
      <label className="flex min-h-11 items-start gap-3 px-1">
        <input type="checkbox" className="mt-1 size-5 accent-[var(--color-accent)]" checked={checked} onChange={(e) => setChecked(e.target.checked)} />
        <span>I understand that Steady is not medical advice.</span>
      </label>
      <Button disabled={!checked} onClick={() => saveProfile({ disclaimerAcceptedAt: new Date().toISOString() })}>
        Continue
      </Button>
    </main>
  );
}
