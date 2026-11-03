import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import type { ColorMode } from '@kanji/core';
import {
  applyColorMode,
  deviceColorMode,
  deviceDarkQuery,
  holdTransitions,
  loadSavedColorMode,
  releaseTransitions,
  saveColorMode,
} from '../../../lib/color-mode';

/** What the page opens with: the saved mode, or the device's mode when nothing usable is saved. */
function initialChoice() {
  const saved = loadSavedColorMode();
  return { mode: saved ?? deviceColorMode(), chosen: saved !== null };
}

/**
 * The colour mode the user has chosen (FEAT5), a function to choose another, and whether a mode
 * has been chosen yet (FEAT5_1). It starts as the saved mode, which index.html has already put on
 * the page before it was first drawn. When nothing usable is saved (nothing, a broken or unknown
 * value, or blocked storage), no mode is chosen yet: the app shows the start page, in the device's
 * mode, and follows the device's setting live until a mode is chosen, saving nothing.
 *
 * Choosing a mode saves it (even if it is the mode already on) and switches the whole page at once,
 * with no fade and no reload; the new mode is on the page before the browser next draws it. If
 * storage is blocked the choice still holds until the page is closed.
 */
export function useColorModeChoice(): [ColorMode, (mode: ColorMode) => void, boolean] {
  const [{ mode, chosen }, setChoice] = useState(initialChoice);

  useLayoutEffect(() => {
    applyColorMode(mode);
    releaseTransitions();
  }, [mode]);

  // Until a mode is chosen, follow the device's setting as it changes (FEAT5_1).
  useEffect(() => {
    if (chosen) return;
    // Null when the device setting can't be read: the start page then just doesn't follow it.
    const query = deviceDarkQuery();
    if (!query) return;
    const follow = () => {
      const next = query.matches ? 'dark' : 'light';
      setChoice((current) => {
        if (current.chosen || current.mode === next) return current;
        holdTransitions();
        return { mode: next, chosen: false };
      });
    };
    // The device may have changed between the first render and now.
    follow();
    query.addEventListener('change', follow);
    return () => query.removeEventListener('change', follow);
  }, [chosen]);

  const choose = useCallback(
    (next: ColorMode) => {
      saveColorMode(next);
      if (next !== mode) holdTransitions();
      setChoice({ mode: next, chosen: true });
    },
    [mode],
  );

  return [mode, choose, chosen];
}
