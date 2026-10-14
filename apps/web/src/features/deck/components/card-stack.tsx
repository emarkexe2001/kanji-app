import type { WordEntry } from '@kanji/core';
import { WordCard } from './word-card';

export type Move = 'next' | 'shuffle';

/** The front card, with two blank cards fanned out behind it (their content stays hidden). */
export function CardStack({ entry, move }: { entry: WordEntry; move: Move }) {
  return (
    <div className="relative w-full max-w-sm pb-8">
      <div aria-hidden className="deck-back deck-back-far" />
      <div aria-hidden className="deck-back deck-back-near" />
      <div
        key={entry.id ?? entry.word}
        className={`relative z-10 ${move === 'shuffle' ? 'deal-shuffle' : 'deal-next'}`}
      >
        <WordCard entry={entry} />
      </div>
    </div>
  );
}
