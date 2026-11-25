import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { DRUG_IDS, DRUGS, drugOf } from './drugs';
import { formatDrugDose, WEGOVY_DOSES_MG } from './injections';
import { OZEMPIC_GUIDE } from './injectionGuide';
import { doseChanges, doseMarkLabel } from './range';
import { footerFor, helpFor, HELP_FOOTER, tipFor, WHEN_TO_GET_HELP, WHEN_TO_GET_HELP_OZEMPIC } from './sideEffectText';
import { symptomAlerts } from './symptomAlerts';

const label = readFileSync('docs/sources/07-ozempic-label.md', 'utf8').replace(/\s+/g, ' ');
const inLabel = (quote: string) => label.toLowerCase().includes(quote.replace(/\s+/g, ' ').toLowerCase());

describe('medicine catalog', () => {
  it('has Wegovy and Ozempic, both semaglutide, with their pen doses', () => {
    expect(DRUG_IDS).toEqual(['wegovy', 'ozempic']);
    expect(DRUGS.wegovy.dosesMg).toEqual([0.25, 0.5, 1, 1.7, 2.4]);
    expect(DRUGS.ozempic.dosesMg).toEqual([0.25, 0.5, 1, 2]);
    expect(WEGOVY_DOSES_MG).toBe(DRUGS.wegovy.dosesMg);
    expect(DRUGS.ozempic.generic).toBe('semaglutide');
  });
  it('anything logged before (no drug) is Wegovy; a stored drug is kept', () => {
    expect(drugOf({})).toBe('wegovy');
    expect(drugOf(undefined)).toBe('wegovy');
    expect(drugOf({ drug: 'ozempic' })).toBe('ozempic');
    expect(drugOf({ drug: 'something-else' })).toBe('wegovy');
    expect(formatDrugDose({ doseMg: 0.5, drug: 'ozempic' })).toBe('Ozempic 0.5 mg');
    expect(formatDrugDose({ doseMg: 2.4 })).toBe('Wegovy 2.4 mg');
  });
});

describe('chart marks', () => {
  const t = (d: number) => new Date(2026, 9, d, 9).toISOString();
  it('same medicine and dose: no mark; new dose: mark; a switch is its own mark, never a dose step', () => {
    const c = doseChanges([
      { datetime: t(1), doseMg: 2.4 },
      { datetime: t(8), doseMg: 2.4 },
      { datetime: t(15), doseMg: 2.4, drug: 'ozempic' }, // switch, same number
      { datetime: t(22), doseMg: 2, drug: 'ozempic' }, // dose change within Ozempic
      { datetime: t(29), doseMg: 1, drug: 'wegovy' }, // switch back, lower number
    ]);
    expect(c.map(doseMarkLabel)).toEqual(['Start 2.4 mg', 'Ozempic 2.4 mg', '2 mg', 'Wegovy 1 mg']);
    expect(c.map((x) => x.drugChanged)).toEqual([false, true, false, true]);
  });
  it('an Ozempic-only history names it on the first mark; unordered input is sorted', () => {
    const c = doseChanges([{ datetime: t(8), doseMg: 0.5, drug: 'ozempic' }, { datetime: t(1), doseMg: 0.25, drug: 'ozempic' }]);
    expect(c.map(doseMarkLabel)).toEqual(['Start Ozempic 0.25 mg', '0.5 mg']);
  });
});

describe('Ozempic wording', () => {
  it('help list and footer follow the medicine; Wegovy text unchanged', () => {
    expect(helpFor('wegovy')).toBe(WHEN_TO_GET_HELP);
    expect(footerFor('wegovy')).toBe(HELP_FOOTER);
    expect(helpFor('ozempic')).toBe(WHEN_TO_GET_HELP_OZEMPIC);
    expect(footerFor('ozempic')).toContain('From the Ozempic label and Medication Guide.');
    expect(WHEN_TO_GET_HELP_OZEMPIC.join(' ')).not.toMatch(/988|Wegovy/);
  });
  it('every Ozempic line is quoted from the saved label (except the app’s own 911 line)', () => {
    const quotes = [
      'call your healthcare provider right away if you have severe pain in your stomach area (abdomen) that will not go away, with or without vomiting. You may feel the pain from your abdomen to your back.',
      'Tell your healthcare provider right away if you have nausea, vomiting, or diarrhea that does not go away.',
      'get medical help right away, if you have any symptoms of a serious allergic reaction including',
      'Tell your healthcare provider right away if you get symptoms of gallbladder problems which may include',
      'Tell your healthcare provider if you get a lump or swelling in your neck, hoarseness, trouble swallowing, or shortness of breath.',
      'Tell your healthcare provider if you have changes in vision during treatment with OZEMPIC.',
      'Your risk for getting low blood sugar may be higher if you use OZEMPIC with another medicine that can cause low blood sugar, such as a sulfonylurea or insulin.',
      'It is important for you to drink fluids to help reduce your chance of dehydration.',
      'Talk to your healthcare provider about any side effect that bothers you or does not go away.',
      ...OZEMPIC_GUIDE,
    ];
    for (const q of quotes) expect(inLabel(q), q).toBe(true);
  });
  it('tips follow the medicine; the wegovy.com nausea tip is Wegovy-only', () => {
    expect(tipFor('nausea', 'ozempic').source).toBe('Ozempic Medication Guide');
    expect(tipFor('nausea', 'ozempic').text).toContain('drink fluids');
    expect(tipFor('headache', 'ozempic').text).toBe('Talk to your healthcare provider about any side effect that bothers you or does not go away.');
    expect(tipFor('stomach-pain', 'ozempic').seeHelp).toBe(true);
    expect(tipFor('nausea').text).toContain('Eat more slowly.');
  });
  it('no Ozempic text gives dose advice', () => {
    const all = [...WHEN_TO_GET_HELP_OZEMPIC, footerFor('ozempic'), ...OZEMPIC_GUIDE, ...['nausea', 'headache'].map((x) => tipFor(x, 'ozempic').text)].join(' ');
    expect(all).not.toMatch(/increase|decrease|raise|lower your|escalat|titrat|next dose|skip|missed/i);
  });
  it('the stomach-pain alert quotes the profile medicine’s first help line', () => {
    const now = new Date(2026, 10, 25, 12);
    const s = [{ datetime: new Date(2026, 10, 25, 9).toISOString(), type: 'stomach-pain', severity: 4 }];
    expect(symptomAlerts(s, now, 'ozempic').find((a) => a.extra)?.extra).toBe(WHEN_TO_GET_HELP_OZEMPIC[0]);
    expect(symptomAlerts(s, now).find((a) => a.extra)?.extra).toBe(WHEN_TO_GET_HELP[0]);
  });
});
