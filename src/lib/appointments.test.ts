import { describe, expect, it } from 'vitest';
import { cleanText, lastAppointmentOnOrBefore, sortAppointments, TEXT_MAX } from './appointments';

const a = (id: number, date: string) => ({ id, date });

describe('appointments', () => {
  it('sorts newest first; same day keeps the later entry first', () => {
    expect(sortAppointments([a(1, '2026-10-01'), a(3, '2026-11-20'), a(2, '2026-11-20')]).map((x) => x.id)).toEqual([3, 2, 1]);
  });
  it('last appointment on or before a day: none, one, same day, future ignored', () => {
    expect(lastAppointmentOnOrBefore('2026-11-26', [])).toBeUndefined();
    expect(lastAppointmentOnOrBefore('2026-11-26', [a(1, '2026-10-01')])?.id).toBe(1);
    expect(lastAppointmentOnOrBefore('2026-11-26', [a(1, '2026-10-01'), a(2, '2026-11-26')])?.id).toBe(2);
    expect(lastAppointmentOnOrBefore('2026-11-26', [a(1, '2026-10-01'), a(2, '2026-12-10')])?.id).toBe(1);
  });
  it('cleans the owner’s text: control and direction characters removed, line breaks kept, capped, empty → undefined', () => {
    expect(cleanText('  Ask about‮ constipation\u0007  \n\n\n\nRecheck labs ')).toBe('Ask about constipation\n\nRecheck labs');
    expect(cleanText('Dr.\nLee', 120, false)).toBe('Dr. Lee');
    expect(cleanText('x'.repeat(TEXT_MAX + 50))).toHaveLength(TEXT_MAX);
    expect(cleanText('   ')).toBeUndefined();
    expect(cleanText('<script>alert(1)</script>')).toBe('<script>alert(1)</script>'); // kept as text; shown as plain React text
  });
});
