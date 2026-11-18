/**
 * The shared check behind the number fields (the card limit and Cards to shuffle in, CHORE10):
 * a whole number from `min` to `max`. Each field passes its own messages.
 */

export type WholeNumberResult = { ok: true; value: number } | { ok: false; error: string };

/** What each field says when its input is empty, not a whole number, too small or too big. */
export interface WholeNumberMessages {
  empty: string;
  notWhole: string;
  tooSmall: string;
  tooBig: string;
}

export interface WholeNumberRules {
  min: number;
  max: number;
  messages: WholeNumberMessages;
}

/** Trims `raw`, then checks it is digits only (no sign or decimal point) and from `min` to `max`. */
export function parseWholeNumber(raw: string, { min, max, messages }: WholeNumberRules): WholeNumberResult {
  const trimmed = raw.trim();
  if (trimmed === '') return { ok: false, error: messages.empty };
  if (!/^\d+$/.test(trimmed)) return { ok: false, error: messages.notWhole };

  const value = Number(trimmed);
  if (value < min) return { ok: false, error: messages.tooSmall };
  if (value > max) return { ok: false, error: messages.tooBig };
  return { ok: true, value };
}
