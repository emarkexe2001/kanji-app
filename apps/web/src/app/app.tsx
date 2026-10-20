import { useMemo } from 'react';
import type { WordEntry } from '@kanji/core';
import { CardLimitControl } from '../features/card-limit/components/card-limit-control';
import { useCardLimit } from '../features/card-limit/hooks/use-card-limit';
import { Deck } from '../features/deck/components/deck';
import { DeckPicker } from '../features/deck/components/deck-picker';
import { ShuffleInControl } from '../features/deck/components/shuffle-in-control';
import { useDeck } from '../features/deck/hooks/use-deck';
import { useStudyDeck } from '../features/deck/hooks/use-study-deck';
import { buildLibrary, type Library } from '../features/deck/utils/decks';
import { DeckErrorBoundary } from './deck-error-boundary';

/** Combines the deck and card-limit features: the deck has as many cards as the card limit. */
function StudyDeck({ library }: { library: Library }) {
  const [limit, setLimit] = useCardLimit();
  const study = useStudyDeck(library, limit);

  return (
    <>
      <DeckPicker decks={study.decks} value={study.studied} onChange={study.chooseDeck} />
      <Deck study={study}>
        <ShuffleInControl study={study} />
        <CardLimitControl
          size={study.cards.length}
          onChange={(size) => {
            setLimit(size);
            study.setLimit(size);
          }}
        />
      </Deck>
    </>
  );
}

/** Builds the decks from the dictionary; there must be at least one to study. */
function Decks({ words }: { words: WordEntry[] }) {
  const library = useMemo(() => buildLibrary(words), [words]);
  if (!library.decks.size) {
    return (
      <p className="flex flex-1 items-center justify-center text-center text-rose-600">
        The word deck has no words to study.
      </p>
    );
  }
  return <StudyDeck library={library} />;
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
          <Decks words={deck.words} />
        </DeckErrorBoundary>
      )}

      <footer className="mt-6 text-center text-[11px] leading-snug text-slate-400">
        Dictionary data from{' '}
        <a className="underline" href="https://www.edrdg.org/" target="_blank" rel="noreferrer">
          JMdict &amp; KANJIDIC2
        </a>{' '}
        © EDRDG, used under{' '}
        <a className="underline" href="https://www.edrdg.org/edrdg/licence.html" target="_blank" rel="noreferrer">
          CC BY-SA 4.0
        </a>
        . JLPT levels from{' '}
        <a
          className="underline"
          href="https://github.com/jamsinclair/open-anki-jlpt-decks"
          target="_blank"
          rel="noreferrer"
        >
          open-anki-jlpt-decks
        </a>
        , based on the lists at{' '}
        <a className="underline" href="http://www.tanos.co.uk/jlpt/" target="_blank" rel="noreferrer">
          tanos.co.uk
        </a>
        .
      </footer>
    </main>
  );
}
