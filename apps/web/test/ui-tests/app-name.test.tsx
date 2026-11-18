// UI5: the app has one name, "Kanji Reading Highlighter" (answer 1), shown as the header's <h1> on
// the start page and on the cards. The icon is only in the browser tab, not in the header
// (answer 8). The page title and the tab icon are checked in test/e2e/app-name-and-favicon.test.ts.
import { screen, within } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { chooseOnStartPage, firstVisit, renderApp, renderStartPage } from './helpers';

const NAME = 'Kanji Reading Highlighter';

const appHeading = () => screen.getByRole('heading', { level: 1 });
const header = () => appHeading().closest('header')!;

describe('the app name in the header (UI5)', () => {
  test('on the start page (no colour mode chosen yet), the only level 1 heading is "Kanji Reading Highlighter"', () => {
    firstVisit();
    renderStartPage();

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(appHeading()).toHaveAccessibleName(NAME);
    expect(appHeading()).toHaveTextContent(new RegExp(`^${NAME}$`));
  });

  test('after a colour mode is chosen on the start page, the header still says "Kanji Reading Highlighter"', async () => {
    firstVisit();
    const user = renderStartPage();
    await chooseOnStartPage(user, 'Dark');

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(appHeading()).toHaveAccessibleName(NAME);
  });

  test('with a colour mode saved (the cards on screen), the header says "Kanji Reading Highlighter"', async () => {
    await renderApp();

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(appHeading()).toHaveAccessibleName(NAME);
  });
});

describe('no icon in the header (UI5, answer 8)', () => {
  test('on the start page, the header has no image or drawing next to the name', () => {
    firstVisit();
    renderStartPage();

    expect(header().querySelectorAll('img, svg, picture, [role="img"]')).toHaveLength(0);
    expect(appHeading().children).toHaveLength(0);
  });

  test('on the cards, the only drawings in the header are inside its buttons, none next to the name', async () => {
    await renderApp();

    expect(header().querySelectorAll('img, picture')).toHaveLength(0);
    // The menu and Shuffled out buttons have their own icons; anything else would be a new icon.
    for (const drawing of header().querySelectorAll('svg, [role="img"]')) {
      expect(drawing.closest('button')).not.toBeNull();
    }
    expect(appHeading().children).toHaveLength(0);
    expect(within(appHeading()).queryByRole('img')).toBeNull();
  });
});
