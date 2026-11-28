import { afterEach, describe, expect, it, vi } from 'vitest';
import { fillState } from './shaker';
import { goalTurn } from './useFillAnimation';

const D = '2026-11-28';

describe('water glass (same tracker as the shaker, in ml)', () => {
  it.each([
    ['first look of the day: quiet', null, 1242, 2662, 'none', false],
    ['a glass added: pour', { date: D, lastTotal: 1005, goalShown: false }, 1242, 2662, 'shake', false],
    ['the last glass reaches the target: goal', { date: D, lastTotal: 2500, goalShown: false }, 2737, 2662, 'goal', true],
    ['after the goal: no replay, still reached', { date: D, lastTotal: 2737, goalShown: true }, 2974, 2662, 'none', true],
  ] as const)('%s', (_, memory, total, target, play, reached) => {
    const s = fillState(D, total, target, memory);
    expect(s.play).toBe(play);
    expect(s.reached).toBe(reached);
  });
});

describe('goal moments take turns', () => {
  afterEach(() => vi.useRealTimers());
  it('the second waits for the first, then about a second more', async () => {
    vi.useFakeTimers();
    const order: string[] = [];
    const p1 = goalTurn().then((release) => { order.push('protein'); return release; });
    const p2 = goalTurn().then(() => order.push('water'));
    const release = await p1;
    await Promise.resolve();
    expect(order).toEqual(['protein']);
    release();
    await vi.advanceTimersByTimeAsync(900);
    expect(order).toEqual(['protein']);
    await vi.advanceTimersByTimeAsync(200);
    await p2;
    expect(order).toEqual(['protein', 'water']);
  });
});
