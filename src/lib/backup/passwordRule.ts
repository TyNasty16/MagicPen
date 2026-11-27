// Rule for NEW and CHANGED backup passwords (workflow 11). Pure. Never applied when opening or restoring a backup,
// so passwords set under the old 12-character rule keep working.

export const MIN_PASSWORD = 16;
const MIN_DISTINCT = 6;
const RUN = 6; // this many characters in a row going up or down counts as a run (123456, abcdef, qwerty)

export type PasswordProblem = 'short' | 'variety' | 'repeat' | 'run';

/** Characters as people count them (an emoji is one), after NFC so the same letters always match. */
export const passwordChars = (pw: string) => Array.from(pw.normalize('NFC'));

const KEYBOARD_ROWS = ['1234567890', 'qwertyuiop', 'asdfghjkl', 'zxcvbnm'];

function hasRun(chars: string[]): boolean {
  const low = chars.map((c) => c.toLowerCase());
  // Steps of +1 or -1 in character code (abcdef, 654321).
  for (const step of [1, -1]) {
    let len = 1;
    for (let i = 1; i < low.length; i++) {
      len = low[i].codePointAt(0)! - low[i - 1].codePointAt(0)! === step ? len + 1 : 1;
      if (len >= RUN) return true;
    }
  }
  // Keyboard rows, either direction (qwerty, poiuyt).
  const text = low.join('');
  for (const row of KEYBOARD_ROWS) {
    for (const r of [row, [...row].reverse().join('')]) {
      for (let i = 0; i + RUN <= r.length; i++) if (text.includes(r.slice(i, i + RUN))) return true;
    }
  }
  return false;
}

/** One piece repeated to fill the whole password: "passwordpassword", or a short piece (4 or fewer) that may end part-way, "abcabcabcabcabca". */
function isRepeatedPiece(chars: string[]): boolean {
  for (let len = 1; len <= Math.max(4, Math.floor(chars.length / 2)); len++) {
    if (len > 4 && chars.length % len !== 0) continue;
    if (len > 4 && chars.length / len < 2) continue;
    if (chars.every((c, i) => c === chars[i % len])) return true;
  }
  return false;
}

/** The first rule a new password breaks, or undefined when it is fine. */
export function checkNewPassword(pw: string): PasswordProblem | undefined {
  const chars = passwordChars(pw);
  if (chars.length < MIN_PASSWORD) return 'short';
  if (new Set(chars.map((c) => c.toLowerCase())).size < MIN_DISTINCT) return 'variety';
  if (isRepeatedPiece(chars)) return 'repeat';
  if (hasRun(chars)) return 'run';
  return undefined;
}

export const PASSWORD_TEXT: Record<PasswordProblem, string> = {
  short: 'Use at least 16 characters. For example: river lamp tiger chair.',
  variety: 'Too few different characters. Mix in more, for example four unrelated words.',
  repeat: 'This repeats a short piece, like passwordpassword. Use four unrelated words instead.',
  run: 'This has a run like 123456 or qwerty. Use four unrelated words instead.',
};

export const counterText = (pw: string) => `${Math.min(passwordChars(pw).length, MIN_PASSWORD)} of ${MIN_PASSWORD} characters`;
