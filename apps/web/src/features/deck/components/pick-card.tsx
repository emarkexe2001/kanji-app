import { useId, type CSSProperties } from 'react';
import {
  FALLBACK_INK,
  PICK_COLORS,
  PICK_OUTLINE_COLORS,
  PICK_TICK_COLORS,
  modeColor,
  type PickKind,
  type WordEntry,
} from '@kanji/core';
import { useColorMode } from '../../../hooks/use-color-mode';
import { DECK_LABELS, type DeckId } from '../utils/decks';
import { flightSourceMarker } from '../utils/dom-markers';
import { CardCantBeShown } from './card-cant-be-shown';
import { CardErrorBoundary } from './card-error-boundary';
import { WordCard } from './word-card';

const wordLabel = (w: WordEntry) => `${w.word}【${w.reading}】`;

export interface ListedCard {
  /** The card's data, or undefined when it is missing (FEAT2_6, CHORE8). */
  entry: WordEntry | undefined;
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
  card: ListedCard & { entry: WordEntry };
  kind: PickKind;
  picked: boolean;
  onToggle: () => void;
  /** Marks the card as where a card added back starts sliding from (ADJ3). */
  sourceId?: string;
  /** The card has slid out of the panel into the deck (ADJ3): its place is left empty. */
  gone?: boolean;
}

/**
 * One card in a list of cards to pick (FEAT2_5): its number above it, then the compact card,
 * picked by selecting the card itself. A card whose data is missing shows "This card can't be
 * shown." in its place, with nothing to pick (FEAT2_6, CHORE8), and the rest of the list keeps
 * working. The card also sits in its own error boundary, as a safety net for a card that throws
 * while it is drawn: that shows the same message.
 */
export function PickCard({
  number,
  card,
  ...props
}: Omit<PickCardProps, 'card'> & { card: ListedCard; number: number }) {
  const { entry } = card;
  return (
    <li>
      <span className="mb-1 block text-[10px] font-bold text-muted tabular-nums wide:text-[11px]">{number}</span>
      <CardErrorBoundary>
        {entry ? <PickCardBody {...props} card={{ ...card, entry }} /> : <CardCantBeShown />}
      </CardErrorBoundary>
    </li>
  );
}

/**
 * The card itself, for a card whose data is there. Everything drawn from the card's data, its name
 * included, is worked out here, inside the error boundary, so a card whose data is broken only
 * breaks itself, not the whole view (FEAT2_6).
 *
 * A picked card gets an outline and a tick, green when it is being added back and red when it is
 * being taken out. In a high-contrast (forced colours) mode, where those colours are dropped, see
 * FORCED_COLORS_PICK_CARD. A visually hidden checkbox inside makes it reachable with Tab, toggled with Space (or Enter,
 * once however long it is held) and announced as picked (checked) or not. Screen readers hear its
 * word and reading, then its meaning, the deck it came from and "New" if it is new.
 */
function PickCardBody({ labelPrefix = '', card, kind, picked, onToggle, sourceId, gone }: PickCardProps) {
  const id = useId();
  const mode = useColorMode();
  const highContrast = mode === 'high-contrast';
  // The tick keeps PICK_COLORS in Light and Dark; in High contrast it is the bright pick colour
  // with a black tick (FEAT5_5). A missing colour falls back to white, which the black tick reads on.
  const color = modeColor(PICK_TICK_COLORS, mode, kind, highContrast ? FALLBACK_INK[mode] : PICK_COLORS[kind]);
  // The outline is brighter in Dark mode, so it shows on the dark panel (FEAT5), and again in High
  // contrast (FEAT5_5); a missing one falls back to the mode's text colour (white in High contrast).
  const outline = modeColor(PICK_OUTLINE_COLORS, mode, kind, FALLBACK_INK[mode]);
  const describedBy = [`${id}-meaning`, `${id}-from`, ...(card.isNew ? [`${id}-new`] : [])].join(' ');
  return (
    // In High contrast (FEAT5_5) a picked card's ring is 3px (the 8px gap leaves 2px between two
    // picked cards) and keyboard focus is a 2px yellow outline 5px out, clear of that ring.
    <label
      style={{ '--pick': outline } as CSSProperties}
      {...flightSourceMarker(sourceId)}
      className={`${gone ? 'invisible' : ''} relative block cursor-pointer rounded-lg transition has-checked:ring-2 has-checked:ring-(--pick) has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ink-soft hc:has-checked:ring-3 hc:has-focus-visible:outline-offset-[5px] hc:has-focus-visible:outline-hc-focus ${FORCED_COLORS_PICK_CARD}`}
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
        <p id={`${id}-from`} className="text-[9px] font-semibold text-from-ink wide:text-[10px]">
          From {DECK_LABELS[card.deck]}
        </p>
      </WordCard>
      {picked && (
        <span
          aria-hidden
          style={{ backgroundColor: color }}
          className="absolute -top-2 -right-2 z-10 flex size-6 items-center justify-center rounded-full text-sm font-bold text-white shadow forced-colors:border-2 forced-colors:border-[color:Highlight] forced-colors:bg-[color:Canvas]! forced-colors:text-[color:Highlight] hc:text-black hc:shadow-[0_0_0_2px_#000]"
        >
          ✓
        </span>
      )}
    </label>
  );
}
