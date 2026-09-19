import type { WordEntry } from './types';

/** The two example cards from the spec, used until real dictionary data is wired up. */
export const SAMPLE_WORDS: WordEntry[] = [
  {
    word: '食べる',
    reading: 'たべる',
    jlpt: 'N5',
    common: true,
    segments: [
      { text: '食', reading: 'た', kind: 'kunyomi', rootMeaning: 'eat / food' },
      { text: 'べる', kind: 'okurigana', grammar: 'Verb Inflection Suffix' },
    ],
    meaning: 'To eat; to consume',
  },
  {
    word: '学生',
    reading: 'がくせい',
    jlpt: 'N5',
    common: true,
    segments: [
      { text: '学', reading: 'がく', kind: 'onyomi', rootMeaning: 'study / learning' },
      { text: '生', reading: 'せい', kind: 'onyomi', rootMeaning: 'life / person' },
    ],
    meaning: 'Student; pupil',
  },
  {
    word: '先生',
    reading: 'せんせい',
    jlpt: 'N5',
    common: true,
    segments: [
      { text: '先', reading: 'せん', kind: 'onyomi', rootMeaning: 'previous / ahead' },
      { text: '生', reading: 'せい', kind: 'onyomi', rootMeaning: 'life / person' },
    ],
    meaning: 'Teacher; master; doctor',
  },
  {
    word: '大きい',
    reading: 'おおきい',
    jlpt: 'N5',
    common: true,
    segments: [
      { text: '大', reading: 'おお', kind: 'kunyomi', rootMeaning: 'big / large' },
      { text: 'きい', kind: 'okurigana', grammar: 'Adjective Inflection Suffix' },
    ],
    meaning: 'Big; large; great',
  },
  {
    word: '飲み物',
    reading: 'のみもの',
    jlpt: 'N5',
    common: true,
    segments: [
      { text: '飲', reading: 'の', kind: 'kunyomi', rootMeaning: 'drink' },
      { text: 'み', kind: 'okurigana', grammar: 'Verb Stem Suffix' },
      { text: '物', reading: 'もの', kind: 'kunyomi', rootMeaning: 'thing / object' },
    ],
    meaning: 'Drink; beverage',
  },
  {
    word: '図書館',
    reading: 'としょかん',
    jlpt: 'N4',
    common: true,
    segments: [
      { text: '図', reading: 'と', kind: 'onyomi', rootMeaning: 'diagram / plan' },
      { text: '書', reading: 'しょ', kind: 'onyomi', rootMeaning: 'write / book' },
      { text: '館', reading: 'かん', kind: 'onyomi', rootMeaning: 'building / mansion' },
    ],
    meaning: 'Library',
  },
  {
    word: '経験',
    reading: 'けいけん',
    jlpt: 'N3',
    common: true,
    segments: [
      { text: '経', reading: 'けい', kind: 'onyomi', rootMeaning: 'pass through / sutra' },
      { text: '験', reading: 'けん', kind: 'onyomi', rootMeaning: 'verification / effect' },
    ],
    meaning: 'Experience; to experience',
  },
  {
    word: '影響',
    reading: 'えいきょう',
    jlpt: 'N3',
    common: true,
    segments: [
      { text: '影', reading: 'えい', kind: 'onyomi', rootMeaning: 'shadow / silhouette' },
      { text: '響', reading: 'きょう', kind: 'onyomi', rootMeaning: 'echo / resound' },
    ],
    meaning: 'Influence; effect',
  },
  {
    word: '複雑',
    reading: 'ふくざつ',
    jlpt: 'N2',
    common: true,
    segments: [
      { text: '複', reading: 'ふく', kind: 'onyomi', rootMeaning: 'duplicate / compound' },
      { text: '雑', reading: 'ざつ', kind: 'onyomi', rootMeaning: 'miscellaneous / mixed' },
    ],
    meaning: 'Complicated; complex',
  },
  {
    word: '憂鬱',
    reading: 'ゆううつ',
    jlpt: 'N1',
    common: false,
    segments: [
      { text: '憂', reading: 'ゆう', kind: 'onyomi', rootMeaning: 'melancholy / grief' },
      { text: '鬱', reading: 'うつ', kind: 'onyomi', rootMeaning: 'depression / gloom' },
    ],
    meaning: 'Depression; melancholy; gloom',
  },
];
