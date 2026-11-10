// FEAT5_5 failure path: "When a high-contrast colour token is missing, the app falls back to
// readable white on black instead of crashing or showing unreadable text."
//
// @kanji/core is replaced with a copy whose High contrast colours set in the code are missing: one
// reading colour (Kunyomi) is left out, and the whole High contrast entry of the JLPT header, card
// (no level, NEW ribbon, ★ Common Word), pick outline and tick tables is gone. The CSS tokens have
// their own check (color-mode-css.test.ts fails if one is missing from the High contrast block) and
// a white-on-black safety net in index.css.
import { screen, within } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { JLPT_COLORS, READING_COLORS_BY_MODE, type ColorMode, type WordEntry } from '@kanji/core';
import { COLOR_MODE_KEY } from '../../src/lib/color-mode';
import { firstVisit, makeDecks, renderApp, renderStartPage, shuffleIn, startPageTile, type User } from './helpers';

vi.mock('@kanji/core', async (importOriginal) => {
  const core = await importOriginal<typeof import('@kanji/core')>();
  /** `table` without its High contrast entry. */
  const withoutHighContrast = <T,>(table: Record<ColorMode, T>): Partial<Record<ColorMode, T>> =>
    Object.fromEntries(Object.entries(table).filter(([mode]) => mode !== 'high-contrast'));
  const highContrastReadings = Object.fromEntries(
    Object.entries(core.READING_COLORS_BY_MODE['high-contrast']).filter(([kind]) => kind !== 'kunyomi'),
  );
  return {
    ...core,
    READING_COLORS_BY_MODE: { ...core.READING_COLORS_BY_MODE, 'high-contrast': highContrastReadings },
    JLPT_COLORS_BY_MODE: withoutHighContrast(core.JLPT_COLORS_BY_MODE),
    CARD_COLORS_BY_MODE: withoutHighContrast(core.CARD_COLORS_BY_MODE),
    PICK_OUTLINE_COLORS: withoutHighContrast(core.PICK_OUTLINE_COLORS),
    PICK_TICK_COLORS: withoutHighContrast(core.PICK_TICK_COLORS),
  };
});

const WHITE = '#ffffff';
const BLACK = '#000000';

/** Words whose Reading Breakdown has every kind of reading. */
const COLOURFUL: WordEntry[] = makeDecks({ N5: 30, N4: 30 }).map((w) => ({
  ...w,
  segments: [
    { text: '静', reading: 'しず', kind: 'kunyomi', rootMeaning: 'quiet' },
    { text: '音', reading: 'おん', kind: 'onyomi', rootMeaning: 'sound' },
  ],
}));

const card = () => screen.getByRole('article');
const cardHeader = () => card().querySelector('header')!;
const CANT_SHOW = /can.t be shown/i;

async function renderInHighContrast(words: WordEntry[] = COLOURFUL) {
  localStorage.setItem(COLOR_MODE_KEY, 'high-contrast');
  return renderApp(words);
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('A missing High contrast colour falls back to white on black (FEAT5_5 failure path)', () => {
  test('the mock really leaves the colours out', () => {
    expect(READING_COLORS_BY_MODE['high-contrast']).not.toHaveProperty('kunyomi');
  });

  test('a missing reading colour: the card still shows, and that reading is white, not unreadable', async () => {
    await renderInHighContrast();
    expect(screen.queryByText(CANT_SHOW)).not.toBeInTheDocument();
    const kunyomi = within(card()).getByText('Kunyomi');
    expect(kunyomi).toHaveStyle({ color: WHITE });
    const note = within(card()).getByText('Root Meaning: "quiet"');
    expect(note).toHaveStyle({ color: WHITE, borderColor: WHITE });
    expect(note.style.backgroundColor).toBe('transparent');
    // The colours that are there are still used.
    expect(within(card()).getByText('Onyomi')).toHaveStyle({ color: '#6cb8ff' });
  });

  test('a missing JLPT header colour: the header is black with white text', async () => {
    await renderInHighContrast();
    expect(cardHeader()).toHaveTextContent(/^JLPT N[45]$/);
    expect(cardHeader()).toHaveStyle({ backgroundColor: BLACK, color: WHITE });
  });

  test('a missing no-level header and ★ Common Word colour: black with white text, and a white badge', async () => {
    await renderInHighContrast(makeDecks({ common: 30 }));
    expect(cardHeader()).toHaveTextContent('Vocabulary');
    expect(cardHeader()).toHaveStyle({ backgroundColor: BLACK, color: WHITE });
    expect(within(card()).getByText('★ Common Word')).toHaveStyle({ color: WHITE });
  });

  test('a missing NEW ribbon colour: the ribbon is white, under its black text', async () => {
    const user = await renderInHighContrast();
    await shuffleIn(user, '1');
    const ribbon = within(card()).getByText('New');
    expect(ribbon).toHaveStyle({ backgroundColor: WHITE });
    // Its text is black in High contrast (a class, as jsdom draws no colours).
    expect(ribbon).toHaveClass('hc:text-black');
  });

  test('missing pick colours: a picked card still has a white outline and a white tick with its black ✓', async () => {
    const user: User = await renderInHighContrast();
    await shuffleIn(user, '1');
    await user.click(screen.getByRole('button', { name: 'Next →' }));
    await user.click(screen.getByRole('button', { name: /^Shuffled out \(\d+\)$/ }));
    const addBack = within(screen.getByRole('group', { name: /^Add back/ }))
      .getAllByRole('checkbox')[0]
      .closest('label')!;
    await user.click(addBack);
    const takeOut = within(screen.getByRole('group', { name: /^Take out of your deck/ }))
      .getByRole('checkbox', { name: /^Card 1: / })
      .closest('label')!;
    await user.click(takeOut);

    expect(screen.queryByText(CANT_SHOW)).not.toBeInTheDocument();
    for (const label of [addBack, takeOut]) {
      expect(label).toHaveStyle({ '--pick': WHITE });
      const tick = within(label).getByText('✓');
      expect(tick).toHaveStyle({ backgroundColor: WHITE });
      expect(tick).toHaveClass('hc:text-black');
    }
  });
});

describe('The start page with High contrast colours missing (FEAT5_5 failure path)', () => {
  /** The mini card preview inside a tile (the part hidden from screen readers). */
  const preview = (name: 'Light' | 'Dark' | 'High contrast') =>
    startPageTile(name).querySelector<HTMLElement>('[aria-hidden="true"]')!;

  test('a missing JLPT colour: the High contrast preview’s header is black with white text, not black on black', () => {
    firstVisit();
    renderStartPage(COLOURFUL);
    const header = within(preview('High contrast')).getByText('JLPT N5');
    // The inline white beats the header's text-black class.
    expect(header).toHaveStyle({ backgroundColor: BLACK, color: WHITE });
    // Light and Dark still have their own colours, with no inline text colour.
    const light = within(preview('Light')).getByText('JLPT N5');
    expect(light).toHaveStyle({ backgroundColor: JLPT_COLORS.N5 });
    expect(light.style.color).toBe('');
  });

  test('a missing reading colour: 静 is white in the High contrast preview, and か keeps its colour', () => {
    firstVisit();
    renderStartPage(COLOURFUL);
    expect(within(preview('High contrast')).getByText('静')).toHaveStyle({
      color: WHITE,
      borderBottom: `2px solid ${WHITE}`,
    });
    expect(within(preview('High contrast')).getByText('か')).toHaveStyle({ color: '#5ce67c' });
  });
});
