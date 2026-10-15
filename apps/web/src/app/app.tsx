import { useMemo } from 'react';
import type { WordEntry } from '@kanji/core';
import { CardLimitControl } from '../features/card-limit/components/card-limit-control';
import { useCardLimit } from '../features/card-limit/hooks/use-card-limit';
import { Deck } from '../features/deck/components/deck';
import { useDeck } from '../features/deck/hooks/use-deck';
import { DeckErrorBoundary } from './deck-error-boundary';

/** Combines the deck and card-limit features: the deck shows as many words as the card limit. */
function StudyDeck({ words }: { words: WordEntry[] }) {
  const [size, setSize] = useCardLimit();

  // The deck is the first `size` cards of the (already shuffled) word list, so growing it
  // keeps the same cards and just appends more.
  const count = Math.min(size, words.length);
  const cards = useMemo(() => words.slice(0, count), [words, count]);

  return (
    <Deck cards={cards}>
      <CardLimitControl size={count} onChange={setSize} />
    </Deck>
  );
}

export default function App() {
  const deck = useDeck();

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-4 py-6">
      <header>
        <h1 className="text-lg font-bold">Kanji Reading Highlighter</h1>
      </header>

      {deck.status === 'loading' && (
        <p className="flex flex-1 items-center justify-center text-slate-500">Loading dictionary…</p>
      )}
      {deck.status === 'error' && (
        <p className="flex flex-1 items-center justify-center text-center text-rose-600">
          Couldn&apos;t load the word deck: {deck.message}
        </p>
      )}
      {deck.status === 'ready' && (
        <DeckErrorBoundary>
          <StudyDeck words={deck.words} />
        </DeckErrorBoundary>
      )}

      <footer className="mt-6 text-center text-[11px] leading-snug text-slate-400">
        Dictionary data from{' '}
        <a className="underline" href="https://www.edrdg.org/" target="_blank" rel="noreferrer">
          JMdict &amp; KANJIDIC2
        </a>{' '}
        © EDRDG, used under{' '}
        <a
          className="underline"
          href="https://www.edrdg.org/edrdg/licence.html"
          target="_blank"
          rel="noreferrer"
        >
          CC BY-SA 4.0
        </a>
        .
      </footer>
    </main>
  );
}
