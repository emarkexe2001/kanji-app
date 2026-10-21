import { useSyncExternalStore } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

/** The media query, or null where the browser can't answer it (e.g. very old browsers, tests). */
const media = () => (typeof window.matchMedia === 'function' ? window.matchMedia(QUERY) : null);

function subscribe(onChange: () => void) {
  const query = media();
  query?.addEventListener('change', onChange);
  return () => query?.removeEventListener('change', onChange);
}

/** True when the device's "reduce motion" setting is on, so the slide animations are skipped. */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, () => media()?.matches ?? false);
}
