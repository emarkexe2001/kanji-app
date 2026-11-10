// FEAT5_5: High contrast, the third colour mode (black with white text). Chosen on the start page
// or from the menu, remembered like Light and Dark, never picked by the device.
//
// jsdom draws no colours, outlines, shadows or hover, and has no forced-colours mode or screen
// widths, so (standards 4.2) those are checked here by class name, with a comment saying why, and
// in color-mode-css.test.ts against the stylesheet as it is built. Colours set in the code (the
// JLPT headers, reading colours, picks, the NEW ribbon) are inline styles, so those are checked
// as styles.
import { act, cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import {
  CARD_COLORS_BY_MODE,
  JLPT_COLORS,
  JLPT_COLORS_BY_MODE,
  MODE_COLORS,
  NEW_COLOR,
  PICK_COLORS,
  PICK_OUTLINE_COLORS,
  PICK_TICK_COLORS,
  READING_COLORS_BY_MODE,
  type JlptLevel,
  type WordEntry,
} from '@kanji/core';
import App from '../../src/app/app';
import { COLOR_MODE_KEY, DEVICE_DARK_QUERY } from '../../src/lib/color-mode';
import {
  COUNTER,
  chooseOnStartPage,
  currentWord,
  deckShuffleButton,
  enterCardLimit,
  firstVisit,
  makeDecks,
  makeWords,
  modeRadio,
  renderApp,
  renderStartPage,
  serveDeck,
  shuffleIn,
  shuffleInButton,
  startPageHeading,
  startPageTile,
  stubDevice,
  type User,
} from './helpers';

const HC = 'high-contrast';
const DECKS = makeDecks({ N5: 30, N4: 30 });

/** Words whose Reading Breakdown has every kind of reading, so their colours can be checked. */
const COLOURFUL: WordEntry[] = DECKS.map((w) => ({
  ...w,
  segments: [
    { text: '静', reading: 'しず', kind: 'kunyomi', rootMeaning: 'quiet' },
    { text: '音', reading: 'おん', kind: 'onyomi', rootMeaning: 'sound' },
    { text: 'か', kind: 'okurigana', grammar: 'Adjectival Noun Suffix' },
  ],
}));

const html = () => document.documentElement;
const modeOnPage = () => html().getAttribute('data-color-mode');
const switching = () => html().hasAttribute('data-color-mode-switching');
const saved = () => localStorage.getItem(COLOR_MODE_KEY);
const modeButton = () => screen.getByRole('button', { name: /^Colour mode: / });
const menu = () => screen.queryByRole('menu', { name: 'Colour mode' });
const item = (name: 'Light' | 'Dark' | 'High contrast') => screen.getByRole('menuitemradio', { name });
const shuffledOutButton = () => screen.getByRole('button', { name: /^Shuffled out \(\d+\)$/ });
const panel = () => screen.getByRole('region', { name: 'Shuffled-out cards' });
const button = (name: string | RegExp) => screen.getByRole('button', { name });
const card = () => screen.getByRole('article');
const cardHeader = () => card().querySelector('header')!;
/** The mode name shown on the colour mode button (the icon and the arrow are hidden from screen readers). */
const buttonName = () => modeButton().querySelector('span:not([aria-hidden])') as HTMLElement;
const tickOf = (label: HTMLElement) => within(label).queryByText('✓');
const preview = (name: 'Light' | 'Dark' | 'High contrast') =>
  startPageTile(name).querySelector<HTMLElement>('[aria-hidden="true"]')!;

/** The classes of a coloured button in High contrast: black, white text, a 2px inset outline, no shadow. */
const outlined = (colour: string) => [
  'hc:bg-page',
  'hc:text-ink',
  'hc:ring-2',
  'hc:ring-inset',
  `hc:ring-${colour}`,
  'hc:shadow-none',
  'hc:hover:bg-hc-hover',
];

/** Holds back the frames the app asks for, so a test can see the page between two frames. */
function holdFrames() {
  const frames: FrameRequestCallback[] = [];
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => frames.push(cb));
  return () => act(() => frames.splice(0).forEach((cb) => cb(0)));
}

