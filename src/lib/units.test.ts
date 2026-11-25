import { describe, expect, it } from 'vitest';
import { cmToFeetInches, cmToIn, flOzToMl, inToCm, kgToLb, lbToKg, mlToFlOz, parseNum } from './units';

describe('units', () => {
  it('converts weight both ways', () => {
    expect(kgToLb(100)).toBeCloseTo(220.462, 3);
    expect(lbToKg(kgToLb(83.4))).toBeCloseTo(83.4, 10);
  });
  it('converts length both ways', () => {
    expect(inToCm(69)).toBeCloseTo(175.26, 2);
    expect(cmToIn(inToCm(70.5))).toBeCloseTo(70.5, 10);
  });
  it('splits cm into feet and inches', () => {
    expect(cmToFeetInches(inToCm(69))).toEqual({ feet: 5, inches: 9 });
    expect(cmToFeetInches(inToCm(71.95))).toEqual({ feet: 6, inches: 0 });
  });
  it('converts ml to fl oz', () => {
    expect(mlToFlOz(1000)).toBeCloseTo(33.814, 3);
    expect(flOzToMl(mlToFlOz(2500))).toBeCloseTo(2500, 10);
  });
  it('parses user input', () => {
    expect(parseNum('')).toBeUndefined();
    expect(parseNum('abc')).toBeUndefined();
    expect(parseNum('72,5')).toBe(72.5);
    expect(parseNum(' 180 ')).toBe(180);
    expect(parseNum('.5')).toBe(0.5);
    expect(parseNum('1e3')).toBeUndefined();
    expect(parseNum('0x10')).toBeUndefined();
    expect(parseNum('-5')).toBeUndefined();
  });
});
