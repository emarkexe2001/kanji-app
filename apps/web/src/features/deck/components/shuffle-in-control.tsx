import { useState } from 'react';
import type { StudyDeck } from '../hooks/use-study-deck';
import { DECK_IDS, DECK_LABELS, isDeckId, type DeckId } from '../utils/decks';
import {
  MIN_TICKED_DECKS,
  SHUFFLE_MODES,
  checkTicked,
  describeUnticked,
  parseShuffleInCount,
  type ShuffleChoice,
  type ShuffleMode,
} from '../utils/study-deck';
import { HC_DISABLED_BUTTON, HC_EMERALD_BUTTON } from '../utils/high-contrast-buttons';

/** A dropdown or number field. In High contrast (FEAT5_5) its white line is 2px (border plus a 1px inset ring). */
const fieldClass =
  'rounded-lg border border-field-line bg-field px-2 py-1.5 text-sm font-semibold hc:ring-1 hc:ring-field-line hc:ring-inset';
const errorClass = 'text-xs font-semibold text-danger-ink';

const MODE_LABELS: Record<ShuffleMode, string> = {
  deck: 'One deck',
  random: 'Random',
  multiple: 'Multiple decks',
};

/**
 * One segment of the "Shuffle in from" switch: a native radio (hidden, but still focused and
 * changed with the arrow keys) inside a label drawn as the segment. The chosen segment is
 * emerald-700 with white text (4.5:1 or better at this small size); keyboard focus is an outline inside the segment in its text colour.
 * In a high-contrast (forced colours) mode only system colours survive, so the segments use them
 * directly: the chosen one is Highlight with HighlightText, the others Canvas with CanvasText, a
 * disabled one GrayText.
 * In High contrast (FEAT5_5) the chosen segment is white with black text and the others black with
 * white text; keyboard focus is a 3px yellow outline, still inside the segment. A disabled one is
 * black with white text and a 2px dashed white outline inside it (agreed 2026-11-09), so it can
 * be told apart without fading to grey.
 */
const SEGMENT_CLASS = [
  'flex min-h-9 cursor-pointer items-center justify-center px-1 py-1 text-center text-[13px] leading-tight font-semibold',
  'text-ink-soft not-first:border-l not-first:border-seg-line',
  'has-checked:bg-emerald-700 has-checked:text-white',
  'has-focus-visible:outline-2 has-focus-visible:-outline-offset-4 has-focus-visible:outline-current',
  'has-disabled:cursor-not-allowed has-disabled:bg-section has-disabled:text-faint',
  'forced-colors:forced-color-adjust-none forced-colors:bg-[color:Canvas] forced-colors:text-[color:CanvasText]',
  'forced-colors:has-checked:bg-[color:Highlight] forced-colors:has-checked:text-[color:HighlightText]',
  'forced-colors:has-disabled:text-[color:GrayText]',
  'hc:has-checked:bg-white hc:has-checked:text-black',
  'hc:has-focus-visible:outline-3 hc:has-focus-visible:outline-hc-focus',
  'hc:has-disabled:bg-page hc:has-disabled:text-ink',
  'hc:has-disabled:outline-2 hc:has-disabled:-outline-offset-2 hc:has-disabled:outline-ink hc:has-disabled:outline-dashed',
].join(' ');

interface ModeSwitchProps {
  mode: ShuffleMode;
  /** Multiple decks can only be chosen with two or more other decks. */
  multipleAllowed: boolean;
  onChange: (mode: ShuffleMode) => void;
}

/** The "Shuffle in from" switch: One deck | Random | Multiple decks, a radio group drawn as connected segments. */
function ModeSwitch({ mode, multipleAllowed, onChange }: ModeSwitchProps) {
  return (
    <fieldset>
      <legend className="mb-1.5 text-sm font-semibold text-ink-soft">Shuffle in from</legend>
      {/* In High contrast (FEAT5_5) the switch's outer line is 2px: its border plus a 1px ring just
        outside it (an inset ring would be hidden under the segments). */}
      <div className="grid grid-cols-3 overflow-hidden rounded-lg border border-seg-line bg-field hc:ring-1 hc:ring-seg-line">
        {SHUFFLE_MODES.map((m) => {
          const disabled = m === 'multiple' && !multipleAllowed;
          return (
            <label key={m} className={SEGMENT_CLASS}>
              <input
                type="radio"
                name="shuffle-in-mode"
                value={m}
                checked={mode === m}
                disabled={disabled}
                aria-describedby={disabled ? 'shuffle-in-multiple-hint' : undefined}
                onChange={() => onChange(m)}
                className="sr-only"
              />
              {MODE_LABELS[m]}
            </label>
          );
        })}
      </div>
      {!multipleAllowed && (
        <p id="shuffle-in-multiple-hint" className="mt-1 text-right text-xs text-muted-strong">
          Needs at least two other decks.
        </p>
      )}
    </fieldset>
  );
}

interface TickedDecksProps {
  sources: DeckId[];
  ticked: DeckId[];
  error: string | null;
  onChange: (ticked: DeckId[]) => void;
}

