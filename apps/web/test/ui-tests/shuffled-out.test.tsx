// FEAT2: the Shuffled-out cards view, for adding shuffled-out cards back.
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';
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

/** Ticks shuffled-out cards to add back, by word (e.g. "N5単語3【たんご3】"). */
async function pickToAddBack(user: User, ...words: (string | null)[]) {
  for (const word of words) await user.click(addBackGroup().getByRole('checkbox', { name: word! }));
}

/** Ticks deck cards to take out, by position (from 1). */
async function pickToTakeOut(user: User, ...positions: number[]) {
  for (const p of positions) {
    await user.click(takeOutGroup().getByRole('checkbox', { name: new RegExp(`^Card ${p}: `) }));
  }
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
    // Each card shows its word, reading, meaning and the deck it came from.
    const row = addBackGroup().getByRole('checkbox', { name: first! }).closest('li')!;
    expect(row).toHaveTextContent(/word number \d+/);
    expect(row).toHaveTextContent('From JLPT N5');
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

describe('Shuffled-out cards view failure paths', () => {
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
