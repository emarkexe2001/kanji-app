// ARCH2: picking a deck to study before its file has arrived (answer 8), the line under the Deck
// row and what screen readers hear (answers 6, 14 and 15, with the live regions the user approved
// on 2026-11-17), which decks the first card waits for from the saved data (answers 5 and 11), and
// the app in StrictMode. The basic cases are in deck-download.test.tsx.
import { StrictMode } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { WordEntry } from '@kanji/core';
import { afterEach, describe, expect, test, vi } from 'vitest';
import App from '../../src/app/app';
import {
  COUNTER,
  chooseDeck,
  counter,
  currentCardLevel,
  currentWord,
  deckContents,
  deckShuffleButton,
  enterCardLimit,
  makeDecks,
  modeRadio,
  oneDeckSelect,
  requestedFile,
  serveDeck,
  serveDeckSlowly,
  shuffleIn,
  tickDecks,
  deckCheckbox,
} from './helpers';

/** JLPT N5 (studied first), N4 and N3 words, and common words with no level. */
const WORDS = makeDecks({ N5: 30, N4: 30, N3: 30, common: 30 });
/** As WORDS, with the N4 words also common, so the Common words deck needs n4.json too. */
const WORDS_COMMON_N4: WordEntry[] = WORDS.map((w) => (w.jlpt === 'N4' ? { ...w, common: true } : w));

const deckSelect = () => screen.getByLabelText<HTMLSelectElement>('Deck');
const deckMessage = () => document.getElementById('deck-message')!;
const politeRegion = () => deckMessage().querySelector('[aria-live="polite"]');
const assertiveRegion = () => deckMessage().querySelector('[aria-live="assertive"]');
const shuffledOutButton = () => screen.getByRole('button', { name: /^Shuffled out \(\d+\)$/ });
const next = () => screen.getByRole('button', { name: 'Next →' });

async function openWithHeld(held: string[], words: unknown = WORDS) {
  const server = serveDeckSlowly(words, held);
  const user = userEvent.setup();
  render(<App />);
  await screen.findByText(COUNTER);
  return { user, server };
}

/** Starts the app with `held` files waiting, without waiting for the first card. */
function startWithHeld(held: string[], words: unknown = WORDS) {
  const server = serveDeckSlowly(words, held);
  render(<App />);
  return server;
}

afterEach(() => vi.restoreAllMocks());

