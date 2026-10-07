/** Card-limit rules from docs/tickets/selectable-card_limit_ticket.md: 1–150, no 0, nothing non-numeric. */
export const MIN_DECK_SIZE = 1;
export const MAX_DECK_SIZE = 150;
export const DEFAULT_DECK_SIZE = 10;

const SIZE_KEY = 'kanji.deckSize';

export type DeckSizeResult = { ok: true; value: number } | { ok: false; error: string };

/** Validates a raw card-limit input (from the number field) against the 1–150 rule. */
export function parseDeckSizeInput(raw: string): DeckSizeResult {
  const trimmed = raw.trim();
  if (trimmed === '') return { ok: false, error: 'Enter a card limit.' };
  if (!/^\d+$/.test(trimmed)) return { ok: false, error: 'Card limit must be a whole number.' };

  const value = Number(trimmed);
  if (value < MIN_DECK_SIZE) {
    return { ok: false, error: `Card limit can't be 0 — enter at least ${MIN_DECK_SIZE}.` };
  }
  if (value > MAX_DECK_SIZE) {
    return { ok: false, error: `Card limit can't be more than ${MAX_DECK_SIZE}.` };
  }
  return { ok: true, value };
}

/** Clamps a size (e.g. from the +/- stepper buttons) into the valid 1–150 range. */
export function clampDeckSize(n: number): number {
  return Math.min(MAX_DECK_SIZE, Math.max(MIN_DECK_SIZE, n));
}

/** Reads the persisted card limit, falling back to the default when absent, invalid or out of range. */
export function loadDeckSize(): number {
  try {
    const n = Number(localStorage.getItem(SIZE_KEY));
    if (Number.isInteger(n) && n >= MIN_DECK_SIZE && n <= MAX_DECK_SIZE) return n;
  } catch {
    /* storage unavailable (private mode etc.) — fall back to the default */
  }
  return DEFAULT_DECK_SIZE;
}

export function saveDeckSize(size: number): void {
  try {
    localStorage.setItem(SIZE_KEY, String(size));
  } catch {
    /* not persisted — the size still applies for this session */
  }
}
