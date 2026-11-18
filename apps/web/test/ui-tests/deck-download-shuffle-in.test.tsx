// ARCH2: Shuffle In Cards when a source deck's file hasn't arrived yet. Which files it waits for
// (One deck, Random, Multiple decks), the deck staying usable while it waits and the shuffle-in
// using the deck as it is when the file arrives (answer 9), a failed download (answer 7), and
// what cancels the wait (answers 10 and 12). The basic loading state is in deck-download.test.tsx.
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { WordEntry } from '@kanji/core';
import { afterEach, describe, expect, test, vi } from 'vitest';
import App from '../../src/app/app';
import {
  COUNTER,
  chooseDeck,
  chooseMode,
  chooseSource,
  counter,
  currentCardLevel,
  currentWord,
  deckCheckbox,
  deckContents,
  deckShuffleButton,
  enterCardLimit,
  makeDecks,
  oneDeckSelect,
  serveDeckSlowly,
  shuffleIn,
  tickDecks,
  type User,
} from './helpers';

/** JLPT N5 (studied first), N4 and N3 words, and common words with no level. */
const WORDS = makeDecks({ N5: 30, N4: 30, N3: 30, common: 30 });
const LOADING_CARDS = 'Loading cards…';
const LOAD_ERROR =
  "Couldn't load the cards to shuffle in. Check your connection and press Shuffle In Cards to try again.";

/** `words` with the N3 words also marked common, so the Common words deck needs n3.json too. */
const withCommonN3 = (words: WordEntry[]) => words.map((w) => (w.jlpt === 'N3' ? { ...w, common: true } : w));

const shuffledOutButton = () => screen.getByRole('button', { name: /^Shuffled out \(\d+\)$/ });
const shuffledOutCount = () => Number(/\((\d+)\)/.exec(shuffledOutButton().textContent ?? '')?.[1]);
const submitButton = () => screen.getByRole('button', { name: /^(Shuffle In Cards|Loading cards…)$/ });
const isLoading = () => submitButton().getAttribute('aria-busy') === 'true';
const countField = () => screen.getByLabelText('Cards to shuffle in');
const summary = () => screen.queryByText(/^Shuffled out cards? /);
const newBadge = () => within(screen.getByRole('article')).queryByText('New');
/** The words in the Shuffled-out list, newest first (opens the panel, then closes it again). */
async function listedWords(user: User) {
  await user.click(shuffledOutButton());
  const words = within(screen.getByRole('group', { name: 'Add back' }))
    .getAllByRole('checkbox')
    .map((c) => c.getAttribute('aria-label'));
  await user.click(shuffledOutButton());
  return words;
}

async function openWithHeld(held: string[], words: unknown = WORDS) {
  const server = serveDeckSlowly(words, held);
  const user = userEvent.setup();
  render(<App />);
  await screen.findByText(COUNTER);
  return { user, server };
}

afterEach(() => vi.restoreAllMocks());

describe('the files a Shuffle In Cards waits for (ARCH2)', () => {
  test('Random waits for the file of every other deck', async () => {
    const { user, server } = await openWithHeld(['n4.json', 'n3.json', 'common-no-level.json']);
    const before = currentWord();
    await chooseSource(user, 'Random');
    await shuffleIn(user, '1');

    await server.arrive('n4.json');
    expect(isLoading()).toBe(true);
    await server.arrive('n3.json');
    expect(isLoading()).toBe(true);
    expect(currentWord()).toBe(before);
    await server.arrive('common-no-level.json');

    expect(isLoading()).toBe(false);
    expect(currentWord()).not.toBe(before);
    expect(shuffledOutCount()).toBe(1);
  });

  test('Multiple decks waits only for the ticked decks’ files', async () => {
    const { user, server } = await openWithHeld(['n4.json', 'n3.json', 'common-no-level.json']);
    await tickDecks(user, 'JLPT N4', 'JLPT N3');
    await shuffleIn(user, '1');

    await server.arrive('n4.json');
    expect(isLoading()).toBe(true);
    await server.arrive('n3.json');
    // The no-level common words are still downloading, but no ticked deck needs them.
    expect(isLoading()).toBe(false);
    expect(['JLPT N4', 'JLPT N3']).toContain(currentCardLevel());
    expect(shuffledOutCount()).toBe(1);
  });

  test('Multiple decks with Common words ticked waits for every file with common words (answer 4)', async () => {
    const { user, server } = await openWithHeld(['n3.json', 'common-no-level.json'], withCommonN3(WORDS));
    await tickDecks(user, 'JLPT N4', 'Common words');
    await shuffleIn(user, '1');

    await server.arrive('common-no-level.json');
    // Common words is made from the common words in every file, and n3.json has some.
    expect(isLoading()).toBe(true);
    await server.arrive('n3.json');
    expect(isLoading()).toBe(false);
    expect(shuffledOutCount()).toBe(1);
  });

  test('from a deck that has already arrived, it shuffles in at once, with no loading state at all', async () => {
    const { user } = await openWithHeld([]);
    let sawLoading = false;
    const watcher = new MutationObserver(() => {
      if (document.body.textContent?.includes(LOADING_CARDS)) sawLoading = true;
    });
    watcher.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true });
    const before = currentWord();

    await shuffleIn(user, '1');
    watcher.disconnect();

    expect(sawLoading).toBe(false);
    expect(currentWord()).not.toBe(before);
    expect(currentCardLevel()).toBe('JLPT N4');
  });
});

