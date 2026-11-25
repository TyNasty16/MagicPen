import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useRef, useState } from 'react';
import { useOverlay } from '../lib/useOverlay';
import { deletePhoto, getPhoto } from '../db/db';

/** Full-screen view of a weigh-in's photo. */
export default function PhotoViewer({ weightId, caption, onClose }: { weightId: number; caption: string; onClose: () => void }) {
  const photo = useLiveQuery(() => getPhoto(weightId), [weightId]);
  const [url, setUrl] = useState<string>();

  useEffect(() => {
    if (!photo) return;
    const u = URL.createObjectURL(photo.blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [photo]);

  useOverlay(onClose);
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => closeRef.current?.focus(), []);

  const remove = async () => {
    if (window.confirm('Remove this photo? The weigh-in stays.')) {
      onClose(); // close first so "not found" never flashes
      await deletePhoto(weightId);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-[#1a1411] text-white" role="dialog" aria-modal="true" aria-label={`Photo, ${caption}`}>
      <header className="flex items-center justify-between px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-2">
        <button ref={closeRef} type="button" onClick={onClose} className="min-h-11 px-1 font-semibold">Close</button>
        <p className="text-sm">{caption}</p>
        <button type="button" onClick={remove} className="min-h-11 px-1 text-sm font-semibold text-[#f3b3a3]">Remove</button>
      </header>
      <div className="flex flex-1 items-center justify-center overflow-hidden p-3">
        {url ? <img src={url} alt={`Progress photo, ${caption}`} className="max-h-full max-w-full rounded-2xl object-contain" /> : photo === undefined ? null : <p>Photo not found.</p>}
      </div>
    </div>
  );
}