/** Opens the app with High contrast saved, as after choosing it. */
async function renderInHighContrast(words: WordEntry[] = DECKS) {
  localStorage.setItem(COLOR_MODE_KEY, HC);
  return renderApp(words);
}

async function chooseFromMenu(user: User, name: 'Light' | 'Dark' | 'High contrast') {
  await user.click(modeButton());
  await user.click(item(name));
}

/** Shuffles in one card, then moves on, and returns the word that was shuffled out. */
async function shuffleOutOne(user: User) {
  const word = currentWord()!;
  await shuffleIn(user, '1');
  await user.click(button('Next →'));
  return word;
}

/** Opens the Shuffled-out panel with one card in it, and picks it and the first deck card. */
async function pickACardEachWay(user: User) {
  const word = await shuffleOutOne(user);
  await user.click(shuffledOutButton());
  const addBack = screen.getByRole('checkbox', { name: word }).closest('label')!;
  // The deck's cards are offered once a card is picked to add back.
  await user.click(addBack);
  const deckCard = (n: number) =>
    within(screen.getByRole('group', { name: /^Take out of your deck/ }))
      .getByRole('checkbox', { name: new RegExp(`^Card ${n}: `) })
      .closest('label')!;
  const takeOut = deckCard(1);
  const unpicked = deckCard(2);
  await user.click(takeOut);
  return { addBack, takeOut, unpicked };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('Choosing High contrast (FEAT5_5)', () => {
  test('when I choose High contrast on the start page, my cards are shown in high-contrast mode and it is saved', async () => {
    firstVisit();
    const user = renderStartPage(DECKS);
    const nextFrame = holdFrames();
    await user.click(startPageTile('High contrast'));

    // Instant, with no fade: index.css turns transitions off under this attribute.
    expect(modeOnPage()).toBe(HC);
    expect(switching()).toBe(true);
    nextFrame();
    expect(switching()).toBe(false);

    await screen.findByText(COUNTER);
    expect(startPageHeading()).not.toBeInTheDocument();
    expect(saved()).toBe(HC);
    expect(card()).toBeInTheDocument();
    // Focus goes to the colour mode button, which a screen reader announces as High contrast.
    expect(modeButton()).toHaveFocus();
    expect(modeButton()).toHaveAccessibleName('Colour mode: High contrast');
    // The cards themselves are in High contrast: the bright JLPT header colour.
    const level = /JLPT (N[1-5])/.exec(cardHeader().textContent ?? '')![1] as JlptLevel;
    expect(cardHeader()).toHaveStyle({ backgroundColor: JLPT_COLORS_BY_MODE[HC][level] });
  });

  test('when my device is dark, I can still choose High contrast on the start page', async () => {
    stubDevice({ dark: true });
    firstVisit();
    const user = renderStartPage(DECKS);
    expect(modeOnPage()).toBe('dark');
    await chooseOnStartPage(user, 'High contrast');
    expect(modeOnPage()).toBe(HC);
    expect(saved()).toBe(HC);
  });

  test('when I choose High contrast from the menu, the app switches straight away and the menu marks it as the current mode', async () => {
    const frames: FrameRequestCallback[] = [];
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => frames.push(cb));
    const user = await renderApp(DECKS);
    await user.click(modeButton());
    frames.length = 0;
    await user.click(item('High contrast'));

    expect(modeOnPage()).toBe(HC);
    expect(switching()).toBe(true);
    act(() => frames.splice(0).forEach((cb) => cb(0)));
    expect(switching()).toBe(false);
    expect(menu()).not.toBeInTheDocument();
    expect(saved()).toBe(HC);
    expect(modeButton()).toHaveFocus();
    expect(modeButton()).toHaveAccessibleName('Colour mode: High contrast');
    expect(modeButton().querySelector('svg')).toHaveAttribute('data-icon', 'contrast');

    await user.click(modeButton());
    expect(item('High contrast')).toHaveAttribute('aria-checked', 'true');
    expect(item('Light')).toHaveAttribute('aria-checked', 'false');
    expect(item('Dark')).toHaveAttribute('aria-checked', 'false');
    // The tick (so it isn't marked by colour alone) and the ◐ icon.
    expect(item('High contrast').querySelector('[data-icon="tick"]')).not.toBeNull();
    expect(item('Light').querySelector('[data-icon="tick"]')).toBeNull();
    expect(item('High contrast').querySelector('[data-icon="contrast"]')).not.toBeNull();
    // Its row is black with a 2px white outline, and still fills under the pointer. jsdom has no
    // colours or outlines, so the classes are checked.
    expect(item('High contrast')).toHaveClass(
      'hc:bg-card',
      'hc:ring-2',
      'hc:ring-inset',
      'hc:ring-ink',
      'hc:hover:bg-menu-selected',
    );
    expect(item('Light')).not.toHaveClass('hc:ring-2');
    expect(item('Dark')).not.toHaveClass('hc:ring-2');
  });

  test('I can go back from High contrast to Light or Dark from the menu', async () => {
    const user = await renderInHighContrast();
    await chooseFromMenu(user, 'Dark');
    expect(modeOnPage()).toBe('dark');
    expect(saved()).toBe('dark');
    await chooseFromMenu(user, 'Light');
    expect(modeOnPage()).toBe('light');
    expect(saved()).toBe('light');
  });

  test('when I open the app again after choosing High contrast, it is still on and the start page is not shown', async () => {
    const user = await renderApp(DECKS);
    await chooseFromMenu(user, 'High contrast');

    cleanup();
    html().removeAttribute('data-color-mode');
    serveDeck(DECKS);
    render(<App />);
    // From the first render, before the cards load: no start page, already in High contrast.
    expect(startPageHeading()).not.toBeInTheDocument();
    expect(modeOnPage()).toBe(HC);
    await screen.findByText(COUNTER);
    expect(modeButton()).toHaveAccessibleName('Colour mode: High contrast');
    // Nothing is focused when the app opens with a mode saved.
    expect(document.activeElement).toBe(document.body);
  });

  test('when High contrast was chosen on the start page and the app is opened again, the start page is not shown', async () => {
    firstVisit();
    const user = renderStartPage(DECKS);
    await chooseOnStartPage(user, 'High contrast');

    cleanup();
    html().removeAttribute('data-color-mode');
    serveDeck(DECKS);
    render(<App />);
    expect(startPageHeading()).not.toBeInTheDocument();
    expect(modeOnPage()).toBe(HC);
    await screen.findByText(COUNTER);
  });
});

