import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useMemo, useState } from 'react';
import Segmented from '../components/Segmented';
import { Button, Card, inputClass, ScreenHeader } from '../components/ui';
import { db, getPhoto, getProfile, listAppointments, listInjections, listMeasurements, listSymptoms, listWeights, weightIdsWithPhotos } from '../db/db';
import { buildReport, defaultIncluded, defaultPeriod, FOOTER, PRIVACY_NOTE, reportDate, reportFileName, SECTIONS, SHARE_FALLBACK, validPeriod, type Block, type Period, type ReportData, type SectionId } from '../lib/report';
import { shareReport } from '../lib/shareReport';

/** Doctor report (workflow 08b): pick the period, switch sections, preview, then share a PDF made on the phone. */
export default function DoctorReport({ backHref }: { backHref?: string }) {
  const data = useLiveQuery(async (): Promise<ReportData | null> => {
    const profile = await getProfile();
    if (!profile) return null;
    const [injections, weights, photoIds, measurements, symptoms, foodLog, water, dayMarks, appointments] = await Promise.all([
      listInjections(), listWeights(), weightIdsWithPhotos(), listMeasurements(), listSymptoms(), db.foodLog.toArray(), db.water.toArray(), db.dayMarks.toArray(), listAppointments(),
    ]);
    return { profile, injections, weights, photoWeightIds: [...photoIds], measurements, symptoms, foodLog, water, dayMarks, appointments };
  });
  if (data === undefined) return null;
  if (data === null) return <ScreenHeader title="Doctor report" backHref={backHref} />;
  return <ReportBuilder data={data} backHref={backHref} />;
}

