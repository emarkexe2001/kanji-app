import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useDismiss } from '../../../hooks/use-dismiss';
import { KEEP_PANEL_OPEN_ATTRIBUTE } from '../../../lib/keep-panel-open';
import type { CardFlights } from '../hooks/use-card-flights';
import { useReducedMotion } from '../hooks/use-reduced-motion';
import type { StudyDeck } from '../hooks/use-study-deck';
import { HC_EMERALD_BUTTON, HC_ROSE_BUTTON } from '../utils/high-contrast-buttons';
import { PickCard, type ListedCard } from './pick-card';
import { ClearListConfirm, FOOTER_ROW, PANEL_FOOTER, RecoverButton, panelButton } from './shuffled-out-panel-footer';

const toggle = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

/** How long the panel takes to lift away after cards are added back (the panel-lift animation, ADJ3). */
const PANEL_LIFT_MS = 180;

/** What the panel lists: the shuffled-out cards and the deck, and the cards being added back. */
interface PanelView {
  added: string[];
  shuffledOut: StudyDeck['shuffledOut'];
  deck: { id: string; card: ListedCard }[];
}

/** The id of the panel, which the "Shuffled out (N)" button controls (aria-controls). */
export const SHUFFLED_OUT_PANEL_ID = 'shuffled-out-panel';

/** The "Shuffled out (N)" button, found by the panel it controls, so focus can go back to it. */
const toggleButton = () => document.querySelector<HTMLElement>(`[aria-controls="${SHUFFLED_OUT_PANEL_ID}"]`);

/**
 * Presses that aren't outside the panel, although they are: the "Shuffled out (N)" button toggles
 * the panel itself, and the colour mode menu leaves it open (FEAT5).
 */
const PANEL_KEEP_OPEN = `[aria-controls="${SHUFFLED_OUT_PANEL_ID}"], [${KEEP_PANEL_OPEN_ATTRIBUTE}]`;

/** The cards to pick: two per row (ADJ2). They scroll with the rest of the panel's body. */
const CARD_GRID = 'grid grid-cols-2 gap-x-2 gap-y-3 p-2';

/**
 * Where the panel sits (ADJ2, ADJ2_5). It floats over the page (fixed). Its top is just below the
 * header, measured from the header itself (`--panel-top`, see usePanelTop), so it never covers
 * "Shuffled out (N)" however tall the header is:
 * - in the wide layout (`wide:`, WIDE_LAYOUT_MIN_WIDTH, 1100px, and up), beside the deck, which
 *   doesn't move: 300px wide, 24px from the right, at most 560px tall and never reaching closer
 *   than 24px to the bottom of the screen;
 * - below it, where a 300px panel would cover the deck: a pop-up, 300px wide but never wider than
 *   the screen less 16px (so the page can't scroll sideways), 8px from the right, and always 260px
 *   tall (its lists scroll inside it), so it doesn't grow when the Take out list appears and the
 *   deck card below it stays still. On a screen too short for that, it stops 8px above the bottom.
 *   The deck card moves below it while it is open (see Deck).
 */
const PANEL_PLACE = [
  'fixed z-40 flex flex-col top-(--panel-top)',
  'right-2 w-[min(300px,calc(100vw-16px))] h-[min(260px,calc(100dvh-var(--panel-top)-8px))]',
  'wide:right-6 wide:w-[300px] wide:h-auto wide:max-h-[min(560px,calc(100dvh-var(--panel-top)-24px))]',
].join(' ');

/**
 * Its look (ADJ2): a sky-50 panel with a sky-200 border (in Dark mode a dark blue panel with a
 * darker blue border, FEAT5), rounded corners and a large shadow.
 */
const PANEL_LOOK =
  'rounded-xl border border-panel-line bg-panel text-sm shadow-xl hc:shadow-none hc:ring-1 hc:ring-inset hc:ring-panel-line';

/**
 * The panel's body, between the title row and the buttons: the card lists scroll here. A card
 * added back that is scrolled out of view starts sliding from its edge (`data-flight-clip`, ADJ3).
 */
const PANEL_BODY = 'min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-2';

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
 * itself, and the colour mode menu leaves it open, FEAT5), or once cards have been added back;
 * focus then goes back to "Shuffled out (N)", unless the click outside put it somewhere else.
 * Closing it unmounts it, which drops any picks.
 * `onClose` closes it.
 *
 * Cards added back slide down out of the panel into the deck (ADJ3, `flights`). Until they have
 * all left it, the panel stays open, showing what it showed when Add Back Cards was pressed with
 * their places left empty, and can't be used (inert). Then it lifts away and closes. With reduced
 * motion on it closes straight away, as before.
 */
