import { useState } from 'react';
import { Button } from '../components/ui';
import { saveProfile } from '../db/db';
import { DISCLAIMER } from '../lib/disclaimer';

export default function Disclaimer() {
  const [checked, setChecked] = useState(false);
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-4 py-10">
      <h1 className="text-2xl font-semibold">Before you start</h1>
      <div className="space-y-3 text-base leading-relaxed">
        {DISCLAIMER.map((p) => <p key={p}>{p}</p>)}
      </div>
      <label className="flex items-start gap-3">
        <input type="checkbox" className="mt-1 size-5 accent-[var(--color-accent)]" checked={checked} onChange={(e) => setChecked(e.target.checked)} />
        <span>I understand that Steady is not medical advice.</span>
      </label>
      <Button disabled={!checked} onClick={() => saveProfile({ disclaimerAcceptedAt: new Date().toISOString() })}>
        Continue
      </Button>
    </main>
  );
}
