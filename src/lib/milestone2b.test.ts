import { describe, expect, it } from 'vitest';
import { fitWithin } from './image';
import { weighInStatus } from './weighIn';
import { areaOf, SITE_GUIDE } from './injectionGuide';

describe('fitWithin', () => {
  it('scales a landscape photo to 1080 wide', () => expect(fitWithin(4032, 3024)).toEqual({ width: 1080, height: 810 }));
  it('scales a portrait photo to 1080 tall', () => expect(fitWithin(3024, 4032)).toEqual({ width: 810, height: 1080 }));
  it('never enlarges a small photo', () => expect(fitWithin(800, 600)).toEqual({ width: 800, height: 600 }));
  it('keeps an exact-limit photo', () => expect(fitWithin(1080, 1080)).toEqual({ width: 1080, height: 1080 }));
});

describe('weighInStatus', () => {
  // First weigh-in Sunday Nov 1 2026 → windows start every Sunday.
  const sun = (d: number) => new Date(2026, 10, d, 9);
  it('invites the first weigh-in', () => expect(weighInStatus([], sun(1)).state).toBe('first'));
  it('is done in the week of the first weigh-in', () => expect(weighInStatus(['2026-11-01'], sun(4)).state).toBe('done'));
  it('is due on the next Sunday', () => {
    const s = weighInStatus(['2026-11-01'], sun(8));
    expect(s.state).toBe('due');
    expect(s.daysLeft).toBe(6);
    expect(s.streak).toBe(1);
  });
  it('shows "still time" after a missed weigh-in day', () => {
    const s = weighInStatus(['2026-11-01'], new Date(2026, 10, 11, 20));
    expect(s.state).toBe('still');
    expect(s.daysLeft).toBe(3);
  });
  it('a mid-week weigh-in completes the week', () => expect(weighInStatus(['2026-11-01', '2026-11-12'], new Date(2026, 10, 13)).state).toBe('done'));
  it('counts a streak of consecutive weeks and breaks on a gap', () => {
    expect(weighInStatus(['2026-11-01', '2026-11-08', '2026-11-16', '2026-11-22'], sun(22)).streak).toBe(4);
    expect(weighInStatus(['2026-11-01', '2026-11-15', '2026-11-22'], sun(22)).streak).toBe(2);
  });
  it('two weigh-ins in one week count once', () => expect(weighInStatus(['2026-11-01', '2026-11-02', '2026-11-08'], sun(8)).streak).toBe(2));
  it('reports the last five weeks, current last', () => {
    expect(weighInStatus(['2026-11-01', '2026-11-15'], sun(22)).weeks).toEqual([true, false, true, false]);
  });
});

describe('injection guide', () => {
  it('maps every site to an area with tips', () => {
    expect(areaOf('abdomen-left')).toBe('stomach');
    expect(areaOf('thigh-right')).toBe('thigh');
    expect(areaOf('arm-left')).toBe('arm');
    expect(SITE_GUIDE.stomach.tips[0]).toContain('2 inches (5 cm)');
  });
});

describe('weighInStatus edge cases', () => {
  it('treats a clock set before the first weigh-in as day 0', () => {
    const s = weighInStatus(['2026-11-10'], new Date(2026, 10, 5));
    expect(s.daysLeft).toBeLessThanOrEqual(6);
  });
  it('re-anchors to an earlier backdated weigh-in', () => {
    // Anchor moves from Nov 8 (Sun) to Nov 4 (Wed): Nov 11 becomes weigh-in day.
    expect(weighInStatus(['2026-11-04', '2026-11-08'], new Date(2026, 10, 11, 9)).state).toBe('due');
  });
});
