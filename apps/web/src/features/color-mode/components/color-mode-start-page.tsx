import { useId } from 'react';
import {
  COLOR_MODES,
  FALLBACK_HEADER,
  JLPT_COLORS_BY_MODE,
  MODE_COLORS,
  READING_COLORS_BY_MODE,
  modeColor,
  type ColorMode,
} from '@kanji/core';
import { MODE_ICONS } from './color-mode-icons';
import { COLOR_MODE_NAMES } from './color-mode-menu';

/**
 * A tile (FEAT5_1). Its focus ring and its border in a forced-colours (high-contrast) mode are the
 * same as the colour mode button's. How it is laid out is TILE_LAYOUT's.
 */
const TILE = [
  'rounded-xl border border-field-line bg-card p-2.5 text-left text-ink transition',
  'hover:bg-menu-selected active:scale-[0.98]',
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink',
  'forced-colors:border-[color:ButtonText]',
].join(' ');

/**
 * How each tile is laid out. Light and Dark are 168px tall, side by side, with the preview above
 * the name (FEAT5_1). High contrast (FEAT5_5) is a tile across both columns underneath them, 88px
 * tall, with its preview on the left and its icon and name beside it.
 */
const TILE_LAYOUT: Record<ColorMode, string> = {
  light: 'flex flex-col gap-2.5',
  dark: 'flex flex-col gap-2.5',
  'high-contrast': 'col-span-2 flex h-[88px] flex-row items-center gap-3',
};

/**
 * High contrast's preview (FEAT5_5): 66px tall, and as wide as a half tile's preview, which is the
 * wide tile's content box less half the 12px gap and a half tile's 22px of border and padding
 * (e.g. 136px at 360px wide).
 */
const HIGH_CONTRAST_PREVIEW = 'h-[66px] w-[calc(50%-17px)] shrink-0 p-2';

/**
 * A mini card in `mode`'s colours, for decoration only. It uses the fixed colours from @kanji/core,
 * not the Tailwind colours: those follow the mode that is on the page, so on a dark device the
 * Light preview would turn dark too.
 *
 * High contrast's preview (FEAT5_5) is as wide as the others' but only 66px tall: black with white
 * lines and no shadow, "JLPT N5" in black on its bright header, a 16px word and no grey bars.
 */
function ModePreview({ mode }: { mode: ColorMode }) {
  const colors = MODE_COLORS[mode];
  const readings = READING_COLORS_BY_MODE[mode];
  const highContrast = mode === 'high-contrast';
  const header = modeColor(JLPT_COLORS_BY_MODE, mode, 'N5', FALLBACK_HEADER.background);
  return (
    <div
      aria-hidden
      className={`flex flex-col justify-center rounded-lg ${highContrast ? HIGH_CONTRAST_PREVIEW : 'h-[112px] p-3'}`}
      style={{
        background: colors.page,
        boxShadow: `inset 0 0 0 ${highContrast ? 2 : 1}px ${colors['card-line']}`,
      }}
    >
      <div
        className="overflow-hidden rounded-lg"
        style={{
          background: colors.card,
          boxShadow: highContrast
            ? `0 0 0 2px ${colors['card-line']}`
            : `0 0 0 1px ${colors['card-line']}, 0 4px 8px -4px rgb(15 23 42 / 0.35)`,
        }}
      >
        <div
          className={`px-2 py-0.5 text-[8px] leading-3 font-bold tracking-wide ${highContrast ? 'text-black' : 'text-white'}`}
          style={{ background: header }}
        >
          JLPT N5
        </div>
        <div className="px-2 pt-1.5 pb-2">
          <p className={`font-bold ${highContrast ? 'text-base leading-5' : 'text-xl leading-7'}`}>
            <span style={{ color: readings.kunyomi, borderBottom: `2px solid ${readings.kunyomi}` }}>静</span>
            <span style={{ color: readings.okurigana, borderBottom: `2px solid ${readings.okurigana}` }}>か</span>
          </p>
          {!highContrast && (
            <>
              <div className="mt-1.5 h-1.5 w-4/5 rounded-full" style={{ background: colors['card-line'] }} />
              <div className="mt-1 h-1.5 w-[55%] rounded-full" style={{ background: colors['card-line'] }} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ModeTile({ mode, onChoose }: { mode: ColorMode; onChoose: (mode: ColorMode) => void }) {
  const Icon = MODE_ICONS[mode];
  return (
    <button type="button" onClick={() => onChoose(mode)} className={`${TILE} ${TILE_LAYOUT[mode]}`}>
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
 * asks for a mode with a tile for each, Light then Dark side by side, then High contrast across
 * the width underneath (FEAT5_5), each showing a mini card in that mode. Nothing is focused when
 * it opens and no tile looks chosen. It sits in the middle of the space between the header and
 * the footer, and has no animation. It follows the device's Light or Dark setting: it is never
 * shown in High contrast, as a mode has been saved by then.
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
