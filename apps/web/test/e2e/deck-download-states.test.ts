// ARCH2, in a real browser with the real deck files: studying N1 downloads only N1's file (at most
// 150 KB, answer 2) before the first card; a deck saved before ARCH2 loads again (answer 5); the
// Shuffle In loading state keeps the box's size, the focus and the High contrast look, and its
// spinner stands still with reduced motion (answer 6); and the line under the Deck row is one
// line, 22px, at 360px and 1024px, in every colour mode (answers 14 and 15).
import { readFileSync } from 'node:fs';
import { expect, test, type Page, type Route } from '@playwright/test';
import { DECK_LOAD_TIMEOUT, currentCard, openApp, waitForDeck } from './helpers';

const DATA = new URL('../../public/data/', import.meta.url);
const wordsIn = (file: string): { id: string; word: string }[] => JSON.parse(readFileSync(new URL(file, DATA), 'utf8'));
const WORD_FILES = ['n5.json', 'n4.json', 'n3.json', 'n2.json', 'n1.json', 'common-no-level.json'];

const counterTop = async (page: Page) => (await page.getByText(/^Card \d+ of \d+$/).boundingBox())?.y;
const deckSelect = (page: Page) => page.getByLabel('Deck', { exact: true });
const slot = (page: Page) => page.locator('#deck-message');
const shuffleInForm = (page: Page) => page.locator('form').filter({ has: page.getByLabel('Cards to shuffle in') });
const shuffleInButton = (page: Page) => page.getByRole('button', { name: 'Shuffle In Cards' });
const loadingButton = (page: Page) => page.getByRole('button', { name: 'Loading cards…' });

/**
 * Lets only the word files in `keep` download: the others are held back for the whole test. A test
 * that doesn't need the background downloads holds them back, so the tests running side by side
 * don't all download the whole dictionary from the one preview server at once. Call it before
 * holdFiles, whose routes then take over for their own files.
 */
async function serveOnly(page: Page, keep: string[]) {
  const others = WORD_FILES.filter((f) => !keep.includes(f)).map((f) => f.replace('.', '\\.'));
  await page.route(new RegExp(`/data/(${others.join('|')})$`), () => {});
}

/**
 * Holds back every request for the files matching `pattern` until `release()` lets them through
 * or `fail()` drops them, as when the network drops. Both first wait for a request to be held:
 * the browser only downloads a few files at once, so a request can be queued for a while.
 */
async function holdFiles(page: Page, pattern: RegExp) {
  const held: Route[] = [];
  let released = false;
  await page.route(pattern, (route) => (released ? route.continue() : held.push(route)));
  const someHeld = () => expect.poll(() => held.length, { timeout: DECK_LOAD_TIMEOUT }).toBeGreaterThan(0);
  return {
    count: () => held.length,
    release: async () => {
      await someHeld();
      released = true;
      await Promise.all(held.splice(0).map((route) => route.continue()));
    },
    fail: async () => {
      await someHeld();
      await Promise.all(held.splice(0).map((route) => route.abort('internetdisconnected')));
    },
  };
}

/** Saves values before the first page load only, so a reload keeps what the app saved since. */
async function saveBeforeFirstLoad(page: Page, values: Record<string, unknown>) {
  await page.addInitScript(
    (entries) => {
      if (sessionStorage.getItem('e2e.saved') !== null) return;
      sessionStorage.setItem('e2e.saved', 'yes');
      for (const [key, value] of entries) localStorage.setItem(key, value);
    },
    Object.entries(values).map(([k, v]) => [k, typeof v === 'string' ? v : JSON.stringify(v)] as const),
  );
}

