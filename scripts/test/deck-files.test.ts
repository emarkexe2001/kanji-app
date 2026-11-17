// ARCH2: the deck files `npm run data:build` writes to apps/web/public/data/, as committed. They
// replace deck.json: one file per JLPT level, one of the common words with no level, and the
// manifest (decks.json). Rebuilding needs the unzipped raw dictionaries, so these tests check the
// committed output instead of running the build.
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { gzipSync } from 'node:zlib';
import {
  DECK_MANIFEST_FILE,
  NO_LEVEL_FILE,
  deckFileOf,
  splitDeckFiles,
  type DeckManifest,
  type WordEntry,
} from '../../packages/core/src/index.ts';

const DATA = new URL('../../apps/web/public/data/', import.meta.url);
const read = (file: string) => readFileSync(new URL(file, DATA), 'utf8');
const manifest: DeckManifest = JSON.parse(read(DECK_MANIFEST_FILE));
const files = new Map<string, WordEntry[]>(manifest.files.map(({ file }) => [file, JSON.parse(read(file))]));
const allWords = [...files.values()].flat();

/** The most a JLPT deck may download before the first card (answer 2), gzipped. */
const TARGET_BYTES = 150 * 1024;

describe('the committed deck files', () => {
  it('replace deck.json, which is gone', () => {
    assert.equal(existsSync(new URL('deck.json', DATA)), false);
  });

  it('are one file per JLPT level and one of the common words with no level, as the manifest lists', () => {
    assert.deepEqual(
      manifest.files.map((f) => f.file),
      ['n5.json', 'n4.json', 'n3.json', 'n2.json', 'n1.json', NO_LEVEL_FILE],
    );
  });

  it('hold each word in the file for its level, or the no-level file for a common word with none', () => {
    for (const [file, words] of files) {
      assert.ok(words.length > 0, `${file} has words`);
      for (const word of words) assert.equal(deckFileOf(word), file, `${word.id} is in ${file}`);
    }
  });

  it('have no word in two files, and no word twice', () => {
    const ids = allWords.map((w) => w.id);
    assert.equal(new Set(ids).size, ids.length);
  });

  it('match the manifest: each file lists the decks it has words for', () => {
    assert.deepEqual(splitDeckFiles(allWords).manifest, manifest);
  });

  it('keep every deck: the Common words deck is the common words across every file', () => {
    const counts = {
      N5: allWords.filter((w) => w.jlpt === 'N5').length,
      N4: allWords.filter((w) => w.jlpt === 'N4').length,
      N3: allWords.filter((w) => w.jlpt === 'N3').length,
      N2: allWords.filter((w) => w.jlpt === 'N2').length,
      N1: allWords.filter((w) => w.jlpt === 'N1').length,
      common: allWords.filter((w) => w.common).length,
    };
    // The counts in the ticket (measured on main before ARCH2).
    assert.deepEqual(counts, { N5: 523, N4: 515, N3: 1762, N2: 1299, N1: 2039, common: 17387 });
  });

  it('let a JLPT deck download at most 150 KB gzipped before the first card (answer 2)', () => {
    for (const { file, decks } of manifest.files) {
      if (!decks.some((d) => d !== 'common')) continue;
      const bytes = gzipSync(read(file), { level: 9 }).length + gzipSync(read(DECK_MANIFEST_FILE)).length;
      assert.ok(bytes <= TARGET_BYTES, `${file} and the manifest are ${bytes} bytes gzipped`);
    }
  });

  it('are each described in data/README.md, which no longer says the build writes deck.json', () => {
    const readme = readFileSync(new URL('../../data/README.md', import.meta.url), 'utf8');
    const section = readme.split('## The deck files')[1]?.split('\n## ')[0] ?? '';
    assert.ok(section, 'data/README.md has a "The deck files" section');
    for (const file of [DECK_MANIFEST_FILE, NO_LEVEL_FILE, 'n5.json', 'n1.json']) {
      assert.ok(section.includes(`\`${file}\``), `${file} is described`);
    }
    assert.ok(!readme.includes('deck.json'), 'data/README.md no longer mentions deck.json');
  });
});
