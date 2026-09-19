import { useCallback, useEffect, useState } from 'react';
import type { WordEntry } from '@kanji/core';
import { WordCard } from './components/WordCard';
import { useDeck } from './useDeck';

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

function Deck({ words }: { words: WordEntry[] }) {
  const [index, setIndex] = useState(0);
  const [move, setMove] = useState<Move>('next');

  const next = useCallback(() => {
    setMove('next');
    setIndex((i) => (i + 1) % words.length);
  }, [words.length]);

  const shuffle = useCallback(() => {
    setMove('shuffle');
    setIndex((i) => randomOther(i, words.length));
  }, [words.length]);

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
      <div className="flex flex-1 items-center justify-center py-6">
        <CardDeck entry={words[index]} move={move} />
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
      <header className="flex items-baseline justify-between">
        <h1 className="text-lg font-bold">Kanji Reading Highlighter</h1>
        {deck.status === 'ready' && (
          <span className="text-sm tabular-nums text-slate-500">
            {deck.words.length.toLocaleString()} words
          </span>
        )}
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
