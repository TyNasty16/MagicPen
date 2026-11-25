import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { BackIcon, ChevronIcon } from './icons';

export const Button = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'quiet' }>(function Button(
  { variant = 'primary', className = '', ...props },
  ref,
) {
  const styles =
    variant === 'primary'
      ? 'bg-accent text-on-accent shadow-soft hover:brightness-95 active:brightness-90'
      : 'bg-transparent text-accent underline-offset-2 hover:underline';
  return <button ref={ref} className={`min-h-11 rounded-2xl px-5 font-semibold transition disabled:opacity-50 ${styles} ${className}`} {...props} />;
});

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
