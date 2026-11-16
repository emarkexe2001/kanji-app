import { HC_SKY_BUTTON } from '../../../lib/high-contrast-buttons';
import { SHUFFLED_OUT_PANEL_ID } from './shuffled-out-panel';

/**
 * The "Shuffled out (N)" button bumps each time a card lands in it (ADJ3). `bump` goes up by one
 * for each card, and the class switches between two copies of the bump so the next one starts
 * again. (A class name is the only way tests can see it: jsdom doesn't run CSS animations.)
 */
const bumpClass = (bump: number) => (bump === 0 ? '' : bump % 2 ? 'count-bump' : 'count-bump-again');

/**
 * The "Shuffled out (3)" button (FEAT2). The app shows it in the header, top right beside the
 * title (ADJ1); it keeps its full label, so on a narrow phone the title wraps instead. It opens
 * and closes the panel, and says whether the panel is open: aria-expanded for screen readers, and
 * an arrow (▾ closed, ▴ open) that is hidden from them so the name stays "Shuffled out (3)". The
 * label and arrow never wrap. While cards slide into it, `count` is the count before they land
 * (ADJ3), and it bumps as each one does (`bump`).
 */
export function ShuffledOutButton({
  count,
  open,
  onToggle,
  bump = 0,
}: {
  count: number;
  open: boolean;
  onToggle: () => void;
  bump?: number;
}) {
  return (
    <button
      type="button"
      aria-expanded={open}
      aria-controls={SHUFFLED_OUT_PANEL_ID}
      onClick={onToggle}
      className={`${bumpClass(bump)} shrink-0 rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold whitespace-nowrap text-white shadow-sm transition hover:bg-sky-500 active:scale-95 ${HC_SKY_BUTTON}`}
    >
      Shuffled out ({count})<span aria-hidden> {open ? '▴' : '▾'}</span>
    </button>
  );
}
