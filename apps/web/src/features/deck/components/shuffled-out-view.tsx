import { useEffect, useEffectEvent, useId, useRef, useState, type CSSProperties } from 'react';
import { PICK_COLORS, type PickKind, type WordEntry } from '@kanji/core';
import { useReducedMotion } from '../hooks/use-reduced-motion';
import type { StudyDeck } from '../hooks/use-study-deck';
import { DECK_LABELS, type DeckId } from '../utils/decks';
import { CardErrorBoundary } from './card-error-boundary';
import { WordCard } from './word-card';

const wordLabel = (w: WordEntry) => `${w.word}【${w.reading}】`;

const toggle = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

interface ListedCard {
  entry: WordEntry;
  /** The deck it came from, shown as "From JLPT N4". */
  deck: DeckId;
  /** A shuffled-in card that still shows "New" in the deck. */
  isNew?: boolean;
}

/**
 * How a pick card looks in a high-contrast (forced colours) mode (FEAT2_6), where the device
 * replaces the page's colours with its own and drops the ring and tick colours. Only system
 * colours survive there, so they are set on every part of the card:
 * - a picked card turns fully Highlight: the compact card (the label's `div`) and everything in
 *   it, header included, get a Highlight background and HighlightText text (`!` so they beat the
 *   header's inline colour), with a 3px solid Highlight outline 2px out. The tick, outside that
 *   `div`, keeps its own Canvas/Highlight ring;
 * - keyboard focus is a 2px dashed CanvasText outline 5px out on the label, just outside the
 *   picked card's outline, so it shows on picked and unpicked cards alike.
 * Normal colours are not affected.
 */
const FORCED_COLORS_PICK_CARD = [
  'forced-colors:has-checked:[&>div]:outline-3',
  'forced-colors:has-checked:[&>div]:outline-solid',
  'forced-colors:has-checked:[&>div]:outline-offset-2',
  'forced-colors:has-checked:[&>div]:outline-[color:Highlight]',
  'forced-colors:has-checked:[&>div]:bg-[color:Highlight]!',
  'forced-colors:has-checked:[&>div]:text-[color:HighlightText]!',
  'forced-colors:has-checked:[&>div_*]:bg-[color:Highlight]!',
  'forced-colors:has-checked:[&>div_*]:text-[color:HighlightText]!',
  'forced-colors:has-focus-visible:outline-2',
  'forced-colors:has-focus-visible:outline-dashed',
  'forced-colors:has-focus-visible:outline-offset-[5px]',
  'forced-colors:has-focus-visible:outline-[color:CanvasText]',
].join(' ');

interface PickCardProps {
  /** Put before the word and reading in the card's name, e.g. "Card 3: ". */
  labelPrefix?: string;
  card: ListedCard;
  kind: PickKind;
  picked: boolean;
  onToggle: () => void;
}

/**
 * One card in a list of cards to pick (FEAT2_5): its number above it, then the compact card,
 * picked by selecting the card itself. The card sits in its own error boundary, so a card that
 * can't be drawn shows "This card can't be shown." and the rest of the list keeps working.
 */
function PickCard({ number, ...props }: PickCardProps & { number: number }) {
  return (
    <li>
      <span className="mb-1 block text-[10px] font-bold text-slate-500 tabular-nums lg:text-[11px]">{number}</span>
      <CardErrorBoundary>
        <PickCardBody {...props} />
      </CardErrorBoundary>
    </li>
  );
}

/**
 * The card itself. Everything drawn from the card's data, its name included, is worked out here,
 * inside the error boundary, so a card whose data is missing completely only breaks itself, not
 * the whole view (FEAT2_6).
 *
 * A picked card gets an outline and a tick, green when it is being added back and red when it is
 * being taken out. In a high-contrast (forced colours) mode, where those colours are dropped, see
 * FORCED_COLORS_PICK_CARD. A visually hidden checkbox inside makes it reachable with Tab, toggled with Space (or Enter,
 * once however long it is held) and announced as picked (checked) or not. Screen readers hear its
 * word and reading, then its meaning, the deck it came from and "New" if it is new.
 */