describe('while Shuffle In Cards waits, the deck stays usable, and the cards go into the deck as it is then (answer 9)', () => {
  test('after Next, Next and Back, the card on screen when the file arrives is replaced, shown as New, listed and summed up', async () => {
    const { user, server } = await openWithHeld(['n4.json']);
    const next = () => user.click(screen.getByRole('button', { name: 'Next →' }));
    await next();
    await shuffleIn(user, '1');
    await next();
    await user.click(screen.getByRole('button', { name: 'Back' }));
    expect(counter().position).toBe(2);
    const onScreen = currentWord();
    expect(summary()).not.toBeInTheDocument();

    await server.arrive('n4.json');

    expect(counter().position).toBe(2);
    expect(currentCardLevel()).toBe('JLPT N4');
    expect(newBadge()).toBeInTheDocument();
    expect(summary()).toHaveTextContent('Shuffled out card 2 of 10');
    expect(await listedWords(user)).toEqual([onScreen]);
  });

  test('the ← → and S keys and Deck Shuffle work while it waits; the card on screen at arrival is replaced', async () => {
    const { user, server } = await openWithHeld(['n4.json']);
    await shuffleIn(user, '1');
    await user.keyboard('{ArrowRight}{ArrowRight}{ArrowRight}{ArrowLeft}');
    expect(counter().position).toBe(3);
    await user.keyboard('s');
    expect(counter().position).not.toBe(3);
    await user.click(deckShuffleButton());
    const position = counter().position;
    const onScreen = currentWord();

    await server.arrive('n4.json');

    expect(counter().position).toBe(position);
    expect(currentCardLevel()).toBe('JLPT N4');
    expect(await listedWords(user)).toEqual([onScreen]);
  });

  test('Add Back and the Shuffled-out panel work while it waits; the card added back is the one replaced at arrival', async () => {
    const { user, server } = await openWithHeld(['n4.json']);
    // Shuffle a card out first, from N3, which has arrived.
    await chooseSource(user, 'JLPT N3');
    const shuffledOut = currentWord();
    await shuffleIn(user, '1');
    await user.click(screen.getByRole('button', { name: 'Next →' }));

    await user.selectOptions(oneDeckSelect(), 'JLPT N4');
    await shuffleIn(user, '1');
    expect(isLoading()).toBe(true);

    // Add the shuffled-out card back in place of card 5, from the panel.
    await user.click(shuffledOutButton());
    const addBack = within(screen.getByRole('group', { name: 'Add back' }));
    await user.click(addBack.getByRole('checkbox', { name: shuffledOut! }).closest('label')!);
    const takeOut = within(screen.getByRole('group', { name: /^Take out of your deck/ }));
    await user.click(takeOut.getByRole('checkbox', { name: /^Card 5: / }).closest('label')!);
    await user.click(screen.getByRole('button', { name: 'Add Back Cards' }));
    await user.keyboard('{Escape}');
    expect(currentWord()).toBe(shuffledOut);
    expect(isLoading()).toBe(true);

    await server.arrive('n4.json');

    expect(currentCardLevel()).toBe('JLPT N4');
    expect((await listedWords(user))[0]).toBe(shuffledOut);
  });

  test('if the shuffle-in itself fails once the file has arrived, its message shows and the deck doesn’t change', async () => {
    // JLPT N4 has a single word, so 2 cards can't be shuffled in from it; that is only known once it arrives.
    const { user, server } = await openWithHeld(['n4.json'], makeDecks({ N5: 30, N4: 1 }));
    const before = currentWord();
    await shuffleIn(user, '2');
    expect(isLoading()).toBe(true);

    await server.arrive('n4.json');

    expect(screen.getByRole('alert')).toHaveTextContent('There is only 1 new card left in JLPT N4 to shuffle in.');
    expect(currentWord()).toBe(before);
    expect(shuffledOutCount()).toBe(0);
  });
});

