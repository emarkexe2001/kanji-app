// FEAT5: the colour mode menu in the top left of the header, and Dark mode.
import { StrictMode } from 'react';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, test, vi } from 'vitest';
import {
  COMMON_COLOR,
  JLPT_COLORS,
  MODE_COLORS,
  NEW_COLOR,
  PICK_COLORS,
  PICK_OUTLINE_COLORS,
  READING_COLORS,
  READING_COLORS_BY_MODE,
  type WordEntry,
} from '@kanji/core';
import App from '../../src/app/app';
import { COLOR_MODE_KEY } from '../../src/lib/color-mode';
import {
  COUNTER,
  counter,
  currentWord,
  deckShuffleButton,
  makeDecks,
  renderApp,
  serveDeck,
  shuffleIn,
  shuffleInButton,
  type User,
} from './helpers';

const DECKS = makeDecks({ N5: 30, N4: 30 });

/** Words whose Reading Breakdown has every kind of reading, so their colours can be checked. */
const COLOURFUL: WordEntry[] = makeDecks({ N5: 30, N4: 30 }).map((w) => ({
  ...w,
  segments: [
    { text: '静', reading: 'しず', kind: 'kunyomi', rootMeaning: 'quiet' },
    { text: '音', reading: 'おん', kind: 'onyomi', rootMeaning: 'sound' },
    { text: 'か', kind: 'okurigana', grammar: 'Adjectival Noun Suffix' },
  ],
}));

const html = () => document.documentElement;
const modeOnPage = () => html().getAttribute('data-color-mode');
const saved = () => localStorage.getItem(COLOR_MODE_KEY);
const title = () => screen.getByRole('heading', { level: 1, name: 'Kanji Reading Highlighter' });
const modeButton = () => screen.getByRole('button', { name: /^Colour mode: / });
const menu = () => screen.queryByRole('menu', { name: 'Colour mode' });
const item = (name: 'Light' | 'Dark') => screen.getByRole('menuitemradio', { name });
const shuffledOutButton = () => screen.getByRole('button', { name: /^Shuffled out \(\d+\)$/ });
const panel = () => screen.queryByRole('region', { name: 'Shuffled-out cards' });
const icon = (el: HTMLElement) =>
  el.querySelector('svg[data-icon="sun"], svg[data-icon="moon"]')?.getAttribute('data-icon');

async function openMenu(user: User) {
  await user.click(modeButton());
  return menu()!;
}

async function choose(user: User, name: 'Light' | 'Dark') {
  await openMenu(user);
  await user.click(item(name));
}

/** Renders the app again, as if the page were reloaded (storage is kept). */
async function reload(words: WordEntry[] = DECKS) {
  document.body.innerHTML = '';
  html().removeAttribute('data-color-mode');
  serveDeck(words);
  const user = userEvent.setup();
  render(<App />);
  await screen.findByText(COUNTER);
  return user;
}

