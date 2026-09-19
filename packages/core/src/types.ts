export type JlptLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1';

/** How a segment of a word is read, per the spec's color-coding. */
export type ReadingKind = 'onyomi' | 'kunyomi' | 'okurigana';

/** One piece of the "READING BREAKDOWN" section of a word card. */
export interface ReadingSegment {
  /** The characters as written, e.g. "食" or "べる". */
  text: string;
  /** The kana reading of this segment, e.g. "た". Absent for okurigana (its text is its reading). */
  reading?: string;
  kind: ReadingKind;
  /** Kanji only: e.g. "eat / food". */
  rootMeaning?: string;
  /** Okurigana only: e.g. "Verb Inflection Suffix". */
  grammar?: string;
}

/** Everything a popover card needs to render one word. */
export interface WordEntry {
  /** JMdict entry id (absent for hand-written samples). */
  id?: string;
  /** Surface form, e.g. "食べる". */
  word: string;
  /** Full kana reading, e.g. "たべる". */
  reading: string;
  jlpt?: JlptLevel;
  /** JMdict high-frequency vocabulary flag → ★ Common Word badge. */
  common: boolean;
  segments: ReadingSegment[];
  /** Full word meaning, e.g. "To eat; to consume". */
  meaning: string;
}
