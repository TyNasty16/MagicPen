// Side-effect tips and "When to get help". Wording approved by the owner (Wegovy: docs/workflows/04-side-effects.md;
// Ozempic: docs/workflows/07-ozempic.md, quoted from docs/sources/07-ozempic-label.md).
// Do not add tips from general knowledge, and never dose advice.
import type { DrugId } from './drugs';

export const TIP_SOURCES = {
  nausea: 'Wegovy “Common side effects” (wegovy.com)',
  fluids: 'Wegovy label and Medication Guide; MedlinePlus',
  general: 'Cleveland Clinic; Mayo Clinic',
};

const NAUSEA =
  'Eat more slowly. Get fresh air. Choose bland, low-fat foods such as crackers, toast and rice. Try foods that contain water, such as soups. Avoid greasy foods. Avoid lying down right after eating. Ask your care team whether smaller, more frequent meals and stopping as soon as you feel full would help.';
const FLUIDS =
  'Vomiting and diarrhea can cause fluid loss, which can lead to kidney problems. Drink fluids to help avoid dehydration. Tell your healthcare provider right away if nausea, vomiting or diarrhea does not go away.';
const GENERAL = 'Many side effects ease with time. Tell your care team if it continues or bothers you.';

const OZ_SOURCE = 'Ozempic Medication Guide';
const OZ_FLUIDS =
  'Diarrhea, nausea, and vomiting may cause a loss of fluids (dehydration) which may cause kidney problems. It is important for you to drink fluids to help reduce your chance of dehydration. Tell your healthcare provider right away if you have nausea, vomiting, or diarrhea that does not go away.';
const OZ_GENERAL = 'Talk to your healthcare provider about any side effect that bothers you or does not go away.';

export function tipFor(type: string, drug: DrugId = 'wegovy'): { text: string; source: string; seeHelp: boolean } {
  if (drug === 'ozempic') {
    if (type === 'nausea' || type === 'vomiting' || type === 'diarrhea') return { text: OZ_FLUIDS, source: OZ_SOURCE, seeHelp: false };
    return { text: OZ_GENERAL, source: OZ_SOURCE, seeHelp: type === 'stomach-pain' };
  }
  if (type === 'nausea') return { text: NAUSEA, source: TIP_SOURCES.nausea, seeHelp: false };
  if (type === 'vomiting' || type === 'diarrhea') return { text: FLUIDS, source: TIP_SOURCES.fluids, seeHelp: false };
  return { text: GENERAL, source: TIP_SOURCES.general, seeHelp: type === 'stomach-pain' };
}

export const WHEN_TO_GET_HELP = [
  'Stop using Wegovy and call your healthcare provider right away if you have severe pain in your stomach area that will not go away, with or without vomiting.',
  'Tell your healthcare provider right away if nausea, vomiting or diarrhea does not go away.',
  'Stop using Wegovy and get medical help right away for signs of a serious allergic reaction: swelling of the face, lips, tongue or throat; trouble breathing or swallowing; severe rash or itching; fainting or feeling dizzy; very rapid heartbeat.',
  'Gallbladder problems: pain in the upper stomach, fever, yellowing of the skin or eyes, or clay-colored stools. Call your healthcare provider.',
  'Tell your healthcare provider about a lump or swelling in your neck, hoarseness, trouble swallowing, or shortness of breath.',
  'Pay attention to changes in mood. Call your healthcare provider right away for new or worse depression or thoughts of suicide. In a crisis, call or text 988 (US).',
  'If you also take insulin or a sulfonylurea, low blood sugar is possible. Follow your diabetes plan and tell your provider.',
  'Emergency: call 911.',
];

export const HELP_FOOTER = 'From the Wegovy label and Medication Guide. This is not a complete list — read the Medication Guide that came with your medicine.';

/** Ozempic list, quoted from its Medication Guide. No mood/988 line: the Ozempic guide has none (owner default). */
export const WHEN_TO_GET_HELP_OZEMPIC = [
  'Stop using Ozempic and call your healthcare provider right away if you have severe pain in your stomach area (abdomen) that will not go away, with or without vomiting. You may feel the pain from your abdomen to your back.',
  'Tell your healthcare provider right away if you have nausea, vomiting, or diarrhea that does not go away.',
  'Stop using Ozempic and get medical help right away, if you have any symptoms of a serious allergic reaction including: swelling of your face, lips, tongue or throat; problems breathing or swallowing; severe rash or itching; fainting or feeling dizzy; very rapid heartbeat.',
  'Tell your healthcare provider right away if you get symptoms of gallbladder problems which may include: pain in your upper stomach (abdomen); yellowing of skin or eyes (jaundice); fever; clay-colored stools.',
  'Tell your healthcare provider if you get a lump or swelling in your neck, hoarseness, trouble swallowing, or shortness of breath.',
  'Tell your healthcare provider if you have changes in vision during treatment with Ozempic.',
  'Your risk for getting low blood sugar may be higher if you use Ozempic with another medicine that can cause low blood sugar, such as a sulfonylurea or insulin. Signs and symptoms of low blood sugar may include: dizziness or light-headedness; blurred vision; anxiety, irritability, or mood changes; sweating; slurred speech; hunger; confusion or drowsiness; shakiness; weakness; headache; fast heartbeat; feeling jittery.',
  'Emergency: call 911.',
];
export const HELP_FOOTER_OZEMPIC = 'From the Ozempic label and Medication Guide. This is not a complete list — read the Medication Guide that came with your medicine.';

export const helpFor = (drug: DrugId) => (drug === 'ozempic' ? WHEN_TO_GET_HELP_OZEMPIC : WHEN_TO_GET_HELP);
export const footerFor = (drug: DrugId) => (drug === 'ozempic' ? HELP_FOOTER_OZEMPIC : HELP_FOOTER);
