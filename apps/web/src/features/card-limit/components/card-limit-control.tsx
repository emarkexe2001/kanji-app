import { useEffect, useState } from 'react';
import { MIN_DECK_SIZE, MAX_DECK_SIZE, clampDeckSize, parseDeckSizeInput } from '../utils/deck-size';

const stepBtn =
  'grid h-9 w-9 place-items-center rounded-lg border border-slate-300 bg-white text-lg font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-95 disabled:opacity-40 disabled:hover:bg-white disabled:active:scale-100';

/** Lets the user type a card limit (1–150) directly, or nudge it with the − / + buttons. */
export function CardLimitControl({
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
