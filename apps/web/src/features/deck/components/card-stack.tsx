import { useState } from 'react';
import type { WordEntry } from '@kanji/core';
import { useReducedMotion } from '../hooks/use-reduced-motion';
import { WordCard } from './word-card';

/** How the card on screen got there: Next, Deck Shuffle (or adding cards back), or Shuffle In Cards. */
export type Move = 'next' | 'shuffle' | 'shuffle-in';

const ARRIVE_CLASS: Record<Move, string> = {
  next: 'deal-next',
  shuffle: 'deal-shuffle',
  'shuffle-in': 'drop-in',
};

/**
 * The front card, with two blank cards fanned out behind it (their content stays hidden).
 * After Shuffle In Cards, the new card drops onto the deck from above and `leaving`, the card
 * that was shuffled out, slides down and away (FEAT2_5). With "reduce motion" on, neither moves.
 */
export function CardStack({
  entry,
  move,
  isNew,
  leaving,
}: {
  entry: WordEntry;
  move: Move;
  isNew: boolean;
  leaving: WordEntry | null;
}) {
  const reducedMotion = useReducedMotion();
  const [goneId, setGoneId] = useState<string | null>(null);
  const leavingId = leaving && (leaving.id ?? leaving.word);

  return (
    <div className="relative w-full max-w-sm pb-8">
      <div aria-hidden className="deck-back deck-back-far" />
      <div aria-hidden className="deck-back deck-back-near" />
      <div key={entry.id ?? entry.word} className={`relative z-10 ${reducedMotion ? '' : ARRIVE_CLASS[move]}`}>
        <WordCard entry={entry} isNew={isNew} />
      </div>
      {leaving && !reducedMotion && goneId !== leavingId && (
        // Only there to be seen sliding away: hidden from screen readers and can't be clicked.
        <div
          key={leavingId}
          aria-hidden
          inert
          className="slide-out pointer-events-none absolute inset-x-0 top-0 z-20"
          onAnimationEnd={() => setGoneId(leavingId)}
        >
          <WordCard entry={leaving} />
        </div>
      )}
    </div>
  );
}
