// CHORE10: the JLPT list reader uses core's toHiragana instead of its own copy.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { toHiragana } from '../../packages/core/src/segment.ts';
import { matchKey, parseJlptCsv } from '../jlpt-list.ts';

const source = readFileSync(new URL('../jlpt-list.ts', import.meta.url), 'utf8');

describe("jlpt-list uses core's toHiragana", () => {
  it('imports toHiragana from core and has no copy of its own', () => {
    assert.match(source, /import \{ toHiragana \} from '\.\.\/packages\/core\/src\/segment';/);
    assert.doesNotMatch(source, /(const|function)\s+toHiragana\b/);
  });

  it('reads katakana readings in the CSV as hiragana', () => {
    const csv = [
      'expression,reading,meaning,tags,guid',
      '会う,アウ,to meet,JLPT_N5,a',
      '珈琲,コーヒー,coffee,JLPT_N5,b',
      '運動,ウンドウする,exercise,JLPT_N4,c',
    ].join('\n');
    assert.deepEqual(
      parseJlptCsv(csv).map((e) => e.reading),
      ['あう', 'こーひー', 'うんどう'],
    );
  });

  it('matches a katakana reading on the same key as its hiragana', () => {
    assert.equal(matchKey('会う', 'アウ'), '会う|あう');
    assert.equal(matchKey('ヴ', 'ヴヵヶ'), 'ヴ|ゔゕゖ');
  });

  it("gives the same key as core's toHiragana for every katakana letter", () => {
    for (let code = 'ァ'.charCodeAt(0); code <= 'ヶ'.charCodeAt(0); code++) {
      const c = String.fromCharCode(code);
      assert.equal(matchKey('x', c), `x|${toHiragana(c)}`, `katakana ${c}`);
    }
  });
});
