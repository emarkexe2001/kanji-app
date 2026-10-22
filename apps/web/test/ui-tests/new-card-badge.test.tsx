// FEAT2_5: the "New" badge on shuffled-in cards, and the slide animations for cards shuffled in and out.
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { NEW_COLOR } from '@kanji/core';
import App from '../../src/app/app';
import {
  COUNTER,
  counter,
  currentCardLevel,
  currentWord,
  deckShuffleButton,
  enterCardLimit,
  makeDecks,
  renderApp,
  serveDeck,
  shuffleIn,
  type User,
} from './helpers';

/** The app studies JLPT N5 and shuffles in from JLPT N4 by default, so every N4 card was shuffled in. */
const DECKS = makeDecks({ N5: 30, N4: 30 });

afterEach(() => vi.unstubAllGlobals());

/** Whether the card on screen shows the "New" badge. */
const onScreenIsNew = () => within(screen.getByRole('article')).queryByText('New') !== null;

const nextButton = () => screen.getByRole('button', { name: 'Next →' });

/**
 * Every card in the deck, by pressing Next all the way round from the card on screen, with
 * whether it showed "New" when it came on screen. Moving on from a card means it has been seen,
 * so its badge goes as this walks past it. Ends back on the card it started on.
 */
async function walkDeck(user: User) {
  const cards: { word: string | null; level: string | null; isNew: boolean }[] = [];
  for (let i = counter().total; i > 0; i--) {
    cards.push({ word: currentWord(), level: currentCardLevel(), isNew: onScreenIsNew() });
    await user.click(nextButton());
  }
  return cards;
}

const newWords = (cards: { word: string | null; isNew: boolean }[]) => cards.filter((c) => c.isNew).map((c) => c.word);
const n4Words = (cards: { word: string | null; level: string | null }[]) =>
  cards.filter((c) => c.level === 'JLPT N4').map((c) => c.word);

/** Closes the app and opens it again with the same storage, like reloading the page. */
async function reload() {
  cleanup();
  serveDeck(DECKS);
  render(<App />);
  await screen.findByText(COUNTER);
  return userEvent.setup();
}

/** Turns the device's "reduce motion" setting on or off. */
function setReducedMotion(reduce: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches: reduce && query === '(prefers-reduced-motion: reduce)',
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
}

/** Every card drawn on screen, including one only there to be seen sliding away (hidden from screen readers). */
const drawnCards = () => screen.queryAllByRole('article', { hidden: true });

