import type { ButtonHTMLAttributes, ReactNode } from 'react';

export function Button({ variant = 'primary', className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'quiet' }) {
  const styles =
    variant === 'primary'
      ? 'bg-accent text-on-accent hover:opacity-90'
      : 'bg-transparent text-accent underline-offset-2 hover:underline';
  return <button className={`min-h-11 rounded-lg px-4 font-medium disabled:opacity-50 ${styles} ${className}`} {...props} />;
}

export function Card({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-line bg-surface p-4">
      {title && <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">{title}</h2>}
      {children}
    </section>
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
  'min-h-11 w-full rounded-lg border border-line bg-bg px-3 text-base text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30';

export function Banner({ tone = 'info', children }: { tone?: 'info' | 'warn'; children: ReactNode }) {
  const styles = tone === 'warn' ? 'border-warn/40 bg-warn/10' : 'border-accent/30 bg-accent/5';
  return <div className={`rounded-lg border p-3 text-sm ${styles}`}>{children}</div>;
}
