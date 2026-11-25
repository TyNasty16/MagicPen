import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { BackIcon, ChevronIcon } from './icons';

export function Button({ variant = 'primary', className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'quiet' }) {
  const styles =
    variant === 'primary'
      ? 'bg-accent text-on-accent shadow-soft hover:brightness-95 active:brightness-90'
      : 'bg-transparent text-accent underline-offset-2 hover:underline';
  return <button className={`min-h-11 rounded-2xl px-5 font-semibold transition disabled:opacity-50 ${styles} ${className}`} {...props} />;
}

export function Card({ title, children, id }: { title?: string; children: ReactNode; id?: string }) {
  return (
    <section id={id} className="scroll-mt-20 rounded-card bg-surface p-4 shadow-soft">
      {title && <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.07em] text-muted">{title}</h2>}
      {children}
    </section>
  );
}

/** Dashboard tile. With `href` the whole tile is a link with a chevron; without, it is static. */
export function Tile({ title, href, children, className = '' }: { title: string; href?: string; children: ReactNode; className?: string }) {
  const body = (
    <>
      <div className="mb-3 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.07em] text-muted">
        <span>{title}</span>
        {href && <ChevronIcon width={18} height={18} />}
      </div>
      {children}
    </>
  );
  const cls = `block rounded-card bg-surface p-4 shadow-soft ${className}`;
  return href ? (
    <a href={href} className={`${cls} transition active:scale-[0.98]`}>{body}</a>
  ) : (
    <section className={cls}>{body}</section>
  );
}

export function CalorieRing({ eaten, target }: { eaten: number; target: number }) {
  const r = 49;
  const c = 2 * Math.PI * r;
  const frac = target > 0 ? Math.min(eaten / target, 1) : 0;
  return (
    <div className="relative size-[116px] flex-none">
      <svg width="116" height="116" className="-rotate-90" aria-hidden>
        <circle cx="58" cy="58" r={r} strokeWidth="12" fill="none" className="stroke-track" />
        {frac > 0 && (
          <circle cx="58" cy="58" r={r} strokeWidth="12" fill="none" strokeLinecap="round" className="stroke-accent" strokeDasharray={c} strokeDashoffset={c * (1 - frac)} />
        )}
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className="font-serif text-2xl font-semibold">{eaten.toLocaleString()}</div>
          <div className="text-[11px] text-muted">of {target.toLocaleString()} kcal</div>
        </div>
      </div>
    </div>
  );
}

export function MacroBar({ label, value, target, color }: { label: string; value: number; target: number; color: string }) {
  const pct = target > 0 ? Math.min((value / target) * 100, 100) : 0;
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span>{label}</span>
        <span className="text-muted">{value} / {target} g</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-track">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/** Serif page title; with `backHref`, shows a back button that returns there. */
export function ScreenHeader({ title, backHref }: { title: string; backHref?: string }) {
  return (
    <header className={`mb-4 flex items-center gap-2 ${backHref ? 'sticky top-0 z-10 -mx-4 bg-bg/95 px-4 py-1 backdrop-blur' : ''}`}>
      {backHref && (
        <a href={backHref} aria-label="Back" className="-ml-2 grid size-11 place-items-center rounded-2xl text-accent">
          <BackIcon />
        </a>
      )}
      <h1 className="font-serif text-[28px] font-semibold">{title}</h1>
    </header>
  );
}

/** Labelled form row. `htmlFor` must match the id of the input it describes. */
export function Field({ label, htmlFor, hint, error, children }: { label: string; htmlFor: string; hint?: string; error?: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1 block text-sm font-medium">{label}</label>
      {children}
      {error ? <p role="alert" className="mt-1 text-sm text-danger">{error}</p> : hint && <p className="mt-1 text-sm text-muted">{hint}</p>}
    </div>
  );
}

export const inputClass =
  'min-h-11 w-full rounded-xl border border-line bg-bg px-3 text-base text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30';

export function Banner({ tone = 'info', children }: { tone?: 'info' | 'warn'; children: ReactNode }) {
  const styles = tone === 'warn' ? 'border-warn/40 bg-warn/10' : 'border-line bg-track/60';
  return <div className={`rounded-2xl border p-3 text-sm ${styles}`}>{children}</div>;
}
