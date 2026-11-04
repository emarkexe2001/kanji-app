import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach } from 'vitest';

/** The colour mode's storage key (COLOR_MODE_KEY in src/lib/color-mode.ts). */
const COLOR_MODE_KEY = 'kanji.colorMode';

beforeEach(() => {
  if (typeof document === 'undefined') return;
  // FEAT5_1: the app shows the colour mode start page until a mode is saved. Most tests are about
  // the app after that, so a mode (Light, as before FEAT5_1) is saved before each test and the app
  // opens on the cards. Tests of a first visit (nothing saved) call firstVisit() from helpers.tsx;
  // tests that save another value or block storage simply replace it.
  localStorage.setItem(COLOR_MODE_KEY, 'light');
});

afterEach(() => {
  cleanup();
  // Tests that run in Node instead of jsdom (e.g. color-mode-css.test.ts) have no page or storage.
  if (typeof document === 'undefined') return;
  localStorage.clear();
  // The colour mode is put on <html>, which outlives each test's render (FEAT5).
  document.documentElement.removeAttribute('data-color-mode');
  document.documentElement.removeAttribute('data-color-mode-switching');
});
