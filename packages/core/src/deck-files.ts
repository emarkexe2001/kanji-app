/**
 * How the built dictionary is split into files (ARCH2), shared by the build
 * (`scripts/build-deck.ts`) and the web app, which downloads only the files a deck needs.
 *
 * There is one file per JLPT level (`n5.json` … `n1.json`) and one file of the common words that
 * have no JLPT level (`common-no-level.json`). A word is stored in one file only. The JLPT decks
 * each come from their own file; the Common words deck is built from the common words in every
 * file. A small manifest (`decks.json`) lists the files and the decks each one has words for, so
 * the app knows which decks exist before any word file has downloaded.
 */
import type { JlptLevel, WordEntry } from './types';

/** The decks a word can be in: its JLPT level, and Common words for a common word. */
export type DeckName = JlptLevel | 'common';

/** One word file in the manifest, and the decks it has at least one word for. */
export interface DeckFileInfo {
  file: string;
  decks: DeckName[];
}

export interface DeckManifest {
  files: DeckFileInfo[];
}

/** The manifest's file name, next to the word files. */
export const DECK_MANIFEST_FILE = 'decks.json';

/** The file of the common words that have no JLPT level. */
export const NO_LEVEL_FILE = 'common-no-level.json';

const LEVELS: JlptLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1'];

/** The file a word is stored in, or null for a word that is in no deck (not common, no JLPT level). */
export function deckFileOf(word: Pick<WordEntry, 'jlpt' | 'common'>): string | null {
  if (word.jlpt) return `${word.jlpt.toLowerCase()}.json`;
  if (word.common) return NO_LEVEL_FILE;
  return null;
}

/** The decks a word is in. */
export const decksOf = (word: Pick<WordEntry, 'jlpt' | 'common'>): DeckName[] => [
  ...(word.jlpt ? [word.jlpt] : []),
  ...(word.common ? (['common'] as const) : []),
];

export interface SplitDeck {
  manifest: DeckManifest;
  /** Each file's words, in the order they were given, by file name. Only files with words. */
  files: Map<string, WordEntry[]>;
  /** Words in no deck, which aren't written to any file. */
  left: WordEntry[];
}

/**
 * Splits the dictionary into its files. Files are listed N5 to N1, then the no-level file, and
 * only files with at least one word are listed.
 */
export function splitDeckFiles(words: WordEntry[]): SplitDeck {
  const order = [...LEVELS.map((l) => `${l.toLowerCase()}.json`), NO_LEVEL_FILE];
  const byFile = new Map<string, WordEntry[]>(order.map((f) => [f, []]));
  const left: WordEntry[] = [];
  for (const word of words) {
    const list = byFile.get(deckFileOf(word) ?? '');
    if (list) list.push(word);
    else left.push(word);
  }
  const files = new Map([...byFile].filter(([, list]) => list.length));
  const manifest: DeckManifest = {
    files: [...files].map(([file, list]) => {
      const named = new Set(list.flatMap(decksOf));
      return { file, decks: [...LEVELS, 'common' as const].filter((d) => named.has(d)) };
    }),
  };
  return { manifest, files, left };
}
