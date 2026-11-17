// ARCH2: the dictionary downloads a file at a time. The first card waits only for the studied
// deck's file and the files of decks named in the saved data; Shuffle In Cards and the Deck
// dropdown wait for a deck that hasn't arrived, with a loading state, and handle a failure.
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, test, vi } from 'vitest';
import App from '../../src/app/app';
import {
  COUNTER,
  chooseDeck,
  counter,
  currentCardLevel,
  currentWord,
  deckContents,
  enterCardLimit,
  makeDecks,
  requestedFile,
  serveDeck,
  serveDeckSlowly,
  shuffleIn,
} from './helpers';

/** JLPT N5 (studied first), N4 and N3 words, and common words with no level. */
const WORDS = makeDecks({ N5: 30, N4: 30, N3: 30, common: 30 });
const LOADING_CARDS = 'Loading cards…';
const LOAD_ERROR =
  "Couldn't load the cards to shuffle in. Check your connection and press Shuffle In Cards to try again.";

const deckSelect = () => screen.getByLabelText<HTMLSelectElement>('Deck');
const deckMessage = () => document.getElementById('deck-message');
const shuffledOutButton = () => screen.getByRole('button', { name: /^Shuffled out \(\d+\)$/ });
const shuffledOutCount = () => Number(/\((\d+)\)/.exec(shuffledOutButton().textContent ?? '')?.[1]);
const submitButton = () => screen.getByRole('button', { name: /^(Shuffle In Cards|Loading cards…)$/ });
const requestedFiles = () => vi.mocked(fetch).mock.calls.map(([url]) => requestedFile(url));

/** Opens the app with `held` files waiting until the test sends them, and waits for the first card. */
async function openWithHeld(held: string[], words: unknown = WORDS) {
  const server = serveDeckSlowly(words, held);
  const user = userEvent.setup();
  render(<App />);
  await screen.findByText(COUNTER);
  return { user, server };
}

afterEach(() => vi.restoreAllMocks());

