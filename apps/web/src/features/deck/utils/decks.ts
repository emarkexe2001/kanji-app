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

/**
 * The words downloaded so far, plus the decks built from them. The dictionary is split into files
 * (ARCH2) that download as they are needed, so a deck can exist (be in `available`) before its
 * words have arrived (be in `decks`).
 */
export interface Library {
  /** Every deck that has words, loaded or not, in DECK_IDS order. */
  available: DeckId[];
  /**
   * The decks whose words have all downloaded, in DECK_IDS order. Each keeps the order of the
   * words given to buildLibrary.
   */
  decks: Map<DeckId, WordEntry[]>;
  /** Every word downloaded so far, by card id. */
  byId: Map<string, WordEntry>;
}

/**
 * Builds the decks from `words`. Without `loaded`, `words` is the whole dictionary: every deck
 * with words is available and loaded. With it, only the `ready` decks (those whose files have all
 * downloaded) are built, and `available` lists every deck that exists.
 */
export function buildLibrary(words: WordEntry[], loaded?: { available: DeckId[]; ready: DeckId[] }): Library {
  const decks = new Map<DeckId, WordEntry[]>();
  for (const deck of DECK_IDS) {
    if (loaded && !loaded.ready.includes(deck)) continue;
    const deckWords = words.filter((w) => belongsTo(w, deck));
    if (deckWords.length) decks.set(deck, deckWords);
  }
  const available = loaded ? DECK_IDS.filter((d) => loaded.available.includes(d)) : [...decks.keys()];
  return { available, decks, byId: new Map(words.map((w) => [cardId(w), w])) };
}

/** The decks that can be shuffled in from while studying `current`: every deck except the current one. */
export function otherDecks(library: Library, current: DeckId): DeckId[] {
  return library.available.filter((d) => d !== current);
}
