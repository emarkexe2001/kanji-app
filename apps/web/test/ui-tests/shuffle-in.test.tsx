// FEAT1: picking the deck to study, and Shuffle In Cards from other decks.
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';
import App from '../../src/app/app';
import {
  COUNTER,
  chooseDeck,
  chooseSource,
  counter,
  currentCardLevel,
  currentWord,
  deckContents,
  enterCardLimit,
  makeDecks,
  makeWords,
  modeRadio,
  oneDeckSelect,
  renderApp,
  serveDeck,
  shuffleIn,
  shuffleInButton,
  wordsSeenWithNext,
} from './helpers';

/** Three decks to study and shuffle in from. The app studies the first one, JLPT N5, by default. */
const THREE_DECKS = makeDecks({ N5: 30, N4: 30, N3: 30 });

/** Closes the app and opens it again with the same storage, like reloading the page. */
async function reload(words = THREE_DECKS) {
  cleanup();
  serveDeck(words);
  render(<App />);
  await screen.findByText(COUNTER);
  return userEvent.setup();
}

const levels = (cards: { level: string | null }[]) => cards.map((c) => c.level);
const count = (items: (string | null)[], value: string) => items.filter((i) => i === value).length;

describe('picking the deck to study', () => {
  test('when I pick the N5 deck, every card in my deck is an N5 word', async () => {
    const user = await renderApp(makeDecks({ N4: 30, N5: 30, common: 30 }));

    await chooseDeck(user, 'JLPT N4');
    expect(levels(await deckContents(user)).every((l) => l === 'JLPT N4')).toBe(true);

    await chooseDeck(user, 'JLPT N5');
    const cards = await deckContents(user);
    expect(cards).toHaveLength(10);
    expect(levels(cards).every((l) => l === 'JLPT N5')).toBe(true);
  });

  test('only decks that have words are offered, and Common words holds the common words', async () => {
    const user = await renderApp(makeDecks({ N5: 30, common: 30 }));

    const options = Array.from(screen.getByLabelText<HTMLSelectElement>('Deck').options).map((o) => o.text);
    expect(options).toEqual(['JLPT N5', 'Common words']);

    await chooseDeck(user, 'Common words');
    expect(levels(await deckContents(user)).every((l) => l === 'Vocabulary')).toBe(true);
  });

  test('the deck I picked is remembered after a reload', async () => {
    const user = await renderApp(THREE_DECKS);
    await chooseDeck(user, 'JLPT N3');

    const reloaded = await reload();

    expect(screen.getByLabelText('Deck')).toHaveValue('N3');
    expect(levels(await deckContents(reloaded)).every((l) => l === 'JLPT N3')).toBe(true);
  });

  test('the deck being studied is never offered to shuffle in from', async () => {
    const user = await renderApp(THREE_DECKS);
    const sources = () => Array.from(oneDeckSelect().options).map((o) => o.text);

    expect(modeRadio('One deck')).toBeChecked();
    expect(sources()).toEqual(['JLPT N4', 'JLPT N3']);

    await chooseDeck(user, 'JLPT N4');
    expect(sources()).toEqual(['JLPT N5', 'JLPT N3']);
  });
});

