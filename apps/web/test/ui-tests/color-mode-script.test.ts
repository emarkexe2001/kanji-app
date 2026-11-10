// FEAT5: the small script in index.html that puts the saved colour mode on the page before it is
// first drawn, so it opens in Dark with no flash of Light. It can't import the app's code (it runs
// before it loads), so these tests check it does exactly what the app does (loadColorMode) for
// every saved value, and that it runs before anything is drawn. FEAT5_1: when nothing usable is
// saved, both use the device's setting (Dark if it prefers dark), so a dark device no longer gets
// Light; jsdom has no window.matchMedia, so the tests without a device stub get Light.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { COLOR_MODES } from '@kanji/core';
import { COLOR_MODE_ATTRIBUTE, COLOR_MODE_KEY, DEVICE_DARK_QUERY, loadColorMode } from '../../src/lib/color-mode';

const INDEX_HTML = readFileSync(resolve(__dirname, '../../index.html'), 'utf8');
const page = new DOMParser().parseFromString(INDEX_HTML, 'text/html');

/** The inline script (the only <script> without a src). */
const inlineScripts = () => [...page.querySelectorAll('script')].filter((s) => !s.src && !s.getAttribute('src'));
const script = () => inlineScripts()[0];

/** Runs the script on this test's page, as the browser would, and returns the mode it put on <html>. */
function runScript() {
  document.documentElement.removeAttribute(COLOR_MODE_ATTRIBUTE);
  new Function(script().textContent ?? '')();
  return document.documentElement.getAttribute(COLOR_MODE_ATTRIBUTE);
}

afterEach(() => {
  document.documentElement.removeAttribute(COLOR_MODE_ATTRIBUTE);
  vi.unstubAllGlobals();
});

/** The device's colour scheme setting (FEAT5_1): jsdom has no media queries, so matchMedia is replaced. */
function deviceDark(dark: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({ matches: dark && query === DEVICE_DARK_QUERY, media: query })),
  );
}

/** The mode the index.html script puts on the page and the mode the app opens in, side by side. */
const both = () => [runScript(), loadColorMode()];

describe('the colour mode script in index.html (FEAT5)', () => {
  test('there is one, a plain script in <head>, before the app and any stylesheet, so it runs before the first paint', () => {
    expect(inlineScripts()).toHaveLength(1);
    expect(script().parentElement).toBe(page.head);
    // A plain script runs as soon as it is read (a module script would wait until the page is parsed).
    expect(script().getAttribute('type')).toBeNull();
    expect(script().hasAttribute('defer') || script().hasAttribute('async')).toBe(false);
    // Only the page's details (charset, viewport, title) come before it in <head>: nothing it would
    // wait for, and no stylesheet that could be drawn first.
    const before = [...page.head.children].slice(0, [...page.head.children].indexOf(script()));
    expect(before.map((el) => el.tagName)).toEqual(['META', 'META', 'TITLE']);
    // The app (its module script) comes after it.
    const app = page.querySelector('script[type="module"]')!;
    expect(script().compareDocumentPosition(app) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  test('the stylesheet only comes in through the app, which the build links after the script', () => {
    // index.html has no stylesheet of its own: the colours come from index.css, which the app's
    // entry imports. The build turns that into a <link> at the end of <head>, after both scripts
    // (checked in the built index.html in the PR), so the script has always run by the time the
    // page can be drawn with the stylesheet.
    expect(page.querySelectorAll('link[rel="stylesheet"], style')).toHaveLength(0);
    const app = page.querySelector('script[type="module"]')!;
    expect(app.getAttribute('src')).toBe('/src/app/main.tsx');
    const entry = readFileSync(resolve(__dirname, '../../src/app/main.tsx'), 'utf8');
    expect(entry).toMatch(/^import '\.\/index\.css';$/m);
  });

  test('it reads the same storage key and sets the same attribute as the app', () => {
    expect(script().textContent).toContain(`'${COLOR_MODE_KEY}'`);
    expect(script().textContent).toContain(`'${COLOR_MODE_ATTRIBUTE}'`);
  });

  test('when nothing is saved (and the device can’t say), it opens in Light, the same as the app', () => {
    localStorage.removeItem(COLOR_MODE_KEY); // test/setup.ts saves Light
    expect(runScript()).toBe('light');
    expect(loadColorMode()).toBe('light');
  });

  test.each(COLOR_MODES)('when %s is saved, it opens in it, the same as the app', (mode) => {
    localStorage.setItem(COLOR_MODE_KEY, mode);
    expect(runScript()).toBe(mode);
    expect(loadColorMode()).toBe(mode);
  });

  test.each(['Dark', 'black', '', ' dark', '"dark"', '{"mode":"dark"}', 'undefined', 'null'])(
    'when the saved mode is broken or unknown (%j), it opens in Light, the same as the app',
    (saved) => {
      localStorage.setItem(COLOR_MODE_KEY, saved);
      expect(runScript()).toBe('light');
      expect(loadColorMode()).toBe('light');
    },
  );

  test('when storage is blocked, it opens in Light without an error, the same as the app', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('The operation is insecure.', 'SecurityError');
    });
    expect(runScript()).toBe('light');
    expect(loadColorMode()).toBe('light');
  });

  test('when localStorage itself can’t be reached, it opens in Light without an error', () => {
    const real = Object.getOwnPropertyDescriptor(window, 'localStorage')!;
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get() {
        throw new DOMException('The operation is insecure.', 'SecurityError');
      },
    });
    try {
      expect(runScript()).toBe('light');
      expect(loadColorMode()).toBe('light');
    } finally {
      Object.defineProperty(window, 'localStorage', real);
    }
  });
});