test('studying N1, the first card shows after only decks.json and n1.json, at most 150 KB as sent (answer 2)', async ({
  page,
}) => {
  await saveBeforeFirstLoad(page, { 'kanji.studiedDeck': 'N1' });
  const others = await holdFiles(page, /\/data\/(n5|n4|n3|n2|common-no-level)\.json$/);
  const finished: { file: string; bytes: number }[] = [];
  page.on('requestfinished', async (request) => {
    if (!request.url().includes('/data/')) return;
    const sizes = await request.sizes().catch(() => null);
    if (sizes) finished.push({ file: request.url().split('/data/')[1], bytes: sizes.responseBodySize });
  });

  const errors = await openApp(page, { colorMode: 'light' });
  await waitForDeck(page);
  // The first card is on screen while every other file is still held back.
  await expect(currentCard(page).getByText('JLPT N1', { exact: true })).toBeVisible();
  await expect.poll(() => finished.length).toBe(2);
  expect(finished.map((f) => f.file).sort()).toEqual(['decks.json', 'n1.json']);
  const bytes = finished.reduce((sum, f) => sum + f.bytes, 0);
  expect(bytes).toBeLessThanOrEqual(150 * 1024);
  // The others were asked for in the background.
  await expect.poll(others.count).toBe(5);
  expect(errors).toEqual([]);
});

test('a deck saved before ARCH2, with cards from N4 and Common words, its shuffled-out list and shuffle choice, loads again and survives a reload (answer 5)', async ({
  page,
}) => {
  const [n5, n4, n3, common] = ['n5.json', 'n4.json', 'n3.json', 'common-no-level.json'].map((f) => wordsIn(f)[0]);
  await saveBeforeFirstLoad(page, {
    'kanji.deckSize': '3',
    'kanji.studiedDeck': 'N5',
    'kanji.savedDeck': {
      deck: 'N5',
      cards: [
        { id: n4.id, deck: 'N4' },
        { id: common.id, deck: 'common' },
        { id: n5.id, deck: 'N5' },
      ],
      newIds: [n4.id, common.id],
    },
    'kanji.removedCards': [{ id: n3.id, deck: 'N3', reason: 'shuffled-out', removedAt: 7 }],
    'kanji.shuffleSource': { kind: 'deck', deck: 'N3', decks: [] },
  });
  const errors = await openApp(page, { colorMode: 'light' });

  for (const load of ['first', 'after a reload']) {
    if (load !== 'first') await page.reload();
    await waitForDeck(page);
    const heading = currentCard(page).getByRole('heading', { level: 2 });
    for (const word of [n4.word, common.word, n5.word]) {
      await expect(heading, load).toContainText(word);
      await page.getByRole('button', { name: 'Next →' }).click();
    }
    await expect(page.getByRole('button', { name: 'Shuffled out (1)' })).toBeVisible();
    await expect(page.getByLabel('Deck to shuffle in from')).toHaveValue('N3');
    await expect(deckSelect(page)).toHaveValue('N5');
  }
  expect(errors).toEqual([]);
});