describe('Shuffle In Cards', () => {
  test('when I shuffle in 1 card from a deck I picked, the card on screen is removed and a card from that deck is shown', async () => {
    const user = await renderApp(THREE_DECKS);
    await wordsSeenWithNext(user, 3); // card 4 of 10
    const before = currentWord();
    await chooseSource(user, 'JLPT N3');

    await shuffleIn(user, '1');

    expect(currentWord()).not.toBe(before);
    expect(currentCardLevel()).toBe('JLPT N3');
    expect(counter()).toEqual({ position: 4, total: 10 });
    const cards = await deckContents(user);
    expect(cards.map((c) => c.word)).not.toContain(before);
    expect(count(levels(cards), 'JLPT N3')).toBe(1);
  });

  test('when I shuffle in several cards, that many come from the chosen deck, the card on screen is gone and the deck size matches my card limit', async () => {
    const user = await renderApp(THREE_DECKS);
    const before = currentWord();
    await chooseSource(user, 'JLPT N4');

    await shuffleIn(user, '4');

    expect(currentCardLevel()).toBe('JLPT N4');
    const cards = await deckContents(user);
    expect(cards).toHaveLength(10);
    expect(counter().total).toBe(10);
    expect(count(levels(cards), 'JLPT N4')).toBe(4);
    expect(count(levels(cards), 'JLPT N5')).toBe(6);
    expect(cards.map((c) => c.word)).not.toContain(before);
  });

  test('the number to shuffle in can go all the way up to the card limit', async () => {
    const user = await renderApp(THREE_DECKS);
    await chooseSource(user, 'JLPT N4');

    await shuffleIn(user, '10');

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(levels(await deckContents(user)).every((l) => l === 'JLPT N4')).toBe(true);
  });

  test('when I choose Random, the new cards come from decks other than my current deck', async () => {
    // N5 has plenty of cards that aren't in the deck yet, so a Random that used it would show up here.
    const user = await renderApp(makeDecks({ N5: 200, N4: 10, N3: 10 }));
    await chooseSource(user, 'Random');

    await shuffleIn(user, '10');

    expect(['JLPT N4', 'JLPT N3']).toContain(currentCardLevel());
    const cardLevels = levels(await deckContents(user));
    expect(cardLevels).toHaveLength(10);
    expect(cardLevels.every((l) => l === 'JLPT N4' || l === 'JLPT N3')).toBe(true);
  });

  test('when I shuffle in cards and reload the app, my deck still has the shuffled-in cards and my "Shuffle in from" choice is remembered', async () => {
    const user = await renderApp(THREE_DECKS);
    await chooseSource(user, 'JLPT N3');
    await shuffleIn(user, '3');
    const before = (await deckContents(user)).map((c) => c.word);

    const reloaded = await reload();

    expect(oneDeckSelect()).toHaveValue('N3');
    const after = await deckContents(reloaded);
    expect(after.map((c) => c.word)).toEqual(before.slice(before.indexOf(currentWord())));
    expect(count(levels(after), 'JLPT N3')).toBe(3);
  });

  test('when I shuffle in cards many times, the same card never appears in my deck twice', async () => {
    // N5 words are also common, so the Common words deck holds every N5 word as well.
    const words = [...makeWords(30, 'N5').map((w) => ({ ...w, common: true })), ...makeWords(15)];
    const user = await renderApp(words);
    await chooseSource(user, 'Common words');

    for (let i = 0; i < 8; i++) {
      await shuffleIn(user, '3');
      await user.click(screen.getByRole('button', { name: 'Next →' }));
    }

    const cards = (await deckContents(user)).map((c) => c.word);
    expect(cards).toHaveLength(10);
    expect(new Set(cards).size).toBe(10);
  });

  test('when I shuffle in cards, the summary shows which positions in the deck were replaced, out of the deck size', async () => {
    const user = await renderApp(THREE_DECKS);
    await enterCardLimit(user, '20');
    await wordsSeenWithNext(user, 4); // card 5 of 20
    await chooseSource(user, 'JLPT N4');

    await shuffleIn(user, '3');

    const summary = screen.getByRole('status').textContent ?? '';
    const match = /^Shuffled out cards (\d+), (\d+) and (\d+) of 20$/.exec(summary);
    expect(match).not.toBeNull();
    const positions = match!.slice(1).map(Number);
    expect(positions).toContain(5);
    expect(positions).toEqual([...positions].sort((a, b) => a - b));

    // The positions named are exactly where the N4 cards now are. deckContents starts at card 5.
    const cards = await deckContents(user);
    const n4Positions = cards
      .map((c, i) => (c.level === 'JLPT N4' ? ((i + 4) % 20) + 1 : 0))
      .filter(Boolean)
      .sort((a, b) => a - b);
    expect(n4Positions).toEqual(positions);
  });

  test('shuffling in one card names the one position replaced, and the summary goes when I move on', async () => {
    const user = await renderApp(THREE_DECKS);
    await wordsSeenWithNext(user, 1);

    await shuffleIn(user, '1');
    expect(screen.getByRole('status')).toHaveTextContent('Shuffled out card 2 of 10');

    await user.click(screen.getByRole('button', { name: 'Next →' }));
    expect(screen.getByRole('status')).toHaveTextContent('');
  });

  test('when I lower the card limit after shuffling in, the card on screen stays and the deck shrinks to the new limit', async () => {
    const user = await renderApp(THREE_DECKS);
    await wordsSeenWithNext(user, 7); // card 8 of 10
    await chooseSource(user, 'JLPT N4');
    await shuffleIn(user, '1');
    const shuffledIn = currentWord();

    await enterCardLimit(user, '3');

    expect(counter()).toEqual({ position: 3, total: 3 });
    expect(currentWord()).toBe(shuffledIn);
    expect(currentCardLevel()).toBe('JLPT N4');
  });

  test('when I raise the card limit after shuffling in, the shuffled-in cards stay and new cards come from my deck', async () => {
    const user = await renderApp(THREE_DECKS);
    await chooseSource(user, 'JLPT N4');
    await shuffleIn(user, '2');

    await enterCardLimit(user, '15');

    const cards = await deckContents(user);
    expect(cards).toHaveLength(15);
    expect(new Set(cards.map((c) => c.word)).size).toBe(15);
    expect(count(levels(cards), 'JLPT N4')).toBe(2);
    expect(count(levels(cards), 'JLPT N5')).toBe(13);
  });

  test('cards shuffled out or trimmed by the card limit are recorded, newest first, with the deck they came from', async () => {
    const user = await renderApp(THREE_DECKS);
    vi.spyOn(Date, 'now').mockReturnValue(1000);
    await chooseSource(user, 'JLPT N4');
    await shuffleIn(user, '2');
    vi.spyOn(Date, 'now').mockReturnValue(2000);
    await enterCardLimit(user, '7');

    const removed = JSON.parse(localStorage.getItem('kanji.removedCards') ?? '[]');
    expect(removed).toHaveLength(5);
    expect(removed.slice(0, 3).every((r: { reason: string; removedAt: number }) => r.reason === 'card-limit')).toBe(
      true,
    );
    expect(removed.slice(3)).toEqual([
      expect.objectContaining({ reason: 'shuffled-out', removedAt: 1000, deck: 'N5' }),
      expect.objectContaining({ reason: 'shuffled-out', removedAt: 1000, deck: 'N5' }),
    ]);
    // The card limit only trimmed cards from the original deck or the shuffled-in N4 ones.
    for (const r of removed.slice(0, 3)) expect(['N5', 'N4']).toContain(r.deck);
  });

  test('only the newest 100 removed cards are kept', async () => {
    // Shuffle-ins can pick a card that was shuffled out earlier, which takes it off the list, so
    // a big card-limit trim is the reliable way to remove more than 100 different cards.
    const user = await renderApp(makeDecks({ N5: 200, N4: 5 }));
    await enterCardLimit(user, '150');
    await enterCardLimit(user, '1');

    expect(JSON.parse(localStorage.getItem('kanji.removedCards') ?? '[]')).toHaveLength(100);
  });
});