describe('The device never picks High contrast (FEAT5_5)', () => {
  /** A device that asks for more contrast (and, if `dark`, prefers dark). jsdom has no media queries. */
  function deviceWantsMoreContrast({ dark = false } = {}) {
    vi.stubGlobal(
      'matchMedia',
      vi.fn((query: string) => ({
        matches: /prefers-contrast/.test(query) || (dark && query === DEVICE_DARK_QUERY),
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    );
  }

  test.each([false, true])(
    'when my device asks for more contrast (prefers-contrast), the start page still shows, in Light or Dark (device dark: %s)',
    async (dark) => {
      deviceWantsMoreContrast({ dark });
      firstVisit();
      renderStartPage(DECKS);
      expect(startPageHeading()).toBeInTheDocument();
      expect(modeOnPage()).toBe(dark ? 'dark' : 'light');
      expect(saved()).toBeNull();
    },
  );

  test('with Light saved, a device that asks for more contrast still opens in Light', async () => {
    deviceWantsMoreContrast({ dark: true });
    await renderApp(DECKS);
    expect(modeOnPage()).toBe('light');
    expect(modeButton()).toHaveAccessibleName('Colour mode: Light');
  });
});

describe('The colour mode button in High contrast (FEAT5_5)', () => {
  test('it shows just the ◐ icon below 375px and "◐ High contrast" from 375px up, and screen readers always hear "Colour mode: High contrast"', async () => {
    await renderInHighContrast();
    // jsdom has no screen widths, so the name's classes are checked: hidden, shown from 375px up
    // (color-mode-css.test.ts checks the built CSS shows it from 375px).
    expect(buttonName()).toHaveTextContent('High contrast');
    expect(buttonName()).toHaveClass('hidden', 'min-[375px]:inline');
    expect(modeButton().querySelector('svg')).toHaveAttribute('data-icon', 'contrast');
    expect(within(modeButton()).getByText('▾')).toHaveAttribute('aria-hidden', 'true');
    // The accessible name doesn't depend on the hidden text.
    expect(modeButton()).toHaveAttribute('aria-label', 'Colour mode: High contrast');
    expect(modeButton()).toHaveAccessibleName('Colour mode: High contrast');
  });

  test('the Light and Dark names are shown at every width, as before', async () => {
    const user = await renderApp(DECKS);
    expect(buttonName()).toHaveTextContent('Light');
    expect(buttonName()).not.toHaveAttribute('class');
    await chooseFromMenu(user, 'Dark');
    expect(buttonName()).toHaveTextContent('Dark');
    expect(buttonName()).not.toHaveAttribute('class');
  });

  test('the button and the menu get a 2px white line and the menu loses its shadow', async () => {
    const user = await renderInHighContrast();
    // jsdom has no outlines or shadows: the classes are checked. The ring is inset, so no size changes.
    expect(modeButton()).toHaveClass('hc:ring-1', 'hc:ring-inset', 'hc:ring-field-line', 'border');
    await user.click(modeButton());
    expect(menu()).toHaveClass('hc:shadow-none', 'hc:ring-1', 'hc:ring-inset', 'hc:ring-card-line');
    // Still 200px wide.
    expect(menu()).toHaveClass('w-[200px]');
  });
});

describe('The start page High contrast tile (FEAT5_5)', () => {
  test('High contrast is a full-width tile under Light and Dark, 88px tall, with a 66px preview as wide as theirs', () => {
    firstVisit();
    renderStartPage(DECKS);
    // jsdom has no layout, so the classes are checked; the sizes were measured in a real browser.
    expect(startPageTile('High contrast')).toHaveClass('col-span-2', 'h-[88px]', 'flex-row', 'items-center', 'gap-3');
    expect(preview('High contrast')).toHaveClass('h-[66px]', 'w-[calc(50%-17px)]', 'shrink-0');
    // Light and Dark stay as they were: side by side, the preview above the name, 112px previews.
    for (const name of ['Light', 'Dark'] as const) {
      expect(startPageTile(name)).toHaveClass('flex-col', 'gap-2.5');
      expect(startPageTile(name)).not.toHaveClass('col-span-2');
      expect(preview(name)).toHaveClass('h-[112px]');
    }
    expect(startPageTile('High contrast').querySelector('svg')).toHaveAttribute('data-icon', 'contrast');
    expect(startPageTile('High contrast').querySelector('svg')).toHaveAttribute('width', '18');
  });

  test.each([false, true])(
    'the preview shows "JLPT N5" on bright green with black text and 静か in the High contrast reading colours, on black with white outlines (device dark: %s)',
    (dark) => {
      stubDevice({ dark });
      firstVisit();
      renderStartPage(DECKS);
      const box = preview('High contrast');
      // Its colours are inline styles from @kanji/core, whatever the device uses.
      expect(box).toHaveStyle({ backgroundColor: '#000000', boxShadow: 'inset 0 0 0 2px #ffffff' });
      const mini = box.firstElementChild as HTMLElement;
      // A 2px white ring and no shadow.
      expect(mini).toHaveStyle({ backgroundColor: '#000000', boxShadow: '0 0 0 2px #ffffff' });
      const header = within(box).getByText('JLPT N5');
      expect(header).toHaveStyle({ backgroundColor: '#3ee8a5' });
      // Black text on the header (a class, as jsdom draws no colours).
      expect(header).toHaveClass('text-black');
      expect(header).not.toHaveClass('text-white');
      expect(within(box).getByText('静')).toHaveStyle({ color: '#ff8a8a', borderBottom: '2px solid #ff8a8a' });
      expect(within(box).getByText('か')).toHaveStyle({ color: '#5ce67c', borderBottom: '2px solid #5ce67c' });
      // The word is 16px (text-base), smaller than the other previews' 20px.
      expect(within(box).getByText('静').parentElement).toHaveClass('text-base');
    },
  );

  test('the High contrast preview has no grey bars; the Light and Dark previews keep theirs', () => {
    firstVisit();
    renderStartPage(DECKS);
    // The bars are the empty divs under the word.
    const bars = (name: 'Light' | 'Dark' | 'High contrast') =>
      [...preview(name).querySelectorAll('div')].filter((d) => d.childElementCount === 0 && !d.textContent);
    expect(bars('High contrast')).toHaveLength(0);
    expect(bars('Light')).toHaveLength(2);
    expect(bars('Dark')).toHaveLength(2);
    // And the Light and Dark headers keep white text on today's green.
    for (const name of ['Light', 'Dark'] as const) {
      const header = within(preview(name)).getByText('JLPT N5');
      expect(header).toHaveClass('text-white');
      expect(header).toHaveStyle({ backgroundColor: JLPT_COLORS.N5 });
    }
  });
});

describe('Cards in High contrast (FEAT5_5)', () => {
  /** The Reading Breakdown's labels and notes, e.g. "Kunyomi" and 'Root Meaning: "quiet"'. */
  const label = (name: string) => within(card()).getByText(name);
  const note = (text: string) => within(card()).getByText(text);

  test('JLPT headers keep a coloured background (the bright version) with black text', async () => {
    await renderInHighContrast();
    const level = /JLPT (N[1-5])/.exec(cardHeader().textContent ?? '')![1] as JlptLevel;
    expect(cardHeader()).toHaveStyle({ backgroundColor: JLPT_COLORS_BY_MODE[HC][level] });
    // Black text comes from the class (jsdom draws no colours); no inline colour overrides it.
    expect(cardHeader()).toHaveClass('hc:text-black');
    expect(cardHeader().style.color).toBe('');
  });

  test('a word with no JLPT level has the light grey-blue header, and the ★ Common Word badge is the bright yellow', async () => {
    await renderInHighContrast(makeDecks({ common: 30 }));
    expect(cardHeader()).toHaveTextContent('Vocabulary');
    expect(cardHeader()).toHaveStyle({ backgroundColor: CARD_COLORS_BY_MODE[HC].noLevel });
    expect(within(card()).getByText('★ Common Word')).toHaveStyle({ color: CARD_COLORS_BY_MODE[HC].common });
  });

  test('the NEW ribbon is the bright yellow with black text and a black edge instead of a shadow', async () => {
    const user = await renderInHighContrast();
    await shuffleIn(user, '1');
    const ribbon = within(card()).getByText('New');
    expect(ribbon).toHaveStyle({ backgroundColor: CARD_COLORS_BY_MODE[HC].newRibbon });
    // jsdom draws no colours or shadows: the classes are checked.
    expect(ribbon).toHaveClass('hc:text-black', 'hc:shadow-[0_0_0_2px_#000]');
  });

  test('the reading colours are the bright versions, and the notes have no tinted background but keep their coloured bar', async () => {
    await renderInHighContrast(COLOURFUL);
    const colours = READING_COLORS_BY_MODE[HC];
    expect(label('Kunyomi')).toHaveStyle({ color: colours.kunyomi });
    expect(label('Onyomi')).toHaveStyle({ color: colours.onyomi });
    expect(label('Okurigana')).toHaveStyle({ color: colours.okurigana });
    for (const [text, colour] of [
      ['Root Meaning: "quiet"', colours.kunyomi],
      ['Root Meaning: "sound"', colours.onyomi],
      ['Grammar: Adjectival Noun Suffix', colours.okurigana],
    ] as const) {
      expect(note(text)).toHaveStyle({ color: colour, borderColor: colour });
      // No tint (jest-dom can't compare "transparent", so the inline value is read).
      expect(note(text).style.backgroundColor).toBe('transparent');
      expect(note(text)).toHaveClass('border-l-[3px]');
    }
  });

  test('the card has a 2px white outline and no shadow (checked by class, as jsdom draws neither)', async () => {
    await renderInHighContrast();
    expect(card()).toHaveClass('hc:ring-2', 'hc:shadow-none', 'ring-card-line');
  });
});

describe('Picked cards in the Shuffled-out panel in High contrast (FEAT5_5)', () => {
  test('when I pick cards, picked cards are clearly marked with a 3px outline in the pick colour and a tick', async () => {
    const user = await renderInHighContrast();
    const { addBack, takeOut, unpicked } = await pickACardEachWay(user);

    for (const [label, kind] of [
      [addBack, 'addBack'],
      [takeOut, 'takeOut'],
    ] as const) {
      // The outline's colour is an inline variable; its width and the variant are classes (jsdom
      // draws no outlines).
      expect(label).toHaveStyle({ '--pick': PICK_OUTLINE_COLORS[HC][kind] });
      expect(label).toHaveClass('has-checked:ring-(--pick)', 'hc:has-checked:ring-3');
      // The tick is there, so the pick isn't shown by colour alone: the pick colour, a black ✓ and
      // a 2px black edge.
      const tick = tickOf(label)!;
      expect(tick).toBeInTheDocument();
      expect(tick).toHaveStyle({ backgroundColor: PICK_TICK_COLORS[HC][kind] });
      expect(tick).toHaveClass('hc:text-black', 'hc:shadow-[0_0_0_2px_#000]');
    }
    expect(PICK_OUTLINE_COLORS[HC].addBack).not.toBe(PICK_OUTLINE_COLORS[HC].takeOut);
    // A card that isn't picked has no tick (its compact card keeps its 2px white ring).
    expect(within(unpicked).getByRole('checkbox')).not.toBeChecked();
    expect(tickOf(unpicked)).toBeNull();
    expect(unpicked.querySelector('div')).toHaveClass('hc:ring-2', 'hc:shadow-none');
  });

  test('keyboard focus on a pick card is a 2px yellow outline 5px out, clear of the 3px picked outline', async () => {
    const user = await renderInHighContrast();
    const { addBack } = await pickACardEachWay(user);
    // jsdom has no focus ring: the classes are checked (2px from the base class, moved out and yellow in High contrast).
    expect(addBack).toHaveClass(
      'has-focus-visible:outline-2',
      'hc:has-focus-visible:outline-offset-[5px]',
      'hc:has-focus-visible:outline-hc-focus',
    );
  });

  test('the panel has a 2px white line and no shadow, and its buttons are outlined', async () => {
    const user = await renderInHighContrast();
    await pickACardEachWay(user);
    expect(panel()).toHaveClass('hc:shadow-none', 'hc:ring-1', 'hc:ring-inset', 'hc:ring-panel-line', 'border');
    expect(button('Add Back Cards')).toHaveClass(...outlined('hc-emerald'));
    // Clear List: a red outline and red text, which turns white under the pointer (red on the
    // #262626 hover fill would be 6.76:1, agreed 2026-11-09).
    // No white text class at rest: two hc: text colours would be decided by their order in the built
    // CSS, and white came last (review R1).
    const rose = outlined('hc-rose').filter((cls) => cls !== 'hc:text-ink');
    expect(button('Clear List')).toHaveClass(...rose, 'hc:text-hc-rose', 'hc:hover:text-ink');
    expect(button('Clear List')).not.toHaveClass('hc:text-ink');

    await user.click(button('Clear List'));
    expect(button('Yes, Clear List')).toHaveClass(...rose, 'hc:text-hc-rose', 'hc:hover:text-ink');
    expect(button('Yes, Clear List')).not.toHaveClass('hc:text-ink');
    expect(button('Cancel')).toHaveClass('hc:ring-1', 'hc:ring-inset', 'hc:ring-field-line', 'hc:shadow-none');
    expect(screen.getByText(/^Clear 1 card\?/).parentElement).toHaveClass(
      'hc:ring-1',
      'hc:ring-inset',
      'hc:ring-danger-line',
    );

    // "Recover cleared list (N)" gets the blue outline like "Shuffled out (N)" (filled in from the agreed rules).
    await user.click(button('Yes, Clear List'));
    expect(button(/^Recover cleared list/)).toHaveClass(...outlined('hc-sky'));
  });
});

describe('Buttons and controls in High contrast (FEAT5_5)', () => {
  // jsdom draws no colours, outlines or shadows, so the classes that only apply in High contrast
  // (the `hc:` variant) are checked; color-mode-css.test.ts checks they are generated.
  test('the coloured buttons are black with a 2px outline in their colour and white text; Next is white with black text; Back has a white outline', async () => {
    await renderInHighContrast();
    expect(shuffledOutButton()).toHaveClass(...outlined('hc-sky'));
    expect(deckShuffleButton()).toHaveClass(...outlined('hc-indigo'));
    expect(shuffleInButton()).toHaveClass(...outlined('hc-emerald'));
    // Next: the tokens make it white with black text (MODE_COLORS), with no shadow.
    expect(button('Next →')).toHaveClass('bg-next', 'text-next-ink', 'hover:bg-next-hover', 'hc:shadow-none');
    expect([MODE_COLORS[HC].next, MODE_COLORS[HC]['next-ink']]).toEqual(['#ffffff', '#000000']);
    // Back: black with a 2px white line (its border plus a 1px inset ring), no shadow.
    expect(button('Back')).toHaveClass(
      'border',
      'border-back-line',
      'hc:ring-1',
      'hc:ring-inset',
      'hc:ring-back-line',
      'hc:shadow-none',
    );
    // The small press-in stays.
    for (const b of [shuffledOutButton(), deckShuffleButton(), shuffleInButton(), button('Next →'), button('Back')]) {
      expect(b).toHaveClass('active:scale-95');
    }
  });

  test('fields and rows get white lines drawn inside them, so nothing changes size', async () => {
    await renderInHighContrast(makeDecks({ N5: 30, N4: 30, N3: 30 }));
    const inset = ['hc:ring-1', 'hc:ring-inset'];
    expect(screen.getByLabelText('Deck')).toHaveClass(...inset, 'hc:ring-field-line');
    expect(screen.getByLabelText('Deck').parentElement).toHaveClass(...inset, 'hc:ring-box-line');
    expect(screen.getByLabelText('Card limit')).toHaveClass(...inset, 'hc:ring-field-line');
    expect(screen.getByLabelText('Deck to shuffle in from')).toHaveClass(...inset, 'hc:ring-field-line');
    expect(screen.getByLabelText('Cards to shuffle in')).toHaveClass(...inset, 'hc:ring-field-line');
    for (const name of ['Decrease card limit', 'Increase card limit']) {
      expect(button(name)).toHaveClass(...inset, 'hc:ring-field-line', 'hc:shadow-none');
    }
    // The "Shuffle in from" switch: the chosen option is white with black text, and focus is a 3px
    // yellow outline inside it.
    expect(modeRadio('One deck').closest('label')).toHaveClass(
      'hc:has-checked:bg-white',
      'hc:has-checked:text-black',
      'hc:has-focus-visible:outline-3',
      'hc:has-focus-visible:outline-hc-focus',
    );
  });

  test('Shuffle In Cards with nothing to shuffle in from does not fade: it has a 2px dashed white outline and white text', async () => {
    // One deck only, so there's no other deck to shuffle in from.
    await renderInHighContrast(makeWords(60));
    expect(shuffleInButton()).toBeDisabled();
    expect(shuffleInButton()).toHaveClass(
      'opacity-40', // Light and Dark, as before
      'hc:opacity-100',
      'hc:bg-page',
      'hc:text-ink',
      'hc:outline-2',
      'hc:outline-dashed',
      'hc:-outline-offset-2',
      'hc:outline-ink',
      'hc:shadow-none',
    );
  });

  test('a disabled "Shuffle in from" option has a 2px dashed white outline and white text, not a faded look', async () => {
    // Only one other deck, so Multiple decks is disabled.
    await renderInHighContrast(DECKS);
    expect(modeRadio('Multiple decks')).toBeDisabled();
    const option = modeRadio('Multiple decks').closest('label')!;
    expect(option).toHaveClass(
      'hc:has-disabled:bg-page',
      'hc:has-disabled:text-ink',
      'hc:has-disabled:outline-2',
      'hc:has-disabled:-outline-offset-2',
      'hc:has-disabled:outline-ink',
      'hc:has-disabled:outline-dashed',
    );
  });

  test('the − and + buttons at the card limit’s ends do not fade: they have a 2px dashed white outline and white text', async () => {
    const user = await renderInHighContrast(makeWords(200));
    const dashed = [
      'hc:disabled:opacity-100',
      'hc:disabled:text-ink',
      'hc:disabled:border-transparent',
      'hc:disabled:ring-0',
      'hc:disabled:outline-2',
      'hc:disabled:-outline-offset-2',
      'hc:disabled:outline-ink',
      'hc:disabled:outline-dashed',
    ];
    await enterCardLimit(user, '1');
    expect(button('Decrease card limit')).toBeDisabled();
    expect(button('Decrease card limit')).toHaveClass('disabled:opacity-40', ...dashed);
    await enterCardLimit(user, '150');
    expect(button('Increase card limit')).toBeDisabled();
    expect(button('Increase card limit')).toHaveClass('disabled:opacity-40', ...dashed);
  });
});

describe('Light and Dark are unchanged (FEAT5_5)', () => {
  test('in Light and Dark the card header, the NEW ribbon and the pick ticks keep their colours, with no inline text colour', async () => {
    const user = await renderApp(DECKS);
    for (const mode of ['light', 'dark'] as const) {
      if (mode === 'dark') await chooseFromMenu(user, 'Dark');
      const level = /JLPT (N[1-5])/.exec(cardHeader().textContent ?? '')![1] as JlptLevel;
      expect(cardHeader()).toHaveStyle({ backgroundColor: JLPT_COLORS[level] });
      expect(cardHeader()).toHaveClass('text-white');
      expect(cardHeader().style.color).toBe('');
    }
    await shuffleIn(user, '1');
    expect(within(card()).getByText('New')).toHaveStyle({ backgroundColor: NEW_COLOR });
    await user.click(button('Next →'));
    await user.click(shuffledOutButton());
    const addBack = within(screen.getByRole('group', { name: /^Add back/ }))
      .getAllByRole('checkbox')[0]
      .closest('label')!;
    await user.click(addBack);
    expect(tickOf(addBack)).toHaveStyle({ backgroundColor: PICK_COLORS.addBack });
    expect(addBack).toHaveStyle({ '--pick': PICK_OUTLINE_COLORS.dark.addBack });
  });
});
