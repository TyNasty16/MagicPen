// Side-effect tips and "When to get help". Wording approved by the owner (docs/workflows/04-side-effects.md).
// Do not add tips from general knowledge, and never dose advice.

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

export function tipFor(type: string): { text: string; source: string; seeHelp: boolean } {
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
