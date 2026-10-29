/**
 * From this screen width up, the shuffled-out panel floats beside the deck instead of popping up
 * over it (ADJ2_5). Below it the deck column (416px wide, centred) and the 300px panel, 24px from
 * the right, would overlap; at 1100px there is an 18px gap between them.
 *
 * The styles use the same width as the Tailwind breakpoint `wide` (`wide:` and `max-wide:`), set
 * by `--breakpoint-wide` in src/app/index.css. The two must stay the same: wide-layout.test.tsx
 * checks they do.
 */
export const WIDE_LAYOUT_MIN_WIDTH = 1100;

/** The media query for the wide layout, for window.matchMedia. */
export const WIDE_LAYOUT_QUERY = `(min-width: ${WIDE_LAYOUT_MIN_WIDTH}px)`;
