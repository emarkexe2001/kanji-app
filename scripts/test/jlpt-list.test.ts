import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { cleanForms, matchKey, parseCsv, parseJlptCsv } from '../jlpt-list.ts';

describe('parseCsv', () => {
  it('splits rows and fields, keeping commas and "" escapes inside quotes', () => {
    assert.deepEqual(parseCsv('a,b\n"x, y","say ""hi"""\r\n'), [
      ['a', 'b'],
      ['x, y', 'say "hi"'],
    ]);
  });

  it('skips blank lines', () => {
    assert.deepEqual(parseCsv('a\n\nb\n'), [['a'], ['b']]);
  });
});

describe('cleanForms', () => {
  it('drops notes in brackets, ～ placeholders and spaces', () => {
    assert.deepEqual(cleanForms('故～'), ['故']);
    assert.deepEqual(cleanForms('くじ (～をひく)'), ['くじ']);
    assert.deepEqual(cleanForms('～ 宛'), ['宛']);
  });

  it('splits alternatives', () => {
    assert.deepEqual(cleanForms('一昨日;おととい'), ['一昨日', 'おととい']);
  });
});

describe('parseJlptCsv', () => {
  const csv = [
    'expression,reading,meaning,tags,guid',
    '会う,あう,"to meet, to see",JLPT_N5,x',
    'ああ,ああ,Ah!,JLPT_N5,y',
    '運動,うんどうする,exercise,JLPT_N4,z',
    '刷る,する,to print,JLPT_N3,w',
  ].join('\n');

  it('reads the kanji writings and hiragana reading of each entry', () => {
    assert.deepEqual(parseJlptCsv(csv)[0], { writings: ['会う'], reading: 'あう' });
  });

  it('leaves kana-only entries with no writings to match', () => {
    assert.deepEqual(parseJlptCsv(csv)[1].writings, []);
  });

  it('matches "noun + する" readings on the noun, but keeps verbs whose reading is する', () => {
    assert.equal(parseJlptCsv(csv)[2].reading, 'うんどう');
    assert.equal(parseJlptCsv(csv)[3].reading, 'する');
  });

  it('fails clearly when a column is missing', () => {
    assert.throws(() => parseJlptCsv('word,reading\n会う,あう'), /expression/);
  });
});

describe('matchKey', () => {
  it('matches katakana and hiragana readings the same way', () => {
    assert.equal(matchKey('会う', 'アウ'), matchKey('会う', 'あう'));
  });
});