function PickCardBody({ labelPrefix = '', card, kind, picked, onToggle }: PickCardProps) {
  const id = useId();
  const color = PICK_COLORS[kind];
  const describedBy = [`${id}-meaning`, `${id}-from`, ...(card.isNew ? [`${id}-new`] : [])].join(' ');
  return (
    <label
      style={{ '--pick': color } as CSSProperties}
      className={`relative block cursor-pointer rounded-lg transition has-checked:ring-2 has-checked:ring-(--pick) has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-slate-700 ${FORCED_COLORS_PICK_CARD}`}
    >
      <input
        type="checkbox"
        checked={picked}
        onChange={onToggle}
        onKeyDown={(e) => {
          if (e.key !== 'Enter') return;
          e.preventDefault();
          // Holding Enter repeats the key press; only the first one picks or un-picks the card.
          if (!e.repeat) onToggle();
        }}
        aria-label={`${labelPrefix}${wordLabel(card.entry)}`}
        aria-describedby={describedBy}
        className="sr-only"
      />
      <WordCard entry={card.entry} compact isNew={card.isNew} idPrefix={id}>
        <p id={`${id}-from`} className="text-[9px] font-semibold text-sky-800 lg:text-[10px]">
          From {DECK_LABELS[card.deck]}
        </p>
      </WordCard>
      {picked && (
        <span
          aria-hidden
          style={{ backgroundColor: color }}
          className="absolute -top-2 -right-2 z-10 flex size-6 items-center justify-center rounded-full text-sm font-bold text-white shadow forced-colors:border-2 forced-colors:border-[color:Highlight] forced-colors:bg-[color:Canvas]! forced-colors:text-[color:Highlight]"
        >
          ✓
        </span>
      )}
    </label>
  );
}

/** The id of the panel, which the "Shuffled out (N)" button controls (aria-controls). */
export const SHUFFLED_OUT_PANEL_ID = 'shuffled-out-panel';

/** The "Shuffled out (N)" button, found by the panel it controls, so focus can go back to it. */
const toggleButton = () => document.querySelector<HTMLElement>(`[aria-controls="${SHUFFLED_OUT_PANEL_ID}"]`);

/** The cards to pick: two per row (ADJ2). They scroll with the rest of the panel's body. */
const CARD_GRID = 'grid grid-cols-2 gap-x-2 gap-y-3 p-2';

/**
 * Where the panel sits (ADJ2). It floats over the page (fixed), so the deck never moves for it:
 * - from lg (1024px) up: 300px wide in the top right, 72px from the top (just below the header)
 *   and 24px from the right, at most 560px tall and never taller than the screen;
 * - below lg, where a 300px panel would cover the deck card: a smaller pop-up, 300px wide but
 *   never wider than the screen less 16px (so the page can't scroll sideways), 8px from the right,
 *   just below the header (two lines high when the title wraps on a narrow phone, one line from
 *   sm up) and at most 380px tall. The deck card shrinks and moves below it while it is open.
 */
const PANEL_PLACE = [
  'fixed z-40 flex flex-col',
  'top-[92px] right-2 w-[min(300px,calc(100vw-16px))] max-h-[min(380px,calc(100dvh-100px))]',
  'sm:top-[72px]',
  'lg:right-6 lg:w-[300px] lg:max-h-[min(560px,calc(100dvh-96px))]',
].join(' ');

/** Its look (ADJ2): a sky-50 panel with a sky-200 border, rounded corners and a large shadow. */
const PANEL_LOOK = 'rounded-xl border border-sky-200 bg-sky-50 text-sm shadow-xl';

/** The panel's body, between the title row and the buttons: the card lists scroll here. */
const PANEL_BODY = 'min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-2';

/** The bottom of the panel, always in view: the buttons, the Clear List confirmation and messages. */
const PANEL_FOOTER = 'shrink-0 space-y-2 border-t border-sky-200 px-3 py-3';

/** Add Back Cards and Clear List, side by side (ADJ2). */
const FOOTER_ROW = 'grid grid-cols-2 gap-2';

/** The panel's buttons have less padding than the header's, so two fit side by side in 300px. */
const panelButton = 'rounded-xl px-2 py-2 text-sm font-semibold shadow-sm transition active:scale-95';

