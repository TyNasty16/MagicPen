/** Pill-style switch between a few options (44px tall). */
export default function Segmented<T extends string>({ label, value, onChange, options, small }: { label: string; value: T; onChange: (v: T) => void; options: { id: T; label: string }[]; small?: boolean }) {
  return (
    <div className="flex gap-0.5 rounded-xl border border-line bg-bg p-1" role="group" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          aria-pressed={value === o.id}
          onClick={() => onChange(o.id)}
          className={`h-11 flex-1 rounded-lg font-semibold transition ${small ? 'text-xs' : 'text-sm'} ${value === o.id ? 'bg-accent text-on-accent shadow-[0_2px_6px_rgb(168_85_64/0.35)]' : 'text-muted'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
