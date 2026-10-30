// ADJ2: the Shuffled-out cards panel floats in the top right, below the header, over the page.
import { StrictMode, type ComponentProps } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { MODE_COLORS } from '@kanji/core';
import App from '../../src/app/app';
import type { CardStack as RealCardStack } from '../../src/features/deck/components/card-stack';
import {
  COUNTER,
  currentWord,
  deckContents,
  makeDecks,
  renderApp,
  serveDeck,
  setScreen,
  shuffleIn,
  type User,
} from './helpers';
import { tailwindColor } from './mode-colors';

/** Set to make the deck card fail to draw, to crash the deck while the panel is open. */
const crash = vi.hoisted(() => ({ deckCard: false }));

vi.mock('../../src/features/deck/components/card-stack', async (importOriginal) => {
  const real = await importOriginal<typeof import('../../src/features/deck/components/card-stack')>();
  return {
    ...real,
    CardStack: (props: ComponentProps<typeof RealCardStack>) => {
      if (crash.deckCard) throw new TypeError('The card could not be drawn');
      return <real.CardStack {...props} />;
    },
  };
});

const DECKS = makeDecks({ N5: 30, N4: 30 });

const title = () => screen.getByRole('heading', { level: 1, name: 'Kanji Reading Highlighter' });
const shuffledOutButton = () => screen.getByRole('button', { name: /^Shuffled out \(\d+\)$/ });
const panel = () => screen.queryByRole('region', { name: 'Shuffled-out cards' });
const openPanel = () => panel()!;
const closeButton = () => screen.getByRole('button', { name: 'Close shuffled-out cards' });
const addBackButton = () => screen.getByRole('button', { name: 'Add Back Cards' });
const clearButton = () => screen.getByRole('button', { name: 'Clear List' });
const addBackGroup = () => within(screen.getByRole('group', { name: 'Add back' }));
const takeOutGroup = () => within(screen.getByRole('group', { name: /^Take out of your deck/ }));
const addBackCheckbox = (word: string | null) => addBackGroup().getByRole('checkbox', { name: word! });
/** The card the user selects to pick it (the checkbox inside is visually hidden). */
const cardOf = (checkbox: HTMLElement) => checkbox.closest('label')!;
/** The card on screen in the deck, the only full card (an article). */
const deckCard = () => screen.getByRole('article');
/** Every ancestor of `el`, nearest first. */
const ancestors = (el: Element) => {
  const list: HTMLElement[] = [];
  for (let p = el.parentElement; p; p = p.parentElement) list.push(p);
  return list;
};
/** The part of the panel that scrolls: the nearest ancestor of `el` that is a scroll box. */
const scrollBoxOf = (el: Element) => ancestors(el).find((a) => a.classList.contains('overflow-y-auto'))!;

/** Shuffles in one card, then moves on, and returns the word that was shuffled out. */
async function shuffleOutOne(user: User) {
  const word = currentWord();
  await shuffleIn(user, '1');
  await user.click(screen.getByRole('button', { name: 'Next →' }));
  return word;
}

/** Renders the app with `count` cards shuffled out, and returns them, newest first. */
async function appWithShuffledOut(count = 1) {
  const user = await renderApp(DECKS);
  const out: (string | null)[] = [];
  for (let i = 0; i < count; i++) out.unshift(await shuffleOutOne(user));
  return { user, out };
}

// Each test sets its own screen (setScreen), so none carries over to the next.
afterEach(() => vi.unstubAllGlobals());

