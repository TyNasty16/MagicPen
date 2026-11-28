import { describe, expect, it } from 'vitest';
import { shakerState, type ShakerMemory } from './shaker';

const D = '2026-11-28';
const mem = (lastTotal: number, goalShown = false, date = D): ShakerMemory => ({ date, lastTotal, goalShown });

describe('protein shaker', () => {
  it.each([
    ['first look today with protein logged: shake up from empty', null, 84, { from: 0, level: 84 / 114, play: 'shake', reached: false }],
    ['nothing new since last time: no animation', mem(84), 84, { from: 84 / 114, level: 84 / 114, play: 'none', reached: false }],
    ['protein added: shake from the old level', mem(64), 84, { from: 64 / 114, level: 84 / 114, play: 'shake', reached: false }],
    ['food deleted: level just drops, no shake', mem(84), 60, { from: 84 / 114, level: 60 / 114, play: 'none', reached: false }],
    ['goal reached: the goal moment plays, ends empty', mem(98), 114, { from: 98 / 114, level: 0, play: 'goal', reached: true }],
    ['over the goal counts as reached', mem(98), 130, { from: 98 / 114, level: 0, play: 'goal', reached: true }],
    ['after the goal: stays empty and reached, no replay', mem(114, true), 120, { from: 0, level: 0, play: 'none', reached: true }],
    ['food deleted after the goal: still reached today', mem(114, true), 90, { from: 0, level: 0, play: 'none', reached: true }],
    ['a new day starts empty', mem(114, true, '2026-11-27'), 0, { from: 0, level: 0, play: 'none', reached: false }],
    ['a new day with protein already logged', mem(114, true, '2026-11-27'), 30, { from: 0, level: 30 / 114, play: 'shake', reached: false }],
  ] as const)('%s', (_, memory, total, want) => {
    const s = shakerState(D, total, 114, memory);
    expect({ from: s.from, level: s.level, play: s.play, reached: s.reached }).toEqual(want);
    expect(s.next).toEqual({ date: D, lastTotal: total, goalShown: want.reached });
  });
  it('no target: nothing fills', () => expect(shakerState(D, 50, 0, null).level).toBe(0));
});
