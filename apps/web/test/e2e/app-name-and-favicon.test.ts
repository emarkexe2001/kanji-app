// UI5: one app name, and a favicon. On the production build: the page title is the agreed name
// (answer 1), the tab icon loads and nothing gets a 404 (answers 2 and 4), the head has the agreed
// description (answer 7) and exactly the two icon links, with no manifest, home-screen icon or
// theme colour (answers 3 and 5), and the header name stays on one line at 320px (FEAT5 rule).
// The icon files themselves are checked in test/ui-tests/favicon-files.test.ts.
import { expect, test, type Page, type Response } from '@playwright/test';
import { openApp, waitForDeck } from './helpers';

const NAME = 'Kanji Reading Highlighter';
const DESCRIPTION = "Flash cards for Japanese words, with each kanji's readings colour-coded.";

/** Records every response the page gets from now on. */
function watchResponses(page: Page): Response[] {
  const responses: Response[] = [];
  page.on('response', (response) => responses.push(response));
  return responses;
}

/**
 * The responses for a missing file, as "status url", so a failure names them: an error status (400
 * or more), or the page itself sent for something that isn't the page. vite preview (like the dev
 * server) answers any unknown path with index.html and a 200, where a plain static host (CI3) would
 * send a 404, so an HTML answer to a script, style, icon or data request means the file is missing.
 */
const failed = (responses: Response[]) =>
  responses
    .filter(
      (response) =>
        response.status() >= 400 ||
        (response.request().resourceType() !== 'document' &&
          /^text\/html\b/.test(response.headers()['content-type'] ?? '')),
    )
    .map((response) => `${response.status()} ${response.headers()['content-type']} ${response.url()}`);

test('the page title is exactly "Kanji Reading Highlighter"', async ({ page }) => {
  const errors = await openApp(page, { colorMode: 'light' });

  await expect(page).toHaveTitle(NAME);
  expect(await page.title()).toBe(NAME);
  expect(errors).toEqual([]);
});

test('the favicon loads, and no request gets a 404 or any other error, on the start page or after choosing a mode', async ({
  page,
}) => {
  const responses = watchResponses(page);
  // A first visit opens on the start page; choosing a mode then loads the deck files too.
  const errors = await openApp(page);
  await page.getByRole('button', { name: 'Light', exact: true }).click();
  await waitForDeck(page);
  await page.waitForLoadState('networkidle');

  // The page's own requests (the page, its scripts and styles, and the deck files) all succeeded.
  expect(responses.some((response) => /\/data\/.+\.json$/.test(response.url()))).toBe(true);
  expect(failed(responses)).toEqual([]);

  // Headless Chromium doesn't fetch tab icons itself, so each icon link's address, as the page
  // resolves it (a wrong path or base would show here), is requested and checked.
  const addresses = await page
    .locator('link[rel~="icon"]')
    .evaluateAll((links) => (links as HTMLLinkElement[]).map((link) => link.href));
  expect(addresses.map((address) => new URL(address).pathname)).toEqual(['/favicon.svg', '/favicon.ico']);
  for (const address of addresses) {
    const icon = await page.request.get(address);
    expect(icon.status(), address).toBe(200);
    // vite preview answers a missing file with the page itself (200, text/html), so the type matters too.
    expect(icon.headers()['content-type'], address).toMatch(/^image\//);
  }
  expect(errors).toEqual([]);
});

test('/favicon.svg and /favicon.ico are served from the site root with icon content types', async ({ request }) => {
  const svg = await request.get('/favicon.svg');
  expect(svg.status()).toBe(200);
  expect(svg.headers()['content-type']).toMatch(/^image\/svg\+xml\b/);
  expect(await svg.text()).toMatch(/^<svg [^>]*viewBox="0 0 32 32"/);

  const ico = await request.get('/favicon.ico');
  expect(ico.status()).toBe(200);
  expect(ico.headers()['content-type']).toMatch(/^image\/(x-icon|vnd\.microsoft\.icon)\b/);
  expect([...(await ico.body()).subarray(0, 4)]).toEqual([0, 0, 1, 0]);
});

test('the head has the agreed description, once (answer 7)', async ({ page }) => {
  await openApp(page, { colorMode: 'light' });

  const description = page.locator('head meta[name="description"]');
  await expect(description).toHaveCount(1);
  await expect(description).toHaveAttribute('content', DESCRIPTION);
});

test('the head has exactly two icon links, the SVG then the .ico at 32x32, both from the site root (answers 2 and 4)', async ({
  page,
}) => {
  await openApp(page, { colorMode: 'light' });

  const icons = await page
    .locator('link[rel~="icon"]')
    .evaluateAll((links) =>
      links.map((link) => [
        link.getAttribute('rel'),
        link.getAttribute('href'),
        link.getAttribute('type'),
        link.getAttribute('sizes'),
      ]),
    );
  expect(icons).toEqual([
    ['icon', '/favicon.svg', 'image/svg+xml', null],
    ['icon', '/favicon.ico', null, '32x32'],
  ]);
});

test('there is no web app manifest, no home-screen icon and no theme colour (answers 3 and 5)', async ({
  page,
  request,
}) => {
  await openApp(page, { colorMode: 'light' });

  await expect(page.locator('link[rel="manifest"]')).toHaveCount(0);
  await expect(page.locator('link[rel~="apple-touch-icon"], link[rel~="apple-touch-icon-precomposed"]')).toHaveCount(0);
  await expect(page.locator('meta[name="theme-color"]')).toHaveCount(0);
  // Only the two icons are in the build: no manifest or PNG icon files were added either. (vite
  // preview answers an unknown path with the page itself, so the type shows the file isn't there.)
  for (const path of ['/manifest.webmanifest', '/apple-touch-icon.png', '/icon-192.png']) {
    const response = await request.get(path);
    expect(response.headers()['content-type'], path).toMatch(/^text\/html\b/);
  }
});

for (const { label, colorMode } of [
  { label: 'the start page', colorMode: undefined },
  { label: 'Light', colorMode: 'light' },
  { label: 'Dark', colorMode: 'dark' },
  { label: 'High contrast', colorMode: 'high-contrast' },
]) {
  test(`at 320px wide, the header name stays on one line (${label})`, async ({ page }) => {
    const errors = await openApp(page, { colorMode, viewport: { width: 320, height: 640 } });

    const name = page.getByRole('heading', { level: 1, name: NAME });
    await expect(name).toBeVisible();
    const { lines, height, lineHeight, overflows } = await name.evaluate((heading) => {
      const range = document.createRange();
      range.selectNodeContents(heading);
      const tops = new Set([...range.getClientRects()].map((rect) => Math.round(rect.top)));
      return {
        lines: tops.size,
        height: heading.getBoundingClientRect().height,
        lineHeight: parseFloat(getComputedStyle(heading).lineHeight),
        overflows: heading.scrollWidth > heading.clientWidth,
      };
    });
    expect(lines).toBe(1);
    expect(height).toBe(lineHeight);
    expect(overflows).toBe(false);
    expect(errors).toEqual([]);
  });
}
