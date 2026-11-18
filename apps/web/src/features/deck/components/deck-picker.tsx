import type { DeckPick } from '../hooks/use-study-deck';
import { DECK_LABELS, isDeckId, type DeckId } from '../utils/decks';

/** The spinner beside "Loading <deck>…" (ARCH2): 12px, in the text colour, still with reduced motion. */
function Spinner() {
  return (
    <svg className="size-3 shrink-0 animate-spin motion-reduce:animate-none" viewBox="0 0 16 16" aria-hidden="true">
      <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" strokeOpacity="0.3" strokeWidth="2" />
      <path d="M8 1a7 7 0 0 1 7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Picks the deck being studied. Changing it builds a new deck from the picked one. While a picked
 * deck's words download, the dropdown shows it (`value` is the pending deck) and the line under the
 * row says so; if they fail, the dropdown goes back and the line says that instead (ARCH2).
 */
export function DeckPicker({
  decks,
  value,
  message,
  onChange,
}: {
  decks: DeckId[];
  value: DeckId;
  message: DeckPick | null;
  onChange: (deck: DeckId) => void;
}) {
  const error = message?.status === 'error';
  return (
    <div>
      {/* In High contrast (FEAT5_5) the row has a 1px white line and the dropdown a 2px one, drawn as
        inset rings so nothing changes size. */}
      <div className="mt-4 flex items-center justify-between rounded-xl bg-section px-3 py-2 hc:ring-1 hc:ring-box-line hc:ring-inset">
        <label htmlFor="studied-deck" className="text-sm font-semibold text-ink-soft">
          Deck
        </label>
        <select
          id="studied-deck"
          value={value}
          onChange={(e) => {
            if (isDeckId(e.target.value)) onChange(e.target.value);
          }}
          className="rounded-lg border border-field-line bg-field px-2 py-1.5 text-sm font-semibold hc:ring-1 hc:ring-field-line hc:ring-inset"
        >
          {decks.map((deck) => (
            <option key={deck} value={deck}>
              {DECK_LABELS[deck]}
            </option>
          ))}
        </select>
      </div>
      {/* The line under the Deck row (ARCH2): always there and one line high (22px with its gap), so
        nothing moves when its text comes and goes. Its two parts are always rendered live regions,
        so screen readers hear the loading text (politely) and the error (at once) as they appear.
        They are aria-live rather than role="status" and role="alert", so an empty one isn't taken
        for a message by the app's other status and alert checks. */}
      <p
        id="deck-message"
        className={`mt-1.5 flex h-4 items-center justify-end text-right text-xs font-semibold ${
          error ? 'whitespace-nowrap text-danger-ink' : 'text-muted-strong'
        }`}
      >
        <span aria-live="polite" aria-atomic="true" className="flex items-center gap-1.5">
          {message?.status === 'loading' && (
            <>
              <Spinner />
              Loading {DECK_LABELS[message.deck]}…
            </>
          )}
        </span>
        <span aria-live="assertive" aria-atomic="true">
          {message?.status === 'error' && <>Couldn&apos;t load {DECK_LABELS[message.deck]}. Pick it again to retry.</>}
        </span>
      </p>
    </div>
  );
}
