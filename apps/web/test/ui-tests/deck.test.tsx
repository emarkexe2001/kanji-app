import { screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import {
  counter,
  currentWord,
  deckContents,
  deckShuffleButton,
  enterCardLimit,
  renderApp,
  wordsSeenWithNext,
} from './helpers';

describe('deck', () => {
  test('pressing Next shows a new card', async () => {
    const user = await renderApp();
    const first = currentWord();

    await user.click(screen.getByRole('button', { name: /next/i }));

    expect(currentWord()).not.toBe(first);
    expect(counter()).toEqual({ position: 2, total: 10 });
  });

  test('the right arrow key also shows the next card', async () => {
    const user = await renderApp();
    const first = currentWord();

    await user.keyboard('{ArrowRight}');

    expect(currentWord()).not.toBe(first);
    expect(counter().position).toBe(2);
  });

  test('pressing Next on the last card goes back to the first card', async () => {
    const user = await renderApp();
    await enterCardLimit(user, '3');

    const seen = await wordsSeenWithNext(user, 3);

    expect(seen[3]).toBe(seen[0]);
    expect(counter()).toEqual({ position: 1, total: 3 });
  });

  test('when I press Deck Shuffle, a different card from my deck is shown and no card enters or leaves the deck', async () => {
    const user = await renderApp();
    await enterCardLimit(user, '5');
    const deckWords = new Set(await wordsSeenWithNext(user, 4));
    expect(deckWords.size).toBe(5);

    for (let i = 0; i < 20; i++) {
      const before = currentWord();
      await user.click(deckShuffleButton());

      // The old card is replaced by a different one...
      expect(currentWord()).not.toBe(before);
      // ...that comes from the same 5-card deck, and the deck is still 5 cards.
      expect(deckWords).toContain(currentWord());
      expect(counter().total).toBe(5);
    }
    // Walking the whole deck still finds exactly the same 5 cards.
    expect(new Set((await deckContents(user)).map((c) => c.word))).toEqual(deckWords);
  });

  test('the S key does a Deck Shuffle', async () => {
    const user = await renderApp();
    await enterCardLimit(user, '5');
    await user.click(document.body);
    const before = currentWord();

    await user.keyboard('s');

    expect(currentWord()).not.toBe(before);
    expect(counter().total).toBe(5);
  });

  test('the card area shows the position of the card on screen out of the deck size, e.g. "Card 5 of 20"', async () => {
    const user = await renderApp();
    await enterCardLimit(user, '20');
    await wordsSeenWithNext(user, 4);

    expect(screen.getByText('Card 5 of 20')).toBeInTheDocument();
  });
});
