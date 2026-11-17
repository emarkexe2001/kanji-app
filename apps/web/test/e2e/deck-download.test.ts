// ARCH2: the first card waits only for the studied deck's file, and the line under the Deck row
// keeps its 22px whether it is empty, loading or showing an error, so nothing below it moves.
import { expect, test, type Route } from '@playwright/test';
import { currentCard, openApp, waitForDeck } from './helpers';

const counterTop = async (page: import('@playwright/test').Page) =>
  (await page.getByText(/^Card \d+ of \d+$/).boundingBox())?.y;

test('studying N5 with nothing saved, only decks.json and n5.json download before the first card', async ({ page }) => {
  const before: string[] = [];
  let firstCardShown = false;
  page.on('request', (request) => {
    const url = request.url();
    if (url.includes('/data/') && !firstCardShown) before.push(url.split('/data/')[1]);
  });
  // Hold back every other word file, so they can only arrive after the first card.
  const held: Route[] = [];
  await page.route(/\/data\/(n4|n3|n2|n1|common-no-level)\.json$/, (route) => {
    held.push(route);
  });

  const errors = await openApp(page, { colorMode: 'light' });
  await waitForDeck(page);
  firstCardShown = true;

  expect(before.slice(0, 2)).toEqual(['decks.json', 'n5.json']);
  await expect(currentCard(page).getByText('JLPT N5', { exact: true })).toBeVisible();
  // The other files are asked for in the background.
  await expect.poll(() => held.length).toBe(5);
  await Promise.all(held.map((route) => route.continue()));
  expect(errors).toEqual([]);
});

test('the line under the Deck row is 22px when empty, loading and showing an error, and the card doesn’t move', async ({
  page,
}) => {
  // Each request for n4.json waits until the test fails it, as when the network drops.
  const waiting: (() => void)[] = [];
  await page.route(/\/data\/n4\.json$/, async (route) => {
    await new Promise<void>((resolve) => waiting.push(resolve));
    await route.abort('internetdisconnected');
  });
  const failNext = async () => {
    await expect.poll(() => waiting.length).toBeGreaterThan(0);
    waiting.shift()?.();
  };
  await openApp(page, { colorMode: 'light', viewport: { width: 360, height: 640 } });
  await waitForDeck(page);
  const slot = page.locator('#deck-message');

  const emptyBox = await slot.boundingBox();
  const emptyTop = await counterTop(page);
  expect(emptyBox?.height).toBe(16);

  // The background download fails silently.
  await failNext();

  await page.getByLabel('Deck', { exact: true }).selectOption('N4');
  await expect(slot).toHaveText('Loading JLPT N4…');
  expect((await slot.boundingBox())?.height).toBe(16);
  expect(await counterTop(page)).toBe(emptyTop);

  await failNext();
  await expect(slot).toHaveText("Couldn't load JLPT N4. Pick it again to retry.");
  expect((await slot.boundingBox())?.height).toBe(16);
  expect(await counterTop(page)).toBe(emptyTop);
  // 6px gap above the 16px line: 22px reserved.
  const row = await page.getByLabel('Deck', { exact: true }).locator('xpath=..').boundingBox();
  expect(Math.round((emptyBox?.y ?? 0) - ((row?.y ?? 0) + (row?.height ?? 0)))).toBe(6);
});