export function ShuffledOutPanel({
  study,
  onClose,
  flights,
  top = 0,
}: {
  study: StudyDeck;
  onClose: () => void;
  flights?: Pick<CardFlights, 'whenBackLands'>;
  /** How far down the screen its top goes: just below the header (ADJ2_5, see usePanelTop). */
  top?: number;
}) {
  const [adding, setAdding] = useState<string[]>([]);
  const [takingOut, setTakingOut] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [confirmingClear, setConfirmingClear] = useState(false);
  const panelRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const reducedMotion = useReducedMotion();
  const [sent, setSent] = useState<PanelView | null>(null);
  const [lifting, setLifting] = useState(false);
  const mounted = useRef(false);
  const liftTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const live: PanelView = {
    added: [],
    shuffledOut: study.shuffledOut,
    deck: study.cards.map((word, i) => ({
      id: study.cardIds[i],
      card: { entry: word, deck: study.cardDeck(i), isNew: study.isNew(i) },
    })),
  };
  // While the cards added back slide out, the panel keeps showing what it showed when they were sent.
  const { shuffledOut, deck } = sent ?? live;

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      clearTimeout(liftTimer.current);
    };
  }, []);

  /** Closes the panel, with focus back on "Shuffled out (N)" unless it has just gone elsewhere. */
  const close = () => {
    const active = document.activeElement;
    if (!active || active === document.body || panelRef.current?.contains(active)) toggleButton()?.focus();
    onClose();
  };
  // Focus goes into the panel when it opens.
  useEffect(() => closeButtonRef.current?.focus(), []);

  // Escape, or a click or tap outside the panel, closes it. A press that starts inside the panel
  // (e.g. selecting text) and ends outside doesn't close it (ADJ2_5, see useDismiss).
  useDismiss(panelRef, close, { closeOn: 'click', ignore: PANEL_KEEP_OPEN });

  const submit = () => {
    // Picks are kept in list order, newest first, whatever order they were ticked in.
    if (sent) return;
    const addIds = shuffledOut.map((c) => c.id).filter((id) => adding.includes(id));
    // Deck cards are tracked by their stored id, not their data, so a card with missing data can't
    // break the view (FEAT2_6).
    const takeOut = takingOut.map((id) => study.cardIds.indexOf(id)).filter((i) => i >= 0);
    const message = study.addBack(addIds, takeOut);
    if (message) {
      setError(message);
      return;
    }
    if (!flights) {
      close();
      return;
    }
    // The panel stays open until the cards have slid out of it (ADJ3), then lifts away.
    setSent({ ...live, added: addIds });
    flights.whenBackLands((animated) => {
      if (!mounted.current) return;
      if (!animated || reducedMotion) {
        close();
        return;
      }
      setLifting(true);
      liftTimer.current = setTimeout(close, PANEL_LIFT_MS);
    });
  };

  return (
    <section
      ref={panelRef}
      id={SHUFFLED_OUT_PANEL_ID}
      aria-labelledby="shuffled-out-heading"
      inert={sent !== null}
      style={{ '--panel-top': `${top}px` } as CSSProperties}
      className={`${PANEL_PLACE} ${PANEL_LOOK} ${reducedMotion ? '' : lifting ? 'panel-lift' : 'panel-drop'}`}
    >
      <div className="flex shrink-0 items-center justify-between gap-2 px-3 pt-2">
        <h3 id="shuffled-out-heading" className="font-bold text-ink-soft">
          Shuffled-out cards
        </h3>
        <button
          ref={closeButtonRef}
          type="button"
          aria-label="Close shuffled-out cards"
          onClick={close}
          className="flex size-8 items-center justify-center rounded-lg text-xl leading-none text-muted-strong transition hover:bg-panel-hover hover:text-ink-strong focus-visible:outline-2 focus-visible:outline-ink-soft"
        >
          <span aria-hidden>×</span>
        </button>
      </div>

      {shuffledOut.length === 0 ? (
        <>
          <div className={PANEL_BODY}>
            <p className="text-muted-strong">No cards have been shuffled out yet.</p>
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
          <div data-flight-clip className={PANEL_BODY}>
            <fieldset>
              <legend className="font-semibold text-ink-soft">Add back</legend>
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
                    sourceId={card.id}
                    gone={sent?.added.includes(card.id)}
                  />
                ))}
              </ul>
            </fieldset>

            {adding.length > 0 && (
              <fieldset>
                <legend className="font-semibold text-ink-soft">
                  Take out of your deck ({adding.length} to make room)
                </legend>
                <ul className={CARD_GRID}>
                  {deck.map(({ id, card }, i) => (
                    <PickCard
                      key={id}
                      number={i + 1}
                      labelPrefix={`Card ${i + 1}: `}
                      card={card}
                      kind="takeOut"
                      picked={takingOut.includes(id)}
                      onToggle={() => {
                        setTakingOut(toggle(takingOut, id));
                        setError(null);
                      }}
                    />
                  ))}
                </ul>
              </fieldset>
            )}
          </div>

          <div className={PANEL_FOOTER}>
            {error && (
              <p role="alert" className="text-xs font-semibold text-danger-ink">
                {error}
              </p>
            )}
            <div className={FOOTER_ROW}>
              <button
                type="submit"
                className={`bg-emerald-600 text-white hover:bg-emerald-500 ${panelButton} ${HC_EMERALD_BUTTON}`}
              >
                Add Back Cards
              </button>
              <button
                type="button"
                onClick={() => setConfirmingClear(true)}
                className={`bg-rose-600 text-white hover:bg-rose-500 ${panelButton} ${HC_ROSE_BUTTON}`}
              >
                Clear List
              </button>
            </div>
            {confirmingClear ? (
              <ClearListConfirm
                count={shuffledOut.length}
                onClear={() => {
                  study.clearShuffledOut();
                  setAdding([]);
                  setTakingOut([]);
                  setError(null);
                  setConfirmingClear(false);
                }}
                onCancel={() => setConfirmingClear(false)}
              />
            ) : (
              study.clearedCount > 0 && <RecoverButton study={study} />
            )}
          </div>
        </form>
      )}
    </section>
  );
}
