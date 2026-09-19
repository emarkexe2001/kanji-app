import { test } from 'node:test';
import assert from 'node:assert/strict';
import { segmentWord, type KanjiIndex, type KanjiInfo } from './segment';

const k = (on: string[], kun: string[], meaning = ''): KanjiInfo => ({
  on,
  kun: kun.map((r) => {
    const [stem, ok = ''] = r.split('.');
    return { stem, full: stem + ok };
  }),
  meaning,
});

// A tiny hand-made index so the tests don't depend on the downloaded dictionary.
const IDX: KanjiIndex = new Map<string, KanjiInfo>([
  ['食', k(['しょく', 'じき'], ['く.う', 'た.べる', 'は.む'])],
  ['学', k(['がく'], ['まな.ぶ'])],
  ['生', k(['せい', 'しょう'], ['い.きる', 'う.まれる', 'なま'])],
  ['大', k(['だい', 'たい'], ['おお.きい', 'おお-'])],
  ['飲', k(['いん'], ['の.む'])],
  ['物', k(['ぶつ', 'もつ'], ['もの'])],
  ['校', k(['こう'], [])],
  ['日', k(['にち', 'じつ'], ['ひ', 'か'])],
  ['本', k(['ほん'], ['もと'])],
  ['人', k(['じん', 'にん'], ['ひと'])],
  ['今', k(['こん', 'きん'], ['いま'])],
  ['私', k(['し'], ['わたくし', 'わたし'])],
]);

const summary = (w: string, r: string) =>
  segmentWord(w, r, IDX)?.map((s) => `${s.text}:${s.reading ?? '-'}:${s.kind}`);

test('kunyomi stem + okurigana', () => {
  assert.deepEqual(summary('食べる', 'たべる'), ['食:た:kunyomi', 'べる:-:okurigana']);
});

test('all-onyomi compound', () => {
  assert.deepEqual(summary('学生', 'がくせい'), ['学:がく:onyomi', '生:せい:onyomi']);
});

test('longest reading wins, then okurigana', () => {
  assert.deepEqual(summary('大きい', 'おおきい'), ['大:おお:kunyomi', 'きい:-:okurigana']);
});

test('okurigana in the middle of a word', () => {
  assert.deepEqual(summary('飲み物', 'のみもの'), [
    '飲:の:kunyomi',
    'み:-:okurigana',
    '物:もの:kunyomi',
  ]);
});

test('sokuon: 学校 → がっこう', () => {
  assert.deepEqual(summary('学校', 'がっこう'), ['学:がっ:onyomi', '校:こう:onyomi']);
});

test('sokuon + handakuten: 日本 → にっぽん', () => {
  assert.deepEqual(summary('日本', 'にっぽん'), ['日:にっ:onyomi', '本:ぽん:onyomi']);
});

test('iteration mark 々 with rendaku: 日々 → ひび', () => {
  assert.deepEqual(summary('日々', 'ひび'), ['日:ひ:kunyomi', '々:び:kunyomi']);
});

test('full kun reading with no written okurigana: 私 → わたし', () => {
  assert.deepEqual(summary('私', 'わたし'), ['私:わたし:kunyomi']);
});

test('irregular reading (jukujikun) returns null: 今日 → きょう', () => {
  assert.equal(segmentWord('今日', 'きょう', IDX), null);
});

test('katakana reading input is normalised', () => {
  assert.deepEqual(summary('食べる', 'タベル'), ['食:た:kunyomi', 'べる:-:okurigana']);
});
