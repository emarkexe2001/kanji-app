import { DECK_LABELS, isDeckId, type DeckId } from '../utils/decks';

/** Picks the deck being studied. Changing it builds a new deck from the picked one. */
export function DeckPicker({
  decks,
  value,
  onChange,
}: {
  decks: DeckId[];
  value: DeckId;
  onChange: (deck: DeckId) => void;
}) {
  return (
    // In High contrast (FEAT5_5) the row has a 1px white line and the dropdown a 2px one, drawn as
    // inset rings so nothing changes size.
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
  );
}
