import { useCallback, useLayoutEffect, useState } from 'react';
import type { ColorMode } from '@kanji/core';
import {
  applyColorMode,
  holdTransitions,
  loadColorMode,
  releaseTransitions,
  saveColorMode,
} from '../../../lib/color-mode';

/**
 * The colour mode the user has chosen (FEAT5), and a function to choose another. It starts as the
 * saved mode (Light when nothing usable is saved), which index.html has already put on the page
 * before it was first drawn. Choosing a mode saves it and switches the whole page at once, with no
 * fade and no reload; the new mode is on the page before the browser next draws it.
 */
export function useColorModeChoice(): [ColorMode, (mode: ColorMode) => void] {
  const [mode, setMode] = useState(loadColorMode);

  useLayoutEffect(() => {
    applyColorMode(mode);
    releaseTransitions();
  }, [mode]);

  const choose = useCallback(
    (next: ColorMode) => {
      saveColorMode(next);
      if (next === mode) return;
      holdTransitions();
      setMode(next);
    },
    [mode],
  );

  return [mode, choose];
}
