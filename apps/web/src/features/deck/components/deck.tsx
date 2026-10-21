import { useEffect, type ReactNode } from 'react';
import { CardStack } from './card-stack';
import type { StudyDeck } from '../hooks/use-study-deck';

/** Keyboard shortcuts shouldn't fire while the user is typing in a field or using a list. */
const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLElement && ['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName);

/**
 * Shows the card on screen and its position in the deck, with the Deck Shuffle and Next buttons
 * and keyboard shortcuts. `children` is rendered below the buttons (the app puts the Shuffle In
 * Cards and card limit controls there).
 */
export function Deck({ study, children }: { study: StudyDeck; children?: ReactNode }) {
  const { cards, index, move, summary, next, deckShuffle, isNew, leaving } = study;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTyping(e.target)) return;
      if (e.key === 'ArrowRight') next();
      else if (e.key.toLowerCase() === 's') deckShuffle();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, deckShuffle]);

  return (
    <>
      <p className="mt-4 text-center text-sm text-slate-500 tabular-nums">
        Card {index + 1} of {cards.length}
      </p>
      <p role="status" className="min-h-5 text-center text-sm font-semibold text-emerald-700">
        {summary}
      </p>

      <div className="flex flex-1 items-center justify-center py-4">
        <CardStack entry={cards[index]} move={move} isNew={isNew(index)} leaving={leaving} />
      </div>

      <nav className="grid grid-cols-2 gap-3" aria-label="Card controls">
        <button
          type="button"
          onClick={deckShuffle}
          className="rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-indigo-500 active:scale-95"
        >
          <span aria-hidden>🔀 </span>Deck Shuffle
        </button>
        <button
          type="button"
          onClick={next}
          className="rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-slate-700 active:scale-95"
        >
          Next →
        </button>
      </nav>

      {children}

      <p className="mt-3 hidden text-center text-xs text-slate-400 sm:block">Keyboard: → next · S deck shuffle</p>
    </>
  );
}