/** "Recover cleared list (N)" (FEAT2_7): sky blue and filled, like "Shuffled out (N)". */
function RecoverButton({ study }: { study: StudyDeck }) {
  return (
    <button
      type="button"
      onClick={study.recoverCleared}
      className={`w-full bg-sky-600 text-white hover:bg-sky-500 ${panelButton}`}
    >
      Recover cleared list ({study.clearedCount})
    </button>
  );
}

/** The Clear List confirmation, with the number of cards: it says the list can be recovered. */
const confirmClearText = (count: number) =>
  count === 1 ? 'Clear 1 card? You can recover it later.' : `Clear all ${count} cards? You can recover them later.`;

/**
 * The "Shuffled out (3)" button (FEAT2). The app shows it in the header, top right beside the
 * title (ADJ1); it keeps its full label, so on a narrow phone the title wraps instead. It opens
 * and closes the panel, and says whether the panel is open: aria-expanded for screen readers, and
 * an arrow (▾ closed, ▴ open) that is hidden from them so the name stays "Shuffled out (3)". The
 * label and arrow never wrap.
 */
export function ShuffledOutButton({ count, open, onToggle }: { count: number; open: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      aria-expanded={open}
      aria-controls={SHUFFLED_OUT_PANEL_ID}
      onClick={onToggle}
      className="shrink-0 rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold whitespace-nowrap text-white shadow-sm transition hover:bg-sky-500 active:scale-95"
    >
      Shuffled out ({count})<span aria-hidden> {open ? '▴' : '▾'}</span>
    </button>
  );
}

/**
 * The view the "Shuffled out (3)" button opens (FEAT2): the cards that left the deck,
 * newest first, with the deck each came from. The user picks cards to add back and the same
 * number of deck cards to take out in their place, or clears the list (after confirming). A
 * cleared list can be recovered until Clear List is pressed again (FEAT2_7).
 * Both lists show compact cards in a numbered grid, picked by selecting the card (FEAT2_5).
 *
 * It floats in the top right, below the header (ADJ2, see PANEL_PLACE), and slides down into
 * place unless "reduce motion" is on. Focus moves to its × button when it opens. It closes with
 * the × button, Escape, a click or tap outside it (the "Shuffled out (N)" button toggles it
 * itself), or once cards have been added back; focus then goes back to "Shuffled out (N)",
 * unless the click outside put it somewhere else. Closing it unmounts it, which drops any picks.
 * `onClose` closes it.
 */
