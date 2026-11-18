// ARCH2: downloading the dictionary a file at a time.
import { afterEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { splitDeckFiles, type JlptLevel, type WordEntry } from '@kanji/core';
import { createDeckLoader, filesFor, parseManifest } from '../../../src/features/deck/utils/deck-loader';
import type { DeckId } from '../../../src/features/deck/utils/decks';

const word = (id: string, jlpt?: JlptLevel, common = false): WordEntry => ({
  id,
  word: id,
  reading: id,
  common,
  ...(jlpt && { jlpt }),
  segments: [],
  meaning: id,
});

// N5 and N4 words (some common), and common words with no level.
const WORDS = [
  word('n5-a', 'N5', true),
  word('n5-b', 'N5'),
  word('n4-a', 'N4', true),
  word('n4-b', 'N4'),
  word('plain-a', undefined, true),
  word('plain-b', undefined, true),
];
const split = splitDeckFiles(WORDS);

const realFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = realFetch;
});

/**
 * Serves the split files. `failing` files answer 500 until `heal` is called; every request is
 * recorded in `requested`.
 */
function serve(failing: string[] = []) {
  const requested: string[] = [];
  const broken = new Set(failing);
  globalThis.fetch = (async (url: string | URL) => {
    const file = String(url).split('/').pop() ?? '';
    requested.push(file);
    const body = file === 'decks.json' ? split.manifest : split.files.get(file);
    if (broken.has(file) || body === undefined) return new Response(null, { status: 500 });
    return new Response(JSON.stringify(body));
  }) as typeof fetch;
  return { requested, heal: (file: string) => broken.delete(file) };
}

const ids = (words: WordEntry[] | undefined) => (words ?? []).map((w) => w.id).sort();
const keys = <T>(map: Map<T, unknown>) => [...map.keys()];
const only =
  (...decks: DeckId[]) =>
  () =>
    decks;