describe('Shuffle In Cards failure paths', () => {
  test("when the chosen deck doesn't have enough new cards left, a message says how many and my deck does not change", async () => {
    const user = await renderApp(makeDecks({ N5: 30, N4: 2 }));
    const before = await deckContents(user);

    await shuffleIn(user, '3');

    expect(screen.getByRole('alert')).toHaveTextContent('There are only 2 new cards left in JLPT N4 to shuffle in.');
    expect(await deckContents(user)).toEqual(before);
    expect(screen.getByRole('status')).toHaveTextContent('');
  });

  test('once every card of the chosen deck is in my deck, a message says there are none left and my deck does not change', async () => {
    const user = await renderApp(makeDecks({ N5: 30, N4: 2 }));
    await shuffleIn(user, '2');
    const before = await deckContents(user);

    await shuffleIn(user, '1');

    expect(screen.getByRole('alert')).toHaveTextContent('There are no new cards left in JLPT N4 to shuffle in.');
    expect(await deckContents(user)).toEqual(before);
  });

  test("with Random, a message says how many new cards the other decks have left and my deck doesn't change", async () => {
    const user = await renderApp(makeDecks({ N5: 30, N4: 1, N3: 2 }));
    await chooseSource(user, 'Random');
    const before = await deckContents(user);

    await shuffleIn(user, '4');

    expect(screen.getByRole('alert')).toHaveTextContent(
      'There are only 3 new cards left in the other decks to shuffle in.',
    );
    expect(await deckContents(user)).toEqual(before);
  });

  test('when I ask to shuffle in more cards than my card limit, a validation message is shown and my deck does not change', async () => {
    const user = await renderApp(THREE_DECKS);
    const before = await deckContents(user);

    await shuffleIn(user, '11');

    expect(screen.getByRole('alert')).toHaveTextContent("You can't shuffle in more than 10 cards, your card limit.");
    expect(screen.getByLabelText('Cards to shuffle in')).toHaveAttribute('aria-invalid', 'true');
    expect(await deckContents(user)).toEqual(before);
  });

  test.each([
    ['0', 'Shuffle in at least 1 card.'],
    ['', 'Enter how many cards to shuffle in.'],
    ['2.5', 'Cards to shuffle in must be a whole number.'],
  ])('shuffling in "%s" cards shows "%s" and my deck does not change', async (value, message) => {
    const user = await renderApp(THREE_DECKS);
    const before = await deckContents(user);

    await shuffleIn(user, value);

    expect(screen.getByRole('alert')).toHaveTextContent(message);
    expect(await deckContents(user)).toEqual(before);
  });

  test('the validation message goes away when I change the number', async () => {
    const user = await renderApp(THREE_DECKS);
    await shuffleIn(user, '11');
    expect(screen.getByRole('alert')).toBeInTheDocument();

    await user.type(screen.getByLabelText('Cards to shuffle in'), '{Backspace}');

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  test('when there is no other deck to shuffle in from, Shuffle In Cards is disabled and explains why', async () => {
    await renderApp(makeWords(50));

    expect(shuffleInButton()).toBeDisabled();
    expect(shuffleInButton()).toHaveAccessibleDescription("There's no other deck to shuffle in from.");
    // Nothing to choose, so the choices are hidden.
    expect(screen.queryByRole('group', { name: 'Shuffle in from' })).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Cards to shuffle in')).not.toBeInTheDocument();
  });

  test('when browser storage is blocked, shuffling in still works for the current session', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('Access denied', 'SecurityError');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Access denied', 'SecurityError');
    });

    const user = await renderApp(THREE_DECKS);
    await chooseSource(user, 'JLPT N3');
    await shuffleIn(user, '2');

    expect(currentCardLevel()).toBe('JLPT N3');
    expect(screen.getByRole('status')).toHaveTextContent(/^Shuffled out cards \d+ and \d+ of 10$/);
    expect(count(levels(await deckContents(user)), 'JLPT N3')).toBe(2);
  });
});

