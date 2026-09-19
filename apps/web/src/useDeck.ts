import { useEffect, useState } from 'react';
import type { WordEntry } from '@kanji/core';

export type DeckState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; words: WordEntry[] };

/** In-place Fisher–Yates shuffle. */
function shuffled<T>(items: T[]): T[] {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

/** Loads the pre-built dictionary deck (see `npm run data:build`) and shuffles its order once. */
export function useDeck(): DeckState {
  const [state, setState] = useState<DeckState>({ status: 'loading' });

  useEffect(() => {
    const ctrl = new AbortController();
    fetch(`${import.meta.env.BASE_URL}data/deck.json`, { signal: ctrl.signal })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<WordEntry[]>;
      })
      .then((words) => setState({ status: 'ready', words: shuffled(words) }))
      .catch((e: unknown) => {
        if (ctrl.signal.aborted) return;
        setState({
          status: 'error',
          message: `${e instanceof Error ? e.message : e}. Did you run "npm run data:build"?`,
        });
      });
    return () => ctrl.abort();
  }, []);

  return state;
}
