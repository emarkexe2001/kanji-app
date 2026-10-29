import { useEffect, useRef, type ReactNode } from 'react';
import type { CardFlights } from '../hooks/use-card-flights';
import { usePanelClearance } from '../hooks/use-panel-clearance';
import { useWideLayout } from '../hooks/use-wide-layout';
import type { StudyDeck } from '../hooks/use-study-deck';
import { CardStack } from './card-stack';
import { SHUFFLED_OUT_PANEL_ID } from './shuffled-out-view';

/** Keyboard shortcuts shouldn't fire while the user is typing in a field or using a list. */
const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLElement && ['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName);

/**
 * The Back button (FEAT6): an outline button (white, slate-400 border, slate-900 text) so it
 * reads as the quieter partner of Next. Its focus ring is drawn on purpose, and in a forced-colours
 * (high-contrast) mode its border uses the system ButtonText colour so it can still be told apart.
 * Its padding is 1px less than the other buttons' so that, with the border, it is 48px tall too.
 */
const BACK_BUTTON = [
  'min-h-12 rounded-xl border border-slate-400 bg-white px-4 py-2.75 font-semibold text-slate-900 shadow-sm transition',
  'hover:bg-slate-100 active:scale-95',
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900',
  'forced-colors:border-[color:ButtonText]',
].join(' ');

/**
 * Shows the card on screen and its position in the deck, with the Back, Next and Deck Shuffle
 * buttons and keyboard shortcuts. `children` is rendered below the buttons (the app puts the Shuffle In
 * Cards and card limit controls there).
 *
 * `shuffledOutOpen` says the Shuffled-out cards panel is open, `panelTop` how far down the screen
 * it starts. Below the wide layout (WIDE_LAYOUT_MIN_WIDTH) it is a pop-up over the page, so the
 * card moves down to just below it, and goes back when it closes (ADJ2). While it is there, the
 * card is the slim card (header, word, reading and a one-line meaning, see WordCard), so it, Back, Next and Deck
 * Shuffle all fit on a 360x640 phone below the pop-up (ADJ2_5). In the wide layout the panel
 * floats beside the deck, which doesn't change.
 *
 * `flights` are the cards sliding in and out of the deck (ADJ3): while cards being added back are
 * on their way, the deck still shows the card that was on screen, and the first card added back
 * isn't dealt in again once it has slid in.
 */
export function Deck({
  study,
  shuffledOutOpen = false,
  panelTop = 0,
  flights,
  children,
}: {
  study: StudyDeck;
  shuffledOutOpen?: boolean;
  panelTop?: number;
  flights?: CardFlights;
  children?: ReactNode;
}) {
  const { cards, index, move, summary, next, back, deckShuffle, isNew } = study;
  const held = flights?.heldCard ?? null;
  const cardArea = useRef<HTMLDivElement>(null);
  const wide = useWideLayout();
  const clearance = usePanelClearance(shuffledOutOpen, SHUFFLED_OUT_PANEL_ID, cardArea, panelTop, wide);
  // The card sits below the pop-up, as the slim card (ADJ2_5).
  const underPopUp = shuffledOutOpen && !wide;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTyping(e.target)) return;
      if (e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowLeft') back();
      else if (e.key.toLowerCase() === 's') deckShuffle();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, back, deckShuffle]);

  return (
    <>
      <p className="mt-4 text-center text-sm text-slate-500 tabular-nums">
        Card {index + 1} of {cards.length}
      </p>
      <p role="status" className="min-h-5 text-center text-sm font-semibold text-emerald-700">
        {summary}
      </p>

      <div
        ref={cardArea}
        style={clearance ? { paddingTop: Math.max(16, clearance) } : undefined}
        className={`flex flex-1 justify-center py-4 ${underPopUp ? 'items-start' : 'items-center'}`}
      >
        <div className="flex w-full max-w-sm justify-center">
          <CardStack
            entry={held ?? cards[index]}
            move={move}
            isNew={held ? !!flights?.heldIsNew : isNew(index)}
            arrive={!flights?.quietArrival}
            slim={underPopUp}
          />
        </div>
      </div>

      {/* Two rows (FEAT6): Back | Next, then Deck Shuffle across the full width. */}
      <nav className="grid grid-cols-2 gap-3" aria-label="Card controls">
        <button type="button" onClick={back} className={BACK_BUTTON}>
          <span aria-hidden>← </span>Back
        </button>
        <button
          type="button"
          onClick={next}
          className="min-h-12 rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-slate-700 active:scale-95"
        >
          Next →
        </button>
        <button
          type="button"
          onClick={deckShuffle}
          className="col-span-2 min-h-12 rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-indigo-500 active:scale-95"
        >
          <span aria-hidden>🔀 </span>Deck Shuffle
        </button>
      </nav>

      {children}

      <p className="mt-3 hidden text-center text-xs text-slate-400 sm:block">
        Keyboard: ← back · → next · S deck shuffle
      </p>
    </>
  );
}