describe('the "New" badge on shuffled-in cards', () => {
  test('when I shuffle in cards, the cards that were shuffled in show a "New" badge', async () => {
    const user = await renderApp(DECKS);
    expect(onScreenIsNew()).toBe(false);

    await shuffleIn(user, '3');

    expect(onScreenIsNew()).toBe(true);
    const cards = await walkDeck(user);
    expect(n4Words(cards)).toHaveLength(3);
    expect(newWords(cards)).toEqual(n4Words(cards));
  });

  test.each([
    ['Next', () => nextButton()],
    ['Deck Shuffle', () => deckShuffleButton()],
  ])(
    'when a shuffled-in card is on screen it shows "New", and once I move on with %s it no longer does',
    async (_, button) => {
      const user = await renderApp(DECKS);
      await shuffleIn(user, '1');
      const shuffledIn = currentWord();
      expect(onScreenIsNew()).toBe(true);

      await user.click(button());

      expect(currentWord()).not.toBe(shuffledIn);
      const cards = await walkDeck(user);
      expect(n4Words(cards)).toEqual([shuffledIn]);
      expect(newWords(cards)).toEqual([]);
    },
  );

  test('when I shuffle in several cards, the ones I haven\'t seen yet still show "New" until I have seen each one and moved on', async () => {
    const user = await renderApp(DECKS);
    await shuffleIn(user, '3');
    const seen = currentWord();
    await user.click(nextButton());

    const firstWalk = await walkDeck(user);
    const unseen = n4Words(firstWalk).filter((w) => w !== seen);
    expect(unseen).toHaveLength(2);
    expect(newWords(firstWalk)).toEqual(unseen);

    // Each of them has now been seen and moved on from.
    expect(newWords(await walkDeck(user))).toEqual([]);
  });

  test('when I reload the app, shuffled-in cards I haven\'t seen yet still show "New", and ones I have seen don\'t', async () => {
    const user = await renderApp(DECKS);
    await shuffleIn(user, '3');
    const seen = currentWord();
    await user.click(nextButton());

    const reloaded = await reload();

    const cards = await walkDeck(reloaded);
    expect(n4Words(cards)).toContain(seen);
    const unseen = n4Words(cards).filter((w) => w !== seen);
    expect(unseen).toHaveLength(2);
    expect(newWords(cards)).toEqual(unseen);
  });

  test('a card added back from the Shuffled-out cards view is not "New"', async () => {
    const user = await renderApp(DECKS);
    const shuffledOut = currentWord();
    await shuffleIn(user, '1');
    await user.click(nextButton());
    await user.click(screen.getByRole('button', { name: /^Shuffled out/ }));
    await user.click(screen.getByRole('checkbox', { name: shuffledOut! }).closest('label')!);
    await user.click(screen.getByRole('checkbox', { name: /^Card 5: / }).closest('label')!);
    await user.click(screen.getByRole('button', { name: 'Add Back Cards' }));

    expect(currentWord()).toBe(shuffledOut);
    expect(onScreenIsNew()).toBe(false);
  });

  test('cards in "Take out of your deck" also show "New" while they are still new', async () => {
    const user = await renderApp(DECKS);
    const firstOut = currentWord();
    await shuffleIn(user, '3');
    const seen = currentWord();
    await user.click(nextButton()); // the shuffled-in card on screen has been seen; the other two haven't

    await user.click(screen.getByRole('button', { name: /^Shuffled out/ }));
    await user.click(screen.getByRole('checkbox', { name: firstOut! }).closest('label')!);
    const takeOut = within(screen.getByRole('group', { name: /^Take out of your deck/ }));
    const shownNew = takeOut
      .getAllByRole('checkbox')
      .filter((c) => within(c.closest('label')!).queryByText('New'))
      .map((c) => c.getAttribute('aria-label')!.replace(/^Card \d+: /, ''));

    expect(shownNew).toHaveLength(2);
    expect(shownNew).not.toContain(seen);
    for (const word of shownNew) expect(word).toMatch(/^N4/); // shuffled in from JLPT N4
  });
});

// FEAT2_6: the badge only goes when the screen moves to a different card, and the deck is only
// saved again when something changed.
describe('the "New" badge when moving between cards', () => {
  // Saving isn't visible on screen, so the "saved again" tests below spy on browser storage instead.
  /** How many times the deck has been saved since the spy was set up. */
  const deckSaves = (setItem: { mock: { calls: unknown[][] } }) =>
    setItem.mock.calls.filter(([key]) => key === 'kanji.savedDeck');

  test.each([
    ['Next', () => nextButton()],
    ['Deck Shuffle', () => deckShuffleButton()],
  ])('when my deck has one card and it is new, pressing %s keeps its "New" badge', async (_, button) => {
    const user = await renderApp(DECKS);
    await enterCardLimit(user, '1');
    await shuffleIn(user, '1');
    const card = currentWord();
    expect(onScreenIsNew()).toBe(true);

    await user.click(button());
    await user.click(button());

    expect(counter()).toEqual({ position: 1, total: 1 });
    expect(currentWord()).toBe(card);
    expect(onScreenIsNew()).toBe(true);
    // It is still new after a reload too.
    await reload();
    expect(currentWord()).toBe(card);
    expect(onScreenIsNew()).toBe(true);
  });

  test('the "NEW" ribbon keeps its amber colour, now from the shared NEW_COLOR token', async () => {
    const user = await renderApp(DECKS);
    await shuffleIn(user, '1');

    // jsdom can't show colours, so the ribbon's colour is checked: the shared token, which is the
    // same amber as before (Tailwind's amber-400, #fbbf24).
    expect(NEW_COLOR).toBe('#fbbf24');
    expect(within(screen.getByRole('article')).getByText('New')).toHaveStyle({ backgroundColor: NEW_COLOR });
  });

  test('when I press Next and no card stops being new, the deck is not saved again', async () => {
    // A saved deck of 5 cards where only the last one, JLPT N4 word 5, is new.
    localStorage.setItem('kanji.deckSize', '5');
    localStorage.setItem(
      'kanji.savedDeck',
      JSON.stringify({
        deck: 'N5',
        cards: [...[1, 2, 3, 4].map((n) => ({ id: `N5-${n}`, deck: 'N5' })), { id: 'N4-5', deck: 'N4' }],
        newIds: ['N4-5'],
      }),
    );
    const user = await renderApp(DECKS);
    const setItem = vi.spyOn(Storage.prototype, 'setItem');

    // Cards 1 to 4 aren't new, so moving on from them changes nothing that is saved.
    for (let i = 0; i < 4; i++) await user.click(nextButton());

    expect(counter().position).toBe(5);
    expect(onScreenIsNew()).toBe(true);
    expect(deckSaves(setItem)).toHaveLength(0);
    setItem.mockRestore();
  });

  test('when I press Deck Shuffle on a deck with no new cards, the deck is not saved again', async () => {
    const user = await renderApp(DECKS);
    const setItem = vi.spyOn(Storage.prototype, 'setItem');

    for (let i = 0; i < 3; i++) await user.click(deckShuffleButton());

    expect(deckSaves(setItem)).toHaveLength(0);
    setItem.mockRestore();
  });

  test('when my deck has one new card and I press Next or Deck Shuffle, the deck is not saved again', async () => {
    const user = await renderApp(DECKS);
    await enterCardLimit(user, '1');
    await shuffleIn(user, '1');
    const setItem = vi.spyOn(Storage.prototype, 'setItem');

    await user.click(nextButton());
    await user.click(deckShuffleButton());

    expect(deckSaves(setItem)).toHaveLength(0);
    setItem.mockRestore();
  });

  test('when I press Next and a card stops being new, the deck is saved once, without it in the "New" list', async () => {
    const user = await renderApp(DECKS);
    await shuffleIn(user, '1');
    const seenId = JSON.parse(localStorage.getItem('kanji.savedDeck')!).newIds[0];
    const setItem = vi.spyOn(Storage.prototype, 'setItem');

    await user.click(nextButton());

    expect(deckSaves(setItem)).toHaveLength(1);
    expect(JSON.parse(localStorage.getItem('kanji.savedDeck')!).newIds).not.toContain(seenId);
    setItem.mockRestore();
  });
});

