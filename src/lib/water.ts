import type { UnitSystem } from './units';
import { flOzToMl, mlToFlOz } from './units';

/** Quick-add amounts in ml for the owner's units (8 / 16 fl oz, or 250 / 500 ml). */
export const waterQuickAdds = (u: UnitSystem): { ml: number; label: string }[] =>
  u === 'imperial' ? [{ ml: flOzToMl(8), label: '+ 8 fl oz' }, { ml: flOzToMl(16), label: '+ 16 fl oz' }] : [{ ml: 250, label: '+ 250 ml' }, { ml: 500, label: '+ 500 ml' }];

/** Amount for display: whole fl oz, or litres to 1 decimal. */
export const waterAmount = (ml: number, u: UnitSystem) => (u === 'imperial' ? String(Math.round(mlToFlOz(ml))) : (ml / 1000).toFixed(1));
export const waterUnit = (u: UnitSystem) => (u === 'imperial' ? 'fl oz' : 'L');