describe('Floating shuffled-out panel (ADJ2)', () => {
  test('when I press "Shuffled out (N)", the panel opens in the top right and the deck stays in the centre and is still shown', async () => {
    // A wide screen, where the panel floats beside the deck (ADJ2_5: from 1100px).
    setScreen({ wide: true });
    const { user } = await appWithShuffledOut();
    const word = currentWord();
    const deckClasses = () => ancestors(deckCard()).map((a) => a.className);
    const closedClasses = deckClasses();

    await user.click(shuffledOutButton());

    const open = openPanel();
    expect(shuffledOutButton()).toHaveAttribute('aria-expanded', 'true');
    expect(shuffledOutButton()).toHaveAttribute('aria-controls', open.id);
    // The deck card is still shown, outside the panel, with the same card.
    expect(deckCard()).toBeVisible();
    expect(open).not.toContainElement(deckCard());
    expect(currentWord()).toBe(word);
    // jsdom has no layout, so the classes are checked. The panel floats over the page (fixed, so
    // it takes no room and pushes nothing down) in the top right: just below the header (its top
    // is measured from the header, ADJ2_5) and, in the wide layout, 24px from the right and 300px wide.
    expect(open).toHaveClass('fixed', 'top-(--panel-top)', 'wide:right-6', 'wide:w-[300px]');
    // Top right, not top left (the FEAT5 mode menu goes top left).
    expect(open.className).not.toMatch(/(^|\s)(\w+:)?(left|inset|inset-x)-/);
    // The deck stays centred in its column: in the wide layout opening the panel changes nothing.
    expect(deckClasses()).toEqual(closedClasses);
    expect(ancestors(deckCard()).some((a) => a.classList.contains('justify-center'))).toBe(true);
    expect(within(deckCard()).getByText('READING BREAKDOWN')).toBeInTheDocument();
  });

  test('the panel is a sky-50 panel with a sky-200 border, rounded corners and a large shadow, titled "Shuffled-out cards" with a × button', async () => {
    const { user } = await appWithShuffledOut();
    await user.click(shuffledOutButton());

    const open = openPanel();
    // jsdom has no colours or shadows, so the classes are checked.
    // Since FEAT5 its colours are colour mode tokens, sky-50 and sky-200 in Light as before.
    expect(open).toHaveClass('bg-panel', 'border', 'border-panel-line', 'rounded-xl', 'shadow-xl');
    expect(MODE_COLORS.light.panel).toBe(tailwindColor('sky-50'));
    expect(MODE_COLORS.light['panel-line']).toBe(tailwindColor('sky-200'));
    const heading = within(open).getByRole('heading', { name: 'Shuffled-out cards' });
    // The × is in the title row, after the title, and screen readers hear its label, not "×".
    expect(heading.parentElement).toContainElement(closeButton());
    expect(heading.compareDocumentPosition(closeButton()) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(closeButton()).toHaveTextContent('×');
    expect(within(closeButton()).getByText('×')).toHaveAttribute('aria-hidden', 'true');
  });

  test('in the wide layout the panel is 300px wide and at most 560px tall, and below it the pop-up is always 260px tall and never makes the page scroll sideways', async () => {
    const { user } = await appWithShuffledOut();
    await user.click(shuffledOutButton());

    // jsdom has no layout, so the classes are checked; the sizes are checked in a real browser
    // too. In the wide layout (wide:, 1100px and up): 300px wide, 24px from the right, as tall as
    // it needs up to 560px, and never reaching closer than 24px to the bottom of the screen.
    expect(openPanel()).toHaveClass(
      'wide:w-[300px]',
      'wide:right-6',
      'wide:h-auto',
      'wide:max-h-[min(560px,calc(100dvh-var(--panel-top)-24px))]',
    );
    // Below it, a pop-up (ADJ2_5): 300px wide but never wider than the screen less 16px (so no
    // sideways scrolling at 360px), 8px from the right, and always 260px tall (it doesn't grow),
    // or less on a screen too short for it, where it stops 8px above the bottom of the screen.
    expect(openPanel()).toHaveClass(
      'w-[min(300px,calc(100vw-16px))]',
      'right-2',
      'h-[min(260px,calc(100dvh-var(--panel-top)-8px))]',
    );
    expect(openPanel().className).not.toMatch(/(^|\s)max-h-/);
    // Nothing else sets a width that could be wider than the screen, or uses the old lg layout.
    const widths = openPanel()
      .className.match(/(^|\s)(\w+:)?w-\S+/g)!
      .map((w) => w.trim());
    expect(widths.sort()).toEqual(['w-[min(300px,calc(100vw-16px))]', 'wide:w-[300px]']);
    expect(openPanel().className).not.toMatch(/(^|\s)(max-)?lg:/);
  });

  test('the cards are shown 2 per row and scroll inside the panel, and Add Back Cards and Clear List are pinned side by side at the bottom', async () => {
    const { user, out } = await appWithShuffledOut(3);
    await user.click(shuffledOutButton());
    await user.click(cardOf(addBackCheckbox(out[0])));

    const addBackList = addBackGroup().getByRole('list');
    const takeOutList = takeOutGroup().getByRole('list');
    // jsdom has no layout, so the classes are checked: 2 per row in both lists, at every width.
    for (const list of [addBackList, takeOutList]) {
      expect(list).toHaveClass('grid', 'grid-cols-2');
      expect(list.className).not.toMatch(/(^|\s)\w+:grid-cols-/);
    }
    // Both lists scroll together in the panel's body, which takes the room left in the panel.
    const body = scrollBoxOf(addBackList);
    expect(openPanel()).toContainElement(body);
    expect(scrollBoxOf(takeOutList)).toBe(body);
    expect(body).toHaveClass('overflow-y-auto', 'flex-1', 'min-h-0');
    expect(openPanel()).toHaveClass('flex', 'flex-col');
    // The buttons are not in the part that scrolls: they share a row after it, always in view.
    const row = addBackButton().parentElement!;
    expect(row).toContainElement(clearButton());
    expect(addBackButton().nextElementSibling).toBe(clearButton());
    expect(body).not.toContainElement(row);
    expect(body.compareDocumentPosition(row) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(row).toHaveClass('grid', 'grid-cols-2');
    expect(row.parentElement).toHaveClass('shrink-0');
    // Green Add Back Cards, red Clear List (jsdom has no colours).
    expect(addBackButton()).toHaveClass('bg-emerald-600');
    expect(clearButton()).toHaveClass('bg-rose-600');
  });

  test("the panel's cards are smaller than the deck card, and smaller again below the wide layout", async () => {
    const { user, out } = await appWithShuffledOut();
    await user.click(shuffledOutButton());

    const card = cardOf(addBackCheckbox(out[0]));
    const word = within(card).getByText(out[0]!.replace(/【.*$/, '')).closest('p')!;
    // jsdom has no font sizes, so the classes are checked: a 14px word and 8-10px text below the wide layout (1100px),
    // a 16px word and 9-11px text in it; the deck card's word is 30px (text-3xl).
    expect(word).toHaveClass('text-sm', 'wide:text-base');
    expect(within(card).getByText(/^【/)).toHaveClass('text-[9px]', 'wide:text-[10px]');
    expect(within(card).getByText('JLPT N5')).toHaveClass('text-[8px]', 'wide:text-[9px]');
    expect(within(card).getByText(/^word number/)).toHaveClass('text-[10px]', 'wide:text-[11px]');
    expect(within(card).getByText('From JLPT N5')).toHaveClass('text-[9px]', 'wide:text-[10px]');
    expect(within(card.closest('li')!).getByText('1')).toHaveClass('text-[10px]', 'wide:text-[11px]');
    expect(screen.getByRole('heading', { level: 2 })).toHaveClass('text-3xl');
  });

  test('when I open the panel, focus moves into it, onto its × button', async () => {
    const { user } = await appWithShuffledOut();
    await user.click(shuffledOutButton());
    expect(closeButton()).toHaveFocus();
    expect(openPanel()).toContainElement(closeButton());

    // With the keyboard too: Enter on the button, then Tab goes on to the first card.
    await user.click(closeButton());
    await user.keyboard('{Enter}');
    expect(openPanel()).toBeInTheDocument();
    expect(closeButton()).toHaveFocus();
    await user.tab();
    expect(addBackGroup().getAllByRole('checkbox')[0]).toHaveFocus();
  });

  test('when I press the × button, the panel closes and focus goes back to "Shuffled out (N)"', async () => {
    const { user } = await appWithShuffledOut();
    await user.click(shuffledOutButton());

    await user.click(closeButton());

    expect(panel()).not.toBeInTheDocument();
    expect(shuffledOutButton()).toHaveAttribute('aria-expanded', 'false');
    expect(shuffledOutButton()).toHaveFocus();
  });

  test('when I press Escape, the panel closes and focus goes back to "Shuffled out (N)"', async () => {
    const { user, out } = await appWithShuffledOut();
    await user.click(shuffledOutButton());
    // Focus on a card in the panel.
    addBackCheckbox(out[0]).focus();

    await user.keyboard('{Escape}');

    expect(panel()).not.toBeInTheDocument();
    expect(shuffledOutButton()).toHaveAttribute('aria-expanded', 'false');
    expect(shuffledOutButton()).toHaveFocus();
  });

  test('when I click outside the panel, it closes and focus goes back to "Shuffled out (N)"', async () => {
    const { user } = await appWithShuffledOut();
    await user.click(shuffledOutButton());

    await user.click(title());

    expect(panel()).not.toBeInTheDocument();
    expect(shuffledOutButton()).toHaveAttribute('aria-expanded', 'false');
    expect(shuffledOutButton()).toHaveFocus();
  });

  test('when I tap outside the panel on a touch screen, it closes', async () => {
    const { user } = await appWithShuffledOut();
    await user.click(shuffledOutButton());

    await user.pointer({ keys: '[TouchA]', target: title() });

    expect(panel()).not.toBeInTheDocument();
    expect(shuffledOutButton()).toHaveAttribute('aria-expanded', 'false');
  });

  test('when I click one of the deck controls outside the panel, the panel closes and that control still works and keeps focus', async () => {
    const { user } = await appWithShuffledOut();
    await user.click(shuffledOutButton());
    const before = currentWord();
    const next = screen.getByRole('button', { name: 'Next →' });

    await user.click(next);

    expect(panel()).not.toBeInTheDocument();
    expect(currentWord()).not.toBe(before);
    expect(next).toHaveFocus();
  });

  test('when I click inside the panel (picking a card, its title, its background, Clear List and Cancel), it stays open', async () => {
    const { user, out } = await appWithShuffledOut(2);
    await user.click(shuffledOutButton());

    await user.click(cardOf(addBackCheckbox(out[0])));
    expect(openPanel()).toBeInTheDocument();
    expect(addBackCheckbox(out[0])).toBeChecked();
    await user.click(cardOf(takeOutGroup().getByRole('checkbox', { name: /^Card 2: / })));
    expect(openPanel()).toBeInTheDocument();

    await user.click(within(openPanel()).getByRole('heading', { name: 'Shuffled-out cards' }));
    await user.click(openPanel());
    await user.click(addBackGroup().getByText('Add back'));
    expect(openPanel()).toBeInTheDocument();

    await user.click(clearButton());
    expect(openPanel()).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(openPanel()).toBeInTheDocument();
    // The picks are still there.
    expect(addBackCheckbox(out[0])).toBeChecked();
    expect(takeOutGroup().getByRole('checkbox', { name: /^Card 2: / })).toBeChecked();
  });

  test('when I press "Shuffled out (N)" again, the panel closes (it toggles, it is not closed and opened again)', async () => {
    const { user } = await appWithShuffledOut();
    await user.click(shuffledOutButton());
    expect(openPanel()).toBeInTheDocument();

    await user.click(shuffledOutButton());

    expect(panel()).not.toBeInTheDocument();
    expect(shuffledOutButton()).toHaveAttribute('aria-expanded', 'false');
    expect(shuffledOutButton()).toHaveFocus();
    // And again: it opens.
    await user.click(shuffledOutButton());
    expect(openPanel()).toBeInTheDocument();
    expect(shuffledOutButton()).toHaveAttribute('aria-expanded', 'true');
  });

  test.each([
    ['the × button', (user: User) => user.click(closeButton())],
    ['Escape', (user: User) => user.keyboard('{Escape}')],
    ['a click outside it', (user: User) => user.click(title())],
    ['"Shuffled out (N)"', (user: User) => user.click(shuffledOutButton())],
  ])('when I close the panel with %s with cards picked, the picks are dropped', async (_, close) => {
    const { user, out } = await appWithShuffledOut();
    await user.click(shuffledOutButton());
    await user.click(cardOf(addBackCheckbox(out[0])));
    await user.click(cardOf(takeOutGroup().getByRole('checkbox', { name: /^Card 1: / })));

    await close(user);
    expect(panel()).not.toBeInTheDocument();
    await user.click(shuffledOutButton());

    expect(addBackCheckbox(out[0])).not.toBeChecked();
    expect(screen.queryByRole('group', { name: /^Take out of your deck/ })).not.toBeInTheDocument();
  });

  test('without "reduce motion", the panel slides down from the top right as it opens', async () => {
    setScreen({ reduceMotion: false });
    const { user } = await appWithShuffledOut();
    await user.click(shuffledOutButton());
    // jsdom has no animations, so the class is checked: panel-drop slides it down from the top
    // right (index.css).
    expect(openPanel()).toHaveClass('panel-drop');
  });

  test('when reduced motion is on, the panel appears without sliding', async () => {
    setScreen({ reduceMotion: true });
    const { user } = await appWithShuffledOut();
    await user.click(shuffledOutButton());
    // jsdom has no animations, so the classes are checked: no slide, and no other animation.
    expect(openPanel()).toBeInTheDocument();
    expect(openPanel()).not.toHaveClass('panel-drop');
    expect(openPanel().className).not.toMatch(/(^|\s)(\w+:)?animate-/);
  });

  test('when I open the panel on a phone, the deck card moves to the top of its space, at its normal size, and goes back when I close the panel', async () => {
    setScreen({ wide: false });
    const { user } = await appWithShuffledOut();
    const atTop = () => ancestors(deckCard()).some((a) => a.classList.contains('items-start'));
    expect(atTop()).toBe(false);

    await user.click(shuffledOutButton());
    // jsdom has no layout, so the classes are checked: the card sits at the top of its space (so
    // it can move down below the pop-up), and is no longer scaled down (ADJ2_5: it is the slim
    // card instead, see floating-panel-fixes.test.tsx).
    expect(atTop()).toBe(true);
    for (const el of [deckCard(), ...ancestors(deckCard())]) expect(el.className).not.toMatch(/(^|\s)(\S+:)?scale-/);
    expect(deckCard()).toBeVisible();

    await user.click(closeButton());
    expect(atTop()).toBe(false);
  });

  test('on a phone the deck card moves down to just below the pop-up while it is open, and back when it closes; in the wide layout it stays put', async () => {
    // jsdom has no layout, so the positions are made up: the pop-up is laid out from 92px down the
    // screen and is 260px tall, and the deck card's space starts 200px down. The card has to
    // start 12px below the pop-up.
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      return { top: 200, bottom: 600, left: 0, right: 300, width: 300, height: 400, x: 0, y: 200, toJSON: () => ({}) };
    });
    vi.spyOn(HTMLElement.prototype, 'offsetTop', 'get').mockImplementation(function (this: HTMLElement) {
      return this.id === 'shuffled-out-panel' ? 92 : 0;
    });
    vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(function (this: HTMLElement) {
      return this.id === 'shuffled-out-panel' ? 260 : 0;
    });
    const cardSpace = () => ancestors(deckCard()).find((a) => a.classList.contains('flex-1'))!;

    setScreen({ wide: false });
    const { user } = await appWithShuffledOut();
    expect(cardSpace().style.paddingTop).toBe('');
    await user.click(shuffledOutButton());
    expect(cardSpace().style.paddingTop).toBe(`${92 + 260 + 12 - 200}px`);
    await user.click(closeButton());
    expect(cardSpace().style.paddingTop).toBe('');

    // In the wide layout the panel floats beside the deck, so the card doesn't move.
    setScreen({ wide: true });
    await user.click(shuffledOutButton());
    expect(openPanel()).toBeInTheDocument();
    expect(cardSpace().style.paddingTop).toBe('');
  });

  test('the pop-up is measured where it is laid out, not where it is drawn as it slides down, so the deck card never ends up under it', async () => {
    // The panel-drop slide draws the pop-up higher and smaller at first (index.css). Where it is
    // drawn (getBoundingClientRect) is made up to show that: 16px higher and shorter. Where it is
    // laid out (offsetTop and offsetHeight) is where it ends up.
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      const [top, bottom] = this.id === 'shuffled-out-panel' ? [76, 328] : [200, 600];
      return { top, bottom, left: 0, right: 300, width: 300, height: bottom - top, x: 0, y: top, toJSON: () => ({}) };
    });
    vi.spyOn(HTMLElement.prototype, 'offsetTop', 'get').mockImplementation(function (this: HTMLElement) {
      return this.id === 'shuffled-out-panel' ? 92 : 0;
    });
    vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(function (this: HTMLElement) {
      return this.id === 'shuffled-out-panel' ? 260 : 0;
    });
    setScreen({ wide: false });
    const { user } = await appWithShuffledOut();

    await user.click(shuffledOutButton());

    const cardSpace = ancestors(deckCard()).find((a) => a.classList.contains('flex-1'))!;
    expect(openPanel()).toHaveClass('panel-drop');
    expect(cardSpace.style.paddingTop).toBe(`${92 + 260 + 12 - 200}px`);
  });

  test('when I add cards back from the panel in its new place, they are in my deck, the same as before, and focus goes back to "Shuffled out (N)"', async () => {
    const { user, out } = await appWithShuffledOut();
    await user.click(shuffledOutButton());
    await user.click(cardOf(addBackCheckbox(out[0])));
    await user.click(cardOf(takeOutGroup().getByRole('checkbox', { name: /^Card 1: / })));

    await user.click(addBackButton());

    expect(panel()).not.toBeInTheDocument();
    expect(shuffledOutButton()).toHaveFocus();
    expect(currentWord()).toBe(out[0]);
    expect((await deckContents(user)).map((c) => c.word)).toContain(out[0]);
    expect(shuffledOutButton()).toHaveTextContent('Shuffled out (1)'); // the card taken out
  });

  test('where cards cannot slide, cards added back land at once and the panel closes straight away', async () => {
    // jsdom can't animate, so the cards added back can't slide out of the panel (ADJ3, see
    // card-slides.test.tsx for the slides themselves): nothing is left drawn between the two.
    setScreen({ reduceMotion: false });
    const { user, out } = await appWithShuffledOut();
    await user.click(shuffledOutButton());
    await user.click(cardOf(addBackCheckbox(out[0])));
    await user.click(cardOf(takeOutGroup().getByRole('checkbox', { name: /^Card 1: / })));
    await user.click(addBackButton());

    expect(panel()).not.toBeInTheDocument();
    expect(screen.queryAllByRole('article', { hidden: true })).toHaveLength(1);
    expect(document.querySelector('[data-card-flights]')).toBeNull();
  });

  test('a validation message shows in the panel, next to the pinned buttons, and the panel stays open', async () => {
    const { user } = await appWithShuffledOut();
    await user.click(shuffledOutButton());

    await user.click(addBackButton());

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Pick at least one shuffled-out card to add back.');
    expect(openPanel()).toContainElement(alert);
    // Outside the part that scrolls, with the buttons, so it is always in view.
    expect(scrollBoxOf(addBackGroup().getByRole('list'))).not.toContainElement(alert);
    expect(alert.parentElement).toBe(addBackButton().parentElement!.parentElement);
  });

  test('when I clear and recover the list from the panel in its new place, it works the same as before, and the confirmation stays inside the panel', async () => {
    const { user, out } = await appWithShuffledOut(2);
    await user.click(shuffledOutButton());

    await user.click(clearButton());
    const confirm = screen.getByText('Clear all 2 cards? You can recover them later.');
    expect(openPanel()).toContainElement(confirm);
    expect(openPanel()).toContainElement(screen.getByRole('button', { name: 'Yes, Clear List' }));
    await user.click(screen.getByRole('button', { name: 'Yes, Clear List' }));

    expect(openPanel()).toBeInTheDocument();
    expect(within(openPanel()).getByText('No cards have been shuffled out yet.')).toBeInTheDocument();
    expect(shuffledOutButton()).toHaveTextContent('Shuffled out (0)');
    const recover = within(openPanel()).getByRole('button', { name: 'Recover cleared list (2)' });
    await user.click(recover);

    expect(openPanel()).toBeInTheDocument();
    expect(
      addBackGroup()
        .getAllByRole('checkbox')
        .map((c) => c.getAttribute('aria-label')),
    ).toEqual(out);
    expect(shuffledOutButton()).toHaveTextContent('Shuffled out (2)');
  });

  test('when the deck crashes while the panel is open, the friendly message is shown and no panel or button is left behind', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { user } = await appWithShuffledOut();
    await user.click(shuffledOutButton());
    expect(openPanel()).toBeInTheDocument();

    // The next card fails to draw (the → key works while the panel is open).
    crash.deckCard = true;
    try {
      await user.keyboard('{ArrowRight}');
    } finally {
      crash.deckCard = false;
    }

    expect(
      screen.getByText('Something went wrong showing the cards. Please reload the page to try again.'),
    ).toBeInTheDocument();
    expect(panel()).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Shuffled out/ })).not.toBeInTheDocument();
    // Escape and clicks no longer do anything with the panel: nothing comes back, nothing fails.
    consoleError.mockClear();
    await user.keyboard('{Escape}');
    await user.click(title());
    expect(panel()).not.toBeInTheDocument();
    expect(screen.queryAllByRole('region')).toHaveLength(0);
    expect(consoleError).not.toHaveBeenCalled();
  });

  test('in React strict mode there is only ever one panel, and it opens, closes and gives focus back once', async () => {
    serveDeck(DECKS);
    const user = userEvent.setup();
    render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
    await screen.findByText(COUNTER);
    await shuffleOutOne(user);

    await user.click(shuffledOutButton());
    expect(screen.getAllByRole('region', { name: 'Shuffled-out cards' })).toHaveLength(1);
    expect(closeButton()).toHaveFocus();

    // Inside clicks keep it open; Escape, an outside click and the button each close it once.
    await user.click(openPanel());
    expect(screen.getAllByRole('region', { name: 'Shuffled-out cards' })).toHaveLength(1);
    await user.keyboard('{Escape}');
    expect(panel()).not.toBeInTheDocument();
    expect(shuffledOutButton()).toHaveFocus();

    await user.click(shuffledOutButton());
    expect(screen.getAllByRole('region', { name: 'Shuffled-out cards' })).toHaveLength(1);
    await user.click(title());
    expect(panel()).not.toBeInTheDocument();

    await user.click(shuffledOutButton());
    await user.click(shuffledOutButton());
    expect(panel()).not.toBeInTheDocument();
    expect(shuffledOutButton()).toHaveAttribute('aria-expanded', 'false');
  });
});