/** Multiple decks: a checkbox for each deck that can be shuffled in from, 2 per row. */
function TickedDecks({ sources, ticked, error, onChange }: TickedDecksProps) {
  const toggle = (deck: DeckId, on: boolean) =>
    onChange(DECK_IDS.filter((d) => (d === deck ? on : ticked.includes(d))));
  return (
    <fieldset
      aria-describedby={error ? 'shuffle-in-decks-error' : undefined}
      className="rounded-lg border border-ticks-line bg-field px-2.5 pb-2"
    >
      <legend className="px-1 text-[13px] font-semibold text-ink-soft">Decks to shuffle in from</legend>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-sm text-ink-firm">
        {sources.map((deck) => (
          <label key={deck} className="flex min-h-8 cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={ticked.includes(deck)}
              onChange={(e) => toggle(deck, e.target.checked)}
              className="size-[18px] shrink-0 accent-emerald-600"
            />
            {DECK_LABELS[deck]}
          </label>
        ))}
      </div>
      {error && (
        <p id="shuffle-in-decks-error" role="alert" className={`mt-1 ${errorClass}`}>
          {error}
        </p>
      )}
    </fieldset>
  );
}

type ShuffleInError = { at: 'decks' | 'count'; text: string };

/**
 * Shuffle In Cards: swaps the card on screen (and, for more than one card, other random cards)
 * for new cards from other decks. The user picks where they come from (one deck, a random deck
 * for each card, or several ticked decks) and how many.
 */
export function ShuffleInControl({ study }: { study: StudyDeck }) {
  const [count, setCount] = useState('1');
  const [error, setError] = useState<ShuffleInError | null>(null);
  const { choice, sources, unticked } = study;

  // Picking another deck to study or changing the card limit makes the messages out of date, so
  // they are cleared (adjusting state while rendering, as React recommends over an effect).
  const deckKey = `${study.studied}:${study.cards.length}`;
  const [errorDeckKey, setErrorDeckKey] = useState(deckKey);
  if (errorDeckKey !== deckKey) {
    setErrorDeckKey(deckKey);
    setError(null);
  }

  if (!choice || !sources.length) {
    return (
      <div className="mt-4 rounded-xl bg-shuffle-box px-3 py-2 ring-1 ring-shuffle-line">
        <button
          type="button"
          disabled
          aria-describedby="shuffle-in-unavailable"
          className={`w-full rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white opacity-40 ${HC_DISABLED_BUTTON}`}
        >
          Shuffle In Cards
        </button>
        <p id="shuffle-in-unavailable" className="mt-2 text-center text-xs text-muted-strong">
          There&apos;s no other deck to shuffle in from.
        </p>
      </div>
    );
  }

  // Any change the user makes clears the messages.
  const change = (next: Partial<ShuffleChoice>) => {
    study.setChoice({ ...choice, ...next });
    setError(null);
  };

  const submit = () => {
    const tickError = choice.mode === 'multiple' ? checkTicked(choice.ticked) : null;
    if (tickError) return setError({ at: 'decks', text: tickError });
    const parsed = parseShuffleInCount(count, study.cards.length);
    const failed = parsed.ok ? study.shuffleIn(parsed.value) : parsed.error;
    setError(failed ? { at: 'count', text: failed } : null);
  };

  const countError = error?.at === 'count' ? error.text : null;

  return (
    <form
      noValidate
      className="mt-4 space-y-2 rounded-xl bg-shuffle-box px-3 py-2 ring-1 ring-shuffle-line"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <ModeSwitch
        mode={choice.mode}
        multipleAllowed={sources.length >= MIN_TICKED_DECKS}
        onChange={(mode) => change({ mode })}
      />
      {choice.mode === 'deck' && (
        <div>
          <label htmlFor="shuffle-in-deck" className="sr-only">
            Deck to shuffle in from
          </label>
          <select
            id="shuffle-in-deck"
            value={choice.deck}
            onChange={(e) => {
              if (isDeckId(e.target.value)) change({ deck: e.target.value });
            }}
            className={`w-full ${fieldClass}`}
          >
            {sources.map((deck) => (
              <option key={deck} value={deck}>
                {DECK_LABELS[deck]}
              </option>
            ))}
          </select>
        </div>
      )}
      {choice.mode === 'multiple' && (
        <TickedDecks
          sources={sources}
          ticked={choice.ticked}
          error={error?.at === 'decks' ? error.text : null}
          onChange={(ticked) => change({ ticked })}
        />
      )}
      {unticked.length > 0 && (
        <p role="status" className="text-xs font-semibold text-warn-ink">
          {describeUnticked(unticked)}
        </p>
      )}
      <div className="flex items-center justify-between gap-2">
        <label htmlFor="shuffle-in-count" className="text-sm font-semibold text-ink-soft">
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
            study.clearUnticked();
          }}
          aria-invalid={countError ? true : undefined}
          aria-describedby={countError ? 'shuffle-in-error' : undefined}
          className={`w-14 text-center tabular-nums ${fieldClass}`}
        />
      </div>
      {countError && (
        <p id="shuffle-in-error" role="alert" className={`text-right ${errorClass}`}>
          {countError}
        </p>
      )}
      <button
        type="submit"
        className={`w-full rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-emerald-500 active:scale-95 ${HC_EMERALD_BUTTON}`}
      >
        Shuffle In Cards
      </button>
    </form>
  );
}
