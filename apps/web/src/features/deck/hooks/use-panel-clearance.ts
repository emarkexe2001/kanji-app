import { useLayoutEffect, useState, type RefObject } from 'react';

/** The gap left between the bottom of the pop-up and the deck card. */
const GAP = 12;

/**
 * Below the wide layout (WIDE_LAYOUT_MIN_WIDTH, ADJ2_5), while the shuffled-out pop-up (the
 * element with id `panelId`) is open, how far down from the top of `area` the deck card has to
 * start so it sits just below the pop-up and both are fully visible (ADJ2). It is measured as if
 * the page were scrolled to the top, where the pop-up opens, and again when the screen or the
 * pop-up changes size, and when the pop-up moves (`panelTop`, its top below the header, changes).
 * Below the wide layout the pop-up has a fixed height (ADJ2_5), so picking cards in it doesn't
 * move the deck card.
 *
 * `wide` says the screen is in the wide layout (from useWideLayout, so the code has one source
 * for it), where the panel floats beside the deck and nothing is measured.
 * 0 while the panel is closed, in the wide layout, and where there is no layout (e.g. in tests).
 */
export function usePanelClearance(
  open: boolean,
  panelId: string,
  area: RefObject<HTMLElement | null>,
  panelTop = 0,
  wide = false,
): number {
  const [clearance, setClearance] = useState(0);
  const underPopUp = open && !wide;

  useLayoutEffect(() => {
    if (!underPopUp) return;
    const panel = document.getElementById(panelId);
    const measure = () => {
      const el = area.current;
      if (!panel || !el) {
        setClearance(0);
        return;
      }
      const top = el.getBoundingClientRect().top + window.scrollY;
      // Where the pop-up is laid out (it is fixed, so this is from the top of the screen), not
      // where it is drawn: as it slides down into place it is drawn higher and smaller.
      const panelBottom = panel.offsetTop + panel.offsetHeight;
      setClearance(Math.max(0, Math.ceil(panelBottom + GAP - top)));
    };
    measure();
    window.addEventListener('resize', measure);
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(measure) : null;
    if (panel) observer?.observe(panel);
    return () => {
      window.removeEventListener('resize', measure);
      observer?.disconnect();
    };
  }, [underPopUp, panelId, area, panelTop]);

  return underPopUp ? clearance : 0;
}
