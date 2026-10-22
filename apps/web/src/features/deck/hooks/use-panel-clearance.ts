import { useLayoutEffect, useState, type RefObject } from 'react';

/** From this width up (Tailwind's lg) the shuffled-out panel floats beside the deck, not over it. */
const WIDE = '(min-width: 1024px)';

/** The gap left between the bottom of the pop-up and the deck card. */
const GAP = 12;

/**
 * Below the lg breakpoint, while the shuffled-out pop-up (the element with id `panelId`) is open,
 * how far down from the top of `area` the deck card has to start so it sits just below the
 * pop-up and both are fully visible (ADJ2). It is measured as if the page were scrolled to the
 * top, where the pop-up opens, and again when the screen or the pop-up changes size.
 * 0 while the panel is closed, from lg up, and where there is no layout (e.g. in tests).
 */
export function usePanelClearance(open: boolean, panelId: string, area: RefObject<HTMLElement | null>): number {
  const [clearance, setClearance] = useState(0);

  useLayoutEffect(() => {
    if (!open) return;
    const panel = document.getElementById(panelId);
    const measure = () => {
      const el = area.current;
      const wide = typeof window.matchMedia === 'function' && window.matchMedia(WIDE).matches;
      if (!panel || !el || wide) {
        setClearance(0);
        return;
      }
      const top = el.getBoundingClientRect().top + window.scrollY;
      setClearance(Math.max(0, Math.ceil(panel.getBoundingClientRect().bottom + GAP - top)));
    };
    measure();
    window.addEventListener('resize', measure);
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(measure) : null;
    if (panel) observer?.observe(panel);
    return () => {
      window.removeEventListener('resize', measure);
      observer?.disconnect();
    };
  }, [open, panelId, area]);

  return open ? clearance : 0;
}
