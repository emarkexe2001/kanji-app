import { buttonClass } from '../../../lib/button-classes';
import type { StudyDeck } from '../hooks/use-study-deck';

/**
 * The bottom of the panel, always in view: the buttons, the Clear List confirmation and messages.
 * In High contrast (FEAT5_5) the line above it is 2px: its 1px border plus a 1px inset shadow.
 */
export const PANEL_FOOTER =
  'shrink-0 space-y-2 border-t border-panel-line px-3 py-3 hc:shadow-[inset_0_1px_0_0_var(--color-panel-line)]';

/** Add Back Cards and Clear List, side by side (ADJ2). */
export const FOOTER_ROW = 'grid grid-cols-2 gap-2';

/**
 * Cancel's shape: the same as buttonClass's 'panel' size, which the panel's filled buttons use.
 * Cancel isn't a filled colour button, so it keeps its own look (CHORE7).
 */
const panelButton = 'rounded-xl px-2 py-2 text-sm font-semibold shadow-sm transition active:scale-95';

/** "Recover cleared list (N)" (FEAT2_7): sky blue and filled, like "Shuffled out (N)", and outlined like it in High contrast. */
export function RecoverButton({ study }: { study: StudyDeck }) {
  return (
    <button type="button" onClick={study.recoverCleared} className={`w-full ${buttonClass('sky', 'panel')}`}>
      Recover cleared list ({study.clearedCount})
    </button>
  );
}

/** The Clear List confirmation, with the number of cards: it says the list can be recovered. */
const confirmClearText = (count: number) =>
  count === 1 ? 'Clear 1 card? You can recover it later.' : `Clear all ${count} cards? You can recover them later.`;

/**
 * The Clear List confirmation (FEAT2_7), shown below Add Back Cards and Clear List: how many cards
 * will be cleared, then "Yes, Clear List" (`onClear`) and Cancel (`onCancel`).
 */
export function ClearListConfirm({
  count,
  onClear,
  onCancel,
}: {
  count: number;
  onClear: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="space-y-2 rounded-lg border border-danger-line bg-card p-2 hc:ring-1 hc:ring-danger-line hc:ring-inset">
      <p className="font-semibold text-danger-ink-strong">{confirmClearText(count)}</p>
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={onClear} className={buttonClass('rose', 'panel')}>
          Yes, Clear List
        </button>
        <button
          type="button"
          onClick={onCancel}
          className={`border border-field-line bg-field text-ink-soft hover:bg-field-hover ${panelButton} hc:shadow-none hc:ring-1 hc:ring-field-line hc:ring-inset`}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
