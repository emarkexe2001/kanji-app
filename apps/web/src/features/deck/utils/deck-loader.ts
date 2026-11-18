/**
 * Downloads the dictionary a file at a time (ARCH2). The manifest (`decks.json`, see
 * `npm run data:build`) says which files there are and which decks each one has words for, so
 * every deck can be listed before its words arrive. A deck is loaded once every file with words
 * for it has arrived: a JLPT deck needs its own file, Common words needs every file.
 *
 * Each file is downloaded at most once at a time. One that fails is forgotten, so asking for it
 * again downloads it again. Plain code (no React), so it can be tested on its own; the hook in
 * hooks/use-deck.ts connects it to the app.
 */
import { DECK_MANIFEST_FILE, type WordEntry } from '@kanji/core';
import { DECK_IDS, buildLibrary, isDeckId, type DeckId, type Library } from './decks';

export interface ManifestFile {
  file: string;
  decks: DeckId[];
}

/** A file name the manifest may list: letters, digits and dashes, then `.json`. */
const FILE_NAME = /^[\w-]+\.json$/;

/**
 * The manifest's files, checked: each needs a plain `.json` file name and a list of decks.
 * Unknown deck names are left out. Throws if it doesn't fit, as the app can't start without it.
 */
export function parseManifest(value: unknown): ManifestFile[] {
  const files = typeof value === 'object' && value !== null ? (value as { files?: unknown }).files : undefined;
  if (!Array.isArray(files)) throw new Error(`${DECK_MANIFEST_FILE} has no list of files`);
  return files.map((entry: unknown) => {
    const { file, decks } = (typeof entry === 'object' && entry !== null ? entry : {}) as {
      file?: unknown;
      decks?: unknown;
    };
    if (typeof file !== 'string' || !FILE_NAME.test(file) || !Array.isArray(decks)) {
      throw new Error(`${DECK_MANIFEST_FILE} lists a file it can't use`);
    }
    return { file, decks: decks.filter(isDeckId) };
  });
}

/** The files that hold words for any of `decks`. */
export function filesFor(manifest: ManifestFile[], decks: DeckId[]): string[] {
  return manifest.filter((f) => f.decks.some((d) => decks.includes(d))).map((f) => f.file);
}

export type Random = () => number;

export interface DeckLoader {
  /**
   * Downloads the manifest, then the files of the decks `firstDecks` picks from the decks that
   * exist (e.g. the studied deck and the decks named in the saved data). Resolves with the
   * library once they have arrived; rejects if any of them fails. Calling it again returns the
   * same promise.
   */
  start(firstDecks: (available: DeckId[]) => DeckId[]): Promise<Library>;
  /** Downloads every file not downloaded yet, in the background. Failures are silent. */
  loadRest(): void;
  /**
   * Makes sure every file of `decks` has arrived, downloading any that hasn't (again, if it
   * failed before). Resolves with the library that has them; rejects if any of them fails.
   */
  ensure(decks: DeckId[]): Promise<Library>;
  /** The library so far, or null before `start` has resolved. The same object until a file arrives. */
  getLibrary(): Library | null;
  /** Calls `listener` whenever a file arrives. Returns a function that stops it. */
  subscribe(listener: () => void): () => void;
}

/**
 * A loader that downloads from `baseUrl` (ending in `/`). `random` orders the words: each word
 * gets a random place once, when its file arrives, so every deck is shuffled, including Common
 * words, which is made from several files.
 */
export function createDeckLoader(baseUrl: string, random: Random = Math.random): DeckLoader {
  let manifest: ManifestFile[] = [];
  let available: DeckId[] = [];
  let started: Promise<Library> | null = null;
  let library: Library | null = null;
  /** Every word downloaded so far, with its random place, kept in order of place. */
  let placed: { place: number; word: WordEntry }[] = [];
  const arrived = new Set<string>();
  const downloading = new Map<string, Promise<void>>();
  const listeners = new Set<() => void>();

  const getJson = async (file: string): Promise<unknown> => {
    const response = await fetch(`${baseUrl}${file}`);
    if (!response.ok) throw new Error(`HTTP ${response.status} for ${file}`);
    return response.json();
  };

  const rebuild = () => {
    const ready = available.filter((d) => filesFor(manifest, [d]).every((f) => arrived.has(f)));
    library = buildLibrary(
      placed.map((p) => p.word),
      { available, ready },
    );
  };

  const download = (file: string): Promise<void> => {
    if (arrived.has(file)) return Promise.resolve();
    const running = downloading.get(file);
    if (running) return running;
    const request = getJson(file)
      .then((words) => {
        if (!Array.isArray(words)) throw new Error(`${file} isn't a list of words`);
        placed = [...placed, ...(words as WordEntry[]).map((word) => ({ place: random(), word }))].sort(
          (a, b) => a.place - b.place,
        );
        arrived.add(file);
        // Until start has resolved, the library is built once, when the first files are all in.
        if (started && library) {
          rebuild();
          listeners.forEach((listener) => listener());
        }
      })
      .finally(() => downloading.delete(file));
    downloading.set(file, request);
    return request;
  };

  const ensure = async (decks: DeckId[]): Promise<Library> => {
    await Promise.all(filesFor(manifest, decks).map(download));
    if (!library) rebuild();
    return library as Library;
  };

  return {
    start(firstDecks) {
      started ??= (async () => {
        manifest = parseManifest(await getJson(DECK_MANIFEST_FILE));
        const named = new Set(manifest.flatMap((f) => f.decks));
        available = DECK_IDS.filter((d) => named.has(d));
        await Promise.all(filesFor(manifest, firstDecks(available)).map(download));
        rebuild();
        return library as Library;
      })();
      return started;
    },
    loadRest() {
      for (const { file } of manifest) download(file).catch(() => {});
    },
    ensure,
    getLibrary: () => library,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