describe('the first card (ARCH2)', () => {
  test('studying N5 with nothing saved, the first card shows once decks.json and n5.json have arrived; the others load after', async () => {
    const { server } = await openWithHeld(['n4.json', 'n3.json', 'common-no-level.json']);

    expect(currentCardLevel()).toBe('JLPT N5');
    // Every deck is listed before its words have arrived.
    expect(Array.from(deckSelect().options).map((o) => o.text)).toEqual([
      'JLPT N5',
      'JLPT N4',
      'JLPT N3',
      'Common words',
    ]);
    // The other files were asked for in the background, after the first ones.
    expect(requestedFiles().slice(0, 2)).toEqual(['decks.json', 'n5.json']);
    expect(server.requests('n4.json')).toBe(1);
    expect(server.requests('common-no-level.json')).toBe(1);
  });

  test('"Loading dictionary…" shows until the studied deck’s file arrives', async () => {
    const server = serveDeckSlowly(WORDS, ['n5.json']);
    render(<App />);
    expect(await screen.findByText('Loading dictionary…')).toBeInTheDocument();
    await server.arrive('n5.json');
    expect(await screen.findByText(COUNTER)).toBeInTheDocument();
  });

  test('if the studied deck’s file fails, the start-up error shows', async () => {
    const server = serveDeckSlowly(WORDS, ['n5.json']);
    render(<App />);
    await screen.findByText('Loading dictionary…');
    await server.fail('n5.json');
    expect(await screen.findByText(/Couldn't load the word deck: Failed to fetch/)).toBeInTheDocument();
  });

  test('a background file that fails stays silent', async () => {
    const { server } = await openWithHeld(['n4.json']);
    await server.fail('n4.json');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(deckMessage()).toHaveTextContent('');
    expect(screen.getByText(COUNTER)).toBeInTheDocument();
  });

  test('cards from other decks in the saved deck, shuffled-out list and cleared list wait for their files and are kept (answer 5)', async () => {
    localStorage.setItem('kanji.deckSize', '3');
    localStorage.setItem(
      'kanji.savedDeck',
      JSON.stringify({
        deck: 'N5',
        cards: [
          { id: 'N5-1', deck: 'N5' },
          { id: 'N4-1', deck: 'N4' },
          { id: 'N5-2', deck: 'N5' },
        ],
        newIds: ['N4-1'],
      }),
    );
    localStorage.setItem(
      'kanji.removedCards',
      JSON.stringify([{ id: 'N3-1', deck: 'N3', reason: 'shuffled-out', removedAt: 1 }]),
    );
    // The no-level common words are named by no saved card, so the first card doesn't wait for them.
    const { user } = await openWithHeld(['common-no-level.json']);

    expect(requestedFiles().slice(0, 4)).toEqual(['decks.json', 'n5.json', 'n4.json', 'n3.json']);
    expect((await deckContents(user)).map((c) => c.level)).toEqual(['JLPT N5', 'JLPT N4', 'JLPT N5']);
    expect(shuffledOutButton()).toHaveAccessibleName('Shuffled out (1)');
  });

  test('a Common words card in the saved data makes the first card wait for every file (answer 11, known gap)', async () => {
    localStorage.setItem(
      'kanji.removedCards',
      JSON.stringify([{ id: '1', deck: 'common', reason: 'shuffled-out', removedAt: 1 }]),
    );
    const server = serveDeckSlowly(WORDS, ['common-no-level.json']);
    render(<App />);
    expect(await screen.findByText('Loading dictionary…')).toBeInTheDocument();
    expect(screen.queryByText(COUNTER)).not.toBeInTheDocument();
    await server.arrive('common-no-level.json');
    expect(await screen.findByText(COUNTER)).toBeInTheDocument();
    expect(shuffledOutButton()).toHaveAccessibleName('Shuffled out (1)');
  });

  test('a deck saved before ARCH2, with cards from N4 and Common words, its shuffled-out list and shuffle choice, all load after a reload', async () => {
    localStorage.setItem('kanji.deckSize', '3');
    localStorage.setItem('kanji.studiedDeck', 'N5');
    localStorage.setItem(
      'kanji.savedDeck',
      JSON.stringify({
        deck: 'N5',
        cards: [
          { id: 'N4-2', deck: 'N4' },
          { id: '5', deck: 'common' },
          { id: 'N5-3', deck: 'N5' },
        ],
        newIds: ['N4-2', '5'],
      }),
    );
    localStorage.setItem(
      'kanji.removedCards',
      JSON.stringify([{ id: 'N3-4', deck: 'N3', reason: 'shuffled-out', removedAt: 7 }]),
    );
    localStorage.setItem('kanji.shuffleSource', JSON.stringify({ kind: 'deck', deck: 'N3', decks: [] }));
    serveDeck(WORDS);
    const user = userEvent.setup();
    render(<App />);
    await screen.findByText(COUNTER);

    // The first card was shuffled in from N4 and still shows "New" (checked before moving on).
    expect(within(screen.getByRole('article')).getByText('New')).toBeInTheDocument();
    expect((await deckContents(user)).map((c) => c.word)).toEqual([
      'N4単語2【たんご2】',
      '単語5【たんご5】',
      'N5単語3【たんご3】',
    ]);
    expect(shuffledOutButton()).toHaveAccessibleName('Shuffled out (1)');
    expect(screen.getByLabelText<HTMLSelectElement>('Deck to shuffle in from').value).toBe('N3');
  });
});

describe('Shuffle In Cards from a deck that hasn’t loaded yet (ARCH2)', () => {
  test('it shows "Loading cards…" until the file arrives, then shuffles the new card in', async () => {
    const { user, server } = await openWithHeld(['n4.json']);
    const before = currentWord();
    await shuffleIn(user, '1');

    const button = submitButton();
    expect(button).toHaveTextContent(LOADING_CARDS);
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(button).not.toBeDisabled();
    expect(screen.getByText(LOADING_CARDS, { selector: '.sr-only' })).toBeInTheDocument();
    expect(currentWord()).toBe(before);

    // A second press does nothing.
    await user.click(button);
    expect(server.requests('n4.json')).toBe(1);

    await server.arrive('n4.json');
    expect(currentCardLevel()).toBe('JLPT N4');
    expect(shuffledOutCount()).toBe(1);
    expect(submitButton()).toHaveTextContent('Shuffle In Cards');
    expect(submitButton()).not.toHaveAttribute('aria-busy');
  });

  test('a bad count shows its message straight away, with no loading state', async () => {
    const { user, server } = await openWithHeld(['n4.json']);
    await shuffleIn(user, '0');
    expect(screen.getByRole('alert')).toHaveTextContent('Shuffle in at least 1 card.');
    expect(submitButton()).toHaveTextContent('Shuffle In Cards');
    expect(submitButton()).not.toHaveAttribute('aria-busy');
    // Only the background download asked for it; the bad count didn't start a wait.
    expect(server.requests('n4.json')).toBe(1);
  });

  test('if I press Next while it waits, the card on screen when the file arrives is the one replaced', async () => {
    const { user, server } = await openWithHeld(['n4.json']);
    await shuffleIn(user, '1');
    await user.click(screen.getByRole('button', { name: 'Next →' }));
    const onScreen = currentWord();
    expect(counter().position).toBe(2);

    await server.arrive('n4.json');
    expect(counter().position).toBe(2);
    expect(currentCardLevel()).toBe('JLPT N4');
    await user.click(shuffledOutButton());
    const listed = within(screen.getByRole('group', { name: 'Add back' }))
      .getAllByRole('checkbox')
      .map((c) => c.getAttribute('aria-label'));
    expect(listed).toEqual([onScreen]);
  });

  test('if the file fails, the error shows, my deck doesn’t change, and pressing again retries', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { user, server } = await openWithHeld(['n4.json']);
    const before = currentWord();
    await shuffleIn(user, '1');
    await server.fail('n4.json');

    expect(screen.getByRole('alert')).toHaveTextContent(LOAD_ERROR);
    expect(submitButton()).toHaveTextContent('Shuffle In Cards');
    expect(submitButton()).toHaveAccessibleDescription(LOAD_ERROR);
    expect(screen.getByLabelText('Cards to shuffle in')).not.toHaveAttribute('aria-invalid');
    expect(currentWord()).toBe(before);
    expect(shuffledOutCount()).toBe(0);
    expect(consoleError).toHaveBeenCalled();

    await user.click(submitButton());
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(submitButton()).toHaveTextContent(LOADING_CARDS);
    await server.arrive('n4.json');
    expect(currentCardLevel()).toBe('JLPT N4');
    expect(shuffledOutCount()).toBe(1);
  });

  test('the error clears when I change something in the box', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const { user, server } = await openWithHeld(['n4.json']);
    await shuffleIn(user, '1');
    await server.fail('n4.json');
    expect(screen.getByRole('alert')).toHaveTextContent(LOAD_ERROR);
    await user.type(screen.getByLabelText('Cards to shuffle in'), '2');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  test('changing the count while it waits cancels it: nothing is shuffled in when the file arrives', async () => {
    const { user, server } = await openWithHeld(['n4.json']);
    const before = currentWord();
    await shuffleIn(user, '1');
    await user.type(screen.getByLabelText('Cards to shuffle in'), '2');
    expect(submitButton()).toHaveTextContent('Shuffle In Cards');

    await server.arrive('n4.json');
    expect(currentWord()).toBe(before);
    expect(shuffledOutCount()).toBe(0);
  });

  test('picking another deck to study while it waits cancels it (answer 12)', async () => {
    const { user, server } = await openWithHeld(['n4.json', 'n3.json']);
    await shuffleIn(user, '1');
    await chooseDeck(user, 'JLPT N3');
    expect(submitButton()).toHaveTextContent('Shuffle In Cards');

    await server.arrive('n4.json');
    await server.arrive('n3.json');
    const levels = (await deckContents(user)).map((c) => c.level);
    expect(levels.every((l) => l === 'JLPT N3')).toBe(true);
  });

  test('changing the card limit while it waits cancels it', async () => {
    const { user, server } = await openWithHeld(['n4.json']);
    await shuffleIn(user, '1');
    await enterCardLimit(user, '5');
    expect(submitButton()).toHaveTextContent('Shuffle In Cards');
    await server.arrive('n4.json');
    expect(currentCardLevel()).toBe('JLPT N5');
  });
});

describe('picking a deck to study before its file has loaded (ARCH2, answer 8)', () => {
  test('the current deck stays usable with "Loading JLPT N4…" under the Deck row, then the deck switches', async () => {
    const { user, server } = await openWithHeld(['n4.json']);
    await chooseDeck(user, 'JLPT N4');

    expect(deckSelect().value).toBe('N4');
    expect(deckMessage()).toHaveTextContent('Loading JLPT N4…');
    expect(currentCardLevel()).toBe('JLPT N5');
    await user.click(screen.getByRole('button', { name: 'Next →' }));
    expect(counter().position).toBe(2);

    await server.arrive('n4.json');
    expect(counter().position).toBe(1);
    expect(currentCardLevel()).toBe('JLPT N4');
    expect(deckMessage()).toHaveTextContent('');
  });

  test('if the file fails, the dropdown goes back and says so; picking it again retries', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { user, server } = await openWithHeld(['n4.json']);
    const before = currentWord();
    await chooseDeck(user, 'JLPT N4');
    await server.fail('n4.json');

    expect(deckSelect().value).toBe('N5');
    expect(deckMessage()).toHaveTextContent("Couldn't load JLPT N4. Pick it again to retry.");
    expect(deckMessage()?.querySelector('[aria-live="assertive"]')).toHaveTextContent(
      "Couldn't load JLPT N4. Pick it again to retry.",
    );
    expect(currentWord()).toBe(before);
    expect(consoleError).toHaveBeenCalled();

    await chooseDeck(user, 'JLPT N4');
    expect(deckMessage()).toHaveTextContent('Loading JLPT N4…');
    await server.arrive('n4.json');
    expect(currentCardLevel()).toBe('JLPT N4');
  });

  test('picking the deck already studied cancels a pick that is loading', async () => {
    const { user, server } = await openWithHeld(['n4.json']);
    await chooseDeck(user, 'JLPT N4');
    await chooseDeck(user, 'JLPT N5');
    expect(deckMessage()).toHaveTextContent('');
    await server.arrive('n4.json');
    expect(currentCardLevel()).toBe('JLPT N5');
  });

  test('changing the card limit during the pick doesn’t cancel it: the new deck opens at the new limit (answer 13)', async () => {
    const { user, server } = await openWithHeld(['n4.json']);
    await chooseDeck(user, 'JLPT N4');
    await enterCardLimit(user, '4');
    await server.arrive('n4.json');
    expect(currentCardLevel()).toBe('JLPT N4');
    expect(counter().total).toBe(4);
  });

  test('the line under the Deck row is always there, also when empty', async () => {
    await openWithHeld([]);
    expect(deckMessage()).toBeInTheDocument();
    expect(deckMessage()).toHaveTextContent('');
  });
});