describe('parseManifest', () => {
  test('keeps each file and its known decks, dropping unknown deck names', () => {
    assert.deepEqual(parseManifest({ files: [{ file: 'n5.json', decks: ['N5', 'common', 'N9'] }] }), [
      { file: 'n5.json', decks: ['N5', 'common'] },
    ]);
  });

  test('throws when there is no list of files, or a file it can’t use', () => {
    assert.throws(() => parseManifest(null), /no list of files/);
    assert.throws(() => parseManifest({ files: 'n5.json' }), /no list of files/);
    assert.throws(() => parseManifest({ files: [{ file: '../secret.json', decks: [] }] }), /can't use/);
    assert.throws(() => parseManifest({ files: [{ file: 'n5.json' }] }), /can't use/);
  });
});

describe('filesFor', () => {
  const manifest = parseManifest(split.manifest);

  test('a JLPT deck needs its own file; Common words needs every file with common words', () => {
    assert.deepEqual(filesFor(manifest, ['N4']), ['n4.json']);
    assert.deepEqual(filesFor(manifest, ['common']), ['n5.json', 'n4.json', 'common-no-level.json']);
    assert.deepEqual(filesFor(manifest, ['N5', 'N4']), ['n5.json', 'n4.json']);
  });
});

describe('createDeckLoader', () => {
  test('start downloads the manifest, then only the files of the decks asked for; every deck is listed', async () => {
    const server = serve();
    const loader = createDeckLoader('/data/');
    const library = await loader.start(only('N5'));

    assert.deepEqual(server.requested, ['decks.json', 'n5.json']);
    assert.deepEqual(library.available, ['N5', 'N4', 'common']);
    assert.deepEqual(keys(library.decks), ['N5']);
    assert.deepEqual(ids(library.decks.get('N5')), ['n5-a', 'n5-b']);
    assert.equal(loader.getLibrary(), library);
  });

  test('start is given the decks that exist, and calling it again downloads nothing more', async () => {
    const server = serve();
    const loader = createDeckLoader('/data/');
    let given: DeckId[] = [];
    const first = loader.start((available) => {
      given = available;
      return ['N4'];
    });
    assert.equal(loader.start(only('N5')), first);
    await first;
    assert.deepEqual(given, ['N5', 'N4', 'common']);
    assert.deepEqual(server.requested, ['decks.json', 'n4.json']);
  });

  test('Common words is only built once every file has arrived', async () => {
    serve();
    const loader = createDeckLoader('/data/');
    await loader.start(only('N5'));
    await loader.ensure(['N4']);
    assert.equal(loader.getLibrary()?.decks.has('common'), false);
    const library = await loader.ensure(['common']);
    assert.deepEqual(ids(library.decks.get('common')), ['n4-a', 'n5-a', 'plain-a', 'plain-b']);
  });

  test('ensure downloads only the files not there yet, and tells listeners as each arrives', async () => {
    const server = serve();
    const loader = createDeckLoader('/data/');
    await loader.start(only('N5'));
    let told = 0;
    const stop = loader.subscribe(() => told++);
    const library = await loader.ensure(['N5', 'N4']);
    assert.deepEqual(server.requested, ['decks.json', 'n5.json', 'n4.json']);
    assert.deepEqual(keys(library.decks), ['N5', 'N4']);
    assert.equal(told, 1);
    assert.equal(loader.getLibrary(), library);
    stop();
    await loader.ensure(['common']);
    assert.equal(told, 1);
  });

  test('a file asked for twice at once is downloaded once', async () => {
    const server = serve();
    const loader = createDeckLoader('/data/');
    await loader.start(only('N5'));
    await Promise.all([loader.ensure(['N4']), loader.ensure(['N4'])]);
    assert.equal(server.requested.filter((f) => f === 'n4.json').length, 1);
  });

  test('a file that fails rejects, and asking for it again downloads it again', async () => {
    const server = serve(['n4.json']);
    const loader = createDeckLoader('/data/');
    await loader.start(only('N5'));
    await assert.rejects(loader.ensure(['N4']), /HTTP 500 for n4.json/);
    assert.equal(loader.getLibrary()?.decks.has('N4'), false);
    server.heal('n4.json');
    const library = await loader.ensure(['N4']);
    assert.deepEqual(ids(library.decks.get('N4')), ['n4-a', 'n4-b']);
    assert.equal(server.requested.filter((f) => f === 'n4.json').length, 2);
  });

  test('start rejects if the manifest or a first file fails', async () => {
    serve(['decks.json']);
    await assert.rejects(createDeckLoader('/data/').start(only('N5')), /HTTP 500 for decks.json/);
    serve(['n5.json']);
    await assert.rejects(createDeckLoader('/data/').start(only('N5')), /HTTP 500 for n5.json/);
  });

  test('a word file that isn’t a list of words fails', async () => {
    globalThis.fetch = (async (url: string | URL) =>
      new Response(
        JSON.stringify(String(url).endsWith('decks.json') ? split.manifest : { words: [] }),
      )) as typeof fetch;
    await assert.rejects(createDeckLoader('/data/').start(only('N5')), /n5.json isn't a list of words/);
  });

  test('loadRest downloads every other file in the background, and a failure there stays silent', async () => {
    const server = serve(['n4.json']);
    const loader = createDeckLoader('/data/');
    await loader.start(only('N5'));
    const arrived = new Promise<void>((resolve) => loader.subscribe(resolve));
    loader.loadRest();
    await arrived;
    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.deepEqual([...server.requested].sort(), ['common-no-level.json', 'decks.json', 'n4.json', 'n5.json']);
    assert.deepEqual(keys(loader.getLibrary()?.decks ?? new Map()), ['N5']);
  });

  test('words get a random place as they arrive, so Common words is shuffled across files', async () => {
    serve();
    // Places given in the order the words arrive: N5 (a, b), then N4 (a, b), then no level (a, b).
    const places = [0.9, 0.5, 0.1, 0.7, 0.3, 0.6];
    let i = 0;
    const loader = createDeckLoader('/data/', () => places[i++]);
    await loader.start(only('N5'));
    await loader.ensure(['N4']);
    const library = await loader.ensure(['common']);
    assert.deepEqual(
      library.decks.get('common')?.map((w) => w.id),
      ['n4-a', 'plain-a', 'plain-b', 'n5-a'],
    );
    assert.deepEqual(
      library.decks.get('N5')?.map((w) => w.id),
      ['n5-b', 'n5-a'],
    );
  });
});