describe('the colour mode script in index.html and the device setting (FEAT5_1)', () => {
  // localStorage starts with Light saved (test/setup.ts); these tests are about nothing saved.
  beforeEach(() => localStorage.removeItem(COLOR_MODE_KEY));

  test('it asks the device the same question as the app', () => {
    expect(script().textContent).toContain(`'${DEVICE_DARK_QUERY}'`);
  });

  test('when nothing is saved and the device prefers dark, it opens in Dark, the same as the app', () => {
    deviceDark(true);
    expect(both()).toEqual(['dark', 'dark']);
  });

  test.each([false, true])(
    'when nothing is saved and the device asks for more contrast, it still opens in Light or Dark, never High contrast, the same as the app (FEAT5_5, device dark: %s)',
    (dark) => {
      vi.stubGlobal(
        'matchMedia',
        vi.fn((query: string) => ({
          matches: /prefers-contrast/.test(query) || (dark && query === DEVICE_DARK_QUERY),
          media: query,
        })),
      );
      const mode = dark ? 'dark' : 'light';
      expect(both()).toEqual([mode, mode]);
      expect(script().textContent).not.toContain('prefers-contrast');
    },
  );

  test('when nothing is saved and the device prefers light, it opens in Light, the same as the app', () => {
    deviceDark(false);
    expect(both()).toEqual(['light', 'light']);
  });

  test.each(['Dark', 'black', '', ' dark', '"dark"', '{"mode":"dark"}', 'undefined', 'null'])(
    'when the saved mode is broken or unknown (%j) and the device prefers dark, it opens in Dark, the same as the app',
    (saved) => {
      localStorage.setItem(COLOR_MODE_KEY, saved);
      deviceDark(true);
      expect(both()).toEqual(['dark', 'dark']);
    },
  );

  test('when storage is blocked and the device prefers dark, it opens in Dark, the same as the app', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('The operation is insecure.', 'SecurityError');
    });
    deviceDark(true);
    expect(both()).toEqual(['dark', 'dark']);
  });

  test('when localStorage itself can’t be reached and the device prefers dark, it opens in Dark, the same as the app', () => {
    const real = Object.getOwnPropertyDescriptor(window, 'localStorage')!;
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get() {
        throw new DOMException('The operation is insecure.', 'SecurityError');
      },
    });
    deviceDark(true);
    try {
      expect(both()).toEqual(['dark', 'dark']);
    } finally {
      Object.defineProperty(window, 'localStorage', real);
    }
  });

  test.each([
    ['light', true],
    ['dark', false],
  ] as const)('a saved mode (%s) wins over the device setting (device dark: %s), the same as the app', (mode, dark) => {
    localStorage.setItem(COLOR_MODE_KEY, mode);
    deviceDark(dark);
    expect(both()).toEqual([mode, mode]);
  });

  test('when the device setting can’t be read (matchMedia throws), it opens in Light without an error, the same as the app', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => {
        throw new Error('not supported');
      }),
    );
    expect(both()).toEqual(['light', 'light']);
  });

  test('when the browser has no matchMedia, it opens in Light without an error, the same as the app', () => {
    vi.stubGlobal('matchMedia', undefined);
    expect(both()).toEqual(['light', 'light']);
  });
});
