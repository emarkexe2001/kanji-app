import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
  cleanup();
  // Tests that run in Node instead of jsdom (e.g. color-mode-css.test.ts) have no page or storage.
  if (typeof document === 'undefined') return;
  localStorage.clear();
  // The colour mode is put on <html>, which outlives each test's render (FEAT5).
  document.documentElement.removeAttribute('data-color-mode');
  document.documentElement.removeAttribute('data-color-mode-switching');
});
