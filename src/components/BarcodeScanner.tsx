import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { BARCODE_TEXT, cleanBarcode, type ShortFormat } from '../lib/barcode';
import { useOverlay } from '../lib/useOverlay';
import { inputClass } from './ui';

type Status = 'starting' | 'scanning' | 'denied' | 'nocamera';

/**
 * Full-screen camera scanner. The barcode reader (ZXing) loads only when this opens, and reads frames on the phone;
 * no picture is sent anywhere. Only a number that passes `cleanBarcode` is handed back. Every camera track stops on
 * close, on a successful read, or when the app goes to the background.
 */
export default function BarcodeScanner({ onCode, onClose }: { onCode: (code: string, format?: ShortFormat) => void; onClose: () => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<Status>('starting');
  const [typed, setTyped] = useState('');
  const [bad, setBad] = useState(false);
  const done = useRef(false);
  const closeButton = useRef<HTMLButtonElement>(null);
  const typedInput = useRef<HTMLInputElement>(null);
  const latest = useRef({ onCode, onClose });
  latest.current = { onCode, onClose };
  useOverlay(onClose);

  useEffect(() => {
    let stop: (() => void) | undefined;
    let cancelled = false;
    const stopTracks = () => {
      stop?.();
      const s = video.current?.srcObject;
      if (s instanceof MediaStream) s.getTracks().forEach((t) => t.stop());
      if (video.current) video.current.srcObject = null;
    };
    (async () => {
      if (!navigator.mediaDevices?.getUserMedia) return setStatus('nocamera');
      const [{ BrowserMultiFormatReader }, { BarcodeFormat, DecodeHintType }] = await Promise.all([import('@zxing/browser'), import('@zxing/library')]);
      if (cancelled) return;
      const hints = new Map([[DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.EAN_13, BarcodeFormat.EAN_8, BarcodeFormat.UPC_A, BarcodeFormat.UPC_E]]]);
      const reader = new BrowserMultiFormatReader(hints, { delayBetweenScanAttempts: 150 });
      const controls = await reader.decodeFromConstraints({ audio: false, video: { facingMode: { ideal: 'environment' } } }, video.current!, (result) => {
        if (cancelled || !result || done.current) return; // nothing is sent after Close
        const code = cleanBarcode(result.getText()); // a misread or non-food code is ignored and scanning continues
        if (!code) return;
        done.current = true;
        stopTracks();
        const f = result.getBarcodeFormat();
        latest.current.onCode(code, f === BarcodeFormat.UPC_E ? 'upce' : f === BarcodeFormat.EAN_8 ? 'ean8' : undefined);
      });
      stop = () => controls.stop();
      if (cancelled || done.current) stopTracks(); // closed, or a code was read, while the camera was starting
      else setStatus('scanning');
    })().catch((e: unknown) => {
      if (cancelled) return;
      const name = e instanceof Error ? e.name : '';
      setStatus(name === 'NotAllowedError' || name === 'SecurityError' ? 'denied' : 'nocamera');
    });
    const onHide = () => document.visibilityState === 'hidden' && latest.current.onClose();
    const onPageHide = () => latest.current.onClose();
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', onPageHide);
    // Focus moves into the scanner; the app behind it is hidden from screen readers and taps until it closes.
    const opener = document.activeElement as HTMLElement | null;
    const root = document.getElementById('root');
    root?.setAttribute('inert', '');
    closeButton.current?.focus();
    return () => {
      cancelled = true;
      stopTracks();
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', onPageHide);
      root?.removeAttribute('inert');
      opener?.focus?.();
    };
  }, []);

  // Without a camera, go straight to the typed number.
  useEffect(() => {
    if (status === 'denied' || status === 'nocamera') typedInput.current?.focus();
  }, [status]);

  const lookUp = () => {
    const code = cleanBarcode(typed);
    if (!code) return setBad(true);
    done.current = true;
    onCode(code);
  };

  const message = status === 'denied' ? BARCODE_TEXT.denied : status === 'nocamera' ? BARCODE_TEXT.noCamera : BARCODE_TEXT.status;
  return createPortal(
    <div className="fixed inset-0 z-50 flex flex-col bg-black text-white" role="dialog" aria-modal="true" aria-label="Scan barcode">
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <video ref={video} className="h-full w-full object-cover" muted playsInline aria-hidden />
        {status === 'scanning' && <div className="pointer-events-none absolute inset-x-10 top-1/2 h-32 -translate-y-1/2 rounded-2xl border-2 border-white/80" aria-hidden />}
        <button ref={closeButton} type="button" onClick={onClose} className="absolute top-[max(0.75rem,env(safe-area-inset-top))] right-3 min-h-11 rounded-full bg-black/55 px-4 font-semibold">Close</button>
        <p role="status" className="absolute inset-x-4 bottom-4 rounded-xl bg-black/60 px-3 py-2 text-center text-sm">{message}</p>
      </div>
      <div className="bg-surface px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] text-ink">
        <label htmlFor="typed-barcode" className="mb-1 block text-sm font-medium">{BARCODE_TEXT.typedLabel}</label>
        <div className="flex gap-2">
          <input
            ref={typedInput}
            id="typed-barcode"
            className={inputClass}
            inputMode="numeric"
            autoComplete="off"
            maxLength={32}
            value={typed}
            aria-invalid={bad}
            onChange={(e) => {
              setTyped(e.target.value);
              setBad(false);
            }}
            onKeyDown={(e) => e.key === 'Enter' && lookUp()}
          />
          <button type="button" onClick={lookUp} disabled={!typed.trim()} className="min-h-11 flex-none rounded-2xl bg-accent px-5 font-semibold text-on-accent disabled:opacity-50">{BARCODE_TEXT.typedButton}</button>
        </div>
        {bad && <p role="alert" className="mt-1 text-sm text-danger">{BARCODE_TEXT.bad}</p>}
      </div>
    </div>,
    document.body,
  );
}