describe('saved deck checks (failure paths)', () => {
  const save = (value: unknown) => localStorage.setItem('kanji.savedDeck', JSON.stringify(value));

  test('a corrupt saved deck is ignored and a fresh deck is built', async () => {
    localStorage.setItem('kanji.savedDeck', '{not json');

    const user = await renderApp(THREE_DECKS);

    const cards = await deckContents(user);
    expect(cards).toHaveLength(10);
    expect(levels(cards).every((l) => l === 'JLPT N5')).toBe(true);
  });

  test('unknown and repeated cards in the saved deck are dropped, and the deck is topped up to the card limit', async () => {
    save({
      deck: 'N5',
      cards: [
        { id: 'N4-7', deck: 'N4' },
        { id: 'no-such-word', deck: 'N4' },
        { id: 'N4-7', deck: 'N4' },
        { id: 'N4-8', deck: 'not-a-deck' },
        'junk',
      ],
    });

    const user = await renderApp(THREE_DECKS);

    const cards = await deckContents(user);
    expect(cards).toHaveLength(10);
    expect(new Set(cards.map((c) => c.word)).size).toBe(10);
    expect(cards[0].word).toBe('N4単語7【たんご7】');
    expect(count(levels(cards), 'JLPT N5')).toBe(9);
  });

  test('a saved deck bigger than the card limit is cut down to the limit', async () => {
    localStorage.setItem('kanji.deckSize', '3');
    save({ deck: 'N5', cards: makeWords(8, 'N4').map((w) => ({ id: w.id, deck: 'N4' })) });

    const user = await renderApp(THREE_DECKS);

    expect(counter().total).toBe(3);
    expect(levels(await deckContents(user))).toEqual(['JLPT N4', 'JLPT N4', 'JLPT N4']);
  });

  test('a deck saved for a different deck than the one being studied is ignored', async () => {
    localStorage.setItem('kanji.studiedDeck', 'N5');
    save({ deck: 'N3', cards: [{ id: 'N4-1', deck: 'N4' }] });

    const user = await renderApp(THREE_DECKS);

    expect(levels(await deckContents(user)).every((l) => l === 'JLPT N5')).toBe(true);
  });

  test('an unknown saved deck choice, "Shuffle in from" choice or removed-cards list falls back safely', async () => {
    localStorage.setItem('kanji.studiedDeck', 'N9');
    localStorage.setItem('kanji.shuffleSource', '{"kind":"deck","deck":"N5"}');
    localStorage.setItem(
      'kanji.removedCards',
      JSON.stringify([
        { id: 'no-such-word', deck: 'N4', reason: 'shuffled-out', removedAt: 1 },
        { id: 'N4-1', deck: 'N4', reason: 'lost', removedAt: 1 },
        { id: 'N4-2', deck: 'N4', reason: 'card-limit', removedAt: 'yesterday' },
        42,
      ]),
    );

    const user = await renderApp(THREE_DECKS);

    expect(screen.getByLabelText('Deck')).toHaveValue('N5');
    // N5 is the deck being studied, so it can't be the source: the first other deck is used.
    expect(oneDeckSelect()).toHaveValue('N4');
    await shuffleIn(user, '1');
    expect(JSON.parse(localStorage.getItem('kanji.removedCards') ?? '[]')).toHaveLength(1);
  });
});