export function ShuffledOutPanel({ study, onClose }: { study: StudyDeck; onClose: () => void }) {
  const [adding, setAdding] = useState<string[]>([]);
  const [takingOut, setTakingOut] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [confirmingClear, setConfirmingClear] = useState(false);
  const panelRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const reducedMotion = useReducedMotion();
  const { shuffledOut, cards, cardIds } = study;

  /** Closes the panel, with focus back on "Shuffled out (N)" unless it has just gone elsewhere. */
  const close = () => {
    const active = document.activeElement;
    if (!active || active === document.body || panelRef.current?.contains(active)) toggleButton()?.focus();
    onClose();
  };
  const closeFromOutside = useEffectEvent(close);

  // Focus goes into the panel when it opens.
  useEffect(() => closeButtonRef.current?.focus(), []);

  // Escape, or a click or tap outside the panel, closes it. The listeners run in the capture phase,
  // before the click is handled, so a click inside always finds its target still in the panel.
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const isOutside = (target: EventTarget | null) =>
      target instanceof Node &&
      !panel.contains(target) &&
      !(target instanceof Element && target.closest(`[aria-controls="${SHUFFLED_OUT_PANEL_ID}"]`));
    // A press that starts inside the panel (e.g. selecting text) and ends outside doesn't close it.
    let pressedInside = false;
    const onPointerDown = (e: Event) => {
      pressedInside = !isOutside(e.target);
    };
    const onClick = (e: Event) => {
      const startedInside = pressedInside;
      pressedInside = false;
      if (!startedInside && isOutside(e.target)) closeFromOutside();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeFromOutside();
    };
    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('click', onClick, true);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true);
      document.removeEventListener('click', onClick, true);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  const submit = () => {
    // Picks are kept in list order, newest first, whatever order they were ticked in.
    const addIds = shuffledOut.map((c) => c.id).filter((id) => adding.includes(id));
    // Deck cards are tracked by their stored id, not their data, so a card with missing data can't
    // break the view (FEAT2_6).
    const takeOut = takingOut.map((id) => cardIds.indexOf(id)).filter((i) => i >= 0);
    const message = study.addBack(addIds, takeOut);
    if (message) {
      setError(message);
      return;
    }
    close();
  };

  return (
    <section
      ref={panelRef}
      id={SHUFFLED_OUT_PANEL_ID}
      aria-labelledby="shuffled-out-heading"
      className={`${PANEL_PLACE} ${PANEL_LOOK} ${reducedMotion ? '' : 'panel-drop'}`}
    >
      <div className="flex shrink-0 items-center justify-between gap-2 px-3 pt-2">
        <h3 id="shuffled-out-heading" className="font-bold text-slate-700">
          Shuffled-out cards
        </h3>
        <button
          ref={closeButtonRef}
          type="button"
          aria-label="Close shuffled-out cards"
          onClick={close}
          className="flex size-8 items-center justify-center rounded-lg text-xl leading-none text-slate-600 transition hover:bg-sky-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-slate-700"
        >
          <span aria-hidden>×</span>
        </button>
      </div>

      {shuffledOut.length === 0 ? (
        <>
          <div className={PANEL_BODY}>
            <p className="text-slate-600">No cards have been shuffled out yet.</p>
          </div>
          {study.clearedCount > 0 && (
            <div className={PANEL_FOOTER}>
              <RecoverButton study={study} />
            </div>
          )}
        </>
      ) : (
        <form
          noValidate
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <div className={PANEL_BODY}>
            <fieldset>
              <legend className="font-semibold text-slate-700">Add back</legend>
              <ul className={CARD_GRID}>
                {shuffledOut.map((card, i) => (
                  <PickCard
                    key={card.id}
                    number={i + 1}
                    card={{ entry: card.word, deck: card.deck }}
                    kind="addBack"
                    picked={adding.includes(card.id)}
                    onToggle={() => {
                      setAdding(toggle(adding, card.id));
                      setError(null);
                    }}
                  />
                ))}
              </ul>
            </fieldset>

            {adding.length > 0 && (
              <fieldset>
                <legend className="font-semibold text-slate-700">
                  Take out of your deck ({adding.length} to make room)
                </legend>
                <ul className={CARD_GRID}>
                  {cards.map((word, i) => {
                    const id = cardIds[i];
                    return (
                      <PickCard
                        key={id}
                        number={i + 1}
                        labelPrefix={`Card ${i + 1}: `}
                        card={{ entry: word, deck: study.cardDeck(i), isNew: study.isNew(i) }}
                        kind="takeOut"
                        picked={takingOut.includes(id)}
                        onToggle={() => {
                          setTakingOut(toggle(takingOut, id));
                          setError(null);
                        }}
                      />
                    );
                  })}
                </ul>
              </fieldset>
            )}
          </div>

          <div className={PANEL_FOOTER}>
            {error && (
              <p role="alert" className="text-xs font-semibold text-rose-600">
                {error}
              </p>
            )}
            <div className={FOOTER_ROW}>
              <button type="submit" className={`bg-emerald-600 text-white hover:bg-emerald-500 ${panelButton}`}>
                Add Back Cards
              </button>
              <button
                type="button"
                onClick={() => setConfirmingClear(true)}
                className={`bg-rose-600 text-white hover:bg-rose-500 ${panelButton}`}
              >
                Clear List
              </button>
            </div>
            {confirmingClear ? (
              <div className="space-y-2 rounded-lg border border-rose-200 bg-white p-2">
                <p className="font-semibold text-rose-700">{confirmClearText(shuffledOut.length)}</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      study.clearShuffledOut();
                      setAdding([]);
                      setTakingOut([]);
                      setError(null);
                      setConfirmingClear(false);
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
              study.clearedCount > 0 && <RecoverButton study={study} />
            )}
          </div>
        </form>
      )}
    </section>
  );
}
