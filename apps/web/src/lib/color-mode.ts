import { DEFAULT_COLOR_MODE, isColorMode, type ColorMode } from '@kanji/core';
import { readStorage, writeStorage } from './storage';

/**
 * Where the chosen colour mode is saved (FEAT5). index.html reads the same key in a small script
 * before the page is first drawn, so it opens in the saved mode (or the device's mode when nothing
 * usable is saved) with no flash of the wrong colours. Keep the two the same
 * (color-mode-script.test.ts checks).
 */
export const COLOR_MODE_KEY = 'kanji.colorMode';

/** The attribute on <html> that says which mode is on; index.css switches the colours with it. */
export const COLOR_MODE_ATTRIBUTE = 'data-color-mode';

/**
 * Set on <html> while the mode changes, so nothing fades from one mode's colours to the other's
 * (the switch is instant, FEAT5): index.css turns transitions off under it.
 */
export const SWITCHING_ATTRIBUTE = 'data-color-mode-switching';

/** The device's colour scheme setting, as the browser reports it. */
export const DEVICE_DARK_QUERY = '(prefers-color-scheme: dark)';

/**
 * The saved mode, or null when nothing usable is saved: nothing saved, a broken or unknown value,
 * or blocked storage (FEAT5_1). The start page shows while it is null.
 */
export function loadSavedColorMode(): ColorMode | null {
  const saved = readStorage(COLOR_MODE_KEY);
  return isColorMode(saved) ? saved : null;
}

/** The device's "prefers dark" setting, or null when the browser can't give it (no matchMedia, or it throws). */
export function deviceDarkQuery(): MediaQueryList | null {
  try {
    return window.matchMedia(DEVICE_DARK_QUERY);
  } catch {
    return null;
  }
}

/** The mode the device asks for: Dark if it prefers dark, otherwise (or if it can't say) Light. */
export function deviceColorMode(): ColorMode {
  return deviceDarkQuery()?.matches ? 'dark' : DEFAULT_COLOR_MODE;
}

/**
 * The mode the page opens in: the saved mode, or the device's mode when nothing usable is saved
 * (FEAT5_1: nothing saved no longer means Light). index.html does the same before the first paint.
 *
 * The app itself doesn't call this (useColorModeChoice needs to know whether a mode was saved, so
 * it uses loadSavedColorMode and deviceColorMode). It is kept as the rule the inline script in
 * index.html must agree with: color-mode-script.test.ts checks the two give the same mode.
 */
export function loadColorMode(): ColorMode {
  return loadSavedColorMode() ?? deviceColorMode();
}

/** Saves the mode; if storage is blocked it still applies until the page is closed. */
export const saveColorMode = (mode: ColorMode) => writeStorage(COLOR_MODE_KEY, mode);

/** Puts `mode` on the page: the attribute on <html> that index.css switches the colours with. */
export function applyColorMode(mode: ColorMode, root: HTMLElement = document.documentElement) {
  root.setAttribute(COLOR_MODE_ATTRIBUTE, mode);
}

/** Turns transitions off before the mode changes, so the colours don't fade (see releaseTransitions). */
export function holdTransitions(root: HTMLElement = document.documentElement) {
  root.setAttribute(SWITCHING_ATTRIBUTE, '');
}

/**
 * Once the new mode is on the page: works out the new colours while transitions are still off (by
 * reading the page's layout, which makes the browser do it now), then turns transitions back on
 * in the next frame. Card slides and the other animations are not transitions, so they carry on.
 */
export function releaseTransitions(root: HTMLElement = document.documentElement) {
  if (!root.hasAttribute(SWITCHING_ATTRIBUTE)) return;
  void root.offsetHeight;
  const restore = () => root.removeAttribute(SWITCHING_ATTRIBUTE);
  if (typeof requestAnimationFrame === 'function') requestAnimationFrame(restore);
  else restore();
}