/** Shuffles in one card, then moves on, and returns the word that was shuffled out. */
async function shuffleOutOne(user: User) {
  const word = currentWord();
  await shuffleIn(user, '1');
  await user.click(screen.getByRole('button', { name: 'Next →' }));
  return word!;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('The colour mode button (FEAT5)', () => {
  test('when I open the app for the first time (nothing saved), it opens in Light and nothing is saved yet', async () => {
    await renderApp(DECKS);
    expect(modeOnPage()).toBe('light');
    expect(modeButton()).toHaveAccessibleName('Colour mode: Light');
    expect(saved()).toBeNull();
  });

  test('the button is top left in the header, before "Shuffled out (N)", and shows a sun and "Light ▾"', async () => {
    await renderApp(DECKS);
    const header = title().closest('header')!;
    expect(within(header).getAllByRole('button')[0]).toBe(modeButton());
    expect(within(header).getAllByRole('button')[1]).toBe(shuffledOutButton());
    expect(modeButton()).toHaveTextContent(/^Light\s*▾$/);
    expect(icon(modeButton())).toBe('sun');
    // The icon and the arrow are hidden from screen readers; they hear "Colour mode: Light".
    expect(modeButton().querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    expect(within(modeButton()).getByText('▾')).toHaveAttribute('aria-hidden', 'true');
  });

  test('it says it opens a menu, and whether the menu is open', async () => {
    const user = await renderApp(DECKS);
    expect(modeButton()).toHaveAttribute('aria-haspopup', 'menu');
    expect(modeButton()).toHaveAttribute('aria-expanded', 'false');
    expect(modeButton()).not.toHaveAttribute('aria-controls');

    const open = await openMenu(user);
    expect(modeButton()).toHaveAttribute('aria-expanded', 'true');
    expect(modeButton()).toHaveAttribute('aria-controls', open.id);
    expect(modeButton()).toHaveTextContent(/^Light\s*▴$/);
  });

  test('it is 36px tall with a border, like "Shuffled out (N)", and keeps a border and a focus ring in forced colours', async () => {
    await renderApp(DECKS);
    // jsdom has no sizes or colours, so the classes are checked.
    expect(modeButton()).toHaveClass('h-9', 'border', 'border-field-line', 'bg-card', 'text-ink', 'rounded-xl');
    expect(modeButton()).toHaveClass('focus-visible:outline-2', 'focus-visible:outline-ink');
    expect(modeButton()).toHaveClass('forced-colors:border-[color:ButtonText]');
  });
});

describe('The colour mode menu (FEAT5)', () => {
  test('when I open the menu, it is headed "Colour mode", lists Light and Dark, and the current mode has a tick', async () => {
    const user = await renderApp(DECKS);
    const open = await openMenu(user);

    expect(within(open).getByText('Colour mode')).toBeInTheDocument();
    expect(
      within(open)
        .getAllByRole('menuitemradio')
        .map((i) => i.textContent),
    ).toEqual(['Light', 'Dark']);
    expect(item('Light')).toHaveAttribute('aria-checked', 'true');
    expect(item('Dark')).toHaveAttribute('aria-checked', 'false');
    expect(item('Light').querySelector('[data-icon="tick"]')).not.toBeNull();
    expect(item('Dark').querySelector('[data-icon="tick"]')).toBeNull();
    expect(icon(item('Light'))).toBe('sun');
    expect(icon(item('Dark'))).toBe('moon');
    // The current mode's row is shaded too (checked by class, as jsdom has no colours).
    expect(item('Light')).toHaveClass('bg-menu-selected');
    expect(item('Dark')).not.toHaveClass('bg-menu-selected');
  });

  test('the menu is 200px wide, just under the button, and drawn over the page and the Shuffled-out panel', async () => {
    const user = await renderApp(DECKS);
    const open = await openMenu(user);
    // jsdom has no layout, so the classes are checked: under the button's left edge, 8px down,
    // and above the panel (z-40).
    expect(open).toHaveClass('absolute', 'top-full', 'left-0', 'mt-2', 'w-[200px]', 'z-50');
    expect(open.parentElement).toContainElement(modeButton());
    expect(open.parentElement).toHaveClass('relative');
  });

  test('when I choose Dark, the app switches straight away, the menu closes and the button says Dark', async () => {
    const user = await renderApp(DECKS);
    await choose(user, 'Dark');

    expect(modeOnPage()).toBe('dark');
    expect(menu()).not.toBeInTheDocument();
    expect(modeButton()).toHaveAccessibleName('Colour mode: Dark');
    expect(modeButton()).toHaveTextContent(/^Dark\s*▾$/);
    expect(icon(modeButton())).toBe('moon');
    expect(modeButton()).toHaveFocus();
    expect(saved()).toBe('dark');

    const open = await openMenu(user);
    expect(within(open).getByRole('menuitemradio', { name: 'Dark' })).toHaveAttribute('aria-checked', 'true');
    expect(item('Light')).toHaveAttribute('aria-checked', 'false');
    expect(item('Dark').querySelector('[data-icon="tick"]')).not.toBeNull();
  });

  test('when I choose Light again, the app goes back to Light', async () => {
    const user = await renderApp(DECKS);
    await choose(user, 'Dark');
    await choose(user, 'Light');
    expect(modeOnPage()).toBe('light');
    expect(modeButton()).toHaveAccessibleName('Colour mode: Light');
    expect(saved()).toBe('light');
  });

  test('switching is instant: transitions are held off while the mode changes and back on in the next frame', async () => {
    const frames: FrameRequestCallback[] = [];
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => frames.push(cb));
    const user = await renderApp(DECKS);
    await openMenu(user);
    frames.length = 0;

    await user.click(item('Dark'));
    // index.css turns every transition off under this attribute (color-mode-css.test.ts checks).
    expect(modeOnPage()).toBe('dark');
    expect(html()).toHaveAttribute('data-color-mode-switching');
    act(() => frames.splice(0).forEach((cb) => cb(0)));
    expect(html()).not.toHaveAttribute('data-color-mode-switching');
  });

  test('choosing the mode that is already on changes nothing and leaves transitions on', async () => {
    const user = await renderApp(DECKS);
    await choose(user, 'Light');
    expect(modeOnPage()).toBe('light');
    expect(menu()).not.toBeInTheDocument();
    expect(html()).not.toHaveAttribute('data-color-mode-switching');
  });

  test('when I open the app again after choosing Dark, it opens in Dark', async () => {
    const user = await renderApp(DECKS);
    await choose(user, 'Dark');

    await reload();
    expect(modeOnPage()).toBe('dark');
    expect(modeButton()).toHaveAccessibleName('Colour mode: Dark');
  });

  test('when I press outside the open menu, it closes and the mode does not change', async () => {
    const user = await renderApp(DECKS);
    await openMenu(user);
    await user.click(title());

    expect(menu()).not.toBeInTheDocument();
    expect(modeButton()).toHaveAttribute('aria-expanded', 'false');
    expect(modeOnPage()).toBe('light');
    expect(saved()).toBeNull();
  });

  test('a press outside the menu still does what it was for: pressing Next closes the menu and moves on', async () => {
    const user = await renderApp(DECKS);
    const before = counter().position;
    await openMenu(user);
    await user.click(screen.getByRole('button', { name: 'Next →' }));
    expect(menu()).not.toBeInTheDocument();
    expect(counter().position).toBe(before + 1);
    expect(modeOnPage()).toBe('light');
  });

  test('pressing the button again closes the menu', async () => {
    const user = await renderApp(DECKS);
    await openMenu(user);
    await user.click(modeButton());
    expect(menu()).not.toBeInTheDocument();
    expect(modeButton()).toHaveAttribute('aria-expanded', 'false');
  });
});

describe('The colour mode menu with the keyboard (FEAT5)', () => {
  test.each(['{Enter}', ' ', '{ArrowDown}'])('%s on the button opens the menu on the current mode', async (key) => {
    const user = await renderApp(DECKS);
    modeButton().focus();
    await user.keyboard(key);
    expect(menu()).toBeInTheDocument();
    expect(item('Light')).toHaveFocus();
  });

  test('the menu opens on the current mode when Dark is on', async () => {
    const user = await renderApp(DECKS);
    await choose(user, 'Dark');
    await user.keyboard('{Enter}');
    expect(item('Dark')).toHaveFocus();
  });

  test('the arrow keys move between the modes, round from the last to the first, and Home and End go to either end', async () => {
    const user = await renderApp(DECKS);
    modeButton().focus();
    await user.keyboard('{Enter}');
    await user.keyboard('{ArrowDown}');
    expect(item('Dark')).toHaveFocus();
    await user.keyboard('{ArrowDown}');
    expect(item('Light')).toHaveFocus();
    await user.keyboard('{ArrowUp}');
    expect(item('Dark')).toHaveFocus();
    await user.keyboard('{Home}');
    expect(item('Light')).toHaveFocus();
    await user.keyboard('{End}');
    expect(item('Dark')).toHaveFocus();
    // Moving doesn't choose.
    expect(modeOnPage()).toBe('light');
  });

  test.each(['{Enter}', ' '])('%s chooses the mode, closes the menu and puts focus back on the button', async (key) => {
    const user = await renderApp(DECKS);
    modeButton().focus();
    await user.keyboard('{ArrowDown}{ArrowDown}');
    await user.keyboard(key);
    expect(modeOnPage()).toBe('dark');
    expect(menu()).not.toBeInTheDocument();
    expect(modeButton()).toHaveFocus();
    expect(modeButton()).toHaveAccessibleName('Colour mode: Dark');
  });

  test('Escape closes the menu without changing the mode and puts focus back on the button', async () => {
    const user = await renderApp(DECKS);
    modeButton().focus();
    await user.keyboard('{Enter}{ArrowDown}{Escape}');
    expect(menu()).not.toBeInTheDocument();
    expect(modeButton()).toHaveFocus();
    expect(modeOnPage()).toBe('light');
  });

  test('Tab closes the menu and moves on from the button to "Shuffled out (N)"', async () => {
    const user = await renderApp(DECKS);
    modeButton().focus();
    await user.keyboard('{Enter}');
    await user.tab();
    expect(menu()).not.toBeInTheDocument();
    expect(shuffledOutButton()).toHaveFocus();
  });

  test('the modes are menu radio items, out of the Tab order, so a screen reader hears which one is on', async () => {
    const user = await renderApp(DECKS);
    await openMenu(user);
    for (const name of ['Light', 'Dark'] as const) {
      expect(item(name)).toHaveAttribute('role', 'menuitemradio');
      expect(item(name)).toHaveAttribute('tabindex', '-1');
    }
    expect(item('Light')).toBeChecked();
    expect(item('Dark')).not.toBeChecked();
  });
});

describe('Saving the colour mode (FEAT5): failure paths', () => {
  test.each(['Dark', 'black', '', '{"mode":"dark"}', 'null'])(
    'when the saved mode is broken or unknown (%j), the app opens in Light instead of crashing',
    async (value) => {
      localStorage.setItem(COLOR_MODE_KEY, value);
      const user = await renderApp(DECKS);
      expect(modeOnPage()).toBe('light');
      expect(modeButton()).toHaveAccessibleName('Colour mode: Light');
      // The app works, and the mode can still be changed.
      await user.click(screen.getByRole('button', { name: 'Next →' }));
      expect(counter().position).toBe(2);
      await choose(user, 'Dark');
      expect(modeOnPage()).toBe('dark');
      expect(saved()).toBe('dark');
    },
  );

  test('when storage is blocked, I can still switch modes and use the app, and it opens in Light next time', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('The quota has been exceeded.', 'QuotaExceededError');
    });
    const user = await renderApp(DECKS);
    await choose(user, 'Dark');
    expect(modeOnPage()).toBe('dark');
    expect(modeButton()).toHaveAccessibleName('Colour mode: Dark');
    await user.click(screen.getByRole('button', { name: 'Next →' }));
    expect(counter().position).toBe(2);
    await choose(user, 'Light');
    await choose(user, 'Dark');
    expect(modeOnPage()).toBe('dark');

    await reload();
    expect(modeOnPage()).toBe('light');
    expect(modeButton()).toHaveAccessibleName('Colour mode: Light');
  });

  test('when storage can’t be read at all, the app opens in Light', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('The operation is insecure.', 'SecurityError');
    });
    await renderApp(DECKS);
    expect(modeOnPage()).toBe('light');
    expect(modeButton()).toHaveAccessibleName('Colour mode: Light');
  });

  test('when the dictionary is loading or fails to load, or the deck fails to show, the mode can still be changed', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Promise.reject(new TypeError('Failed to fetch'))),
    );
    const user = userEvent.setup();
    render(<App />);
    expect(screen.getByText('Loading dictionary…')).toBeInTheDocument();
    await screen.findByText(/Couldn't load the word deck/);
    await choose(user, 'Dark');
    expect(modeOnPage()).toBe('dark');

    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    document.body.innerHTML = '';
    serveDeck(DECKS.map((w) => ({ ...w, segments: null })));
    render(<App />);
    await screen.findByText('Something went wrong showing the cards. Please reload the page to try again.');
    expect(modeButton()).toHaveAccessibleName('Colour mode: Dark');
    await choose(user, 'Light');
    expect(modeOnPage()).toBe('light');
    consoleError.mockRestore();
  });

  test('in React strict mode there is exactly one colour mode button and one menu', async () => {
    serveDeck(DECKS);
    const user = userEvent.setup();
    render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
    await screen.findByText(COUNTER);
    expect(screen.getAllByRole('button', { name: /^Colour mode: / })).toHaveLength(1);
    await openMenu(user);
    expect(screen.getAllByRole('menu')).toHaveLength(1);
    await user.click(item('Dark'));
    expect(modeOnPage()).toBe('dark');
  });
});

