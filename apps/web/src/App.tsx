import { useCallback, useEffect, useMemo, useState } from 'react';
import type { WordEntry } from '@kanji/core';
import { WordCard } from './components/WordCard';
import { useDeck } from './useDeck';
import { MIN_DECK_SIZE, MAX_DECK_SIZE, clampDeckSize, loadDeckSize, parseDeckSizeInput, saveDeckSize } from './deckSize';

type Move = 'next' | 'shuffle';

/** A random index that differs from `current` (when there is more than one card). */
function randomOther(current: number, length: number): number {
  if (length < 2) return current;
  const n = Math.floor(Math.random() * (length - 1));
  return n >= current ? n + 1 : n;
}

/** The front card, with two blank cards fanned out behind it (their content stays hidden). */
function CardDeck({ entry, move }: { entry: WordEntry; move: Move }) {
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

const stepBtn =
  'grid h-9 w-9 place-items-center rounded-lg border border-slate-300 bg-white text-lg font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-95 disabled:opacity-40 disabled:hover:bg-white disabled:active:scale-100';

/** Lets the user type a card limit (1–150) directly, or nudge it with the − / + buttons. */
function CardLimitControl({
  size,
  available,
  onChange,
}: {
  size: number;
  available: number;
  onChange: (size: number) => void;
}) {
  const [draft, setDraft] = useState(String(size));
  const [error, setError] = useState<string | null>(null);

  // Keep the field in sync when the committed size changes from elsewhere (e.g. the +/- buttons).
  useEffect(() => setDraft(String(size)), [size]);

  const commit = (raw: string) => {
    const result = parseDeckSizeInput(raw);
    if (result.ok) {
      setError(null);
      onChange(result.value);
    } else {
      setError(result.error);
    }
  };

  const step = (delta: 1 | -1) => {
    const next = clampDeckSize(size + delta);
    setError(null);
    onChange(next);
  };

  return (
    <div className="mt-4 rounded-xl bg-slate-100 px-3 py-2">
      <div className="flex items-center justify-between">
        <div className="text-sm">
          <label htmlFor="card-limit" className="font-semibold text-slate-700">
            Card limit
          </label>
          <div className="text-xs text-slate-500">of {available.toLocaleString()} words</div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className={stepBtn}
            aria-label="Decrease card limit"
            disabled={size <= MIN_DECK_SIZE}
            onClick={() => step(-1)}
          >
            −
          </button>
          <input
            id="card-limit"
            type="number"
            inputMode="numeric"
            min={MIN_DECK_SIZE}
            max={MAX_DECK_SIZE}
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              commit(e.target.value);
            }}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? 'card-limit-error' : undefined}
            className="w-14 rounded-lg border border-slate-300 bg-white py-1.5 text-center font-bold tabular-nums"
          />
          <button
            type="button"
            className={stepBtn}
            aria-label="Increase card limit"
            disabled={size >= MAX_DECK_SIZE}
            onClick={() => step(1)}
          >
            +
          </button>
        </div>
      </div>
      {error && (
        <p id="card-limit-error" role="alert" className="mt-2 text-right text-xs font-semibold text-rose-600">
          {error}
        </p>
      )}
    </div>
  );
}

function Deck({ words }: { words: WordEntry[] }) {
  const [size, setSize] = useState(loadDeckSize);
  const [index, setIndex] = useState(0);
  const [move, setMove] = useState<Move>('next');

  // The deck is the first `size` cards of the (already shuffled) word list, so growing it
  // keeps the same cards and just appends more.
  const count = Math.min(size, words.length);
  const cards = useMemo(() => words.slice(0, count), [words, count]);

  const next = useCallback(() => {
    setMove('next');
    setIndex((i) => (i + 1) % count);
  }, [count]);

  const shuffle = useCallback(() => {
    setMove('shuffle');
    setIndex((i) => randomOther(i, count));
  }, [count]);

  const changeSize = useCallback((newSize: number) => {
    setSize(newSize);
    setIndex((i) => Math.min(i, newSize - 1)); // shrinking may drop the current card
    saveDeckSize(newSize);
  }, []);

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
      <p className="mt-4 text-center text-sm tabular-nums text-slate-500">
        Card {index + 1} / {count}
      </p>

      <div className="flex flex-1 items-center justify-center py-4">
        <CardDeck entry={cards[index]} move={move} />
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

      <CardLimitControl size={count} available={words.length} onChange={changeSize} />

      <p className="mt-3 hidden text-center text-xs text-slate-400 sm:block">
        Keyboard: → next · S shuffle
      </p>
    </>
  );
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
      {deck.status === 'ready' && <Deck words={deck.words} />}

      <footer className="mt-6 text-center text-[11px] leading-snug text-slate-400">
        Dictionary data from{' '}
        <a className="underline" href="https://www.edrdg.org/" target="_blank" rel="noreferrer">
          JMdict &amp; KANJIDIC2
        </a>{' '}
        © EDRDG, used under{' '}
        <a
          className="underline"
          href="https://www.edrdg.org/edrdg/licence.html"
          target="_blank"
          rel="noreferrer"
        >
          CC BY-SA 4.0
        </a>
        .
      </footer>
    </main>
  );
}
