// FEAT5_5 failure path on the start page: the whole High contrast entry of the page colours
// (MODE_COLORS) and of the reading colours (READING_COLORS_BY_MODE) is missing. The start page is
// shown on a first visit with a High contrast tile, so it must still draw it, white on black,
// instead of crashing; and High contrast can still be chosen.
import { screen, within } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { MODE_COLORS, READING_COLORS_BY_MODE, type ColorMode } from '@kanji/core';
import { COUNTER, chooseOnStartPage, firstVisit, makeDecks, renderStartPage, startPageTile } from './helpers';

vi.mock('@kanji/core', async (importOriginal) => {
  const core = await importOriginal<typeof import('@kanji/core')>();
  /** `table` without its High contrast entry. */
  const withoutHighContrast = <T,>(table: Record<ColorMode, T>): Partial<Record<ColorMode, T>> =>
    Object.fromEntries(Object.entries(table).filter(([mode]) => mode !== 'high-contrast'));
  return {
    ...core,
    MODE_COLORS: withoutHighContrast(core.MODE_COLORS),
    READING_COLORS_BY_MODE: withoutHighContrast(core.READING_COLORS_BY_MODE),
  };
});

const WHITE = '#ffffff';
const BLACK = '#000000';
const preview = () => startPageTile('High contrast').querySelector<HTMLElement>('[aria-hidden="true"]')!;

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('The start page with a whole High contrast entry missing (FEAT5_5 failure path)', () => {
  test('the mock really leaves the entries out', () => {
    expect(MODE_COLORS).not.toHaveProperty('high-contrast');
    expect(READING_COLORS_BY_MODE).not.toHaveProperty('high-contrast');
  });

  test('on a first visit the start page still shows, with the High contrast preview in white on black', () => {
    firstVisit();
    renderStartPage(makeDecks({ N5: 30, N4: 30 }));
    expect(screen.getByRole('heading', { level: 2, name: 'Choose how the app looks' })).toBeInTheDocument();
    expect(startPageTile('High contrast')).toBeInTheDocument();
    expect(preview()).toHaveStyle({ backgroundColor: BLACK, boxShadow: `inset 0 0 0 2px ${WHITE}` });
    expect(preview().firstElementChild).toHaveStyle({ backgroundColor: BLACK });
    expect(within(preview()).getByText('静')).toHaveStyle({ color: WHITE });
    expect(within(preview()).getByText('か')).toHaveStyle({ color: WHITE });
  });

  test('I can still choose High contrast there, and my cards show', async () => {
    firstVisit();
    const user = renderStartPage(makeDecks({ N5: 30, N4: 30 }));
    await chooseOnStartPage(user, 'High contrast');
    expect(document.documentElement.getAttribute('data-color-mode')).toBe('high-contrast');
    expect(screen.getByText(COUNTER)).toBeInTheDocument();
    expect(screen.getByRole('article')).toBeInTheDocument();
  });
});