describe('picking a deck to study before its file has arrived (answer 8)', () => {
  test('the current deck stays fully usable while it loads: Back, Deck Shuffle, the keys, Shuffle In, the card limit and the panel', async () => {
    const { user, server } = await openWithHeld(['n4.json']);
    await chooseDeck(user, 'JLPT N4');
    expect(deckMessage()).toHaveTextContent('Loading JLPT N4…');
    // Move focus off the dropdown, so the arrow keys move through the cards.
    await user.click(next());
    await user.click(screen.getByRole('button', { name: 'Back' }));
    expect(counter().position).toBe(1);
    await user.keyboard('{ArrowRight}{ArrowRight}{ArrowLeft}');
    expect(counter().position).toBe(2);
    await user.keyboard('s');
    await user.click(deckShuffleButton());
    expect(currentCardLevel()).toBe('JLPT N5');

    // Shuffle In for the current deck, from N3 (already arrived): straight away.
    await user.selectOptions(oneDeckSelect(), 'JLPT N3');
    await shuffleIn(user, '1');
    expect(currentCardLevel()).toBe('JLPT N3');
    expect(shuffledOutButton()).toHaveAccessibleName('Shuffled out (1)');

    await user.click(shuffledOutButton());
    expect(screen.getByRole('group', { name: 'Add back' })).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('group', { name: 'Add back' })).not.toBeInTheDocument();

    await enterCardLimit(user, '6');
    expect(counter().total).toBe(6);
    // Still loading, and the dropdown still shows the deck picked.
    expect(deckMessage()).toHaveTextContent('Loading JLPT N4…');
    expect(deckSelect().value).toBe('N4');

    await server.arrive('n4.json');
    expect(currentCardLevel()).toBe('JLPT N4');
    expect(counter()).toEqual({ position: 1, total: 6 });
  });

  test('nothing is saved for the picked deck until its file arrives', async () => {
    const { user, server } = await openWithHeld(['n4.json']);
    await chooseDeck(user, 'JLPT N4');
    expect(localStorage.getItem('kanji.studiedDeck')).toBe('N5');
    expect(JSON.parse(localStorage.getItem('kanji.savedDeck')!).deck).toBe('N5');

    await server.arrive('n4.json');
    expect(localStorage.getItem('kanji.studiedDeck')).toBe('N4');
    expect(JSON.parse(localStorage.getItem('kanji.savedDeck')!).deck).toBe('N4');
  });

  test('when the picked deck arrives, a ticked deck that is now studied is unticked and I am told', async () => {
    const { user, server } = await openWithHeld(['n4.json']);
    await tickDecks(user, 'JLPT N4', 'JLPT N3', 'Common words');
    await chooseDeck(user, 'JLPT N4');
    const notice = 'JLPT N4 is no longer available, so it has been unticked.';
    expect(screen.queryByText(notice)).not.toBeInTheDocument();

    await server.arrive('n4.json');
    expect(screen.getByText(notice)).toHaveAttribute('role', 'status');
    expect(modeRadio('Multiple decks')).toBeChecked();
  });

  test('picking Common words waits for every file with common words (answer 4)', async () => {
    const { user, server } = await openWithHeld(['n4.json', 'common-no-level.json'], WORDS_COMMON_N4);
    await chooseDeck(user, 'Common words');
    expect(deckMessage()).toHaveTextContent('Loading Common words…');

    await server.arrive('common-no-level.json');
    expect(deckMessage()).toHaveTextContent('Loading Common words…');
    expect(currentCardLevel()).toBe('JLPT N5');
    await server.arrive('n4.json');

    expect(deckMessage()).toHaveTextContent('');
    expect(deckSelect().value).toBe('common');
    expect(counter().position).toBe(1);
    // Every card is a common word: one with no level, or an N4 word.
    expect((await deckContents(user)).every((c) => c.level !== 'JLPT N5')).toBe(true);
  });

  test('the latest pick wins: an earlier pick that arrives, or fails, later is ignored', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const { user, server } = await openWithHeld(['n4.json', 'n3.json']);
    await chooseDeck(user, 'JLPT N4');
    await chooseDeck(user, 'JLPT N3');
    await server.fail('n4.json');
    expect(deckMessage()).toHaveTextContent('Loading JLPT N3…');
    expect(deckSelect().value).toBe('N3');

    await chooseDeck(user, 'JLPT N4');
    await chooseDeck(user, 'JLPT N3');
    await server.arrive('n4.json');
    expect(currentCardLevel()).toBe('JLPT N5');
    expect(deckMessage()).toHaveTextContent('Loading JLPT N3…');

    await server.arrive('n3.json');
    expect(currentCardLevel()).toBe('JLPT N3');
  });

  test('the error clears when I pick any deck again', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const { user, server } = await openWithHeld(['n4.json']);
    await chooseDeck(user, 'JLPT N4');
    await server.fail('n4.json');
    expect(deckMessage()).toHaveTextContent("Couldn't load JLPT N4. Pick it again to retry.");

    await chooseDeck(user, 'JLPT N3');
    expect(deckMessage()).toHaveTextContent('');
    expect(currentCardLevel()).toBe('JLPT N3');
  });

  test('a deck whose file failed in the background is downloaded again when picked (answer 10)', async () => {
    const { user, server } = await openWithHeld(['n4.json']);
    await server.fail('n4.json');
    expect(deckMessage()).toHaveTextContent('');

    await chooseDeck(user, 'JLPT N4');
    expect(server.requests('n4.json')).toBe(2);
    await server.arrive('n4.json');
    expect(currentCardLevel()).toBe('JLPT N4');
  });
});

