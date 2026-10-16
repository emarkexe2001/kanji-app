import { useCallback, useEffect, useState, type ReactNode } from 'react';
import type { WordEntry } from '@kanji/core';
import { CardStack, type Move } from './card-stack';
import { randomOther } from '../utils/random-other';

/**
 * Shows one card at a time from `cards`, with Next and Shuffle buttons and keyboard shortcuts.
 * `children` is rendered below the buttons (the app puts the card limit control there).
 */
export function Deck({ cards, children }: { cards: WordEntry[]; children?: ReactNode }) {
  const count = cards.length;
  const [index, setIndex] = useState(0);
  const [move, setMove] = useState<Move>('next');

  // Shrinking the deck may drop the current card, so keep the index in range.
  const [prevCount, setPrevCount] = useState(count);
  if (count !== prevCount) {
    setPrevCount(count);
    setIndex((i) => Math.min(i, count - 1));
  }

  const next = useCallback(() => {
    setMove('next');
    setIndex((i) => (i + 1) % count);
  }, [count]);

  const shuffle = useCallback(() => {
    setMove('shuffle');
    setIndex((i) => randomOther(i, count));
  }, [count]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') next();
      else if (e.key.toLowerCase() === 's') shuffle();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, shuffle]);

  return (
    <>
      <p className="mt-4 text-center text-sm text-slate-500 tabular-nums">
        Card {index + 1} / {count}
      </p>

      <div className="flex flex-1 items-center justify-center py-4">
        <CardStack entry={cards[index]} move={move} />
      </div>

      <nav className="grid grid-cols-2 gap-3" aria-label="Card controls">
        <button
          type="button"
          onClick={shuffle}
          className="rounded-xl border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-95"
        >
          🔀 Shuffle
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

      <p className="mt-3 hidden text-center text-xs text-slate-400 sm:block">Keyboard: → next · S shuffle</p>
    </>
  );
}
