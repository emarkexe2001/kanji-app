import { useState, type ReactNode } from 'react';
import type { WordEntry } from '@kanji/core';
import type { StudyDeck } from '../hooks/use-study-deck';
import { DECK_LABELS, cardId } from '../utils/decks';

const wordLabel = (w: WordEntry) => `${w.word}【${w.reading}】`;

const toggle = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

function PickRow({
  checked,
  onChange,
  label,
  children,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  children?: ReactNode;
}) {
  return (
    <li>
      <label className="flex items-start gap-2 rounded-lg px-2 py-1.5 hover:bg-white">
        <input type="checkbox" checked={checked} onChange={onChange} aria-label={label} className="mt-1" />
        <span className="flex-1">
          <span className="font-semibold text-slate-900">{label}</span>
          {children}
        </span>
      </label>
    </li>
  );
}

const panelButton = 'rounded-xl px-4 py-2 text-sm font-semibold shadow-sm transition active:scale-95';

/**
 * The "Shuffled out (3)" button and the view it opens (FEAT2): the cards that left the deck,
 * newest first, with the deck each came from. The user picks cards to add back and the same
 * number of deck cards to take out in their place, or clears the list (after confirming).
 */
export function ShuffledOutView({ study }: { study: StudyDeck }) {
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState<string[]>([]);
  const [takingOut, setTakingOut] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [confirmingClear, setConfirmingClear] = useState(false);
  const { shuffledOut, cards } = study;

  const reset = () => {
    setAdding([]);
    setTakingOut([]);
    setError(null);
    setConfirmingClear(false);
  };

  const submit = () => {
    // Picks are kept in list order, newest first, whatever order they were ticked in.
    const addIds = shuffledOut.map((c) => c.id).filter((id) => adding.includes(id));
    const takeOut = takingOut.map((id) => cards.findIndex((w) => cardId(w) === id)).filter((i) => i >= 0);
    const message = study.addBack(addIds, takeOut);
    if (message) {
      setError(message);
      return;
    }
    reset();
    setOpen(false);
  };

  return (
    <div className="mt-4">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="shuffled-out-panel"
        onClick={() => {
          setOpen(!open);
          reset();
        }}
        className={`w-full bg-sky-600 text-white hover:bg-sky-500 ${panelButton}`}
      >
        Shuffled out ({shuffledOut.length})
      </button>

      {open && (
        <section
          id="shuffled-out-panel"
          aria-labelledby="shuffled-out-heading"
          className="mt-2 space-y-3 rounded-xl bg-sky-50 px-3 py-3 text-sm"
        >
          <h3 id="shuffled-out-heading" className="font-bold text-slate-700">
            Shuffled-out cards
          </h3>

          {shuffledOut.length === 0 ? (
            <p className="text-slate-600">No cards have been shuffled out yet.</p>
          ) : (
            <>
              <form
                noValidate
                className="space-y-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  submit();
                }}
              >
                <fieldset>
                  <legend className="font-semibold text-slate-700">Add back</legend>
                  <ul className="max-h-60 overflow-y-auto">
                    {shuffledOut.map((card) => (
                      <PickRow
                        key={card.id}
                        label={wordLabel(card.word)}
                        checked={adding.includes(card.id)}
                        onChange={() => {
                          setAdding(toggle(adding, card.id));
                          setError(null);
                        }}
                      >
                        <span className="block text-slate-600">{card.word.meaning}</span>
                        <span className="text-xs font-semibold text-sky-800">From {DECK_LABELS[card.deck]}</span>
                      </PickRow>
                    ))}
                  </ul>
                </fieldset>

                {adding.length > 0 && (
                  <fieldset>
                    <legend className="font-semibold text-slate-700">
                      Take out of your deck ({adding.length} to make room)
                    </legend>
                    <ul className="max-h-60 overflow-y-auto">
                      {cards.map((word, i) => (
                        <PickRow
                          key={cardId(word)}
                          label={`Card ${i + 1}: ${wordLabel(word)}`}
                          checked={takingOut.includes(cardId(word))}
                          onChange={() => {
                            setTakingOut(toggle(takingOut, cardId(word)));
                            setError(null);
                          }}
                        />
                      ))}
                    </ul>
                  </fieldset>
                )}

                {error && (
                  <p role="alert" className="text-xs font-semibold text-rose-600">
                    {error}
                  </p>
                )}
                <button
                  type="submit"
                  className={`w-full bg-emerald-600 text-white hover:bg-emerald-500 ${panelButton}`}
                >
                  Add Back Cards
                </button>
              </form>

              {confirmingClear ? (
                <div className="space-y-2 rounded-lg border border-rose-200 bg-white p-2">
                  <p className="font-semibold text-rose-700">
                    Clear all {shuffledOut.length} shuffled-out cards? This can&apos;t be undone.
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        study.clearShuffledOut();
                        reset();
                      }}
                      className={`bg-rose-600 text-white hover:bg-rose-500 ${panelButton}`}
                    >
                      Yes, Clear List
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmingClear(false)}
                      className={`border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 ${panelButton}`}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmingClear(true)}
                  className={`w-full bg-rose-600 text-white hover:bg-rose-500 ${panelButton}`}
                >
                  Clear List
                </button>
              )}
            </>
          )}
        </section>
      )}
    </div>
  );
}