describe('what screen readers hear, and the reserved line (answers 6, 14 and 15)', () => {
  test('the line under the Deck row holds two always-present live regions, polite for loading and assertive for the error', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const { user, server } = await openWithHeld(['n4.json']);
    // Both exist, empty, before there is anything to say, so their first text is announced.
    expect(politeRegion()).toHaveAttribute('aria-atomic', 'true');
    expect(assertiveRegion()).toHaveAttribute('aria-atomic', 'true');
    expect(politeRegion()).toHaveTextContent('');
    expect(assertiveRegion()).toHaveTextContent('');
    // Live regions, not role="status" / role="alert" (approved 2026-11-17).
    expect(deckMessage().querySelector('[role]')).toBeNull();

    await chooseDeck(user, 'JLPT N4');
    expect(politeRegion()).toHaveTextContent('Loading JLPT N4…');
    expect(assertiveRegion()).toHaveTextContent('');

    await server.fail('n4.json');
    expect(politeRegion()).toHaveTextContent('');
    expect(assertiveRegion()).toHaveTextContent("Couldn't load JLPT N4. Pick it again to retry.");
  });

  test('the error line never wraps (answer 15)', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const { user, server } = await openWithHeld(['n4.json']);
    // Checked by class name: jsdom has no layout (the e2e test measures its height).
    expect(deckMessage()).toHaveClass('h-4');
    expect(deckMessage()).not.toHaveClass('whitespace-nowrap');
    await chooseDeck(user, 'JLPT N4');
    await server.fail('n4.json');
    expect(deckMessage()).toHaveClass('h-4', 'whitespace-nowrap', 'text-danger-ink');
  });

  test('"Loading cards…" is announced politely from a region that is always there; focus stays on the button', async () => {
    const { user } = await openWithHeld(['n4.json']);
    const form = screen.getByRole('button', { name: 'Shuffle In Cards' }).closest('form')!;
    const region = form.querySelector('[aria-live="polite"]');
    expect(region).toHaveAttribute('aria-atomic', 'true');
    expect(region).toHaveTextContent('');

    await shuffleIn(user, '1');
    expect(region).toHaveTextContent('Loading cards…');
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Loading cards…' }));
  });

  test('the spinners stand still with reduced motion', async () => {
    const { user } = await openWithHeld(['n4.json', 'n3.json']);
    await shuffleIn(user, '1');
    // Checked by class name: jsdom has no animations (the e2e test checks the computed style).
    const button = screen.getByRole('button', { name: 'Loading cards…' });
    expect(button.querySelector('svg')).toHaveClass('animate-spin', 'motion-reduce:animate-none');
    await chooseDeck(user, 'JLPT N3');
    expect(deckMessage().querySelector('svg')).toHaveClass('animate-spin', 'motion-reduce:animate-none');
  });
});

