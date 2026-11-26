import { useEffect, useRef, useState } from 'react';
import { MenuIcon } from './icons';

const ITEMS = [
  { href: '#/report?from=home', label: 'Doctor report' },
  { href: '#/appointments?from=home', label: 'Appointments' },
  { href: '#/settings', label: 'Settings' },
];

/** Home's menu button (three lines): a small menu (workflow 08a; owner asked for a standard menu icon). More items can be added to ITEMS. */
export default function GearMenu() {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => !root.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        button.current?.focus();
      }
    };
    // Keyboard: focus arriving somewhere outside (e.g. tabbing on) closes the menu. Watching where focus *arrives*
    // matters on iPhone: tapping an item drops focus with nowhere new to go, and that must not close the menu
    // before the tap's click lands (bug fixed 2026-11-26).
    const onFocusIn = (e: FocusEvent) => !root.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    document.addEventListener('focusin', onFocusIn);
    root.current?.querySelector('a')?.focus();
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('focusin', onFocusIn);
    };
  }, [open]);
  return (
    <div ref={root} className="relative">
      <button ref={button} type="button" aria-label="Menu" aria-controls="home-menu" aria-expanded={open} onClick={() => setOpen(!open)} className="grid size-11 place-items-center rounded-2xl bg-surface text-muted shadow-soft">
        <MenuIcon width={22} height={22} />
      </button>
      {open && (
        <nav id="home-menu" aria-label="Menu" className="absolute top-12 right-0 z-30 w-52 overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_10px_30px_rgb(80_50_30/0.15)]">
          {ITEMS.map((i) => (
            <a key={i.href} href={i.href} onClick={() => setOpen(false)} className="flex min-h-12 items-center border-b border-line px-4 font-medium last:border-b-0">
              {i.label}
            </a>
          ))}
        </nav>
      )}
    </div>
  );
}
