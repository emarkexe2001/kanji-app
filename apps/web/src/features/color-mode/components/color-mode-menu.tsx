import { useEffect, useEffectEvent, useId, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { COLOR_MODES, type ColorMode } from '@kanji/core';
import { KEEP_PANEL_OPEN_ATTRIBUTE } from '../../../lib/keep-panel-open';
import { MODE_ICONS, TickIcon } from './color-mode-icons';

/** The name of each mode, on the button and in the menu. */
export const COLOR_MODE_NAMES: Record<ColorMode, string> = {
  light: 'Light',
  dark: 'Dark',
  'high-contrast': 'High contrast',
};

/**
 * The colour mode button (FEAT5), 36px tall like "Shuffled out (N)", with a border so it reads as
 * a quieter control. Its focus ring is drawn on purpose, and in a forced-colours (high-contrast)
 * mode its border uses the system ButtonText colour so it can still be seen. In High contrast
 * (FEAT5_5) a 1px inset ring makes its white line 2px, without changing its size.
 */
const BUTTON = [
  'flex h-9 shrink-0 items-center gap-1.5 rounded-xl border border-field-line bg-card px-3 text-sm font-bold text-ink transition',
  'hover:bg-menu-selected active:scale-95',
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink',
  'forced-colors:border-[color:ButtonText]',
  'hc:ring-1 hc:ring-inset hc:ring-field-line',
].join(' ');

/**
 * The button's mode name. In High contrast (FEAT5_5) it shows from 375px up only: below that,
 * "High contrast" doesn't fit beside "Shuffled out (N)", so the button shows just its icon. Screen
 * readers always hear the name (the button's aria-label).
 */
const NAME_CLASS: Partial<Record<ColorMode, string>> = { 'high-contrast': 'hidden min-[375px]:inline' };

/**
 * The menu (FEAT5): 200px wide, just under the button, drawn over the page and the Shuffled-out
 * panel. In High contrast (FEAT5_5) its white line is 2px and it has no shadow.
 */
const MENU = [
  'absolute top-full left-0 z-50 mt-2 w-[200px] rounded-xl border border-card-line bg-card p-1.5',
  'shadow-[0_12px_28px_-8px_rgb(15_23_42/0.45)]',
  'hc:shadow-none hc:ring-1 hc:ring-inset hc:ring-card-line',
].join(' ');

/** A mode in the menu: 40px tall; the mode that is on has a grey row and a tick. */
const ITEM = [
  'flex h-10 w-full items-center gap-2.5 rounded-lg px-2.5 text-left text-[15px] font-semibold text-ink',
  'hover:bg-menu-selected',
  'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ink',
].join(' ');

/**
 * The row of the mode that is on. In High contrast (FEAT5_5) it is black with a 2px white outline
 * (and the tick), instead of a grey row, and still fills under the pointer.
 */
const ITEM_ON = 'bg-menu-selected hc:bg-card hc:ring-2 hc:ring-inset hc:ring-ink hc:hover:bg-menu-selected';

/**
 * The colour mode menu in the top left of the header (FEAT5). The button shows the mode that is
 * on ("Light ▾" with a sun, "Dark ▾" with a moon, or "High contrast ▾" with a half-filled circle,
 * FEAT5_5, just "◐ ▾" below 375px); screen readers hear "Colour mode: Light" and
 * that it opens a menu. The menu, headed "Colour mode", lists the modes as menu radio items, so
 * screen readers hear which one is on; it has a tick too.
 *
 * Choosing a mode (`onChoose`) switches to it and closes the menu. With the keyboard: Enter,
 * Space or ↓ on the button opens the menu on the mode that is on, ↑ / ↓ (and Home / End) move
 * between the modes, Enter or Space chooses one, and Escape closes the menu; focus then goes back
 * to the button. Tab closes it too, and moves on from the button. A press outside closes it
 * without changing anything, and isn't swallowed: pressing "Shuffled out (N)" closes the menu
 * and opens or closes the panel as usual.
 *
 * The button and menu don't count as outside the Shuffled-out panel (KEEP_PANEL_OPEN_ATTRIBUTE),
 * so the mode can be changed with the panel open; the menu is drawn over it. Escape with both
 * open closes only the menu.
 *
 * `autoFocus` focuses the button when it first shows: after a mode is chosen on the start page
 * (FEAT5_1), so screen readers hear the chosen mode and focus isn't left on the page itself.
 */
export function ColorModeMenu({
  mode,
  onChoose,
  autoFocus = false,
}: {
  mode: ColorMode;
  onChoose: (mode: ColorMode) => void;
  autoFocus?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const menuId = useId();
  const name = COLOR_MODE_NAMES[mode];
  const Icon = MODE_ICONS[mode];

  const closeToButton = () => {
    setOpen(false);
    buttonRef.current?.focus();
  };

  const closeOnEscape = useEffectEvent(closeToButton);

  // While it is open, a press outside it or Escape closes it.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (e.target instanceof Node && wrapperRef.current?.contains(e.target)) return;
      // Focus would be lost with the menu, so it goes back to the button; the press then moves it
      // on to whatever it lands on, as usual.
      if (wrapperRef.current?.contains(document.activeElement)) buttonRef.current?.focus();
      setOpen(false);
    };
    // Caught before anything else on the page sees it, so Escape closes only the menu, not the
    // Shuffled-out panel as well.
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      closeOnEscape();
    };
    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true);
      document.removeEventListener('keydown', onKeyDown, true);
    };
  }, [open]);

  const onButtonKeyDown = (e: ReactKeyboardEvent) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    setOpen(true);
  };

  const onMenuKeyDown = (e: ReactKeyboardEvent) => {
    const items = itemRefs.current.filter((item): item is HTMLButtonElement => item !== null);
    const at = items.indexOf(document.activeElement as HTMLButtonElement);
    const moveTo = (i: number) => items[(i + items.length) % items.length]?.focus();
    if (e.key === 'ArrowDown') moveTo(at + 1);
    else if (e.key === 'ArrowUp') moveTo(at - 1);
    else if (e.key === 'Home') moveTo(0);
    else if (e.key === 'End') moveTo(items.length - 1);
    else if (e.key === 'Tab') {
      // Tab moves on from the button, as if the menu had never been opened.
      closeToButton();
      return;
    } else return;
    e.preventDefault();
  };

  return (
    <div ref={wrapperRef} className="relative shrink-0" {...{ [KEEP_PANEL_OPEN_ATTRIBUTE]: '' }}>
      <button
        ref={buttonRef}
        type="button"
        autoFocus={autoFocus}
        aria-label={`Colour mode: ${name}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={onButtonKeyDown}
        className={BUTTON}
      >
        <Icon />
        <span className={NAME_CLASS[mode]}>{name}</span>
        <span aria-hidden className="text-[10px]">
          {open ? '▴' : '▾'}
        </span>
      </button>
      {open && (
        <div id={menuId} role="menu" aria-label="Colour mode" onKeyDown={onMenuKeyDown} className={MENU}>
          <p aria-hidden className="px-2.5 pt-1.5 pb-1 text-xs font-semibold text-muted">
            Colour mode
          </p>
          {COLOR_MODES.map((m, i) => {
            const ItemIcon = MODE_ICONS[m];
            const on = m === mode;
            return (
              <button
                key={m}
                ref={(el) => {
                  itemRefs.current[i] = el;
                }}
                type="button"
                role="menuitemradio"
                aria-checked={on}
                tabIndex={-1}
                // The menu opens on the mode that is on.
                autoFocus={on}
                onClick={() => {
                  onChoose(m);
                  closeToButton();
                }}
                className={`${ITEM} ${on ? ITEM_ON : ''}`}
              >
                <ItemIcon />
                <span className="flex-1">{COLOR_MODE_NAMES[m]}</span>
                {on && <TickIcon />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
