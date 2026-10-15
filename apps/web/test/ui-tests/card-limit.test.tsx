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

  test('the total number of available words is not shown anywhere', async () => {
    // Words with no numbers in them, so the only way 2345 could appear is as the total.
    const words = makeWords(2345).map((w) => ({
      ...w,
      word: '単語',
      reading: 'たんご',
      segments: [{ text: '単語', reading: 'たんご', kind: 'onyomi' as const }],
      meaning: 'a word',
    }));

    await renderApp(words);

    expect(document.body.textContent).not.toMatch(/2,?345/);
    // Checked across the whole page so it still fails if the number and "words" are in separate elements.
    expect(document.body.textContent).not.toMatch(/of\s*[\d,]+\s*words/i);
  });

  test('typing 150 and pressing Enter goes straight to 150 cards, never 1 or 15', async () => {
    const user = await renderApp();
    await user.clear(cardLimitInput());

    for (const key of ['1', '5', '0']) {
      await user.keyboard(key);
      expect(counter().total).toBe(10);
    }
    expect(cardLimitInput()).toHaveValue(150);

    await user.keyboard('{Enter}');

    expect(counter().total).toBe(150);
    expect(localStorage.getItem('kanji.deckSize')).toBe('150');
  });

  test('a typed card limit is applied when I leave the field', async () => {
    const user = await renderApp();
    await user.clear(cardLimitInput());
    await user.keyboard('7');
    expect(counter().total).toBe(10);

    await user.tab();

    expect(counter().total).toBe(7);
    expect(cardLimitInput()).toHaveValue(7);
  });

  test('pressing Enter and then leaving the field applies the typed limit once', async () => {
    const user = await renderApp();
    await wordsSeenWithNext(user, 2); // now on card 3 of 10
    const before = currentWord();

    await enterCardLimit(user, '7');
    await user.tab();

    expect(counter()).toEqual({ position: 3, total: 7 });
    expect(currentWord()).toBe(before);
    expect(cardLimitInput()).toHaveValue(7);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  test('a typed limit that has not been applied yet is applied before + or − steps from it', async () => {
    const user = await renderApp();
    await user.clear(cardLimitInput());
    await user.keyboard('20');

    await user.click(screen.getByRole('button', { name: 'Increase card limit' }));
    expect(counter().total).toBe(21);
    expect(cardLimitInput()).toHaveValue(21);

    await user.clear(cardLimitInput());
    await user.keyboard('5');

    await user.click(screen.getByRole('button', { name: 'Decrease card limit' }));
    expect(counter().total).toBe(4);
    expect(cardLimitInput()).toHaveValue(4);
  });

  test('the + and − buttons change the deck size by one straight away', async () => {
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

    test('typing 0 and leaving the field shows a validation message and puts back the previous card limit', async () => {
      const user = await renderApp();
      await enterCardLimit(user, '25');

      await user.clear(cardLimitInput());
      await user.keyboard('0');
      await user.tab();

      expect(screen.getByRole('alert')).toHaveTextContent("Card limit can't be 0 — enter at least 1.");
      expect(cardLimitInput()).toHaveValue(25);
      expect(counter().total).toBe(25);
    });

    test('after typing 0 and leaving the field, the field shows the previous limit and is not marked invalid', async () => {
      const user = await renderApp();
      await enterCardLimit(user, '25');

      await user.clear(cardLimitInput());
      await user.keyboard('0');
      await user.tab();

      expect(cardLimitInput()).toHaveValue(25);
      expect(cardLimitInput()).not.toHaveAttribute('aria-invalid');
      expect(cardLimitInput()).not.toHaveAttribute('aria-describedby');
      // The message itself stays up so the user knows why their value was replaced.
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    test('pressing Enter on an invalid limit shows the message and keeps what I typed so I can fix it', async () => {
      const user = await renderApp();

      await enterCardLimit(user, '151');

      expect(screen.getByRole('alert')).toHaveTextContent("Card limit can't be more than 150.");
      expect(cardLimitInput()).toHaveValue(151);
      expect(cardLimitInput()).toHaveAttribute('aria-invalid', 'true');
      expect(counter().total).toBe(10);

      // Once I start correcting it, the field no longer holds the rejected value.
      await user.keyboard('{Backspace}');
      expect(cardLimitInput()).toHaveValue(15);
      expect(cardLimitInput()).not.toHaveAttribute('aria-invalid');
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