describe('the "New" badge saved with the deck (failure paths)', () => {
  const saveDeck = (newIds: unknown) =>
    localStorage.setItem(
      'kanji.savedDeck',
      JSON.stringify({
        deck: 'N5',
        cards: [1, 2, 3, 4, 5].map((n) => ({ id: `N4-${n}`, deck: 'N4' })),
        newIds,
      }),
    );

  test('ids in the saved "New" list that aren\'t cards in the deck, or aren\'t ids at all, are ignored', async () => {
    localStorage.setItem('kanji.deckSize', '5');
    saveDeck(['N4-2', 'no-such-word', 'N5-1', 42, null, 'N4-2']);

    const user = await renderApp(DECKS);

    expect(newWords(await walkDeck(user))).toEqual(['N4単語2【たんご2】']);
  });

  test.each([['not a list'], [{ 'N4-1': true }], [undefined]])(
    'a saved "New" list that isn\'t a list (%j) is ignored, and the saved deck is still used',
    async (newIds) => {
      localStorage.setItem('kanji.deckSize', '5');
      saveDeck(newIds);

      const user = await renderApp(DECKS);

      const cards = await walkDeck(user);
      expect(n4Words(cards)).toHaveLength(5);
      expect(newWords(cards)).toEqual([]);
    },
  );
});

describe('slide animations', () => {
  test('when I shuffle in a card, it drops onto the deck and the card shuffled out slides away', async () => {
    setReducedMotion(false);
    const user = await renderApp(DECKS);
    const before = currentWord();

    await shuffleIn(user, '1');

    expect(screen.getByRole('article').parentElement).toHaveClass('drop-in');
    const [, leaving] = drawnCards();
    expect(leaving.parentElement).toHaveClass('slide-out');
    expect(within(leaving).getByRole('heading', { hidden: true, level: 2 })).toHaveTextContent(before!);
    // Moving on, the card that slid away is gone.
    await user.click(nextButton());
    expect(drawnCards()).toHaveLength(1);
  });

  test('when my device\'s "reduce motion" setting is on, cards are shuffled in and out without the slide animations', async () => {
    setReducedMotion(true);
    const user = await renderApp(DECKS);
    const before = currentWord();

    await shuffleIn(user, '1');

    // The card still changes and shows "New"; only the movement is skipped.
    expect(currentWord()).not.toBe(before);
    expect(onScreenIsNew()).toBe(true);
    expect(screen.getByRole('article').parentElement).not.toHaveClass('drop-in');
    expect(drawnCards()).toHaveLength(1); // nothing sliding away
    await user.click(nextButton());
    expect(screen.getByRole('article').parentElement).not.toHaveClass('deal-next');
  });
});
