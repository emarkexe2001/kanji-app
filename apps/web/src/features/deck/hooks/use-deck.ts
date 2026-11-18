import { useEffect, useState, useSyncExternalStore } from 'react';
import { createDeckLoader } from '../utils/deck-loader';
import type { DeckId, Library } from '../utils/decks';
import { decksToLoadFirst } from '../utils/saved-deck';

/** Downloads the words of `decks` if they haven't arrived yet, and resolves with the library that has them. */
export type EnsureDecks = (decks: DeckId[]) => Promise<Library>;

export type DeckState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; library: Library; ensure: EnsureDecks };

type StartState = { status: 'loading' } | { status: 'error'; message: string } | { status: 'started' };

/**
 * Loads the pre-built dictionary (see `npm run data:build`) a file at a time (ARCH2). It is ready
 * once the studied deck's words and the words of every deck named in the saved data have arrived
 * (see decksToLoadFirst); the other files then download in the background. Each deck is shuffled
 * once, as its words arrive. `ensure` downloads a deck that hasn't arrived yet, when it is needed.
 */
export function useDeck(): DeckState {
  const [loader] = useState(() => createDeckLoader(`${import.meta.env.BASE_URL}data/`));
  const [start, setStart] = useState<StartState>({ status: 'loading' });
  const library = useSyncExternalStore(loader.subscribe, loader.getLibrary);

  useEffect(() => {
    let live = true;
    loader.start(decksToLoadFirst).then(
      () => {
        if (!live) return;
        setStart({ status: 'started' });
        loader.loadRest();
      },
      (e: unknown) => {
        if (!live) return;
        setStart({
          status: 'error',
          message: `${e instanceof Error ? e.message : e}. Did you run "npm run data:build"?`,
        });
      },
    );
    return () => {
      live = false;
    };
  }, [loader]);

  if (start.status === 'error') return start;
  if (start.status === 'loading' || !library) return { status: 'loading' };
  return { status: 'ready', library, ensure: loader.ensure };
}
