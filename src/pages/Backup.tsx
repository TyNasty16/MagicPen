import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useState } from 'react';
import { Button, Card, inputClass, ScreenHeader } from '../components/ui';
import { connectWithRedirect, finishCodeSignIn, startCodeSignIn } from '../lib/backup/auth';
import { MIN_PASSWORD } from '../lib/backup/format';
import { applyRestore, disconnect, ERROR_TEXT, getBackupState, listBackups, openBackup, runBackup, saveBackupState, setPassword } from '../lib/backup/run';
import { DEFAULT_EVENING, EVENING_CHOICES } from '../lib/backup/schedule';
import { summarize, type Payload } from '../lib/backup/serialize';
import type { DropboxFile } from '../lib/backup/dropbox';

const TOP_NOTE = 'Steady saves an encrypted copy of your entries (not photos) to your own Dropbox. It is locked on this phone with your password before it leaves. Photos are not included.';
const fmtDateTime = (d: Date) => d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
const fmtDate = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const fmtSize = (b: number) => (b < 1024 ? `${b} B` : b < 1048576 ? `${Math.round(b / 1024)} KB` : `${(b / 1048576).toFixed(1)} MB`);
const errText = (e: unknown) => ERROR_TEXT[(e as { code?: string })?.code ?? ''] ?? 'Something went wrong. Your data on this phone was not changed.';

/** ☰ → Backup (workflow 10a). */
export default function Backup({ backHref, signin }: { backHref?: string; signin?: string }) {
  const s = useLiveQuery(getBackupState);
  if (!s) return null;
  const connected = !!s.refreshToken;
  const hasKey = !!s.key;
  return (
    <div className="space-y-4">
      <ScreenHeader title="Backup" backHref={backHref} />
      <p className="px-1 text-sm text-muted">{TOP_NOTE}</p>
      {signin === 'browser' && <p role="alert" className="rounded-2xl bg-warn/15 p-3 text-sm">Sign-in finished in the browser, not in the app. Go back to Steady and choose Connect with a code.</p>}
      {!connected && (signin === 'failed' || signin === 'cancelled') && <p role="alert" className="rounded-2xl bg-warn/15 p-3 text-sm">Dropbox sign-in didn’t finish. Nothing was changed. Try again.</p>}
      {!connected ? <Connect error={s.lastError} /> : !hasKey ? <PasswordSetup first /> : <Ready />}
    </div>
  );
}

