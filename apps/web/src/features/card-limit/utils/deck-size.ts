import { readStorage, writeStorage } from '../../../lib/storage';
import { parseWholeNumber, type WholeNumberMessages, type WholeNumberResult } from '../../../lib/whole-number';

/**
 * Card-limit rules from docs/tickets/completed_tickets/feat/selectable-card_limit_ticket.md:
 * 1–150, no 0, nothing non-numeric.
 */
export const MIN_DECK_SIZE = 1;
export const MAX_DECK_SIZE = 150;
export const DEFAULT_DECK_SIZE = 10;

const SIZE_KEY = 'kanji.deckSize';

export type DeckSizeResult = WholeNumberResult;

const DECK_SIZE_MESSAGES: WholeNumberMessages = {
  empty: 'Enter a card limit.',
  notWhole: 'Card limit must be a whole number.',
  tooSmall: `Card limit can't be 0 — enter at least ${MIN_DECK_SIZE}.`,
  tooBig: `Card limit can't be more than ${MAX_DECK_SIZE}.`,
};

/** Validates a raw card-limit input (from the number field) against the 1–150 rule. */
export function parseDeckSizeInput(raw: string): DeckSizeResult {
  return parseWholeNumber(raw, { min: MIN_DECK_SIZE, max: MAX_DECK_SIZE, messages: DECK_SIZE_MESSAGES });
}

/** Clamps a size (e.g. from the +/- stepper buttons) into the valid 1–150 range. */
export function clampDeckSize(n: number): number {
  return Math.min(MAX_DECK_SIZE, Math.max(MIN_DECK_SIZE, n));
}

/** Reads the persisted card limit, falling back to the default when absent, invalid or out of range. */
export function loadDeckSize(): number {
  const n = Number(readStorage(SIZE_KEY));
  if (Number.isInteger(n) && n >= MIN_DECK_SIZE && n <= MAX_DECK_SIZE) return n;
  return DEFAULT_DECK_SIZE;
}

export function saveDeckSize(size: number): void {
  writeStorage(SIZE_KEY, String(size));
}
