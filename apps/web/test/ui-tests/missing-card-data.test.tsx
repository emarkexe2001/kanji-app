// FEAT2_6 failure path: a shuffled-out card whose data is missing completely.
import { screen, within } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import type { WordEntry } from '@kanji/core';
import { counter, currentWord, makeDecks, makeWords, renderApp } from './helpers';

/**
 * The ids whose data goes missing. The app checks the dictionary and saved cards as it loads them,
 * so a card with no data at all can't be set up through them. Instead the library is built as
 * normal and then these ids are left in it with no data, the same as the dictionary losing them.
 */
const missing = vi.hoisted(() => ({ ids: [] as string[] }));

vi.mock('../../src/features/deck/utils/decks', async (importOriginal) => {
  const real = await importOriginal<typeof import('../../src/features/deck/utils/decks')>();
  return {
    ...real,
    buildLibrary: (words: WordEntry[]) => {
      const library = real.buildLibrary(words);
      for (const id of missing.ids) library.byId.set(id, undefined as unknown as WordEntry);
      return library;
    },
  };
});

afterEach(() => {
  missing.ids = [];
  vi.restoreAllMocks();
});

describe('Shuffled-out card with missing data (failure path)', () => {
  test('when a card\'s data is missing completely, that card shows "This card can\'t be shown." and the other cards, Add Back and the deck still work', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    // Both JLPT N3 cards were shuffled out earlier (N3 isn't the deck being studied, so neither is
    // in the deck). N3 word 2's data is then missing completely.
    missing.ids = ['N3-2'];
    localStorage.setItem(
      'kanji.removedCards',
      JSON.stringify([
        { id: 'N3-2', deck: 'N3', reason: 'shuffled-out', removedAt: 2 },
        { id: 'N3-1', deck: 'N3', reason: 'shuffled-out', removedAt: 1 },
      ]),
    );
    const user = await renderApp([...makeDecks({ N5: 30, N4: 30 }), ...makeWords(2, 'N3')]);
    await user.click(screen.getByRole('button', { name: 'Shuffled out (2)' }));

    // The friendly message stands in for that card only; the rest of the view is still there.
    expect(
      screen.queryByText('Something went wrong showing the cards. Please reload the page to try again.'),
    ).toBeNull();
    const addBack = within(screen.getByRole('group', { name: 'Add back' }));
    const items = addBack.getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(within(items[0]).getByText('1')).toBeInTheDocument();
    expect(within(items[0]).getByText("This card can't be shown.")).toBeInTheDocument();
    expect(screen.getAllByText("This card can't be shown.")).toHaveLength(1);
    expect(consoleError).toHaveBeenCalledWith('Error while drawing a card:', expect.any(TypeError), expect.anything());
    expect(addBack.getAllByRole('checkbox').map((c) => c.getAttribute('aria-label'))).toEqual(['N3単語1【たんご1】']);
    expect(screen.getByRole('button', { name: 'Clear List' })).toBeInTheDocument();

    // Adding the other card back still works, and so does the deck.
    await user.click(addBack.getByRole('checkbox', { name: 'N3単語1【たんご1】' }).closest('label')!);
    const takeOut = within(screen.getByRole('group', { name: /^Take out of your deck/ }));
    await user.click(takeOut.getByRole('checkbox', { name: /^Card 2: / }).closest('label')!);
    await user.click(screen.getByRole('button', { name: 'Add Back Cards' }));

    expect(currentWord()).toBe('N3単語1【たんご1】');
    expect(counter()).toEqual({ position: 2, total: 10 });
    await user.click(screen.getByRole('button', { name: 'Next →' }));
    expect(counter()).toEqual({ position: 3, total: 10 });
    expect(screen.getByRole('button', { name: 'Shuffled out (2)' })).toBeInTheDocument();
  });

  test('when a deck card\'s data is missing completely, it shows "This card can\'t be shown." in "Take out of your deck", and the other cards, Add Back and the deck still work', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    // A saved deck of 5 JLPT N5 cards, where card 3's data is then missing completely, and one
    // JLPT N3 card shuffled out earlier.
    missing.ids = ['N5-3'];
    localStorage.setItem('kanji.deckSize', '5');
    localStorage.setItem(
      'kanji.savedDeck',
      JSON.stringify({ deck: 'N5', cards: [1, 2, 3, 4, 5].map((n) => ({ id: `N5-${n}`, deck: 'N5' })), newIds: [] }),
    );
    localStorage.setItem(
      'kanji.removedCards',
      JSON.stringify([{ id: 'N3-1', deck: 'N3', reason: 'shuffled-out', removedAt: 1 }]),
    );
    const user = await renderApp([...makeDecks({ N5: 30, N4: 30 }), ...makeWords(1, 'N3')]);
    expect(currentWord()).toBe('N5単語1【たんご1】');
    await user.click(screen.getByRole('button', { name: 'Shuffled out (1)' }));
    const addBack = within(screen.getByRole('group', { name: 'Add back' }));
    await user.click(addBack.getByRole('checkbox', { name: 'N3単語1【たんご1】' }).closest('label')!);

    // Only card 3 shows the friendly message; the other deck cards can still be picked.
    expect(
      screen.queryByText('Something went wrong showing the cards. Please reload the page to try again.'),
    ).toBeNull();
    const takeOut = within(screen.getByRole('group', { name: /^Take out of your deck/ }));
    const items = takeOut.getAllByRole('listitem');
    expect(items).toHaveLength(5);
    expect(within(items[2]).getByText('3')).toBeInTheDocument();
    expect(within(items[2]).getByText("This card can't be shown.")).toBeInTheDocument();
    expect(screen.getAllByText("This card can't be shown.")).toHaveLength(1);
    expect(consoleError).toHaveBeenCalledWith('Error while drawing a card:', expect.any(TypeError), expect.anything());
    expect(takeOut.getAllByRole('checkbox').map((c) => c.getAttribute('aria-label'))).toEqual([
      'Card 1: N5単語1【たんご1】',
      'Card 2: N5単語2【たんご2】',
      'Card 4: N5単語4【たんご4】',
      'Card 5: N5単語5【たんご5】',
    ]);

    // Swapping card 4 out for the shuffled-out card still works, and so does the deck.
    await user.click(takeOut.getByRole('checkbox', { name: /^Card 4: / }).closest('label')!);
    expect(takeOut.getByRole('checkbox', { name: /^Card 4: / })).toBeChecked();
    await user.click(screen.getByRole('button', { name: 'Add Back Cards' }));

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(currentWord()).toBe('N3単語1【たんご1】');
    expect(counter()).toEqual({ position: 4, total: 5 });
    await user.click(screen.getByRole('button', { name: 'Next →' }));
    expect(currentWord()).toBe('N5単語5【たんご5】');
    await user.click(screen.getByRole('button', { name: 'Shuffled out (1)' }));
    expect(
      within(screen.getByRole('group', { name: 'Add back' }))
        .getAllByRole('checkbox')
        .map((c) => c.getAttribute('aria-label')),
    ).toEqual(['N5単語4【たんご4】']);
  });
});
