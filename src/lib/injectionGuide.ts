// "How to inject here" text. Approved by the owner (docs/workflows/02b). Sources: FDA Wegovy prescribing
// information, DailyMed label, Novo Nordisk Wegovy pen guide / Quick Start Guide, EMA product information.
// Do not add dose advice or pen timing in seconds (it differs by pen type).
import type { Site } from '../db/db';

export type SiteArea = 'stomach' | 'thigh' | 'arm';

export const areaOf = (site: Site): SiteArea => (site.startsWith('abdomen') ? 'stomach' : site.startsWith('thigh') ? 'thigh' : 'arm');

const SAME_AREA = 'You can use the same area each week — just not the exact spot you used last time.';

export const SITE_GUIDE: Record<SiteArea, { title: string; tips: string[] }> = {
  stomach: {
    title: 'stomach',
    tips: [
      'Use your lower stomach, at least 2 inches (5 cm) from your belly button.',
      'If it’s hard to inject here, standing up may help — or choose a firmer area like the thigh or upper arm.',
      SAME_AREA,
    ],
  },
  thigh: {
    title: 'thigh',
    tips: ['Use the front of your thigh.', SAME_AREA, 'If the stomach is hard to inject, a firmer area like the thigh can be easier.'],
  },
  arm: {
    title: 'upper arm',
    tips: [
      'Use the back of your upper arm, between shoulder and elbow.',
      'It can be hard to reach on your own — ask someone to help, or choose another area.',
      'Use a different spot from your last injection.',
    ],
  },
};

export const BEFORE_EVERY_INJECTION = [
  'Follow the Instructions for Use leaflet that came with your pen.',
  'Clean the spot with an alcohol swab or soap and water, and let it dry.',
  'Don’t inject into skin that is tender, bruised, red, hard, scarred or has stretch marks.',
  'Inject under the skin only — never into a muscle or vein.',
  'Press the pen firmly against your skin and hold it there until the yellow bar has stopped moving. Lifting it early can make the medicine leak.',
  'If anything is unclear, ask your pharmacist or prescriber.',
];

export const GUIDE_SOURCE = 'From the Wegovy label and Instructions for Use. Always follow the leaflet in your pen box.';
