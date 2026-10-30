import { useCallback, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import type { WordEntry } from '@kanji/core';
import { ColorModeMenu } from '../features/color-mode/components/color-mode-menu';
import { useColorModeChoice } from '../features/color-mode/hooks/use-color-mode-choice';
import { CardLimitControl } from '../features/card-limit/components/card-limit-control';
import { useCardLimit } from '../features/card-limit/hooks/use-card-limit';
import { CardFlightLayer } from '../features/deck/components/card-flights';
import { Deck } from '../features/deck/components/deck';
import { DeckPicker } from '../features/deck/components/deck-picker';
import { ShuffleInControl } from '../features/deck/components/shuffle-in-control';
import { ShuffledOutButton, ShuffledOutPanel } from '../features/deck/components/shuffled-out-view';
import { usePanelTop } from '../features/deck/hooks/use-panel-top';
import { useCardFlights } from '../features/deck/hooks/use-card-flights';
import { useDeck } from '../features/deck/hooks/use-deck';
import { useStudyDeck } from '../features/deck/hooks/use-study-deck';
import { buildLibrary, type Library } from '../features/deck/utils/decks';
import { ColorModeContext } from '../hooks/use-color-mode';
import { DeckErrorBoundary } from './deck-error-boundary';

/**
 * Combines the deck and card-limit features: the deck has as many cards as the card limit.
 * The "Shuffled out (N)" button goes in the header, top right (ADJ1), through a portal into
 * `headerSlot`. Its panel floats in the top right, just below the header, over the page (ADJ2),
 * measured from the header the slot is in (ADJ2_5, see usePanelTop); it comes before the deck
 * picker in the page, so Tab goes from the button into the panel, then on to the deck. While it is
 * open on a phone or tablet, the deck card moves below it as a slim card (see Deck).
 * Cards slide between the deck and the button or the panel as they move (ADJ3, see useCardFlights).
 */
function StudyDeck({ library, headerSlot }: { library: Library; headerSlot: HTMLElement | null }) {
  const [limit, setLimit] = useCardLimit();
  const study = useStudyDeck(library, limit);
  const [shuffledOutOpen, setShuffledOutOpen] = useState(false);
  const closeShuffledOut = useCallback(() => setShuffledOutOpen(false), []);
  const flights = useCardFlights(study);
  const panelTop = usePanelTop(shuffledOutOpen, headerSlot?.closest('header') ?? null);

  return (
    <>
      {headerSlot &&
        createPortal(
          <ShuffledOutButton
            count={flights.shownCount}
            bump={flights.bump}
            open={shuffledOutOpen}
            onToggle={() => setShuffledOutOpen((o) => !o)}
          />,
          headerSlot,
        )}
      {shuffledOutOpen && (
        <ShuffledOutPanel study={study} onClose={closeShuffledOut} flights={flights} top={panelTop} />
      )}
      <DeckPicker decks={study.decks} value={study.studied} onChange={study.chooseDeck} />
      <Deck study={study} shuffledOutOpen={shuffledOutOpen} panelTop={panelTop} flights={flights}>
        <ShuffleInControl study={study} />
        <CardLimitControl
          size={study.cards.length}
          onChange={(size) => {
            setLimit(size);
            study.setLimit(size);
          }}
        />
      </Deck>
      <CardFlightLayer flights={flights} />
    </>
  );
}

/** Builds the decks from the dictionary; there must be at least one to study. */
function Decks({ words, headerSlot }: { words: WordEntry[]; headerSlot: HTMLElement | null }) {
  const library = useMemo(() => buildLibrary(words), [words]);
  if (!library.decks.size) {
    return (
      <p className="flex flex-1 items-center justify-center text-center text-danger-ink">
        The word deck has no words to study.
      </p>
    );
  }
  return <StudyDeck library={library} headerSlot={headerSlot} />;
}

export default function App() {
  const deck = useDeck();
  const [colorMode, chooseColorMode] = useColorModeChoice();
  // Where the deck puts the "Shuffled out (N)" button: top right of the header (ADJ1).
  const [headerSlot, setHeaderSlot] = useState<HTMLElement | null>(null);

  return (
    <ColorModeContext value={colorMode}>
      <main className="mx-auto flex min-h-dvh max-w-md flex-col px-4 py-6">
        {/* Two rows (FEAT5, option B): the colour mode menu top left and "Shuffled out (N)" top right
          (ADJ1), then the title on its own row, so it stays on one line from 320px up. */}
        <header className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3">
            <ColorModeMenu mode={colorMode} onChoose={chooseColorMode} />
            <div ref={setHeaderSlot} className="contents" />
          </div>
          <h1 className="text-lg font-bold">Kanji Reading Highlighter</h1>
        </header>

        {deck.status === 'loading' && (
          <p className="flex flex-1 items-center justify-center text-muted">Loading dictionary…</p>
        )}
        {deck.status === 'error' && (
          <p className="flex flex-1 items-center justify-center text-center text-danger-ink">
            Couldn&apos;t load the word deck: {deck.message}
          </p>
        )}
        {deck.status === 'ready' && (
          <DeckErrorBoundary>
            <Decks words={deck.words} headerSlot={headerSlot} />
          </DeckErrorBoundary>
        )}

        <footer className="mt-6 text-center text-[11px] leading-snug text-faint">
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
    </ColorModeContext>
  );
}
