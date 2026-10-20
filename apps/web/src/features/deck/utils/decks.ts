import type { WordEntry } from '@kanji/core';

/** Every deck the app can build from the dictionary, in the order they are offered. */
export const DECK_IDS = ['N5', 'N4', 'N3', 'N2', 'N1', 'common'] as const;
export type DeckId = (typeof DECK_IDS)[number];

export const DECK_LABELS: Record<DeckId, string> = {
  N5: 'JLPT N5',
  N4: 'JLPT N4',
  N3: 'JLPT N3',
  N2: 'JLPT N2',
  N1: 'JLPT N1',
  common: 'Common words',
};

export function isDeckId(value: unknown): value is DeckId {
  return typeof value === 'string' && (DECK_IDS as readonly string[]).includes(value);
}

/** The id a card is known by in the saved deck. */
export const cardId = (word: WordEntry) => word.id ?? word.word;

/** JLPT decks hold the words of that level; Common words holds every word marked common in JMdict. */
const belongsTo = (word: WordEntry, deck: DeckId) => (deck === 'common' ? word.common : word.jlpt === deck);

/** All the words, plus the decks built from them. */
export interface Library {
  /** Only decks that have at least one word, in DECK_IDS order. Each keeps the order of `words`. */
  decks: Map<DeckId, WordEntry[]>;
  byId: Map<string, WordEntry>;
}

export function buildLibrary(words: WordEntry[]): Library {
  const decks = new Map<DeckId, WordEntry[]>();
  for (const deck of DECK_IDS) {
    const deckWords = words.filter((w) => belongsTo(w, deck));
    if (deckWords.length) decks.set(deck, deckWords);
  }
  return { decks, byId: new Map(words.map((w) => [cardId(w), w])) };
}

/** The decks that can be shuffled in from while studying `current`: every deck except the current one. */
export function otherDecks(library: Library, current: DeckId): DeckId[] {
  return [...library.decks.keys()].filter((d) => d !== current);
}
