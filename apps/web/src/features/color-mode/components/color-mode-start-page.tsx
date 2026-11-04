import { useId } from 'react';
import { COLOR_MODES, JLPT_COLORS, MODE_COLORS, READING_COLORS_BY_MODE, type ColorMode } from '@kanji/core';
import { MODE_ICONS } from './color-mode-icons';
import { COLOR_MODE_NAMES } from './color-mode-menu';

/**
 * A tile (FEAT5_1): 168px tall at every width. Its focus ring and its border in a forced-colours
 * (high-contrast) mode are the same as the colour mode button's.
 */
const TILE = [
  'flex flex-col gap-2.5 rounded-xl border border-field-line bg-card p-2.5 text-left text-ink transition',
  'hover:bg-menu-selected active:scale-[0.98]',
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink',
  'forced-colors:border-[color:ButtonText]',
].join(' ');

/**
 * A mini card in `mode`'s colours, for decoration only. It uses the fixed colours from @kanji/core,
 * not the Tailwind colours: those follow the mode that is on the page, so on a dark device the
 * Light preview would turn dark too.
 */
function ModePreview({ mode }: { mode: ColorMode }) {
  const colors = MODE_COLORS[mode];
  const readings = READING_COLORS_BY_MODE[mode];
  return (
    <div
      aria-hidden
      className="flex h-[112px] flex-col justify-center rounded-lg p-3"
      style={{ background: colors.page, boxShadow: `inset 0 0 0 1px ${colors['card-line']}` }}
    >
      <div
        className="overflow-hidden rounded-lg"
        style={{
          background: colors.card,
          boxShadow: `0 0 0 1px ${colors['card-line']}, 0 4px 8px -4px rgb(15 23 42 / 0.35)`,
        }}
      >
        <div
          className="px-2 py-0.5 text-[8px] leading-3 font-bold tracking-wide text-white"
          style={{ background: JLPT_COLORS.N5 }}
        >
          JLPT N5
        </div>
        <div className="px-2 pt-1.5 pb-2">
          <p className="text-xl leading-7 font-bold">
            <span style={{ color: readings.kunyomi, borderBottom: `2px solid ${readings.kunyomi}` }}>静</span>
            <span style={{ color: readings.okurigana, borderBottom: `2px solid ${readings.okurigana}` }}>か</span>
          </p>
          <div className="mt-1.5 h-1.5 w-4/5 rounded-full" style={{ background: colors['card-line'] }} />
          <div className="mt-1 h-1.5 w-[55%] rounded-full" style={{ background: colors['card-line'] }} />
        </div>
      </div>
    </div>
  );
}

function ModeTile({ mode, onChoose }: { mode: ColorMode; onChoose: (mode: ColorMode) => void }) {
  const Icon = MODE_ICONS[mode];
  return (
    <button type="button" onClick={() => onChoose(mode)} className={TILE}>
      <ModePreview mode={mode} />
      <span className="flex h-6 items-center gap-2 text-base font-bold">
        <Icon size={18} />
        {COLOR_MODE_NAMES[mode]}
      </span>
    </button>
  );
}

/**
 * The start page (FEAT5_1), shown in place of the deck while no colour mode has been chosen. It
 * asks for a mode with a tile for each, Light then Dark, each showing a mini card in that mode.
 * Nothing is focused when it opens and no tile looks chosen. It sits in the middle of the space
 * between the header and the footer, and has no animation.
 */
export function ColorModeStartPage({ onChoose }: { onChoose: (mode: ColorMode) => void }) {
  const headingId = useId();
  return (
    <section aria-labelledby={headingId} className="flex flex-1 flex-col justify-center py-6">
      <h2 id={headingId} className="text-xl font-bold">
        Choose how the app looks
      </h2>
      <p className="mt-1.5 text-sm text-muted-strong">You can change this any time from the menu in the top left.</p>
      <div role="group" aria-labelledby={headingId} className="mt-5 grid grid-cols-2 gap-3">
        {COLOR_MODES.map((mode) => (
          <ModeTile key={mode} mode={mode} onChoose={onChoose} />
        ))}
      </div>
    </section>
  );
}
