// Medicines Steady can log (workflow 07). Doses are pen strengths for logging only — the app never suggests a dose.
// Wegovy: owner-approved list (Milestone 2). Ozempic: label, DailyMed set ID adec4fd2 (docs/sources/07-ozempic-label.md).

export type DrugId = 'wegovy' | 'ozempic';

export interface Drug {
  id: DrugId;
  name: string;
  generic: 'semaglutide';
  dosesMg: number[];
}

export const DRUGS: Record<DrugId, Drug> = {
  wegovy: { id: 'wegovy', name: 'Wegovy', generic: 'semaglutide', dosesMg: [0.25, 0.5, 1, 1.7, 2.4] },
  ozempic: { id: 'ozempic', name: 'Ozempic', generic: 'semaglutide', dosesMg: [0.25, 0.5, 1, 2] },
};

export const DRUG_IDS = Object.keys(DRUGS) as DrugId[];

/** The medicine of an entry or profile; anything logged before workflow 07 (no `drug`) is Wegovy. */
export const drugOf = (x: { drug?: string } | null | undefined): DrugId => (x?.drug === 'ozempic' ? 'ozempic' : 'wegovy');

export const drugName = (id: DrugId) => DRUGS[id].name;
