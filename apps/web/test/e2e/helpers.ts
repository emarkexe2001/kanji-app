import { expect, type Page, type ViewportSize } from '@playwright/test';

/**
 * Shared setup for the e2e tests (TEST7). Each test sets up its own state with these, so the tests
 * don't depend on each other or on the order they run in. Playwright gives every test a new,
 * empty browser context (no saved values), so nothing carries over from another test.
 */

/** Where the app saves the colour mode (COLOR_MODE_KEY in src/lib/color-mode.ts). */
export const COLOR_MODE_KEY = 'kanji.colorMode';

/** Marks, in the tab's sessionStorage, that saveColorMode has already written the mode. */
const SAVED_ONCE_KEY = 'e2e.colorModeSaved';

/**
 * Saves `value` as the colour mode before the page loads, as if it had been chosen on an earlier
 * visit. Any text can be saved, so a test can save a broken value too (e.g. 'purple').
 *
 * It is written before the first page load in the tab only: after a reload the page keeps
 * whatever the app saved since (e.g. a mode chosen from the menu), as it would for a user.
 * Call it before `page.goto`.
 */
export async function saveColorMode(page: Page, value: string) {
  await page.addInitScript(
    ({ key, value, savedOnceKey }) => {
      if (sessionStorage.getItem(savedOnceKey) !== null) return;
      sessionStorage.setItem(savedOnceKey, 'yes');
      localStorage.setItem(key, value);
    },
    { key: COLOR_MODE_KEY, value, savedOnceKey: SAVED_ONCE_KEY },
  );
}

/**
 * Collects the page's errors from now on: uncaught exceptions and anything logged with
 * `console.error` (a crash caught by an error boundary is logged, not thrown). A test checks the
 * list is empty at the end.
 */
export function watchPageErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(`page error: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console error: ${message.text()}`);
  });
  return errors;
}

export type OpenAppOptions = {
  /** Saved before the page loads (see saveColorMode). Leave it out for a first visit (nothing saved). */
  colorMode?: string;
  /** The device's light or dark setting (prefers-color-scheme). Light if left out. */
  device?: 'light' | 'dark';
  /** The window size. Playwright's default (1280×720) if left out. */
  viewport?: ViewportSize;
};

/**
 * Sets up the device and the saved colour mode, then opens the app. Returns the page's errors
 * (see watchPageErrors), collected from before the page starts loading.
 */
export async function openApp(page: Page, { colorMode, device = 'light', viewport }: OpenAppOptions = {}) {
  const errors = watchPageErrors(page);
  if (viewport) await page.setViewportSize(viewport);
  await page.emulateMedia({ colorScheme: device });
  if (colorMode !== undefined) await saveColorMode(page, colorMode);
  await page.goto('/');
  return errors;
}

/** The card on screen. Only it is an article; the cards in the Shuffled-out lists aren't. */
export const currentCard = (page: Page) => page.getByRole('article');

/**
 * How long to wait for the dictionary to load and the first card to show. The dictionary is
 * 5.4 MB, and when several browsers load it at once it can take longer than `expect`'s usual 5
 * seconds (TEST7 review, R2).
 */
export const DECK_LOAD_TIMEOUT = 20_000;

/** Waits for the dictionary to load and the first card to show (after `page.goto` or `page.reload`). */
export async function waitForDeck(page: Page) {
  await expect(currentCard(page)).toBeVisible({ timeout: DECK_LOAD_TIMEOUT });
}
