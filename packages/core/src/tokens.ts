import type { JlptLevel, ReadingKind } from './types';

/** Reading-type colors from spec section 1. */
export const READING_COLORS: Record<ReadingKind, string> = {
  onyomi: '#1e88e5',
  kunyomi: '#e53935',
  okurigana: '#43a047',
};

/** ★ Common Word badge color. */
export const COMMON_COLOR = '#eba834';

/** Word-card header colors per JLPT level, from spec section 1. */
export const JLPT_COLORS: Record<JlptLevel, string> = {
  N5: '#10b981',
  N4: '#06b6d4',
  N3: '#6366f1',
  N2: '#8b5cf6',
  N1: '#f43f5e',
};

/**
 * Outline and tick colors of a picked card in the lists of cards to pick (FEAT2_5): green for a
 * card being added back to the deck, red for a card being taken out of it.
 */
export const PICK_COLORS = {
  addBack: '#059669',
  takeOut: '#e11d48',
} as const;
export type PickKind = keyof typeof PICK_COLORS;

/** The amber "NEW" ribbon on a shuffled-in card (FEAT2_5, FEAT2_6): the same colour as Tailwind's amber-400. */
export const NEW_COLOR = '#fbbf24';

export const JLPT_LABELS: Record<JlptLevel, string> = {
  N5: 'Beginner',
  N4: 'Elementary',
  N3: 'Intermediate',
  N2: 'Upper-Intermediate',
  N1: 'Advanced',
};

export const READING_LABELS: Record<ReadingKind, string> = {
  onyomi: 'Onyomi',
  kunyomi: 'Kunyomi',
  okurigana: 'Okurigana',
};