describe('which decks the first card waits for, from the saved data (answers 5 and 11)', () => {
  test('a Multiple decks choice saved before ARCH2 is kept, with its ticks, and the deck’s N4 card', async () => {
    localStorage.setItem('kanji.deckSize', '3');
    localStorage.setItem(
      'kanji.savedDeck',
      JSON.stringify({
        deck: 'N5',
        cards: [
          { id: 'N5-1', deck: 'N5' },
          { id: 'N4-3', deck: 'N4' },
          { id: 'N5-2', deck: 'N5' },
        ],
        newIds: ['N4-3'],
      }),
    );
    localStorage.setItem('kanji.shuffleSource', JSON.stringify({ kind: 'multiple', deck: 'N4', decks: ['N4', 'N3'] }));
    const server = startWithHeld(['n4.json', 'common-no-level.json']);
    const user = userEvent.setup();

    expect(await screen.findByText('Loading dictionary…')).toBeInTheDocument();
    await server.arrive('n4.json');
    expect(await screen.findByText(COUNTER)).toBeInTheDocument();

    expect(modeRadio('Multiple decks')).toBeChecked();
    expect(deckCheckbox('JLPT N4')).toBeChecked();
    expect(deckCheckbox('JLPT N3')).toBeChecked();
    expect(deckCheckbox('Common words')).not.toBeChecked();
    expect((await deckContents(user)).map((c) => c.word)).toEqual([
      'N5単語1【たんご1】',
      'N4単語3【たんご3】',
      'N5単語2【たんご2】',
    ]);
  });

  test('studying N3 with N5 and Common words cards saved, the first card waits for every file with common words', async () => {
    localStorage.setItem('kanji.deckSize', '3');
    localStorage.setItem('kanji.studiedDeck', 'N3');
    localStorage.setItem(
      'kanji.savedDeck',
      JSON.stringify({
        deck: 'N3',
        cards: [
          { id: 'N3-1', deck: 'N3' },
          { id: 'N5-4', deck: 'N5' },
          { id: '2', deck: 'common' },
        ],
        newIds: ['N5-4', '2'],
      }),
    );
    const server = startWithHeld(['n5.json', 'n4.json', 'common-no-level.json'], WORDS_COMMON_N4);
    const user = userEvent.setup();

    for (const file of ['n5.json', 'common-no-level.json', 'n4.json']) {
      expect(await screen.findByText('Loading dictionary…')).toBeInTheDocument();
      await server.arrive(file);
    }
    expect(await screen.findByText(COUNTER)).toBeInTheDocument();
    expect(deckSelect().value).toBe('N3');
    expect((await deckContents(user)).map((c) => c.word)).toEqual([
      'N3単語1【たんご1】',
      'N5単語4【たんご4】',
      '単語2【たんご2】',
    ]);
  });

  test('a Common words card in the cleared list makes the first card wait for every file with common words (answer 11)', async () => {
    localStorage.setItem(
      'kanji.clearedCards',
      JSON.stringify([{ id: '3', deck: 'common', reason: 'shuffled-out', removedAt: 1 }]),
    );
    const server = startWithHeld(['n4.json', 'common-no-level.json'], WORDS_COMMON_N4);
    const user = userEvent.setup();

    await screen.findByText('Loading dictionary…');
    await server.arrive('common-no-level.json');
    expect(screen.getByText('Loading dictionary…')).toBeInTheDocument();
    await server.arrive('n4.json');
    expect(await screen.findByText(COUNTER)).toBeInTheDocument();

    await user.click(shuffledOutButton());
    await user.click(screen.getByRole('button', { name: /^Recover/ }));
    expect(screen.getByRole('checkbox', { name: '単語3【たんご3】' })).toBeInTheDocument();
  });

  test('a deck saved for another studied deck doesn’t make its decks load first', async () => {
    localStorage.setItem('kanji.studiedDeck', 'N5');
    localStorage.setItem(
      'kanji.savedDeck',
      JSON.stringify({ deck: 'N3', cards: [{ id: 'N4-1', deck: 'N4' }], newIds: [] }),
    );
    startWithHeld(['n4.json', 'n3.json', 'common-no-level.json']);
    // The first card shows while N4 and N3 are still held back.
    expect(await screen.findByText(COUNTER)).toBeInTheDocument();
    expect(currentCardLevel()).toBe('JLPT N5');
  });

  test('a deck name in the saved data that doesn’t exist is ignored', async () => {
    localStorage.setItem(
      'kanji.savedDeck',
      JSON.stringify({ deck: 'N5', cards: [{ id: 'X-1', deck: 'N9' }], newIds: [] }),
    );
    localStorage.setItem(
      'kanji.removedCards',
      JSON.stringify([{ id: 'X-2', deck: 'nonsense', reason: 'shuffled-out', removedAt: 1 }]),
    );
    const server = startWithHeld(['n4.json', 'n3.json', 'common-no-level.json']);
    expect(await screen.findByText(COUNTER)).toBeInTheDocument();
    expect(server.requests('decks.json')).toBe(1);
    expect(shuffledOutButton()).toHaveAccessibleName('Shuffled out (0)');
  });
});

describe('the app in StrictMode and under the error boundary (standards 4.2)', () => {
  test('a card that fails to draw leaves no line under the Deck row behind', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    // Broken data: no reading breakdown, so drawing the card throws.
    serveDeck(makeDecks({ N5: 5, N4: 5 }).map((word) => ({ ...word, segments: null })));
    render(<App />);
    expect(
      await screen.findByText('Something went wrong showing the cards. Please reload the page to try again.'),
    ).toBeInTheDocument();
    expect(document.getElementById('deck-message')).toBeNull();
    expect(screen.queryByLabelText('Deck')).not.toBeInTheDocument();
  });

  test('each file is downloaded once, and there is one line under the Deck row', async () => {
    serveDeck(WORDS);
    render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
    await screen.findByText(COUNTER);
    await vi.waitFor(() => expect(vi.mocked(fetch).mock.calls.length).toBe(5));
    const files = vi.mocked(fetch).mock.calls.map(([url]) => requestedFile(url));
    expect(new Set(files).size).toBe(files.length);
    expect(files[0]).toBe('decks.json');
    expect(document.querySelectorAll('#deck-message')).toHaveLength(1);
    expect(currentWord()).toBeTruthy();
  });
});
