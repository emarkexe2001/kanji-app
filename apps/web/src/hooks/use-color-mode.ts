import { createContext, useContext } from 'react';
import { DEFAULT_COLOR_MODE, type ColorMode } from '@kanji/core';

/**
 * The colour mode that is on (FEAT5), for the colours set in the code rather than by Tailwind
 * classes (the reading colours in a card's Reading Breakdown, a picked card's outline). The app
 * provides it; Tailwind classes switch with the `data-color-mode` attribute on <html> instead.
 */
export const ColorModeContext = createContext<ColorMode>(DEFAULT_COLOR_MODE);

/** The colour mode that is on: Light unless the app says otherwise. */
export const useColorMode = () => useContext(ColorModeContext);