describe('when a source deck’s file fails to load (answer 7)', () => {
  test('my deck doesn’t change: nothing is saved, no New badge, no summary, and the detail goes only to the console', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { user, server } = await openWithHeld(['n4.json']);
    const saved = () => ({
      deck: localStorage.getItem('kanji.savedDeck'),
      removed: localStorage.getItem('kanji.removedCards'),
    });
    const savedBefore = saved();
    const before = currentWord();
    await shuffleIn(user, '1');
    await server.fail('n4.json');

    expect(screen.getByRole('alert')).toHaveTextContent(LOAD_ERROR);
    expect(currentWord()).toBe(before);
    expect(saved()).toEqual(savedBefore);
    expect(newBadge()).not.toBeInTheDocument();
    expect(summary()).not.toBeInTheDocument();
    expect(shuffledOutCount()).toBe(0);
    expect(consoleError).toHaveBeenCalledWith("Couldn't load the cards to shuffle in:", expect.any(TypeError));
    expect(document.body).not.toHaveTextContent('Failed to fetch');
  });

  test('a server error (HTTP 500) shows the same message, never the HTTP detail', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const server = serveDeckSlowly(WORDS, ['n4.json']);
    const user = userEvent.setup();
    render(<App />);
    await screen.findByText(COUNTER);
    // From now on n4.json answers 500.
    const served = vi.mocked(fetch).getMockImplementation()!;
    vi.mocked(fetch).mockImplementation(async (url) =>
      String(url).endsWith('/n4.json') ? ({ ok: false, status: 500, json: async () => null } as Response) : served(url),
    );
    await server.fail('n4.json');
    await shuffleIn(user, '1');

    expect(await screen.findByRole('alert')).toHaveTextContent(LOAD_ERROR);
    expect(document.body).not.toHaveTextContent('500');
    expect(consoleError).toHaveBeenCalledWith(
      "Couldn't load the cards to shuffle in:",
      expect.objectContaining({ message: 'HTTP 500 for n4.json' }),
    );
  });

  test('a file that failed in the background, silently, is downloaded again when Shuffle In Cards needs it (answer 10)', async () => {
    const { user, server } = await openWithHeld(['n4.json']);
    await server.fail('n4.json');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(submitButton()).toHaveTextContent('Shuffle In Cards');
    expect(server.requests('n4.json')).toBe(1);

    await shuffleIn(user, '1');
    expect(submitButton()).toHaveTextContent(LOADING_CARDS);
    expect(server.requests('n4.json')).toBe(2);
    await server.arrive('n4.json');
    expect(currentCardLevel()).toBe('JLPT N4');
    expect(shuffledOutCount()).toBe(1);
  });

  test.each([
    ['the mode switch', (user: User) => chooseMode(user, 'Random')],
    ['the One deck dropdown', (user: User) => user.selectOptions(oneDeckSelect(), 'JLPT N3')],
    ['picking another deck to study', (user: User) => chooseDeck(user, 'JLPT N3')],
    ['changing the card limit', (user: User) => enterCardLimit(user, '5')],
  ])('the error clears on %s', async (_, change) => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const { user, server } = await openWithHeld(['n4.json']);
    await shuffleIn(user, '1');
    await server.fail('n4.json');
    expect(screen.getByRole('alert')).toHaveTextContent(LOAD_ERROR);

    await change(user);
    expect(screen.queryByText(LOAD_ERROR)).not.toBeInTheDocument();
  });

  test('the error clears on a tick under Multiple decks', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const { user, server } = await openWithHeld(['n4.json']);
    await tickDecks(user, 'JLPT N4', 'JLPT N3');
    await shuffleIn(user, '1');
    await server.fail('n4.json');
    expect(screen.getByRole('alert')).toHaveTextContent(LOAD_ERROR);

    await user.click(deckCheckbox('Common words'));
    expect(screen.queryByText(LOAD_ERROR)).not.toBeInTheDocument();
  });

  test('the error clears on picking a deck to study that is still loading', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const { user, server } = await openWithHeld(['n4.json', 'n3.json']);
    await shuffleIn(user, '1');
    await server.fail('n4.json');
    expect(screen.getByRole('alert')).toHaveTextContent(LOAD_ERROR);

    await chooseDeck(user, 'JLPT N3');
    expect(document.getElementById('deck-message')).toHaveTextContent('Loading JLPT N3…');
    expect(screen.queryByText(LOAD_ERROR)).not.toBeInTheDocument();
  });
});

