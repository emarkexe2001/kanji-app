import { useCallback, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import type { WordEntry } from '@kanji/core';
import { CardLimitControl } from '../features/card-limit/components/card-limit-control';
import { useCardLimit } from '../features/card-limit/hooks/use-card-limit';
import { Deck } from '../features/deck/components/deck';
import { DeckPicker } from '../features/deck/components/deck-picker';
import { ShuffleInControl } from '../features/deck/components/shuffle-in-control';
import { ShuffledOutButton, ShuffledOutPanel } from '../features/deck/components/shuffled-out-view';
import { useDeck } from '../features/deck/hooks/use-deck';
import { useStudyDeck } from '../features/deck/hooks/use-study-deck';
import { buildLibrary, type Library } from '../features/deck/utils/decks';
import { DeckErrorBoundary } from './deck-error-boundary';

/**
 * Combines the deck and card-limit features: the deck has as many cards as the card limit.
 * The "Shuffled out (N)" button goes in the header, top right (ADJ1), through a portal into
 * `headerSlot`. Its panel floats in the top right, just below the header, over the page (ADJ2); it
 * comes before the deck picker in the page, so Tab goes from the button into the panel, then on to
 * the deck. While it is open on a phone or tablet, the deck card gets smaller (see Deck).
 */
function StudyDeck({ library, headerSlot }: { library: Library; headerSlot: HTMLElement | null }) {
  const [limit, setLimit] = useCardLimit();
  const study = useStudyDeck(library, limit);
  const [shuffledOutOpen, setShuffledOutOpen] = useState(false);
  const closeShuffledOut = useCallback(() => setShuffledOutOpen(false), []);

  return (
    <>
      {headerSlot &&
        createPortal(
          <ShuffledOutButton
            count={study.shuffledOut.length}
            open={shuffledOutOpen}
            onToggle={() => setShuffledOutOpen((o) => !o)}
          />,
          headerSlot,
        )}
      {shuffledOutOpen && <ShuffledOutPanel study={study} onClose={closeShuffledOut} />}
      <DeckPicker decks={study.decks} value={study.studied} onChange={study.chooseDeck} />
      <Deck study={study} shuffledOutOpen={shuffledOutOpen}>
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
function Decks({ words, headerSlot }: { words: WordEntry[]; headerSlot: HTMLElement | null }) {
  const library = useMemo(() => buildLibrary(words), [words]);
  if (!library.decks.size) {
    return (
      <p className="flex flex-1 items-center justify-center text-center text-rose-600">
        The word deck has no words to study.
      </p>
    );
  }
  return <StudyDeck library={library} headerSlot={headerSlot} />;
}

export default function App() {
  const deck = useDeck();
  // Where the deck puts the "Shuffled out (N)" button: top right of the header (ADJ1).
  const [headerSlot, setHeaderSlot] = useState<HTMLElement | null>(null);

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-4 py-6">
      {/* The title wraps onto two lines when the button doesn't fit beside it (ADJ1). */}
      <header className="flex items-start justify-between gap-3">
        <h1 className="min-w-0 text-lg font-bold">Kanji Reading Highlighter</h1>
        <div ref={setHeaderSlot} className="contents" />
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
          <Decks words={deck.words} headerSlot={headerSlot} />
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
