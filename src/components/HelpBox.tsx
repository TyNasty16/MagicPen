import { footerFor, helpFor } from '../lib/sideEffectText';
import { useDrug } from '../lib/useDrug';

/** Always-open "When to get help" box (owner-approved wording from the label of the profile's medicine). */
export default function HelpBox({ id }: { id?: string }) {
  const drug = useDrug();
  return (
    <section id={id} className="scroll-mt-20 rounded-card border border-danger/30 bg-[#fbeeea] p-4" aria-labelledby={`${id ?? 'help'}-title`}>
      <h2 id={`${id ?? 'help'}-title`} className="mb-2 flex items-center gap-2 font-serif text-lg font-semibold text-danger">
        <span className="grid size-6 place-items-center rounded-full bg-danger font-sans text-sm text-white" aria-hidden>!</span>
        When to get help
      </h2>
      <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed">
        {helpFor(drug).map((t) => <li key={t}>{t}</li>)}
      </ul>
      <p className="mt-2.5 text-xs">{footerFor(drug)}</p>
    </section>
  );
}