describe('what cancels a Shuffle In Cards that is waiting (answers 10 and 12)', () => {
  test.each([
    ['the mode switch', (user: User) => chooseMode(user, 'Random')],
    ['the One deck dropdown', (user: User) => user.selectOptions(oneDeckSelect(), 'JLPT N3')],
  ])('%s cancels it: nothing is shuffled in when the file arrives', async (_, change) => {
    const { user, server } = await openWithHeld(['n4.json']);
    const before = currentWord();
    await shuffleIn(user, '1');
    await change(user);
    expect(submitButton()).toHaveTextContent('Shuffle In Cards');

    await server.arrive('n4.json');
    expect(currentWord()).toBe(before);
    expect(shuffledOutCount()).toBe(0);
  });

  test('a tick under Multiple decks cancels it', async () => {
    const { user, server } = await openWithHeld(['n4.json']);
    const before = currentWord();
    await tickDecks(user, 'JLPT N4', 'JLPT N3');
    await shuffleIn(user, '1');
    await user.click(deckCheckbox('Common words'));
    expect(submitButton()).toHaveTextContent('Shuffle In Cards');

    await server.arrive('n4.json');
    expect(currentWord()).toBe(before);
    expect(shuffledOutCount()).toBe(0);
  });

  test('picking a deck that has already arrived cancels it at once (answer 12)', async () => {
    const { user, server } = await openWithHeld(['n4.json']);
    await shuffleIn(user, '1');
    await chooseDeck(user, 'JLPT N3');
    expect(currentCardLevel()).toBe('JLPT N3');
    expect(submitButton()).toHaveTextContent('Shuffle In Cards');

    await server.arrive('n4.json');
    expect((await deckContents(user)).every((c) => c.level === 'JLPT N3')).toBe(true);
    expect(shuffledOutCount()).toBe(0);
  });

  test('a Shuffle In pressed after picking a deck that is still loading is cancelled when that deck arrives (answer 12)', async () => {
    const { user, server } = await openWithHeld(['n4.json', 'n3.json']);
    await chooseDeck(user, 'JLPT N3');
    // Shuffle In from N4, pressed while N3 is still loading: its cards were meant for N5.
    await shuffleIn(user, '1');
    expect(submitButton()).toHaveTextContent(LOADING_CARDS);

    await server.arrive('n3.json');
    expect(currentCardLevel()).toBe('JLPT N3');
    expect(submitButton()).toHaveTextContent('Shuffle In Cards');
    await server.arrive('n4.json');

    expect((await deckContents(user)).every((c) => c.level === 'JLPT N3')).toBe(true);
    expect(shuffledOutCount()).toBe(0);
  });

  test('a cancelled download still arrives and is kept: the next Shuffle In is immediate, with no new download', async () => {
    const { user, server } = await openWithHeld(['n4.json']);
    await shuffleIn(user, '1');
    await user.type(countField(), '{Backspace}1');
    await server.arrive('n4.json');
    expect(shuffledOutCount()).toBe(0);

    await shuffleIn(user, '1');
    expect(isLoading()).toBe(false);
    expect(currentCardLevel()).toBe('JLPT N4');
    expect(server.requests('n4.json')).toBe(1);
  });

  test('there is no Cancel button while it waits', async () => {
    const { user } = await openWithHeld(['n4.json']);
    await shuffleIn(user, '1');
    expect(isLoading()).toBe(true);
    expect(screen.queryByRole('button', { name: /cancel/i })).not.toBeInTheDocument();
  });

  test('Enter in the count field while it waits does nothing: one download, one card shuffled in', async () => {
    const { user, server } = await openWithHeld(['n4.json']);
    await shuffleIn(user, '1');
    countField().focus();
    await user.keyboard('{Enter}');
    expect(isLoading()).toBe(true);
    expect(server.requests('n4.json')).toBe(1);

    await server.arrive('n4.json');
    expect(shuffledOutCount()).toBe(1);
    expect(screen.getAllByText('Shuffled out card 1 of 10')).toHaveLength(1);
  });
});
