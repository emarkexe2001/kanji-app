// UI5: one app name, and a favicon. On the production build: the page title is the agreed name
// (answer 1), the tab icon loads and nothing gets a 404 (answers 2 and 4), the head has the agreed
// description (answer 7) and exactly the two icon links, the same in every colour mode (answer 6),
// with no manifest, home-screen icon or theme colour (answers 3 and 5), and the header name stays
// on one line at 320px (FEAT5 rule).
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

/** Records, as "error url", every request from now on that got no answer at all (refused, dropped). */
function watchDroppedRequests(page: Page): string[] {
  const dropped: string[] = [];
  page.on('requestfailed', (request) => dropped.push(`${request.failure()?.errorText} ${request.url()}`));
  return dropped;
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
  const dropped = watchDroppedRequests(page);
  // A first visit opens on the start page; choosing a mode then loads the deck files too.
  const errors = await openApp(page);
  await page.getByRole('button', { name: 'Light', exact: true }).click();
  await waitForDeck(page);
  await page.waitForLoadState('networkidle');

  // The page's own requests (the page, its scripts and styles, and the deck files) all succeeded.
  expect(responses.some((response) => /\/data\/.+\.json$/.test(response.url()))).toBe(true);
  expect(responses.some((response) => /\/assets\/.+\.js$/.test(response.url()))).toBe(true);
  expect(failed(responses)).toEqual([]);
  expect(dropped).toEqual([]);

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

// The check above only fails if it sees a missing file as missing. vite preview answers a missing
// file with the page and a 200, so this proves that answer is caught for a data request, a
// stylesheet and an image, and that the page's own answer to "/" is not counted.
test('the missing-file check counts a file the server does not have, though vite preview answers it with a 200', async ({
  page,
}) => {
  const responses = watchResponses(page);
  await openApp(page, { colorMode: 'light' });
  await waitForDeck(page);
  expect(failed(responses)).toEqual([]);

  await page.evaluate(async () => {
    await fetch('/data/no-such-file.json');
    const style = document.createElement('link');
    style.rel = 'stylesheet';
    style.href = '/no-such-style.css';
    const image = document.createElement('img');
    image.src = '/no-such-icon.ico';
    const settled = (element: HTMLElement) =>
      new Promise((done) => {
        element.addEventListener('load', done);
        element.addEventListener('error', done);
      });
    const waits = [settled(style), settled(image)];
    document.head.append(style);
    document.body.append(image);
    await Promise.all(waits);
  });

  const missing = failed(responses);
  for (const path of ['/data/no-such-file.json', '/no-such-style.css', '/no-such-icon.ico']) {
    expect(
      missing.filter((line) => line.endsWith(path)),
      path,
    ).toEqual([expect.stringMatching(/^200 text\/html\b/)]);
  }
  expect(missing).toHaveLength(3);
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

test('the icon links are the same in every colour mode, so the tab icon never changes (answer 6)', async ({
  browser,
}) => {
  const linksIn = async (colorMode: string | undefined, device: 'light' | 'dark') => {
    const page = await browser.newPage();
    await openApp(page, { colorMode, device });
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    const links = await page
      .locator('link[rel~="icon"]')
      .evaluateAll((elements) => elements.map((element) => element.outerHTML));
    await page.close();
    return links;
  };

  const light = await linksIn('light', 'light');
  expect(light).toHaveLength(2);
  expect(await linksIn('dark', 'dark')).toEqual(light);
  expect(await linksIn('high-contrast', 'light')).toEqual(light);
  // A first visit on a dark device opens on the start page in Dark.
  expect(await linksIn(undefined, 'dark')).toEqual(light);
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
