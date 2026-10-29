// FEAT2: the Shuffled-out cards view, for adding shuffled-out cards back.
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';
import { PICK_COLORS } from '@kanji/core';
import App from '../../src/app/app';
import {
  COUNTER,
  chooseDeck,
  chooseSource,
  counter,
  currentCardLevel,
  currentWord,
  deckContents,
  enterCardLimit,
  makeDecks,
  makeWords,
  renderApp,
  serveDeck,
  setScreen,
  shuffleIn,
  type User,
} from './helpers';

const DECKS = makeDecks({ N5: 30, N4: 30 });

const shuffledOutButton = () => screen.getByRole('button', { name: /^Shuffled out \(\d+\)$/ });
const addBackGroup = () => within(screen.getByRole('group', { name: 'Add back' }));
const takeOutGroup = () => within(screen.getByRole('group', { name: /^Take out of your deck/ }));
/** The words in the "Add back" list, in the order shown. */
const listedWords = () =>
  addBackGroup()
    .getAllByRole('checkbox')
    .map((c) => c.getAttribute('aria-label'));

async function openView(user: User) {
  await user.click(shuffledOutButton());
}

/** The card the user selects to pick it, for the (visually hidden) checkbox that says whether it is picked. */
const cardOf = (checkbox: HTMLElement) => checkbox.closest('label')!;
const addBackCheckbox = (word: string | null) => addBackGroup().getByRole('checkbox', { name: word! });
const takeOutCheckbox = (position: number) =>
  takeOutGroup().getByRole('checkbox', { name: new RegExp(`^Card ${position}: `) });

/** Picks shuffled-out cards to add back by selecting each card, by word (e.g. "N5単語3【たんご3】"). */
async function pickToAddBack(user: User, ...words: (string | null)[]) {
  for (const word of words) await user.click(cardOf(addBackCheckbox(word)));
}

/** Picks deck cards to take out by selecting each card, by position (from 1). */
async function pickToTakeOut(user: User, ...positions: number[]) {
  for (const p of positions) await user.click(cardOf(takeOutCheckbox(p)));
}

/** "N5単語3【たんご3】" split into the word and its reading. */
function splitWord(label: string | null) {
  const [, word, reading] = /^(.+)【(.+)】$/.exec(label ?? '')!;
  return { word, reading };
}

const addBackButton = () => screen.getByRole('button', { name: 'Add Back Cards' });

/** Shuffles in one card, then moves on, and returns the word that was shuffled out. */
async function shuffleOutOne(user: User) {
  const word = currentWord();
  await shuffleIn(user, '1');
  await user.click(screen.getByRole('button', { name: 'Next →' }));
  return word;
}

const words = (cards: { word: string | null }[]) => cards.map((c) => c.word);

describe('Shuffled-out cards view', () => {
  test('when I shuffle in cards, the cards that were removed appear in the view, newest first', async () => {
    const user = await renderApp(DECKS);
    const first = await shuffleOutOne(user);
    const second = await shuffleOutOne(user);

    expect(shuffledOutButton()).toHaveTextContent('Shuffled out (2)');
    await openView(user);

    expect(listedWords()).toEqual([second, first]);
  });

  test('when I add a card back, it is shown and in my deck, it leaves the list, the card I picked to swap out moves to the list, and my deck size still matches my card limit', async () => {
    const user = await renderApp(DECKS);
    const shuffledOut = await shuffleOutOne(user);
    const before = await deckContents(user);
    await openView(user);

    await pickToAddBack(user, shuffledOut);
    await pickToTakeOut(user, 5);
    const swappedOut = takeOutGroup()
      .getByRole('checkbox', { name: /^Card 5: / })
      .getAttribute('aria-label')!
      .replace(/^Card 5: /, '');
    await user.click(addBackButton());

    expect(currentWord()).toBe(shuffledOut);
    expect(counter()).toEqual({ position: 5, total: 10 });
    const after = await deckContents(user);
    expect(after).toHaveLength(10);
    expect(words(after)).toContain(shuffledOut);
    expect(words(after)).not.toContain(swappedOut);
    expect(words(before)).toContain(swappedOut);

    expect(shuffledOutButton()).toHaveTextContent('Shuffled out (1)');
    await openView(user);
    expect(listedWords()).toEqual([swappedOut]);
  });

  test('when I add several cards back at once, they are all in my deck and my deck size still matches my card limit', async () => {
    const user = await renderApp(DECKS);
    const out = [await shuffleOutOne(user), await shuffleOutOne(user), await shuffleOutOne(user)];
    await openView(user);

    await pickToAddBack(user, ...out);
    await pickToTakeOut(user, 2, 6, 9);
    await user.click(addBackButton());

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(counter().total).toBe(10);
    const after = words(await deckContents(user));
    for (const word of out) expect(after).toContain(word);
    expect(new Set(after).size).toBe(10);
  });

  test('when I reload the app, the shuffled-out list is still there', async () => {
    const user = await renderApp(DECKS);
    const first = await shuffleOutOne(user);
    const second = await shuffleOutOne(user);

    cleanup();
    serveDeck(DECKS);
    render(<App />);
    await screen.findByText(COUNTER);
    const reloaded = userEvent.setup();

    expect(shuffledOutButton()).toHaveTextContent('Shuffled out (2)');
    await openView(reloaded);
    expect(listedWords()).toEqual([second, first]);
  });

  test('when I clear the shuffled-out list and confirm, the list is empty', async () => {
    const user = await renderApp(DECKS);
    await shuffleOutOne(user);
    await shuffleOutOne(user);
    await openView(user);

    const clear = screen.getByRole('button', { name: 'Clear List' });
    expect(clear).toHaveClass('bg-rose-600');
    await user.click(clear);
    // FEAT2_7: the confirmation gives the number of cards and says they can be recovered.
    expect(screen.getByText('Clear all 2 cards? You can recover them later.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Yes, Clear List' }));

    expect(screen.getByText('No cards have been shuffled out yet.')).toBeInTheDocument();
    expect(shuffledOutButton()).toHaveTextContent('Shuffled out (0)');
    expect(JSON.parse(localStorage.getItem('kanji.removedCards') ?? 'null')).toEqual([]);
  });

  test('when I lower the card limit, the cards that drop out appear in the shuffled-out list', async () => {
    const user = await renderApp(DECKS);
    const before = words(await deckContents(user)); // starts and ends on card 1

    await enterCardLimit(user, '7');
    await openView(user);

    expect(listedWords().sort()).toEqual(before.slice(7).sort());
  });

  test('when more than 100 cards have been shuffled out, only the newest 100 are kept', async () => {
    const user = await renderApp(makeDecks({ N5: 200, N4: 5 }));
    await enterCardLimit(user, '150');
    await enterCardLimit(user, '1');

    expect(shuffledOutButton()).toHaveTextContent('Shuffled out (100)');
    await openView(user);
    expect(listedWords()).toHaveLength(100);
  });

  test('cards are listed only once, and a card that comes back into my deck leaves the list', async () => {
    const user = await renderApp(makeDecks({ N5: 30, N4: 1 }));
    await enterCardLimit(user, '3');
    await shuffleIn(user, '1'); // N4's only card replaces the N5 card on screen
    const n4Card = currentWord();
    expect(currentCardLevel()).toBe('JLPT N4');
    await enterCardLimit(user, '1'); // trims the two other N5 cards, keeps the N4 card on screen
    // Topping the deck back up takes the first N5 cards not in the deck, which are the ones just
    // trimmed or shuffled out, so they come back into the deck and must leave the list.
    await enterCardLimit(user, '3');

    await openView(user);
    // Ten different N5 cards left the deck (7 when the limit went from 10 to 3, 1 shuffled out,
    // 2 trimmed) and two came back, so eight are left on the list, each once.
    const listed = listedWords();
    expect(listed).toHaveLength(8);
    expect(new Set(listed).size).toBe(8);
    const inDeck = words(await deckContents(user));
    expect(inDeck).toContain(n4Card);
    for (const word of listed) expect(inDeck).not.toContain(word);
  });
});

