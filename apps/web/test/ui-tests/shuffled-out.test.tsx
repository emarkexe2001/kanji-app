// FEAT2: the Shuffled-out cards view, for adding shuffled-out cards back.
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';
import { PICK_COLORS } from '@kanji/core';
import App from '../../src/app/app';
import {
  COUNTER,
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
    expect(screen.getByText("Clear all 2 shuffled-out cards? This can't be undone.")).toBeInTheDocument();
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
    // Two cards per row on a phone, three on wider screens, scrolling inside a fixed-height box.
    expect(grid).toHaveClass('grid', 'grid-cols-2', 'sm:grid-cols-3', 'max-h-96', 'overflow-y-auto');
    // On wider screens the panel grows past the app's column so three cards fit; on a phone it
    // keeps the column's width (only sm: classes change its width or position).
    const panel = screen.getByRole('region', { name: 'Shuffled-out cards' });
    expect(panel).toHaveClass('sm:w-[min(36rem,calc(100vw-2rem))]', 'sm:left-1/2', 'sm:-translate-x-1/2');
    expect(panel.className).not.toMatch(/(^|\s)-?(w|left|right|translate-x|mx|-mx)-/);
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
    expect(takeOut).toHaveClass('grid', 'grid-cols-2', 'sm:grid-cols-3');
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
