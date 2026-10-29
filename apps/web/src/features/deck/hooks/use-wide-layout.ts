import { useSyncExternalStore } from 'react';
import { WIDE_LAYOUT_QUERY } from '../utils/wide-layout';

/** The media query, or null where the browser can't answer it (e.g. tests). */
const media = () => (typeof window.matchMedia === 'function' ? window.matchMedia(WIDE_LAYOUT_QUERY) : null);

function subscribe(onChange: () => void) {
  const query = media();
  query?.addEventListener('change', onChange);
  return () => query?.removeEventListener('change', onChange);
}

/**
 * True when the screen is wide enough for the shuffled-out panel to float beside the deck
 * (WIDE_LAYOUT_MIN_WIDTH and up, ADJ2_5). False below it, where the panel pops up over the page,
 * and where the browser can't say.
 */
export function useWideLayout(): boolean {
  return useSyncExternalStore(subscribe, () => media()?.matches ?? false);
}