for (const viewport of [
  { width: 360, height: 640 },
  { width: 1024, height: 768 },
]) {
  test(`at ${viewport.width}px, "Loading cards…" keeps the box and the button the same size, keeps focus, and Enter does nothing more (answer 6)`, async ({
    page,
  }) => {
    await serveOnly(page, ['n5.json', 'n4.json']);
    const n4 = await holdFiles(page, /\/data\/n4\.json$/);
    const errors = await openApp(page, { colorMode: 'light', viewport });
    await waitForDeck(page);
    // The button is scrolled into view first, so the press doesn't move the page.
    await shuffleInButton(page).scrollIntoViewIfNeeded();
    const box = await shuffleInForm(page).boundingBox();
    const button = await shuffleInButton(page).boundingBox();

    await shuffleInButton(page).click();
    await expect(loadingButton(page)).toBeVisible();
    await expect(loadingButton(page)).toBeFocused();
    expect(await shuffleInForm(page).boundingBox()).toEqual(box);
    const busy = await loadingButton(page).boundingBox();
    expect([busy?.width, busy?.height]).toEqual([button?.width, button?.height]);

    // Enter in the count field (without changing it) doesn't start a second Shuffle In.
    await page.getByLabel('Cards to shuffle in').focus();
    await page.keyboard.press('Enter');
    await expect(loadingButton(page)).toBeVisible();

    await n4.release();
    await expect(shuffleInButton(page)).toBeVisible({ timeout: DECK_LOAD_TIMEOUT });
    await expect(currentCard(page).getByText('JLPT N4', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Shuffled out (1)' })).toBeVisible();
    expect(errors).toEqual([]);
  });
}

test('the spinners turn, and stand still with reduced motion (answer 6)', async ({ page }) => {
  await serveOnly(page, ['n5.json']);
  await openApp(page, { colorMode: 'light' });
  await waitForDeck(page);
  await shuffleInButton(page).click();
  const buttonSpinner = loadingButton(page).locator('svg');
  const animation = (spinner: typeof buttonSpinner) => spinner.evaluate((el) => getComputedStyle(el).animationName);

  expect(await animation(buttonSpinner)).toBe('spin');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  expect(await animation(buttonSpinner)).toBe('none');

  await deckSelect(page).selectOption('N3');
  const slotSpinner = slot(page).locator('svg');
  expect(await animation(slotSpinner)).toBe('none');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  expect(await animation(slotSpinner)).toBe('spin');
});

test('in High contrast, the busy button keeps its green ring and full colour, with no dashed "disabled" outline (answer 6)', async ({
  page,
}) => {
  await serveOnly(page, ['n5.json']);
  await openApp(page, { colorMode: 'high-contrast' });
  await waitForDeck(page);
  await shuffleInButton(page).click();
  const style = await loadingButton(page).evaluate((el) => {
    const s = getComputedStyle(el);
    return { opacity: s.opacity, outlineStyle: s.outlineStyle, boxShadow: s.boxShadow, cursor: s.cursor };
  });
  expect(style.opacity).toBe('1');
  expect(style.outlineStyle).not.toBe('dashed');
  expect(style.boxShadow).toContain('rgb(92, 230, 124)');
  expect(style.cursor).toBe('wait');
});

test('at 1024px the line under the Deck row is 22px when empty, loading and showing an error, and the card doesn’t move (answers 14 and 15)', async ({
  page,
}) => {
  await serveOnly(page, ['n5.json', 'n4.json']);
  const n4 = await holdFiles(page, /\/data\/n4\.json$/);
  await openApp(page, { colorMode: 'light', viewport: { width: 1024, height: 768 } });
  await waitForDeck(page);
  const row = await deckSelect(page).locator('xpath=..').boundingBox();
  const empty = await slot(page).boundingBox();
  const top = await counterTop(page);
  expect(empty?.height).toBe(16);
  expect(Math.round((empty?.y ?? 0) - ((row?.y ?? 0) + (row?.height ?? 0)))).toBe(6);

  await deckSelect(page).selectOption('N4');
  await expect(slot(page)).toHaveText('Loading JLPT N4…');
  expect((await slot(page).boundingBox())?.height).toBe(16);
  expect(await counterTop(page)).toBe(top);

  await n4.fail();
  await expect(slot(page)).toHaveText("Couldn't load JLPT N4. Pick it again to retry.");
  expect((await slot(page).boundingBox())?.height).toBe(16);
  expect(await counterTop(page)).toBe(top);
});

for (const { mode, color } of [
  { mode: 'light', color: null },
  { mode: 'dark', color: 'rgb(251, 113, 133)' },
  { mode: 'high-contrast', color: 'rgb(255, 138, 158)' },
]) {
  test(`at 360px in ${mode}, the longest error, for Common words, fits on one line and the card doesn’t move (answer 15)`, async ({
    page,
  }) => {
    // Common words needs every file. The JLPT files are held back and the no-level common words
    // fail, as when the network drops, so the pick fails.
    await serveOnly(page, ['n5.json', 'common-no-level.json']);
    await page.route(/\/data\/common-no-level\.json$/, (route) => route.abort('internetdisconnected'));
    await openApp(page, { colorMode: mode, viewport: { width: 360, height: 640 } });
    await waitForDeck(page);
    const top = await counterTop(page);

    await deckSelect(page).selectOption('common');
    await expect(slot(page)).toHaveText("Couldn't load Common words. Pick it again to retry.");
    await expect(deckSelect(page)).toHaveValue('N5');
    const fit = await slot(page).evaluate((el) => ({
      height: el.getBoundingClientRect().height,
      overflows: el.scrollWidth > el.clientWidth,
      color: getComputedStyle(el).color,
    }));
    expect(fit.height).toBe(16);
    expect(fit.overflows).toBe(false);
    expect(await counterTop(page)).toBe(top);
    if (color) expect(fit.color).toBe(color);
    // No sideways scrolling.
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
  });
}