describe('The colour mode menu and the Shuffled-out panel (FEAT5)', () => {
  async function appWithPanelOpen() {
    const user = await renderApp(DECKS);
    const word = await shuffleOutOne(user);
    await user.click(shuffledOutButton());
    expect(panel()).toBeInTheDocument();
    return { user, word };
  }

  test('opening the mode menu leaves the panel open', async () => {
    const { user } = await appWithPanelOpen();
    await openMenu(user);
    expect(menu()).toBeInTheDocument();
    expect(panel()).toBeInTheDocument();
    expect(shuffledOutButton()).toHaveAttribute('aria-expanded', 'true');
  });

  test('choosing a mode with the panel open switches the mode and leaves the panel open, with my picks kept', async () => {
    const { user, word } = await appWithPanelOpen();
    await user.click(screen.getByRole('checkbox', { name: word }).closest('label')!);

    await choose(user, 'Dark');
    expect(modeOnPage()).toBe('dark');
    expect(panel()).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: word })).toBeChecked();
    expect(screen.getByRole('group', { name: /^Take out of your deck/ })).toBeInTheDocument();
  });

  test('Escape with both open closes only the menu; Escape again closes the panel', async () => {
    const { user } = await appWithPanelOpen();
    await openMenu(user);
    await user.keyboard('{Escape}');
    expect(menu()).not.toBeInTheDocument();
    expect(panel()).toBeInTheDocument();
    expect(modeButton()).toHaveFocus();

    await user.keyboard('{Escape}');
    expect(panel()).not.toBeInTheDocument();
  });

  test('pressing "Shuffled out (N)" while the menu is open closes the menu and closes or opens the panel as usual', async () => {
    const { user } = await appWithPanelOpen();
    await openMenu(user);
    await user.click(shuffledOutButton());
    expect(menu()).not.toBeInTheDocument();
    expect(panel()).not.toBeInTheDocument();

    await openMenu(user);
    await user.click(shuffledOutButton());
    expect(menu()).not.toBeInTheDocument();
    expect(panel()).toBeInTheDocument();
    expect(modeOnPage()).toBe('light');
  });

  test('a press elsewhere with both open closes both, as before', async () => {
    const { user } = await appWithPanelOpen();
    await openMenu(user);
    await user.click(title());
    expect(menu()).not.toBeInTheDocument();
    expect(panel()).not.toBeInTheDocument();
  });
});

