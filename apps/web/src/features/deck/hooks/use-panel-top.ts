import { useLayoutEffect, useState } from 'react';

/** The gap between the bottom of the header and the top of the shuffled-out panel. */
export const PANEL_GAP_BELOW_HEADER = 12;

/** Where the panel's top goes for `header`: just below its bottom edge, as if the page were scrolled to the top. */
const topBelow = (header: HTMLElement | null) =>
  header ? Math.ceil(header.getBoundingClientRect().bottom + window.scrollY) + PANEL_GAP_BELOW_HEADER : 0;

/**
 * How far down the screen the shuffled-out panel's top goes while it is open (`open`): just below
 * the bottom of `header`, measured from the header itself (ADJ2_5), so the panel never covers
 * "Shuffled out (N)" however tall the header is (large text, browser zoom, or a title wrapping
 * onto two or three lines). It is measured again whenever the header changes size (the title
 * wrapping, a font loading, the text size changing) and when the window is resized or zoomed.
 * Like the panel itself (position: fixed), it is measured as if the page were scrolled to the top.
 */
export function usePanelTop(open: boolean, header: HTMLElement | null): number {
  const [top, setTop] = useState(() => topBelow(header));

  useLayoutEffect(() => {
    if (!open || !header) return;
    const measure = () => setTop(topBelow(header));
    measure();
    window.addEventListener('resize', measure);
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(measure) : null;
    observer?.observe(header);
    return () => {
      window.removeEventListener('resize', measure);
      observer?.disconnect();
    };
  }, [open, header]);

  return top;
}
