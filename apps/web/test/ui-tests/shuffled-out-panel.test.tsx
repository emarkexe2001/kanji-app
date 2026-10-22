// ADJ2: the Shuffled-out cards panel floats in the top right, below the header, over the page.
import { StrictMode, type ComponentProps } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';
import App from '../../src/app/app';
import type { CardStack as RealCardStack } from '../../src/features/deck/components/card-stack';
import { COUNTER, currentWord, deckContents, makeDecks, renderApp, serveDeck, shuffleIn, type User } from './helpers';

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

/**
 * Sets what the screen reports: `wide` for the lg breakpoint (1024px) and up, and the "reduce
 * motion" setting. jsdom has no media queries, so window.matchMedia is replaced.
 */
function setScreen({ wide = false, reduceMotion = false }: { wide?: boolean; reduceMotion?: boolean }) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches:
        (reduceMotion && query === '(prefers-reduced-motion: reduce)') || (wide && query === '(min-width: 1024px)'),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
}

describe('Floating shuffled-out panel (ADJ2)', () => {
  test('when I press "Shuffled out (N)", the panel opens in the top right and the deck stays in the centre and is still shown', async () => {
    const { user } = await appWithShuffledOut();
    const word = currentWord();

    await user.click(shuffledOutButton());

    const open = openPanel();
    expect(shuffledOutButton()).toHaveAttribute('aria-expanded', 'true');
    expect(shuffledOutButton()).toHaveAttribute('aria-controls', open.id);
    // The deck card is still shown, outside the panel, with the same card.
    expect(deckCard()).toBeVisible();
    expect(open).not.toContainElement(deckCard());
    expect(currentWord()).toBe(word);
    // jsdom has no layout, so the classes are checked. The panel floats over the page (fixed, so
    // it takes no room and pushes nothing down) in the top right: 72px down from sm up (just below
    // the one-line header) and 24px from the right and 300px wide from lg (1024px) up.
    expect(open).toHaveClass('fixed', 'sm:top-[72px]', 'lg:right-6', 'lg:w-[300px]');
    // Top right, not top left (the FEAT5 mode menu goes top left).
    expect(open.className).not.toMatch(/(^|\s)(\w+:)?(left|inset|inset-x)-/);
    // The deck stays centred in its column: opening the panel only changes the deck below lg.
    for (const el of ancestors(deckCard())) expect(el.className).not.toMatch(/(^|\s)lg:/);
    expect(ancestors(deckCard()).some((a) => a.classList.contains('justify-center'))).toBe(true);
  });

  test('the panel is a sky-50 panel with a sky-200 border, rounded corners and a large shadow, titled "Shuffled-out cards" with a × button', async () => {
    const { user } = await appWithShuffledOut();
    await user.click(shuffledOutButton());

    const open = openPanel();
    // jsdom has no colours or shadows, so the classes are checked.
    expect(open).toHaveClass('bg-sky-50', 'border', 'border-sky-200', 'rounded-xl', 'shadow-xl');
    const heading = within(open).getByRole('heading', { name: 'Shuffled-out cards' });
    // The × is in the title row, after the title, and screen readers hear its label, not "×".
    expect(heading.parentElement).toContainElement(closeButton());
    expect(heading.compareDocumentPosition(closeButton()) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(closeButton()).toHaveTextContent('×');
    expect(within(closeButton()).getByText('×')).toHaveAttribute('aria-hidden', 'true');
  });

  test('from lg (1024px) up the panel is 300px wide and at most 560px tall, and below lg it is a smaller pop-up that never makes the page scroll sideways', async () => {
    const { user } = await appWithShuffledOut();
    await user.click(shuffledOutButton());

    // jsdom has no layout, so the classes are checked; the sizes are checked in a real browser at
    // 360/640/1024px too. From lg: 300px wide, 24px from the right, at most 560px tall and never
    // taller than the screen less 96px (72px above it, 24px below).
    expect(openPanel()).toHaveClass('lg:w-[300px]', 'lg:right-6', 'lg:max-h-[min(560px,calc(100dvh-96px))]');
    // Below lg, a pop-up: 300px wide but never wider than the screen less 16px (so no sideways
    // scrolling at 360px), 8px from the right, at most 380px tall, below the header (which is two
    // lines high on a narrow phone, where the title wraps).
    expect(openPanel()).toHaveClass(
      'w-[min(300px,calc(100vw-16px))]',
      'right-2',
      'max-h-[min(380px,calc(100dvh-100px))]',
      'top-[92px]',
    );
    // Nothing else sets a width that could be wider than the screen.
    const widths = openPanel()
      .className.match(/(^|\s)(\w+:)?w-\S+/g)!
      .map((w) => w.trim());
    expect(widths.sort()).toEqual(['lg:w-[300px]', 'w-[min(300px,calc(100vw-16px))]']);
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

  test("the panel's cards are smaller than the deck card, and smaller again below lg", async () => {
    const { user, out } = await appWithShuffledOut();
    await user.click(shuffledOutButton());

    const card = cardOf(addBackCheckbox(out[0]));
    const word = within(card).getByText(out[0]!.replace(/【.*$/, '')).closest('p')!;
    // jsdom has no font sizes, so the classes are checked: a 14px word and 8-10px text below lg,
    // a 16px word and 9-11px text from lg up; the deck card's word is 30px (text-3xl).
    expect(word).toHaveClass('text-sm', 'lg:text-base');
    expect(within(card).getByText(/^【/)).toHaveClass('text-[9px]', 'lg:text-[10px]');
    expect(within(card).getByText('JLPT N5')).toHaveClass('text-[8px]', 'lg:text-[9px]');
    expect(within(card).getByText(/^word number/)).toHaveClass('text-[10px]', 'lg:text-[11px]');
    expect(within(card).getByText('From JLPT N5')).toHaveClass('text-[9px]', 'lg:text-[10px]');
    expect(within(card.closest('li')!).getByText('1')).toHaveClass('text-[10px]', 'lg:text-[11px]');
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

  test('when I open the panel on a phone, the deck card gets smaller, and it goes back to normal when I close the panel', async () => {
    const { user } = await appWithShuffledOut();
    const shrunk = () => ancestors(deckCard()).find((a) => a.classList.contains('max-lg:scale-[0.73]'));
    expect(shrunk()).toBeUndefined();

    await user.click(shuffledOutButton());
    // jsdom has no layout, so the classes are checked: below lg the card is scaled from its top
    // edge to about 240px wide on a 360px phone, and sits at the top of its space (so it can
    // move down below the pop-up). Only max-lg: classes change, so from lg up it stays as it is.
    expect(shrunk()).toHaveClass('max-lg:origin-top');
    expect(ancestors(deckCard()).some((a) => a.classList.contains('max-lg:items-start'))).toBe(true);
    expect(deckCard()).toBeVisible();

    await user.click(closeButton());
    expect(shrunk()).toBeUndefined();
    expect(ancestors(deckCard()).some((a) => a.classList.contains('max-lg:items-start'))).toBe(false);
  });

  test('on a phone the smaller deck card moves down to just below the pop-up while it is open, and back when it closes; from lg up it stays put', async () => {
    // jsdom has no layout, so the positions are made up: the pop-up ends 470px down the screen and
    // the deck card's space starts 200px down. The card has to start 12px below the pop-up.
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      const top = this.id === 'shuffled-out-panel' ? 92 : 200;
      const bottom = this.id === 'shuffled-out-panel' ? 470 : 600;
      return { top, bottom, left: 0, right: 300, width: 300, height: bottom - top, x: 0, y: top, toJSON: () => ({}) };
    });
    const cardSpace = () => ancestors(deckCard()).find((a) => a.classList.contains('flex-1'))!;

    setScreen({ wide: false });
    const { user } = await appWithShuffledOut();
    expect(cardSpace().style.paddingTop).toBe('');
    await user.click(shuffledOutButton());
    expect(cardSpace().style.paddingTop).toBe(`${470 + 12 - 200}px`);
    await user.click(closeButton());
    expect(cardSpace().style.paddingTop).toBe('');

    // From lg up the panel floats beside the deck, so the card doesn't move.
    setScreen({ wide: true });
    await user.click(shuffledOutButton());
    expect(openPanel()).toBeInTheDocument();
    expect(cardSpace().style.paddingTop).toBe('');
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

  test('cards added back do not slide between the panel and the deck (that is ADJ3)', async () => {
    setScreen({ reduceMotion: false });
    const { user, out } = await appWithShuffledOut();
    await user.click(shuffledOutButton());
    await user.click(cardOf(addBackCheckbox(out[0])));
    await user.click(cardOf(takeOutGroup().getByRole('checkbox', { name: /^Card 1: / })));
    await user.click(addBackButton());

    // Only the deck card is drawn: no copy of a card flying between the panel and the deck.
    expect(screen.queryAllByRole('article', { hidden: true })).toHaveLength(1);
    expect(document.querySelector('.slide-out')).toBeNull();
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
