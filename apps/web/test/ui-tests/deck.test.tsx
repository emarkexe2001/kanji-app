import { screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { counter, currentWord, enterCardLimit, renderApp, wordsSeenWithNext } from './helpers';

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

  test('with a card limit set, shuffling shows a different card from the same deck and the deck size stays the same', async () => {
    const user = await renderApp();
    await enterCardLimit(user, '5');
    const deckWords = new Set(await wordsSeenWithNext(user, 4));
    expect(deckWords.size).toBe(5);

    for (let i = 0; i < 20; i++) {
      const before = currentWord();
      await user.click(screen.getByRole('button', { name: /shuffle/i }));

      // The old card is replaced by a different one...
      expect(currentWord()).not.toBe(before);
      // ...that comes from the same 5-card deck, and the deck is still 5 cards.
      expect(deckWords).toContain(currentWord());
      expect(counter().total).toBe(5);
    }
  });
});
