// ARCH2: how the dictionary is split into files.
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { NO_LEVEL_FILE, deckFileOf, splitDeckFiles } from '../../src/deck-files';
import type { JlptLevel, WordEntry } from '../../src/types';

const word = (id: string, jlpt: JlptLevel | undefined, common: boolean): WordEntry => ({
  id,
  word: id,
  reading: id,
  common,
  ...(jlpt && { jlpt }),
  segments: [],
  meaning: id,
});

describe('deckFileOf', () => {
  test('a word with a JLPT level goes in its level file, whether or not it is common', () => {
    assert.equal(deckFileOf(word('a', 'N5', true)), 'n5.json');
    assert.equal(deckFileOf(word('b', 'N1', false)), 'n1.json');
  });

  test('a common word with no level goes in the no-level file', () => {
    assert.equal(deckFileOf(word('c', undefined, true)), NO_LEVEL_FILE);
  });

  test('a word in no deck (not common, no level) goes in no file', () => {
    assert.equal(deckFileOf(word('d', undefined, false)), null);
  });
});

describe('splitDeckFiles', () => {
  const words = [
    word('n5-common', 'N5', true),
    word('n3-rare', 'N3', false),
    word('plain-common', undefined, true),
    word('n5-rare', 'N5', false),
    word('nowhere', undefined, false),
  ];
  const split = splitDeckFiles(words);

  test('each word is in exactly one file, in the order given, and words in no deck are left out', () => {
    assert.deepEqual(
      [...split.files].map(([file, list]) => [file, list.map((w) => w.id)]),
      [
        ['n5.json', ['n5-common', 'n5-rare']],
        ['n3.json', ['n3-rare']],
        [NO_LEVEL_FILE, ['plain-common']],
      ],
    );
    assert.deepEqual(
      split.left.map((w) => w.id),
      ['nowhere'],
    );
  });

  test('the manifest lists only files with words, N5 to N1 then the no-level file, with the decks each has words for', () => {
    assert.deepEqual(split.manifest, {
      files: [
        { file: 'n5.json', decks: ['N5', 'common'] },
        { file: 'n3.json', decks: ['N3'] },
        { file: NO_LEVEL_FILE, decks: ['common'] },
      ],
    });
  });

  test('no words gives no files', () => {
    assert.deepEqual(splitDeckFiles([]).manifest, { files: [] });
  });
});