describe('Dark mode colours (FEAT5)', () => {
  /** The Reading Breakdown's labels and pills, e.g. "Kunyomi" and 'Root Meaning: "quiet"'. */
  const label = (name: string) => within(screen.getByRole('article')).getByText(name);
  const pill = (text: string) => within(screen.getByRole('article')).getByText(text);

  test('in Dark the reading colours are the brighter versions, with a slightly stronger tint behind each pill', async () => {
    const user = await renderApp(COLOURFUL);
    // Light: today's colours, with a ~10% tint.
    expect(label('Kunyomi')).toHaveStyle({ color: READING_COLORS.kunyomi });
    expect(pill('Root Meaning: "quiet"')).toHaveStyle({ backgroundColor: `${READING_COLORS.kunyomi}1a` });

    await choose(user, 'Dark');
    const dark = READING_COLORS_BY_MODE.dark;
    expect(label('Kunyomi')).toHaveStyle({ color: dark.kunyomi });
    expect(label('Onyomi')).toHaveStyle({ color: dark.onyomi });
    expect(label('Okurigana')).toHaveStyle({ color: dark.okurigana });
    expect(pill('Root Meaning: "quiet"')).toHaveStyle({ color: dark.kunyomi, borderColor: dark.kunyomi });
    expect(pill('Root Meaning: "quiet"')).toHaveStyle({ backgroundColor: `${dark.kunyomi}29` });
    expect(pill('Grammar: Adjectival Noun Suffix')).toHaveStyle({ color: dark.okurigana });
  });

  test('in Dark a picked card’s outline is the brighter version, and its tick keeps its colour', async () => {
    const user = await renderApp(DECKS);
    const word = await shuffleOutOne(user);
    await user.click(shuffledOutButton());
    const addBack = screen.getByRole('checkbox', { name: word }).closest('label')!;
    await user.click(addBack);
    const takeOut = within(screen.getByRole('group', { name: /^Take out of your deck/ }))
      .getByRole('checkbox', { name: /^Card 1: / })
      .closest('label')!;
    await user.click(takeOut);
    expect(addBack).toHaveStyle({ '--pick': PICK_OUTLINE_COLORS.light.addBack });

    await choose(user, 'Dark');
    expect(addBack).toHaveStyle({ '--pick': PICK_OUTLINE_COLORS.dark.addBack });
    expect(takeOut).toHaveStyle({ '--pick': PICK_OUTLINE_COLORS.dark.takeOut });
    expect(within(addBack).getByText('✓')).toHaveStyle({ backgroundColor: PICK_COLORS.addBack });
    expect(within(takeOut).getByText('✓')).toHaveStyle({ backgroundColor: PICK_COLORS.takeOut });
  });

  test('in Dark the JLPT header, the ★ Common Word badge and the NEW ribbon keep their colours', async () => {
    const user = await renderApp(DECKS);
    await shuffleIn(user, '1'); // the new card on screen has the NEW ribbon
    await choose(user, 'Dark');
    const card = within(screen.getByRole('article'));
    const level = screen.getByRole('article').querySelector('header')!;
    const jlpt = /JLPT (N[1-5])/.exec(level.textContent ?? '')![1] as keyof typeof JLPT_COLORS;
    expect(level).toHaveStyle({ backgroundColor: JLPT_COLORS[jlpt] });
    expect(card.getByText('New')).toHaveStyle({ backgroundColor: NEW_COLOR });
    expect(card.getByText('New')).toHaveClass('text-slate-900');

    // Common words, to see the badge (Dark is still on after the reload).
    await reload(makeDecks({ common: 30 }));
    expect(modeOnPage()).toBe('dark');
    expect(within(screen.getByRole('article')).getByText('★ Common Word')).toHaveStyle({ color: COMMON_COLOR });
  });

  test('in Dark the coloured buttons keep their colours, Next is light with dark text and Back keeps an outline', async () => {
    const user = await renderApp(DECKS);
    await shuffleOutOne(user);
    await choose(user, 'Dark');
    await user.click(shuffledOutButton());
    // jsdom has no colours: the classes are checked, and the Dark values of the tokens.
    expect(shuffledOutButton()).toHaveClass('bg-sky-600', 'text-white');
    expect(deckShuffleButton()).toHaveClass('bg-indigo-600', 'text-white');
    expect(shuffleInButton()).toHaveClass('bg-emerald-600', 'text-white');
    expect(screen.getByRole('button', { name: 'Add Back Cards' })).toHaveClass('bg-emerald-600', 'text-white');
    expect(screen.getByRole('button', { name: 'Clear List' })).toHaveClass('bg-rose-600', 'text-white');
    const next = screen.getByRole('button', { name: 'Next →' });
    expect(next).toHaveClass('bg-next', 'text-next-ink');
    expect([MODE_COLORS.dark.next, MODE_COLORS.dark['next-ink']]).toEqual(['#f1f5f9', '#0f172a']);
    const back = screen.getByRole('button', { name: 'Back' });
    expect(back).toHaveClass('border', 'border-back-line', 'bg-back');
    expect(MODE_COLORS.dark['back-line']).not.toBe('transparent');
  });

  test('the whole app takes its colours from the mode: no fixed light colours are left on the page', async () => {
    const user = await renderApp(COLOURFUL);
    await shuffleOutOne(user);
    await user.click(shuffledOutButton());
    await user.click(screen.getByRole('button', { name: 'Clear List' }));
    await openMenu(user);
    // Everything that was white or slate is now a mode colour (bg-card, text-ink, ...), so Dark
    // covers it. Only the parts that keep their colours in every mode are left: the coloured
    // buttons and the JLPT headers (white text on their own colour), the NEW ribbon's text and the
    // system colours of forced-colours mode.
    const fixed =
      /(?:^|\s)(?:[a-z-]+:)*(?:bg|text|border|ring|outline)-(?:white|black|slate-\d+|gray-\d+|sky-(?:50|100|200|800)|emerald-(?:50|200|700)|rose-(?:200|700)|amber-700)(?=\s|$)/;
    const offenders = [...document.querySelectorAll<HTMLElement>('[class]')]
      .filter((el) => fixed.test(el.getAttribute('class') ?? ''))
      .filter((el) => !/\bbg-(sky|emerald|rose|indigo)-600\b|bg-emerald-700/.test(el.className))
      .filter((el) => !el.style.backgroundColor)
      .map((el) => el.className);
    expect(offenders).toEqual([]);
  });
});