// FEAT2_5: the cards in the view are shown as compact cards in a numbered grid, picked by selecting them.
describe('Shuffled-out cards shown as cards', () => {
  test('when I open the view, each shuffled-out card is shown as a card with its level, word, reading, meaning and the deck it came from', async () => {
    const user = await renderApp(DECKS);
    const shuffledOut = await shuffleOutOne(user);
    await openView(user);

    const card = within(cardOf(addBackCheckbox(shuffledOut)));
    const { word, reading } = splitWord(shuffledOut);
    expect(card.getByText('JLPT N5')).toBeInTheDocument();
    // The word keeps its colour-coded reading highlights, like the card on screen.
    expect(card.getByText(word)).toHaveClass('hl-onyomi');
    expect(card.getByText(`【${reading}】`)).toBeInTheDocument();
    expect(card.getByText(/^word number \d+$/)).toBeInTheDocument();
    expect(card.getByText('From JLPT N5')).toBeInTheDocument();
  });

  test('when I look at a shuffled-out card, it shows its word and meaning but no Reading Breakdown', async () => {
    // On a wide screen, where the deck card keeps its Reading Breakdown while the panel is open
    // (below it, the deck card leaves it out too, ADJ2_5: see shuffled-out-panel.test.tsx).
    setScreen({ wide: true });
    const user = await renderApp(DECKS);
    const shuffledOut = await shuffleOutOne(user);
    expect(screen.getByText('READING BREAKDOWN')).toBeInTheDocument(); // the card on screen has one
    await openView(user);

    const card = within(cardOf(addBackCheckbox(shuffledOut)));
    expect(card.getByText(splitWord(shuffledOut).word)).toBeInTheDocument();
    expect(card.getByText(/^word number \d+$/)).toBeInTheDocument();
    expect(card.queryByText('READING BREAKDOWN')).not.toBeInTheDocument();
    expect(screen.getAllByText('READING BREAKDOWN')).toHaveLength(1);
  });

  test('when I select a shuffled-out card, it is marked as picked, and selecting it again un-picks it', async () => {
    const user = await renderApp(DECKS);
    const shuffledOut = await shuffleOutOne(user);
    await openView(user);
    const checkbox = addBackCheckbox(shuffledOut);
    const card = cardOf(checkbox);

    await user.click(within(card).getByText(/^word number \d+$/)); // anywhere on the card
    expect(checkbox).toBeChecked();
    // Green outline and tick: this card is being added back.
    expect(within(card).getByText('✓')).toHaveStyle({ backgroundColor: PICK_COLORS.addBack });
    expect(card).toHaveStyle({ '--pick': PICK_COLORS.addBack });
    expect(card).toHaveClass('has-checked:ring-(--pick)');
    // The "Take out of your deck" cards appear once a card is picked to add back.
    expect(takeOutGroup().getAllByRole('checkbox')).toHaveLength(10);

    await user.click(card);
    expect(checkbox).not.toBeChecked();
    expect(within(card).queryByText('✓')).not.toBeInTheDocument();
  });

  test('when I pick cards to take out of my deck, they are shown as cards and I pick them by selecting the card', async () => {
    const user = await renderApp(DECKS);
    const shuffledOut = await shuffleOutOne(user);
    await openView(user);
    await pickToAddBack(user, shuffledOut);

    const checkbox = takeOutCheckbox(3);
    const card = within(cardOf(checkbox));
    const third = checkbox.getAttribute('aria-label')!.replace(/^Card 3: /, '');
    const { word, reading } = splitWord(third);
    expect(card.getByText(word)).toHaveClass('hl-onyomi');
    expect(card.getByText(`【${reading}】`)).toBeInTheDocument();
    const level = card.getByText(/^JLPT N[45]$/).textContent;
    expect(card.getByText(/^word number \d+$/)).toBeInTheDocument();
    expect(card.getByText(`From ${level}`)).toBeInTheDocument();
    expect(card.queryByText('READING BREAKDOWN')).not.toBeInTheDocument();

    await user.click(cardOf(checkbox));
    expect(checkbox).toBeChecked();
    // Red outline and tick: this card is being taken out.
    expect(card.getByText('✓')).toHaveStyle({ backgroundColor: PICK_COLORS.takeOut });
    expect(cardOf(checkbox)).toHaveStyle({ '--pick': PICK_COLORS.takeOut });
    await user.click(addBackButton());
    expect(words(await deckContents(user))).not.toContain(third);
  });

  test('when I open the view, the cards are shown in a grid, each with its number above it', async () => {
    const user = await renderApp(DECKS);
    const out = [await shuffleOutOne(user), await shuffleOutOne(user), await shuffleOutOne(user)];
    await openView(user);

    const grid = addBackGroup().getByRole('list');
    // jsdom has no layout, so the classes are checked: two cards per row at every width (ADJ2;
    // the grid and the panel's size are covered in shuffled-out-panel.test.tsx).
    expect(grid).toHaveClass('grid', 'grid-cols-2');
    expect(grid.className).not.toMatch(/(^|\s)\w+:grid-cols-/);
    const items = within(grid).getAllByRole('listitem');
    expect(items).toHaveLength(3);
    [...out].reverse().forEach((word, i) => {
      const number = within(items[i]).getByText(String(i + 1));
      const card = cardOf(within(items[i]).getByRole('checkbox', { name: word! }));
      expect(card).not.toContainElement(number); // the number sits outside the card...
      expect(number.compareDocumentPosition(card) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy(); // ...above it
    });

    // The "Take out of your deck" cards use the same numbered grid, numbered by their place in the deck.
    await pickToAddBack(user, out[0]);
    const takeOut = takeOutGroup().getByRole('list');
    expect(takeOut).toHaveClass('grid', 'grid-cols-2');
    expect(takeOut.className).not.toMatch(/(^|\s)\w+:grid-cols-/);
    within(takeOut)
      .getAllByRole('listitem')
      .forEach((item, i) => expect(within(item).getByText(String(i + 1))).toBeInTheDocument());
  });

  test('when I use only the keyboard, I can move between the shuffled-out cards and pick one', async () => {
    const user = await renderApp(DECKS);
    const first = await shuffleOutOne(user);
    const second = await shuffleOutOne(user);

    shuffledOutButton().focus();
    await user.keyboard('{Enter}');
    // Newest first: Tab reaches the second card shuffled out, then the first.
    await user.tab();
    expect(addBackCheckbox(second)).toHaveFocus();
    await user.tab();
    expect(addBackCheckbox(first)).toHaveFocus();

    await user.keyboard(' ');
    expect(addBackCheckbox(first)).toBeChecked();
    await user.keyboard('{Enter}');
    expect(addBackCheckbox(first)).not.toBeChecked();
    await user.keyboard('{Enter}');
    expect(addBackCheckbox(first)).toBeChecked();
    expect(addBackCheckbox(second)).not.toBeChecked();
    // Pressing Enter on a card picks it; it doesn't submit Add Back Cards.
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    // Then on to a deck card to take out, and Add Back Cards, still with the keyboard.
    await user.tab(); // the first "Take out of your deck" card
    expect(takeOutCheckbox(1)).toHaveFocus();
    await user.keyboard(' ');
    expect(takeOutCheckbox(1)).toBeChecked();
    for (let i = 0; i < 10; i++) await user.tab();
    expect(addBackButton()).toHaveFocus();
    await user.keyboard('{Enter}');

    expect(currentWord()).toBe(first);
  });
});

// FEAT2_6: fixes to the cards in the view (the missing-card failure path is in missing-card-data.test.tsx).
describe('Shuffled-out card view fixes', () => {
  test('when I look at a shuffled-out card for a common word, it shows no "★ Common Word" badge', async () => {
    const user = await renderApp(makeDecks({ N5: 30, common: 30 }));
    await chooseDeck(user, 'Common words');
    // The card on screen is a common word, so it shows the badge there.
    expect(within(screen.getByRole('article')).getByText('★ Common Word')).toBeInTheDocument();
    const shuffledOut = await shuffleOutOne(user);
    await openView(user);

    const card = within(cardOf(addBackCheckbox(shuffledOut)));
    expect(card.getByText(/^word number \d+$/)).toBeInTheDocument();
    expect(card.queryByText('★ Common Word')).not.toBeInTheDocument();
    // The common words in "Take out of your deck" don't show it either.
    await pickToAddBack(user, shuffledOut);
    expect(takeOutGroup().getByRole('checkbox', { name: /^Card 2: 単語/ })).toBeInTheDocument();
    expect(takeOutGroup().queryByText('★ Common Word')).not.toBeInTheDocument();
  });

  test('when I reach a pick card with a screen reader, I hear its word, reading, meaning, deck and whether it is new', async () => {
    const user = await renderApp(DECKS);
    const shuffledOut = await shuffleOutOne(user);
    await shuffleIn(user, '2'); // two new JLPT N4 cards, one of them on screen
    await openView(user);

    // A shuffled-out card: not new.
    const addBack = addBackCheckbox(shuffledOut);
    const meaning = within(cardOf(addBack)).getByText(/^word number \d+$/).textContent;
    expect(addBack).toHaveAccessibleName(shuffledOut!);
    expect(addBack).toHaveAccessibleDescription(`${meaning} From JLPT N5`);

    // Deck cards: a new one also says "New", one that isn't new doesn't.
    await pickToAddBack(user, shuffledOut);
    const takeOut = takeOutGroup().getAllByRole('checkbox');
    const isNew = (c: HTMLElement) => within(cardOf(c)).queryByText('New') !== null;
    const newCard = takeOut.find(isNew)!;
    const oldCard = takeOut.find((c) => !isNew(c) && /^Card \d+: N5/.test(c.getAttribute('aria-label')!))!;
    for (const [checkbox, description] of [
      [newCard, (m: string | null) => `${m} From JLPT N4 New`],
      [oldCard, (m: string | null) => `${m} From JLPT N5`],
    ] as const) {
      const card = cardOf(checkbox);
      const m = within(card).getByText(/^word number \d+$/).textContent;
      expect(checkbox).toHaveAccessibleName(/^Card \d+: .+【.+】$/);
      expect(checkbox).toHaveAccessibleDescription(description(m));
      // Nothing is added to the screen for it: the description is read from what the card already shows.
      for (const id of checkbox.getAttribute('aria-describedby')!.split(' ')) {
        expect(card).toContainElement(document.getElementById(id));
      }
    }
  });

  test('when I hold Enter on a pick card, it is picked once', async () => {
    const user = await renderApp(DECKS);
    const first = await shuffleOutOne(user);
    await openView(user);
    addBackCheckbox(first).focus();

    // Holding the key down repeats the key press (keydown with `repeat`) before it is let go.
    await user.keyboard('{Enter>6/}');
    expect(addBackCheckbox(first)).toBeChecked();
    expect(takeOutGroup().getAllByRole('checkbox')).toHaveLength(10);

    // The same on a "Take out of your deck" card.
    takeOutCheckbox(2).focus();
    await user.keyboard('{Enter>6/}');
    expect(takeOutCheckbox(2)).toBeChecked();
    await user.keyboard('{Enter>5/}');
    expect(takeOutCheckbox(2)).not.toBeChecked();

    addBackCheckbox(first).focus();
    await user.keyboard('{Enter>5/}');
    expect(addBackCheckbox(first)).not.toBeChecked();
    // Holding Enter doesn't submit Add Back Cards either.
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  test('in a high-contrast (forced colours) mode, a picked card turns fully Highlight with a ringed tick, and keyboard focus is a dashed outline outside it; in normal colours it looks the same as before', async () => {
    const user = await renderApp(DECKS);
    const shuffledOut = await shuffleOutOne(user);
    await openView(user);
    await pickToAddBack(user, shuffledOut);
    await pickToTakeOut(user, 3);

    // jsdom can't switch on forced colours or show colours, so the classes are checked. Under
    // forced-colors the page's own colours are dropped and only system colours are kept, so:
    // - keyboard focus on any card, picked or not, is a 2px dashed CanvasText outline 5px out,
    //   just outside a picked card's outline.
    const forcedFocus = [
      'forced-colors:has-focus-visible:outline-2',
      'forced-colors:has-focus-visible:outline-dashed',
      'forced-colors:has-focus-visible:outline-offset-[5px]',
      'forced-colors:has-focus-visible:outline-[color:CanvasText]',
    ];
    expect(takeOutCheckbox(4)).not.toBeChecked();
    expect(cardOf(takeOutCheckbox(4))).toHaveClass(...forcedFocus);

    for (const [checkbox, color] of [
      [addBackCheckbox(shuffledOut), PICK_COLORS.addBack],
      [takeOutCheckbox(3), PICK_COLORS.takeOut],
    ] as const) {
      const card = cardOf(checkbox);
      const tick = within(card).getByText('✓');
      // - a picked card turns fully Highlight: the compact card (the label's only div) and
      //   everything in it get a Highlight background and HighlightText text, with a 3px solid
      //   Highlight outline 2px out;
      expect(card).toHaveClass(
        'forced-colors:has-checked:[&>div]:outline-3',
        'forced-colors:has-checked:[&>div]:outline-solid',
        'forced-colors:has-checked:[&>div]:outline-offset-2',
        'forced-colors:has-checked:[&>div]:outline-[color:Highlight]',
        'forced-colors:has-checked:[&>div]:bg-[color:Highlight]!',
        'forced-colors:has-checked:[&>div]:text-[color:HighlightText]!',
        'forced-colors:has-checked:[&>div_*]:bg-[color:Highlight]!',
        'forced-colors:has-checked:[&>div_*]:text-[color:HighlightText]!',
        ...forcedFocus,
      );
      const compact = card.querySelectorAll(':scope > div');
      expect(compact).toHaveLength(1);
      expect(compact[0]).toHaveTextContent(/^JLPT N[45]/); // the whole card, header included
      // - the tick sits outside that div, so it keeps its own 2px Highlight ring on Canvas with a
      //   Highlight tick.
      expect(compact[0]).not.toContainElement(tick);
      expect(tick).toHaveClass(
        'forced-colors:border-2',
        'forced-colors:border-[color:Highlight]',
        'forced-colors:bg-[color:Canvas]!',
        'forced-colors:text-[color:Highlight]',
      );
      // In normal colours nothing changes: the coloured ring and the white tick on the pick colour,
      // and every high-contrast style only applies under forced-colors.
      expect(card).toHaveClass('has-checked:ring-2', 'has-checked:ring-(--pick)');
      expect(card).toHaveStyle({ '--pick': color });
      expect(tick).toHaveClass('text-white', 'rounded-full');
      expect(tick).toHaveStyle({ backgroundColor: color });
      for (const el of [card, tick]) {
        const highContrast = [...el.classList].filter((c) => /Highlight|Canvas|outline-3|border-2|dashed/.test(c));
        expect(highContrast.length).toBeGreaterThan(0);
        for (const c of highContrast) expect(c).toMatch(/^forced-colors:/);
      }
    }
  });
});

describe('Shuffled-out cards view failure paths', () => {
  test("when a shuffled-out card's details can't be drawn, the rest of the view still works and a friendly message is shown", async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    // Broken data: N3 word 2 is missing its reading breakdown, so drawing its card throws. Both N3
    // cards were shuffled out earlier (N3 isn't the deck being studied, so neither is in the deck).
    const n3 = makeWords(2, 'N3');
    const decks = [...DECKS, n3[0], { ...n3[1], segments: null }];
    localStorage.setItem(
      'kanji.removedCards',
      JSON.stringify([
        { id: 'N3-2', deck: 'N3', reason: 'shuffled-out', removedAt: 2 },
        { id: 'N3-1', deck: 'N3', reason: 'shuffled-out', removedAt: 1 },
      ]),
    );
    const user = await renderApp(decks as typeof DECKS);
    await openView(user);

    expect(screen.getByText("This card can't be shown.")).toBeInTheDocument();
    expect(consoleError).toHaveBeenCalledWith('Error while drawing a card:', expect.any(TypeError), expect.anything());
    // The other card, the deck and the rest of the view still work.
    expect(listedWords()).toEqual(['N3単語1【たんご1】']);
    expect(screen.getByRole('button', { name: 'Clear List' })).toBeInTheDocument();
    await pickToAddBack(user, 'N3単語1【たんご1】');
    await pickToTakeOut(user, 2);
    await user.click(addBackButton());
    expect(currentWord()).toBe('N3単語1【たんご1】');
    expect(counter()).toEqual({ position: 2, total: 10 });
  });

  test('when no cards have been shuffled out yet, the view says so instead of showing an empty list', async () => {
    const user = await renderApp(DECKS);

    expect(shuffledOutButton()).toHaveTextContent('Shuffled out (0)');
    await openView(user);

    expect(screen.getByText('No cards have been shuffled out yet.')).toBeInTheDocument();
    expect(screen.queryByRole('group', { name: 'Add back' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Clear List' })).not.toBeInTheDocument();
  });

  test('when I try to add back more cards than my card limit allows at once, a validation message is shown and my deck does not change', async () => {
    const user = await renderApp(DECKS);
    await chooseSource(user, 'JLPT N4');
    await shuffleIn(user, '10'); // 10 cards on the list
    await enterCardLimit(user, '3'); // the deck is now 3 cards
    const before = await deckContents(user);
    await openView(user);

    await pickToAddBack(user, ...listedWords().slice(0, 4));
    await pickToTakeOut(user, 1, 2, 3);
    await user.click(addBackButton());

    expect(screen.getByRole('alert')).toHaveTextContent(
      "You can't add back more than 3 cards at once, your card limit.",
    );
    expect(await deckContents(user)).toEqual(before);
  });

  test('when I pick a different number of cards to take out than to add back, a validation message is shown and my deck does not change', async () => {
    const user = await renderApp(DECKS);
    const out = [await shuffleOutOne(user), await shuffleOutOne(user)];
    const before = await deckContents(user);
    await openView(user);

    await pickToAddBack(user, ...out);
    await pickToTakeOut(user, 4);
    await user.click(addBackButton());

    expect(screen.getByRole('alert')).toHaveTextContent(
      "Pick 2 cards in your deck to take out, the same number as you're adding back (you picked 1).",
    );
    expect(await deckContents(user)).toEqual(before);
    expect(shuffledOutButton()).toHaveTextContent('Shuffled out (2)');
  });

  test('pressing Add Back Cards with nothing picked shows a validation message and my deck does not change', async () => {
    const user = await renderApp(DECKS);
    await shuffleOutOne(user);
    const before = await deckContents(user);
    await openView(user);

    await user.click(addBackButton());

    expect(screen.getByRole('alert')).toHaveTextContent('Pick at least one shuffled-out card to add back.');
    expect(await deckContents(user)).toEqual(before);
  });

  test('when I clear the shuffled-out list and then cancel the confirmation, nothing is cleared', async () => {
    const user = await renderApp(DECKS);
    const first = await shuffleOutOne(user);
    await openView(user);

    await user.click(screen.getByRole('button', { name: 'Clear List' }));
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(listedWords()).toEqual([first]);
    expect(shuffledOutButton()).toHaveTextContent('Shuffled out (1)');
    expect(JSON.parse(localStorage.getItem('kanji.removedCards') ?? '[]')).toHaveLength(1);
  });

  test('when browser storage is blocked, the shuffled-out list still works for the current session', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('Access denied', 'SecurityError');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Access denied', 'SecurityError');
    });

    const user = await renderApp(DECKS);
    const out = await shuffleOutOne(user);
    expect(shuffledOutButton()).toHaveTextContent('Shuffled out (1)');
    await openView(user);
    expect(listedWords()).toEqual([out]);

    await pickToAddBack(user, out);
    await pickToTakeOut(user, 3);
    await user.click(addBackButton());

    expect(currentWord()).toBe(out);
    expect(shuffledOutButton()).toHaveTextContent('Shuffled out (1)');
  });
});

// FEAT2_7: a cleared shuffled-out list can be recovered until Clear List is pressed again.
describe('Recovering a cleared shuffled-out list', () => {
  const recoverButton = () => screen.queryByRole('button', { name: /^Recover cleared list/ });

  /**
   * Opens the view again if it isn't open: since ADJ2, using the deck's controls (a click outside
   * the panel) closes it.
   */
  async function reopenView(user: User) {
    if (!screen.queryByRole('region', { name: 'Shuffled-out cards' })) await openView(user);
  }

  /** Opens the view (if it isn't open), clears the list and confirms. */
  async function clearList(user: User) {
    await reopenView(user);
    await user.click(screen.getByRole('button', { name: 'Clear List' }));
    await user.click(screen.getByRole('button', { name: 'Yes, Clear List' }));
  }

  /** Unmounts the app and renders it again from what was saved, like reloading the page. */
  async function reload() {
    cleanup();
    serveDeck(DECKS);
    render(<App />);
    await screen.findByText(COUNTER);
    return userEvent.setup();
  }

  test('when I clear a single card, the confirmation says "Clear 1 card? You can recover it later."', async () => {
    const user = await renderApp(DECKS);
    await shuffleOutOne(user);
    await openView(user);

    await user.click(screen.getByRole('button', { name: 'Clear List' }));

    expect(screen.getByText('Clear 1 card? You can recover it later.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Yes, Clear List' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  test('when I clear the shuffled-out list, a "Recover cleared list" button shows with the number of cards cleared', async () => {
    const user = await renderApp(DECKS);
    await shuffleOutOne(user);
    await shuffleOutOne(user);
    await clearList(user);

    const recover = screen.getByRole('button', { name: 'Recover cleared list (2)' });
    // Under the "No cards have been shuffled out yet" message.
    const message = screen.getByText('No cards have been shuffled out yet.');
    expect(message.compareDocumentPosition(recover) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    // jsdom has no colours, so the class is checked: sky blue and filled, like "Shuffled out (N)".
    expect(recover).toHaveClass('bg-sky-600', 'text-white');
    expect(shuffledOutButton()).toHaveClass('bg-sky-600', 'text-white');
  });

  test('when I press "Recover cleared list", the cards come back in the shuffled-out list in the same order, and the button goes away', async () => {
    const user = await renderApp(DECKS);
    const out = [await shuffleOutOne(user), await shuffleOutOne(user), await shuffleOutOne(user)];
    await openView(user);
    const before = listedWords();
    expect(before).toEqual([...out].reverse());
    await clearList(user);

    await user.click(screen.getByRole('button', { name: 'Recover cleared list (3)' }));

    expect(listedWords()).toEqual(before);
    expect(shuffledOutButton()).toHaveTextContent('Shuffled out (3)');
    expect(recoverButton()).not.toBeInTheDocument();
    expect(screen.queryByText('No cards have been shuffled out yet.')).not.toBeInTheDocument();
    // Picking and adding back still work on the recovered list.
    await pickToAddBack(user, out[0]);
    await pickToTakeOut(user, 4);
    await user.click(addBackButton());
    expect(currentWord()).toBe(out[0]);
    expect(shuffledOutButton()).toHaveTextContent('Shuffled out (3)');
  });

  test('when I clear the list and reload the app, I can still recover it', async () => {
    const user = await renderApp(DECKS);
    const first = await shuffleOutOne(user);
    const second = await shuffleOutOne(user);
    await clearList(user);

    const reloaded = await reload();
    expect(shuffledOutButton()).toHaveTextContent('Shuffled out (0)');
    await openView(reloaded);
    await reloaded.click(screen.getByRole('button', { name: 'Recover cleared list (2)' }));

    expect(listedWords()).toEqual([second, first]);
    expect(recoverButton()).not.toBeInTheDocument();
    // Once recovered, it is no longer kept to recover again, after a reload too.
    const again = await reload();
    await openView(again);
    expect(listedWords()).toEqual([second, first]);
    expect(recoverButton()).not.toBeInTheDocument();
  });

  test('after a Clear List, shuffling a new card out keeps the "Recover cleared list" button, after a reload too', async () => {
    const user = await renderApp(DECKS);
    const first = await shuffleOutOne(user);
    const second = await shuffleOutOne(user);
    await clearList(user);

    const newer = await shuffleOutOne(user);
    await enterCardLimit(user, '9'); // lowering the card limit doesn't drop it either
    await reopenView(user);
    const listed = listedWords();
    expect(listed).toHaveLength(2);
    expect(listed[0]).not.toBe(newer); // the card trimmed by the limit is newest
    expect(listed[1]).toBe(newer);
    expect(screen.getByRole('button', { name: 'Recover cleared list (2)' })).toBeInTheDocument();

    const reloaded = await reload();
    await openView(reloaded);
    await reloaded.click(screen.getByRole('button', { name: 'Recover cleared list (2)' }));
    expect(listedWords()).toEqual([...listed, second, first]);
    expect(recoverButton()).not.toBeInTheDocument();
  });

  test('when I recover while the shuffled-out list has cards, the cards already listed stay and the cleared ones are added by when they were shuffled out, with no duplicates', async () => {
    const card = (id: string, removedAt: number) => ({ id, deck: 'N4', reason: 'shuffled-out', removedAt });
    localStorage.setItem('kanji.removedCards', JSON.stringify([card('N4-1', 50), card('N4-2', 30), card('N4-3', 10)]));
    localStorage.setItem(
      'kanji.clearedCards',
      JSON.stringify([
        card('N4-4', 40),
        card('N4-2', 35), // already in the shuffled-out list
        { id: 'N5-1', deck: 'N5', reason: 'card-limit', removedAt: 25 }, // back in the deck
        card('N4-5', 20),
        card('N4-6', 5),
      ]),
    );
    // The deck holds N5 cards 1 to 10.
    localStorage.setItem('kanji.studiedDeck', 'N5');
    localStorage.setItem(
      'kanji.savedDeck',
      JSON.stringify({ deck: 'N5', cards: Array.from({ length: 10 }, (_, i) => ({ id: `N5-${i + 1}`, deck: 'N5' })) }),
    );
    const user = await renderApp(DECKS);
    expect(words(await deckContents(user))).toContain('N5単語1【たんご1】');
    await openView(user);

    await user.click(screen.getByRole('button', { name: 'Recover cleared list (5)' }));

    expect(listedWords()).toEqual([1, 4, 2, 5, 3, 6].map((n) => `N4単語${n}【たんご${n}】`));
    expect(shuffledOutButton()).toHaveTextContent('Shuffled out (6)');
    expect(recoverButton()).not.toBeInTheDocument();
  });

  test('when I press Clear List again, the newer cleared list replaces the one kept before', async () => {
    const user = await renderApp(DECKS);
    await shuffleOutOne(user);
    await shuffleOutOne(user);
    await clearList(user);
    const newer = await shuffleOutOne(user);

    await clearList(user);

    await user.click(screen.getByRole('button', { name: 'Recover cleared list (1)' }));
    expect(listedWords()).toEqual([newer]);
    // Only the newer list was kept in storage too.
    await clearList(user);
    const reloaded = await reload();
    await openView(reloaded);
    await reloaded.click(screen.getByRole('button', { name: 'Recover cleared list (1)' }));
    expect(listedWords()).toEqual([newer]);
  });

  test('when recovering takes the shuffled-out list past 100 cards, the oldest cards are dropped', async () => {
    const card = (n: number, removedAt: number) => ({ id: `N4-${n}`, deck: 'N4', reason: 'shuffled-out', removedAt });
    // 70 listed cards and 50 cleared ones, shuffled out at alternating times.
    const listed = Array.from({ length: 70 }, (_, i) => card(i + 1, 1000 - 2 * i));
    const cleared = Array.from({ length: 50 }, (_, i) => card(i + 71, 999 - 2 * i));
    localStorage.setItem('kanji.removedCards', JSON.stringify(listed));
    localStorage.setItem('kanji.clearedCards', JSON.stringify(cleared));
    const user = await renderApp(makeDecks({ N5: 30, N4: 120 }));
    await openView(user);

    await user.click(screen.getByRole('button', { name: 'Recover cleared list (50)' }));

    const newest100 = [...listed, ...cleared].sort((a, b) => b.removedAt - a.removedAt).slice(0, 100);
    const label = (id: string) => `N4単語${id.slice(3)}【たんご${id.slice(3)}】`;
    expect(listedWords()).toEqual(newest100.map((c) => label(c.id)));
    expect(shuffledOutButton()).toHaveTextContent('Shuffled out (100)');
    // The 20 oldest (listed cards 51 to 70) were dropped.
    for (let n = 51; n <= 70; n++) expect(listedWords()).not.toContain(label(`N4-${n}`));
  });

  test('the button sits under Add Back Cards and Clear List, full width, when the list has cards, and under the "No cards" message when it is empty', async () => {
    const user = await renderApp(DECKS);
    await shuffleOutOne(user);
    await clearList(user);

    const message = screen.getByText('No cards have been shuffled out yet.');
    const recover = screen.getByRole('button', { name: 'Recover cleared list (1)' });
    expect(message.compareDocumentPosition(recover) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Clear List' })).not.toBeInTheDocument();

    await shuffleOutOne(user);
    await reopenView(user);
    expect(screen.queryByText('No cards have been shuffled out yet.')).not.toBeInTheDocument();
    const clear = screen.getByRole('button', { name: 'Clear List' });
    const under = screen.getByRole('button', { name: 'Recover cleared list (1)' });
    // ADJ2: Add Back Cards and Clear List share a row pinned at the bottom of the panel, and
    // Recover comes right after that row, last in the panel, with its full label.
    const row = clear.parentElement!;
    expect(row).toContainElement(screen.getByRole('button', { name: 'Add Back Cards' }));
    expect(row).not.toContainElement(under);
    expect(row.nextElementSibling).toBe(under);
    expect(under.nextElementSibling).toBeNull();
    // jsdom has no layout or colours, so the classes are checked: full width, still sky blue and
    // filled. Check it in a browser too.
    expect(under).toHaveClass('w-full', 'bg-sky-600', 'text-white');
  });

  test('while the Clear List confirmation is open, the "Recover cleared list" button is hidden, and it comes back when I cancel', async () => {
    const user = await renderApp(DECKS);
    await shuffleOutOne(user);
    await clearList(user);
    await shuffleOutOne(user);
    await reopenView(user);
    expect(screen.getByRole('button', { name: 'Recover cleared list (1)' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Clear List' }));

    expect(screen.getByText('Clear 1 card? You can recover it later.')).toBeInTheDocument();
    expect(recoverButton()).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.getByRole('button', { name: 'Recover cleared list (1)' })).toBeInTheDocument();
  });

  test('when I clear the list and switch to another deck, the same cleared list can be recovered, each card still from its own deck', async () => {
    const user = await renderApp(DECKS);
    const first = await shuffleOutOne(user);
    const second = await shuffleOutOne(user);
    await clearList(user);

    await chooseDeck(user, 'JLPT N4');
    expect(currentCardLevel()).toBe('JLPT N4');

    await reopenView(user);
    await user.click(screen.getByRole('button', { name: 'Recover cleared list (2)' }));
    expect(listedWords()).toEqual([second, first]);
    for (const word of [first, second]) {
      expect(within(cardOf(addBackCheckbox(word))).getByText('From JLPT N5')).toBeInTheDocument();
    }
  });

  test('when a cleared card is back in my deck and I recover the list, that card is not shown in the shuffled-out list', async () => {
    const user = await renderApp(DECKS);
    await shuffleOutOne(user);
    await enterCardLimit(user, '7'); // three more cards drop out
    await openView(user);
    const cleared = listedWords();
    expect(cleared).toHaveLength(4);
    await clearList(user);

    // Raising the limit tops the deck up with the first cards not in it, which are cleared ones.
    await enterCardLimit(user, '10');
    const inDeck = words(await deckContents(user));
    const back = cleared.filter((w) => inDeck.includes(w));
    expect(back.length).toBeGreaterThan(0);
    expect(back.length).toBeLessThan(4);

    await reopenView(user);
    await user.click(screen.getByRole('button', { name: 'Recover cleared list (4)' }));

    const listed = listedWords();
    expect(listed).toEqual(cleared.filter((w) => !back.includes(w)));
    for (const word of back) expect(listed).not.toContain(word);
  });

  test('when every cleared card is back in my deck and I recover the list, the list stays empty and the button goes away', async () => {
    const user = await renderApp(DECKS);
    await enterCardLimit(user, '7'); // three cards drop out
    await clearList(user);
    await enterCardLimit(user, '10'); // and all three come back

    await user.click(screen.getByRole('button', { name: 'Recover cleared list (3)' }));

    expect(shuffledOutButton()).toHaveTextContent('Shuffled out (0)');
    expect(screen.getByText('No cards have been shuffled out yet.')).toBeInTheDocument();
    expect(recoverButton()).not.toBeInTheDocument();
  });

  test('when nothing has been cleared, no "Recover cleared list" button is shown', async () => {
    const user = await renderApp(DECKS);
    await openView(user);
    expect(screen.getByText('No cards have been shuffled out yet.')).toBeInTheDocument();
    expect(recoverButton()).not.toBeInTheDocument();

    await shuffleOutOne(user);
    await reopenView(user);
    expect(listedWords()).toHaveLength(1);
    expect(recoverButton()).not.toBeInTheDocument();
  });

  test('when the saved cleared list is broken, the app still loads, the broken cards are dropped, and the rest of the deck works', async () => {
    localStorage.setItem(
      'kanji.clearedCards',
      JSON.stringify([
        { id: 'N4-3', deck: 'N4', reason: 'shuffled-out', removedAt: 5 },
        { id: 'no-such-word', deck: 'N4', reason: 'shuffled-out', removedAt: 4 },
        { id: 'N4-4', deck: 'N9', reason: 'shuffled-out', removedAt: 4 },
        { id: 'N4-5', deck: 'N4', reason: 'lost', removedAt: 4 },
        { id: 'N4-6', deck: 'N4', reason: 'shuffled-out', removedAt: 'yesterday' },
        'garbage',
        null,
        { id: 'N4-3', deck: 'N4', reason: 'shuffled-out', removedAt: 3 },
        { id: 'N4-7', deck: 'N4', reason: 'card-limit', removedAt: 2 },
      ]),
    );
    const user = await renderApp(DECKS);
    await openView(user);

    await user.click(screen.getByRole('button', { name: 'Recover cleared list (2)' }));
    expect(listedWords()).toEqual(['N4単語3【たんご3】', 'N4単語7【たんご7】']);
    // The rest of the deck works.
    await pickToAddBack(user, 'N4単語7【たんご7】');
    await pickToTakeOut(user, 2);
    await user.click(addBackButton());
    expect(currentWord()).toBe('N4単語7【たんご7】');
    await user.click(screen.getByRole('button', { name: 'Next →' }));
    expect(counter()).toEqual({ position: 3, total: 10 });
  });

  test('when the saved cleared list is corrupt, the app still loads and no "Recover cleared list" button is shown', async () => {
    localStorage.setItem('kanji.clearedCards', '{not json');
    const user = await renderApp(DECKS);
    await openView(user);

    expect(screen.getByText('No cards have been shuffled out yet.')).toBeInTheDocument();
    expect(recoverButton()).not.toBeInTheDocument();
    await shuffleOutOne(user);
    expect(shuffledOutButton()).toHaveTextContent('Shuffled out (1)');
  });

  test('when browser storage is blocked, Clear List and recovering still work until the page is reloaded', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('Access denied', 'SecurityError');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Access denied', 'SecurityError');
    });

    const user = await renderApp(DECKS);
    const first = await shuffleOutOne(user);
    const second = await shuffleOutOne(user);
    await clearList(user);
    expect(shuffledOutButton()).toHaveTextContent('Shuffled out (0)');

    await user.click(screen.getByRole('button', { name: 'Recover cleared list (2)' }));
    expect(listedWords()).toEqual([second, first]);

    // Nothing was saved, so after a reload there is nothing to recover.
    await clearList(user);
    const reloaded = await reload();
    await openView(reloaded);
    expect(recoverButton()).not.toBeInTheDocument();
  });
});
