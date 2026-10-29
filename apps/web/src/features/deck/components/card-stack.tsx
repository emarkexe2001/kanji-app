import type { WordEntry } from '@kanji/core';
import { useReducedMotion } from '../hooks/use-reduced-motion';
import { WordCard } from './word-card';

/** How the card on screen got there: Next, Back, Deck Shuffle (or adding cards back), or Shuffle In Cards. */
export type Move = 'next' | 'back' | 'shuffle' | 'shuffle-in';

const ARRIVE_CLASS: Record<Move, string> = {
  next: 'deal-next',
  back: 'deal-back',
  shuffle: 'deal-shuffle',
  'shuffle-in': 'drop-in',
};

/**
 * The front card, with two blank cards fanned out behind it (their content stays hidden).
 * After Shuffle In Cards, the new card drops onto the deck from above (FEAT2_5); the card shuffled
 * out slides into the "Shuffled out (N)" button (ADJ3, see card-flights.tsx). `arrive` false
 * means the card has already slid into the deck (cards added back, ADJ3), so it isn't dealt in as
 * well. With "reduce motion" on, nothing moves.
 *
 * `data-card-stack` marks it so the cards sliding in and out can find it on screen.
 */
export function CardStack({
  entry,
  move,
  isNew,
  arrive = true,
}: {
  entry: WordEntry;
  move: Move;
  isNew: boolean;
  arrive?: boolean;
}) {
  const reducedMotion = useReducedMotion();

  return (
    <div data-card-stack className="relative w-full max-w-sm pb-8">
      <div aria-hidden className="deck-back deck-back-far" />
      <div aria-hidden className="deck-back deck-back-near" />
      <div
        key={entry.id ?? entry.word}
        className={`relative z-10 ${reducedMotion || !arrive ? '' : ARRIVE_CLASS[move]}`}
      >
        <WordCard entry={entry} isNew={isNew} />
      </div>
    </div>
  );
}
