import { screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import {
  cardLimitInput,
  counter,
  currentWord,
  enterCardLimit,
  makeWords,
  renderApp,
  wordsSeenWithNext,
} from './helpers';

describe('card limit', () => {
  test('starts with a deck of 10 cards', async () => {
    await renderApp();

    expect(counter()).toEqual({ position: 1, total: 10 });
    expect(cardLimitInput()).toHaveValue(10);
  });

  test('when I set a card limit, the deck size shown matches that limit', async () => {
    const user = await renderApp();

    await enterCardLimit(user, '5');

    expect(counter().total).toBe(5);
    // Exactly 5 different cards: the 6th press of Next comes back round to the first one.
    const seen = await wordsSeenWithNext(user, 5);
    expect(new Set(seen.slice(0, 5)).size).toBe(5);
    expect(seen[5]).toBe(seen[0]);
  });

  test('the + and − buttons change the deck size by one', async () => {
    const user = await renderApp();

    await user.click(screen.getByRole('button', { name: 'Increase card limit' }));
    expect(counter().total).toBe(11);
    expect(cardLimitInput()).toHaveValue(11);

    await user.click(screen.getByRole('button', { name: 'Decrease card limit' }));
    await user.click(screen.getByRole('button', { name: 'Decrease card limit' }));
    expect(counter().total).toBe(9);
    expect(cardLimitInput()).toHaveValue(9);
  });

  test('shrinking the deck below the current card moves to the last card that is left', async () => {
    const user = await renderApp();
    await wordsSeenWithNext(user, 7); // now on card 8 of 10

    await enterCardLimit(user, '3');

    expect(counter()).toEqual({ position: 3, total: 3 });
  });

  test('the card limit is saved in browser storage', async () => {
    const user = await renderApp();
    await enterCardLimit(user, '7');

    expect(localStorage.getItem('kanji.deckSize')).toBe('7');
  });

  test('a saved card limit is used when the app opens', async () => {
    localStorage.setItem('kanji.deckSize', '4');

    await renderApp();

    expect(counter().total).toBe(4);
  });

  test('the deck can never be bigger than the number of words available', async () => {
    const user = await renderApp(makeWords(6));

    await enterCardLimit(user, '50');

    expect(counter().total).toBe(6);
  });

  describe('validation (failure paths)', () => {
    test('a card limit of 0 shows a validation message and the deck does not change', async () => {
      const user = await renderApp();
      const before = { counter: counter(), word: currentWord() };

      await enterCardLimit(user, '0');

      expect(screen.getByRole('alert')).toHaveTextContent("Card limit can't be 0 — enter at least 1.");
      expect(cardLimitInput()).toHaveAttribute('aria-invalid', 'true');
      expect(counter()).toEqual(before.counter);
      expect(currentWord()).toBe(before.word);
    });

    test('a card limit higher than 150 shows a validation message and the deck does not change', async () => {
      const user = await renderApp();
      const before = { counter: counter(), word: currentWord() };

      await enterCardLimit(user, '151');

      expect(screen.getByRole('alert')).toHaveTextContent("Card limit can't be more than 150.");
      expect(counter()).toEqual(before.counter);
      expect(currentWord()).toBe(before.word);
    });

    test('an empty card limit shows a validation message and the deck does not change', async () => {
      const user = await renderApp();

      await enterCardLimit(user, '');

      expect(screen.getByRole('alert')).toHaveTextContent('Enter a card limit.');
      expect(counter().total).toBe(10);
    });

    test('a decimal card limit shows a validation message and the deck does not change', async () => {
      const user = await renderApp();

      await enterCardLimit(user, '5.5');

      expect(screen.getByRole('alert')).toHaveTextContent('Card limit must be a whole number.');
      expect(counter().total).toBe(10);
    });

    test('the validation message goes away once a valid limit is entered', async () => {
      const user = await renderApp();
      await enterCardLimit(user, '0');
      expect(screen.getByRole('alert')).toBeInTheDocument();

      await enterCardLimit(user, '8');

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(cardLimitInput()).not.toHaveAttribute('aria-invalid');
      expect(counter().total).toBe(8);
    });

    test('− is disabled at the minimum of 1 and + is disabled at the maximum of 150', async () => {
      const user = await renderApp();

      await enterCardLimit(user, '1');
      expect(screen.getByRole('button', { name: 'Decrease card limit' })).toBeDisabled();
      expect(counter().total).toBe(1);

      await enterCardLimit(user, '150');
      expect(screen.getByRole('button', { name: 'Increase card limit' })).toBeDisabled();
      expect(counter().total).toBe(150);
    });
  });
});