function Connect({ error }: { error?: string }) {
  const [codeMode, setCodeMode] = useState(false);
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState<string>();
  const [busy, setBusy] = useState(false);
  const finish = async () => {
    setBusy(true);
    setMsg(undefined);
    try {
      await finishCodeSignIn(code);
    } catch {
      setMsg('That code didn’t work. Tap Connect with a code to get a new one.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <Card>
      {error && <p role="alert" className="mb-3 text-sm text-danger">{error}</p>}
      <Button className="w-full" onClick={() => void connectWithRedirect()}>Connect Dropbox</Button>
      <p className="mt-4 text-sm text-muted">Sign-in didn’t return to the app?</p>
      <button type="button" onClick={() => { setCodeMode(true); void startCodeSignIn(); }} className="mt-1 min-h-11 w-full rounded-2xl border border-line bg-surface font-semibold text-accent">Connect with a code</button>
      {codeMode && (
        <div className="mt-3 space-y-2">
          <p className="text-sm">Dropbox will show a code. Copy it, come back to Steady, and paste it here.</p>
          <label htmlFor="dbx-code" className="block text-sm font-medium">Code from Dropbox</label>
          <input id="dbx-code" className={inputClass} autoComplete="off" autoCapitalize="off" spellCheck={false} value={code} onChange={(e) => setCode(e.target.value)} />
          <Button className="w-full" disabled={!code.trim() || busy} onClick={() => void finish()}>Connect</Button>
          {msg && <p role="alert" className="text-sm text-danger">{msg}</p>}
        </div>
      )}
    </Card>
  );
}

function PasswordSetup({ first, onDone }: { first?: boolean; onDone?: () => void }) {
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string>();
  const ok = a.length >= MIN_PASSWORD && a === b;
  const save = async () => {
    setBusy(true);
    await setPassword(a);
    setBusy(false);
    setA(''); setB('');
    if (!first) setMsg('New backups use the new password. Older backups still need the old one.');
    onDone?.();
  };
  return (
    <Card title={first ? 'Backup password' : 'Change password'}>
      <p className="text-sm leading-relaxed">Choose a password of at least 12 characters. Three or four random words work well. If you forget this password, nobody, including us, can open your backups. There is no reset. Write it down and keep it somewhere safe.</p>
      <div className="mt-3 space-y-2">
        <label htmlFor="pw1" className="block text-sm font-medium">Password</label>
        <input id="pw1" type="password" autoComplete="new-password" className={inputClass} value={a} onChange={(e) => setA(e.target.value)} />
        <label htmlFor="pw2" className="block text-sm font-medium">Type it again</label>
        <input id="pw2" type="password" autoComplete="new-password" className={inputClass} value={b} onChange={(e) => setB(e.target.value)} />
        {a.length > 0 && a.length < MIN_PASSWORD && <p className="text-sm text-muted">{MIN_PASSWORD - a.length} more characters needed.</p>}
        {b.length > 0 && a !== b && <p className="text-sm text-muted">The two passwords don’t match yet.</p>}
        <Button className="w-full" disabled={!ok || busy} onClick={() => void save()}>{busy ? 'Saving…' : 'Save password'}</Button>
        {msg && <p role="status" className="text-sm">{msg}</p>}
      </div>
    </Card>
  );
}

function Ready() {
  const s = useLiveQuery(getBackupState);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string>();
  const [confirmSmall, setConfirmSmall] = useState(false);
  const [view, setView] = useState<'main' | 'restore' | 'password'>('main');
  if (!s) return null;
  const last = s.lastBackupAt ? new Date(s.lastBackupAt) : undefined;
  const days = last ? Math.floor((Date.now() - last.getTime()) / 86_400_000) : undefined;

  const backUp = async (force = false) => {
    setBusy(true);
    setMsg(undefined);
    setConfirmSmall(false);
    const r = await runBackup({ manual: true, force });
    setBusy(false);
    if (r.ok) setMsg('Backed up.');
    else if (r.reason === 'too-small') setConfirmSmall(true);
    else if (r.reason === 'offline') setMsg('You’re offline. Steady will try again next time it’s open.');
    else if (r.message) setMsg(r.message);
  };

  if (view === 'restore') return <Restore onClose={() => setView('main')} />;
  if (view === 'password') return <PasswordSetup onDone={() => undefined} />;

  return (
    <>
      <Card>
        <p className="font-semibold" role="status">
          {!last ? 'No backup yet.' : days !== undefined && days > 3 ? <span className="text-[#7a4f0e]">Last backup: {days} days ago. Open Steady in the evening to back up.</span> : `Last backup: ${fmtDateTime(last)}${s.lastSize ? ` (${fmtSize(s.lastSize)})` : ''}`}
        </p>
        {s.lastError && <p role="alert" className="mt-1 text-sm text-danger">{s.lastError}</p>}
        <label htmlFor="evening" className="mt-3 block text-sm font-medium">Back up each day after</label>
        <select id="evening" className={`${inputClass} mt-1`} value={s.eveningTime ?? DEFAULT_EVENING} onChange={(e) => void saveBackupState({ eveningTime: e.target.value })}>
          {EVENING_CHOICES.map((t) => <option key={t} value={t}>{new Date(`2000-01-01T${t}:00`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</option>)}
        </select>
        <Button className="mt-3 w-full" disabled={busy} onClick={() => void backUp()}>{busy ? 'Backing up…' : 'Back up now'}</Button>
        {confirmSmall && (
          <div className="mt-2 rounded-2xl bg-warn/15 p-3 text-sm">
            <p>This is much smaller than your last backup. Back up anyway? Your older backups stay until a newer one replaces them.</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setConfirmSmall(false)} className="min-h-11 rounded-2xl border border-line font-semibold text-accent">Cancel</button>
              <button type="button" onClick={() => void backUp(true)} className="min-h-11 rounded-2xl bg-accent font-semibold text-on-accent">Back up</button>
            </div>
          </div>
        )}
        <div aria-live="polite">{msg && <p className="mt-2 text-sm">{msg}</p>}</div>
      </Card>
      <button type="button" onClick={() => setView('restore')} className="min-h-11 w-full rounded-2xl border border-line bg-surface font-semibold text-accent">Restore from a backup</button>
      <button type="button" onClick={() => setView('password')} className="min-h-11 w-full rounded-2xl border border-line bg-surface font-semibold text-accent">Change password</button>
      <div>
        <button type="button" onClick={() => void disconnect()} className="min-h-11 w-full rounded-2xl border border-line bg-surface font-semibold text-danger">Disconnect Dropbox</button>
        <p className="mt-1 px-1 text-sm text-muted">Your backups stay in Dropbox.</p>
      </div>
    </>
  );
}

function Restore({ onClose }: { onClose: () => void }) {
  const [files, setFiles] = useState<(DropboxFile & { made: Date })[]>();
  const [pick, setPick] = useState<DropboxFile & { made: Date }>();
  const [needPw, setNeedPw] = useState(false);
  const [pw, setPw] = useState('');
  const [payload, setPayload] = useState<Payload>();
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string>();
  useEffect(() => {
    listBackups().then(setFiles, (e) => setMsg(errText(e)));
  }, []);

  const open = async (f: DropboxFile & { made: Date }, password?: string) => {
    setPick(f);
    setBusy(true);
    setMsg(undefined);
    try {
      setPayload(await openBackup(f.path, password));
      setNeedPw(false);
    } catch (e) {
      if ((e as { code?: string }).code === 'needs-password') setNeedPw(true);
      else setMsg(errText(e));
    } finally {
      setBusy(false);
    }
  };
  const replace = async () => {
    if (!payload) return;
    setBusy(true);
    try {
      await applyRestore(payload);
      location.replace(location.pathname + location.search); // fresh start on Home with the restored data
    } catch {
      setBusy(false);
      setMsg('This backup can’t be read. Your data on this phone was not changed.');
    }
  };

  const sum = payload && summarize(payload);
  return (
    <Card title="Restore from a backup">
      {!files && !msg && <p className="text-sm text-muted">Looking in Dropbox…</p>}
      {files && files.length === 0 && <p className="text-sm text-muted">No backup yet.</p>}
      {files && !payload && (
        <ul className="space-y-2">
          {files.map((f) => (
            <li key={f.path}>
              <button type="button" disabled={busy} onClick={() => void open(f)} className={`flex min-h-11 w-full items-center justify-between rounded-2xl border px-3 text-left text-sm ${pick?.path === f.path ? 'border-accent' : 'border-line'}`}>
                <span>{fmtDateTime(f.made)}</span>
                <span className="text-muted">{fmtSize(f.size)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {needPw && pick && (
        <div className="mt-3 space-y-2">
          <label htmlFor="restore-pw" className="block text-sm font-medium">Password</label>
          <input id="restore-pw" type="password" autoComplete="current-password" className={inputClass} value={pw} onChange={(e) => setPw(e.target.value)} />
          <Button className="w-full" disabled={!pw || busy} onClick={() => void open(pick, pw)}>Open backup</Button>
        </div>
      )}
      {payload && sum && pick && (
        <div className="space-y-2 text-sm">
          <p>This replaces your entries on this phone with the backup from {fmtDate(pick.made)}: {sum.injections} injections, {sum.weighIns} weigh-ins, {sum.measurements} measurements, {sum.symptoms} symptoms, {sum.food} food entries, {sum.appointments} appointments. Last entry {sum.lastEntry ? fmtDate(new Date(`${sum.lastEntry}T12:00:00`)) : '—'}. Photos on this phone are not changed. Type RESTORE to confirm.</p>
          <input aria-label="Type RESTORE to confirm" className={inputClass} autoComplete="off" autoCapitalize="characters" value={typed} onChange={(e) => setTyped(e.target.value)} />
          <button type="button" disabled={typed !== 'RESTORE' || busy} onClick={() => void replace()} className="min-h-12 w-full rounded-2xl bg-reset px-4 font-semibold text-white disabled:opacity-40">Replace my data</button>
        </div>
      )}
      <div aria-live="polite">{msg && <p role="alert" className="mt-2 text-sm text-danger">{msg}</p>}</div>
      <button type="button" onClick={onClose} className="mt-3 min-h-11 w-full text-sm font-semibold text-accent">Back</button>
    </Card>
  );
}

