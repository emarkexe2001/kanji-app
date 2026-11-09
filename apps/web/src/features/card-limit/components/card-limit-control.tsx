import { useState } from 'react';
import { MIN_DECK_SIZE, MAX_DECK_SIZE, clampDeckSize, parseDeckSizeInput } from '../utils/deck-size';

/**
 * The − / + buttons. In High contrast (FEAT5_5) their white line is 2px (the border plus a 1px
 * inset ring) with no shadow. Disabled (at 1 or 150), they don't fade there, as faded white turns
 * grey (agreed 2026-11-09): their solid line gives way to a 2px dashed white outline inside them,
 * with white text. Neither changes the size.
 */
const stepBtn = [
  'grid h-9 w-9 place-items-center rounded-lg border border-field-line bg-field text-lg font-semibold text-ink-soft shadow-sm transition hover:bg-field-hover active:scale-95 disabled:opacity-40 disabled:hover:bg-field disabled:active:scale-100',
  'hc:shadow-none hc:ring-1 hc:ring-field-line hc:ring-inset',
  'hc:disabled:border-transparent hc:disabled:text-ink hc:disabled:opacity-100 hc:disabled:ring-0',
  'hc:disabled:outline-2 hc:disabled:-outline-offset-2 hc:disabled:outline-ink hc:disabled:outline-dashed',
].join(' ');

/**
 * Lets the user type a card limit (1–150) directly, or nudge it with the − / + buttons.
 * A typed limit is applied on Enter or when leaving the field; the buttons apply straight away.
 */
export function CardLimitControl({ size, onChange }: { size: number; onChange: (size: number) => void }) {
  const [draft, setDraft] = useState(String(size));
  const [error, setError] = useState<string | null>(null);
  // Only true while the field still shows the rejected value; the message stays up after a reset.
  const [invalid, setInvalid] = useState(false);

  // Keep the field in sync when the committed size changes from elsewhere (e.g. the +/- buttons).
  const [prevSize, setPrevSize] = useState(size);
  if (size !== prevSize) {
    setPrevSize(size);
    setDraft(String(size));
  }

  // On leaving the field, an invalid value is replaced with the current limit so the field always matches the deck.
  const commit = (resetIfInvalid: boolean) => {
    const result = parseDeckSizeInput(draft);
    if (result.ok) {
      setError(null);
      setInvalid(false);
      setDraft(String(result.value));
      onChange(result.value);
    } else {
      setError(result.error);
      setInvalid(!resetIfInvalid);
      if (resetIfInvalid) setDraft(String(size));
    }
  };

  const step = (delta: 1 | -1) => {
    const next = clampDeckSize(size + delta);
    setError(null);
    setInvalid(false);
    onChange(next);
  };

  return (
    // In High contrast (FEAT5_5) the row has a 1px white line, drawn inside it.
    <div className="mt-4 rounded-xl bg-section px-3 py-2 hc:ring-1 hc:ring-box-line hc:ring-inset">
      <div className="flex items-center justify-between">
        <label htmlFor="card-limit" className="text-sm font-semibold text-ink-soft">
          Card limit
        </label>
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
              setError(null);
              setInvalid(false);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit(false);
            }}
            onBlur={() => commit(true)}
            aria-invalid={invalid ? true : undefined}
            aria-describedby={invalid ? 'card-limit-error' : undefined}
            className="w-14 rounded-lg border border-field-line bg-field py-1.5 text-center font-bold tabular-nums hc:ring-1 hc:ring-field-line hc:ring-inset"
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
        <p id="card-limit-error" role="alert" className="mt-2 text-right text-xs font-semibold text-danger-ink">
          {error}
        </p>
      )}
    </div>
  );
}