function ReportBuilder({ data, backHref }: { data: ReportData; backHref?: string }) {
  const today = useMemo(() => new Date(), []);
  const since = useMemo(() => defaultPeriod(data, today), [data, today]);
  const [mode, setMode] = useState<'since' | 'custom'>('since');
  const [custom, setCustom] = useState<Period>(since);
  const period = mode === 'since' ? since : custom;
  const valid = validPeriod(period);
  const report = useMemo(() => (valid ? buildReport(data, period, today) : null), [data, period.start, period.end, valid, today]); // eslint-disable-line react-hooks/exhaustive-deps
  // The owner's switch choices sit on top of the defaults; they reset only when the period changes (not when new data arrives).
  const [overrides, setOverrides] = useState<Partial<Record<SectionId, boolean>>>({});
  useEffect(() => setOverrides({}), [period.start, period.end]);
  const included = report ? { ...defaultIncluded(report), ...overrides } : null;
  const setIncluded = (id: SectionId, on: boolean) => setOverrides((o) => ({ ...o, [id]: on }));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string>();
  const [ready, setReady] = useState<Uint8Array>(); // a made PDF waiting for a Share tap (iPhone)
  useEffect(() => {
    void import('../lib/pdf/render'); // load the PDF code early so sharing can follow the tap quickly
  }, []);
  useEffect(() => setReady(undefined), [report, overrides]);

  const share = async (bytes: Uint8Array) => {
    const r = await shareReport(bytes, reportFileName(today), report!.title);
    if (r === 'blocked') return setReady(bytes);
    setReady(undefined);
    if (r === 'downloaded') setMessage(SHARE_FALLBACK);
  };

  const make = async () => {
    if (!report || !included) return;
    setBusy(true);
    setMessage(undefined);
    try {
      const photos = new Map<number, Uint8Array>();
      if (included.photos) {
        for (const b of report.sections.find((s) => s.id === 'photos')!.blocks) {
          if (b.kind !== 'photos') continue;
          for (const it of b.items) {
            const p = await getPhoto(it.weightId);
            if (p) photos.set(it.weightId, new Uint8Array(await p.blob.arrayBuffer()));
          }
        }
      }
      const { renderReport } = await import('../lib/pdf/render'); // loaded only when a report is made
      await share(renderReport(report, included, photos));
    } catch {
      setMessage('The report couldn’t be made. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <ScreenHeader title="Doctor report" backHref={backHref} />
      <Card title="Period">
        <Segmented label="Period" value={mode} onChange={setMode} options={[{ id: 'since', label: 'Since last appointment' }, { id: 'custom', label: 'Custom dates' }]} small />
        {mode === 'since' ? (
          <p className="mt-2 text-sm text-muted">{reportDate(since.start)} to {reportDate(since.end)}</p>
        ) : (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <label className="text-sm font-medium">From<input type="date" className={`${inputClass} mt-1`} value={custom.start} max={custom.end} onChange={(e) => setCustom({ ...custom, start: e.target.value })} /></label>
            <label className="text-sm font-medium">To<input type="date" className={`${inputClass} mt-1`} value={custom.end} min={custom.start} onChange={(e) => setCustom({ ...custom, end: e.target.value })} /></label>
          </div>
        )}
        {!valid && <p role="alert" className="mt-2 text-sm text-danger">Choose a start date on or before the end date (from 2000, up to 10 years).</p>}
      </Card>

      {report && included && (
        <>
          <section aria-label="Preview" className="rounded-card bg-surface p-4 shadow-soft">
            <h2 className="font-serif text-2xl font-semibold">{report.title}</h2>
            <p className="mt-1 text-sm text-muted">{report.subtitle}</p>
            <div className="mt-3 space-y-3 border-t-2 border-accent pt-3">
              {report.sections.map((s) => {
                const on = included[s.id];
                const extra = SECTIONS.find((x) => x.id === s.id)!.extra;
                return (
                  <div key={s.id} className="rounded-2xl border border-line p-3">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-serif text-lg font-semibold text-accent">{s.title}</h3>
                      <label className="flex min-h-11 items-center gap-2 text-sm font-medium">
                        <input type="checkbox" role="switch" aria-label={`Include ${s.title}`} className="size-5 accent-accent" checked={on} onChange={(e) => setIncluded(s.id, e.target.checked)} />
                        <span aria-hidden>{on ? 'Included' : 'Left out'}</span>
                      </label>
                    </div>
                    {s.limited && !s.empty && s.limitedLine && (
                      <p className="mt-1 inline-block rounded-lg bg-warn/15 px-2 py-1 text-xs font-semibold text-[#7a4f0e]">
                        {s.blocks.some((b) => b.kind === 'text' && b.text === s.limitedLine) ? 'Limited data' : `Limited data: ${s.limitedLine}`}
                      </p>
                    )}
                    {extra && !on && s.empty ? null : on && <div className="mt-2 space-y-1 text-sm">{s.blocks.map((b, i) => <PreviewBlock key={i} b={b} />)}</div>}
                  </div>
                );
              })}
              <p className="text-xs italic text-muted">{FOOTER}</p>
            </div>
          </section>

          <p className="px-1 text-sm text-muted">{PRIVACY_NOTE}</p>
          {ready ? (
            <Button className="w-full" onClick={() => void share(ready)}>Share PDF</Button>
          ) : (
            <Button className="w-full" onClick={make} disabled={busy}>{busy ? 'Making the PDF…' : 'Make PDF and share'}</Button>
          )}
          <div aria-live="polite">{message && <p className="px-1 text-sm">{message}</p>}</div>
        </>
      )}
    </div>
  );
}

function PreviewBlock({ b }: { b: Block }) {
  if (b.kind === 'text') return <p className={b.muted ? 'text-muted' : ''}>{b.text}</p>;
  if (b.kind === 'table')
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead><tr className="text-muted">{b.head.map((h, i) => <th key={i} className={`py-1 pr-2 font-semibold ${b.align?.[i] === 'right' ? 'text-right' : ''}`}>{h}</th>)}</tr></thead>
          <tbody>{b.rows.map((r, i) => <tr key={i} className="border-t border-line">{r.map((c, j) => <td key={j} className={`py-1 pr-2 ${b.align?.[j] === 'right' ? 'text-right' : ''}`}>{c}</td>)}</tr>)}</tbody>
        </table>
      </div>
    );
  if (b.kind === 'chart') {
    const v = b.points.map((p) => p.value), lo = Math.min(...v), hi = Math.max(...v), span = hi - lo || 1;
    const pts = b.points.map((p, i) => `${(i / Math.max(b.points.length - 1, 1)) * 300},${70 - ((p.value - lo) / span) * 60}`).join(' ');
    return <svg viewBox="0 0 300 80" className="h-20 w-full" role="img" aria-label={`Weight from ${v[0]} to ${v.at(-1)} ${b.unit}`}><polyline points={pts} fill="none" className="stroke-accent" strokeWidth="2" /></svg>;
  }
  return <p className="text-muted">{b.items.length} photo{b.items.length === 1 ? '' : 's'}: {b.items.map((i) => i.caption).join('; ')}</p>;
}
