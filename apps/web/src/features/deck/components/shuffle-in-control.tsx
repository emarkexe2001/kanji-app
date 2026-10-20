import { useState } from 'react';
import type { StudyDeck } from '../hooks/use-study-deck';
import { DECK_LABELS, isDeckId } from '../utils/decks';
import { parseShuffleInCount, type ShuffleSource } from '../utils/study-deck';

const RANDOM = 'random';

const sourceValue = (source: ShuffleSource) => (source.kind === 'random' ? RANDOM : source.deck);

function toSource(value: string): ShuffleSource | null {
  if (value === RANDOM) return { kind: 'random' };
  return isDeckId(value) ? { kind: 'deck', deck: value } : null;
}

const fieldClass = 'rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm font-semibold';

/**
 * Shuffle In Cards: swaps the card on screen (and, for more than one card, other random cards)
 * for new cards from another deck. The user picks where they come from and how many.
 */
export function ShuffleInControl({ study }: { study: StudyDeck }) {
  const [count, setCount] = useState('1');
  const [error, setError] = useState<string | null>(null);
  const { source, sources } = study;

  if (!source || !sources.length) {
    return (
      <div className="mt-4 rounded-xl bg-emerald-50 px-3 py-2">
        <button
          type="button"
          disabled
          aria-describedby="shuffle-in-unavailable"
          className="w-full rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white opacity-40"
        >
          Shuffle In Cards
        </button>
        <p id="shuffle-in-unavailable" className="mt-2 text-center text-xs text-slate-600">
          There&apos;s no other deck to shuffle in from.
        </p>
      </div>
    );
  }

  const submit = () => {
    const parsed = parseShuffleInCount(count, study.cards.length);
    setError(parsed.ok ? study.shuffleIn(parsed.value) : parsed.error);
  };

  return (
    <form
      noValidate
      className="mt-4 space-y-2 rounded-xl bg-emerald-50 px-3 py-2"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <label htmlFor="shuffle-in-from" className="text-sm font-semibold text-slate-700">
          Shuffle in from
        </label>
        <select
          id="shuffle-in-from"
          value={sourceValue(source)}
          onChange={(e) => {
            const next = toSource(e.target.value);
            if (next) study.setSource(next);
            setError(null);
          }}
          className={fieldClass}
        >
          {sources.map((deck) => (
            <option key={deck} value={deck}>
              {DECK_LABELS[deck]}
            </option>
          ))}
          <option value={RANDOM}>Random deck for each card</option>
        </select>
      </div>
      <div className="flex items-center justify-between gap-2">
        <label htmlFor="shuffle-in-count" className="text-sm font-semibold text-slate-700">
          Cards to shuffle in
        </label>
        <input
          id="shuffle-in-count"
          type="number"
          inputMode="numeric"
          min={1}
          max={study.cards.length}
          value={count}
          onChange={(e) => {
            setCount(e.target.value);
            setError(null);
          }}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? 'shuffle-in-error' : undefined}
          className={`w-14 text-center tabular-nums ${fieldClass}`}
        />
      </div>
      {error && (
        <p id="shuffle-in-error" role="alert" className="text-right text-xs font-semibold text-rose-600">
          {error}
        </p>
      )}
      <button
        type="submit"
        className="w-full rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-emerald-500 active:scale-95"
      >
        Shuffle In Cards
      </button>
    </form>
  );
}
