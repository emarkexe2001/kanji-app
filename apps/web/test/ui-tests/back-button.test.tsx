// FEAT6: the Back button, which goes back to the card seen before.
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { MODE_COLORS } from '@kanji/core';
import App from '../../src/app/app';
import {
  COUNTER,
  cardLimitInput,
  chooseDeck,
  counter,
  currentCardLevel,
  currentWord,
  deckContents,
  deckShuffleButton,
  enterCardLimit,
  makeDecks,
  makeWords,
  renderApp,
  serveDeck,
  shuffleIn,
  wordsSeenWithNext,
  type User,
} from './helpers';
import { tailwindColor } from './mode-colors';

afterEach(() => vi.unstubAllGlobals());

const backButton = () => screen.getByRole('button', { name: 'Back' });
const nextButton = () => screen.getByRole('button', { name: 'Next →' });

async function back(user: User, times = 1) {
  for (let i = 0; i < times; i++) await user.click(backButton());
}

async function next(user: User, times = 1) {
  for (let i = 0; i < times; i++) await user.click(nextButton());
}

/**
 * Presses Deck Shuffle with the random source fixed so it lands on `position` (from 1), which
 * must differ from the card on screen. Deck Shuffle picks one of the other cards at random.
 */
async function deckShuffleTo(user: User, position: number) {
  const { position: from, total } = counter();
  const n = position > from ? position - 2 : position - 1;
  vi.spyOn(Math, 'random').mockReturnValueOnce((n + 0.5) / (total - 1));
  await user.click(deckShuffleButton());
  expect(counter().position).toBe(position);
}

/** The word and counter position of the card on screen. */
const onScreen = () => ({ word: currentWord(), position: counter().position });

/** Closes the app and opens it again with the same storage, like reloading the page. */
async function reload(words: Parameters<typeof serveDeck>[0]) {
  cleanup();
  serveDeck(words);
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

/** The element that carries the card's arrival animation. */
const arrivingCard = () => screen.getByRole('article').parentElement;

/** Whether the card on screen shows the "New" badge. */
const onScreenIsNew = () => within(screen.getByRole('article')).queryByText('New') !== null;

/** Everything in browser storage, by key. */
const storageContents = () =>
  Object.fromEntries(
    Array.from({ length: localStorage.length }, (_, i) => localStorage.key(i)!).map((k) => [
      k,
      localStorage.getItem(k),
    ]),
  );

/** Checks the card on screen is a real card from the deck, not a missing or broken one. */
function expectRealCard() {
  expect(screen.queryByText("This card can't be shown.")).not.toBeInTheDocument();
  expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
}

describe('the Back button', () => {
  test('when I press Next and then Back, I see the card I was on before', async () => {
    const user = await renderApp();
    const first = currentWord();
    await next(user);
    expect(currentWord()).not.toBe(first);

    await back(user);

    expect(currentWord()).toBe(first);
    expect(counter()).toEqual({ position: 1, total: 10 });
  });

  test('when I use Deck Shuffle to jump to a random card and then press Back, I go back to the card I was on before the jump', async () => {
    const user = await renderApp();
    await next(user, 2);
    const beforeJump = onScreen();
    await deckShuffleTo(user, 8);

    await back(user);

    expect(onScreen()).toEqual(beforeJump);
    expect(beforeJump.position).toBe(3);
  });

  test('when I press Back several times, I go back through the cards I saw, in reverse order', async () => {
    const user = await renderApp();
    const seen = [onScreen()];
    await next(user);
    seen.push(onScreen());
    await deckShuffleTo(user, 7);
    seen.push(onScreen());
    await next(user);
    seen.push(onScreen());
    await deckShuffleTo(user, 4);
    seen.push(onScreen());
    expect(seen.map((s) => s.position)).toEqual([1, 2, 7, 8, 4]);

    const wentBackTo = [];
    for (let i = 0; i < 4; i++) {
      await back(user);
      wentBackTo.push(onScreen());
    }

    expect(wentBackTo).toEqual(seen.slice(0, 4).reverse());
  });

  test('when I press Back at the start, before seeing any other card, I go to the last card in the deck', async () => {
    const user = await renderApp();
    const deck = (await deckContents(user)).map((c) => c.word);
    // deckContents walks the deck with Next, so reload to start again with nothing seen.
    const fresh = await reload(makeWords(200));
    expect(onScreen()).toEqual({ word: deck[0], position: 1 });

    await back(fresh);

    expect(onScreen()).toEqual({ word: deck[9], position: 10 });
  });

  test('once the cards I saw run out, Back carries on to the card before in deck order', async () => {
    const user = await renderApp();
    const deck = (await deckContents(user)).map((c) => c.word);
    const fresh = await reload(makeWords(200));
    await deckShuffleTo(fresh, 6);
    await back(fresh);
    expect(counter().position).toBe(1);

    await back(fresh);
    expect(onScreen()).toEqual({ word: deck[9], position: 10 });
    await back(fresh);
    expect(onScreen()).toEqual({ word: deck[8], position: 9 });
  });

  test('when I press Back, the "Card X of Y" counter shows the card I went back to, and my deck has not changed', async () => {
    const user = await renderApp();
    const deck = await deckContents(user);
    expect(counter().position).toBe(1);
    await next(user, 4);
    await deckShuffleTo(user, 9);

    await back(user);
    expect(screen.getByText('Card 5 of 10')).toBeInTheDocument();
    await back(user);
    expect(screen.getByText('Card 4 of 10')).toBeInTheDocument();
    expect(currentWord()).toBe(deck[3].word);

    // The same cards in the same order, starting from the card on screen...
    expect(await deckContents(user)).toEqual([...deck.slice(3), ...deck.slice(0, 3)]);
    // ...and the saved deck is the same after a reload.
    await reload(makeWords(200));
    expect(await deckContents(userEvent.setup())).toEqual(deck);
  });

  test('when I go Back and then press Next, Next moves on from the card on screen', async () => {
    const user = await renderApp();
    const seen = await wordsSeenWithNext(user, 3);
    await back(user);
    await deckShuffleTo(user, 8);
    await back(user);
    expect(onScreen()).toEqual({ word: seen[2], position: 3 });

    await next(user);

    // Card 4, the one after the card on screen: there is no "forward" back to card 8.
    expect(onScreen()).toEqual({ word: seen[3], position: 4 });
    // And Back from there goes to the card I just went Next from.
    await back(user);
    expect(counter().position).toBe(3);
  });

  test('Back goes back to a card I reached by adding shuffled-out cards back', async () => {
    const user = await renderApp(makeDecks({ N5: 30, N4: 30 }));
    const shuffledOut = currentWord();
    await shuffleIn(user, '1');
    const shuffledIn = currentWord();
    await next(user);
    expect(counter().position).toBe(2);
    const second = currentWord();

    await user.click(screen.getByRole('button', { name: /^Shuffled out \(\d+\)$/ }));
    await user.click(
      within(screen.getByRole('group', { name: 'Add back' }))
        .getByRole('checkbox', { name: shuffledOut! })
        .closest('label')!,
    );
    await user.click(
      within(screen.getByRole('group', { name: /^Take out of your deck/ }))
        .getByRole('checkbox', { name: /^Card 5: / })
        .closest('label')!,
    );
    await user.click(screen.getByRole('button', { name: 'Add Back Cards' }));
    expect(onScreen()).toEqual({ word: shuffledOut, position: 5 });
    await next(user);

    await back(user);
    expect(onScreen()).toEqual({ word: shuffledOut, position: 5 });
    await back(user);
    expect(onScreen()).toEqual({ word: second, position: 2 });
    await back(user);
    expect(onScreen()).toEqual({ word: shuffledIn, position: 1 });
  });

  test('a one-card deck: Back stays on that card and nothing breaks', async () => {
    const user = await renderApp();
    await enterCardLimit(user, '1');
    await user.click(document.body);
    const only = currentWord();

    await back(user);
    await user.keyboard('{ArrowLeft}');
    await back(user);

    expect(currentWord()).toBe(only);
    expect(counter()).toEqual({ position: 1, total: 1 });
    expectRealCard();
    await next(user);
    expect(currentWord()).toBe(only);
  });
});

describe('the Left arrow key', () => {
  test('when I press the Left arrow key, it works the same as the Back button', async () => {
    const user = await renderApp();
    await next(user, 2);
    await deckShuffleTo(user, 6);
    await user.click(document.body);

    await user.keyboard('{ArrowLeft}');
    expect(counter().position).toBe(3);
    await user.keyboard('{ArrowLeft}');
    expect(counter().position).toBe(2);
    await user.keyboard('{ArrowLeft}{ArrowLeft}');
    // Card 1, then the history has run out and it wraps to the last card.
    expect(counter().position).toBe(10);
  });

  test("the Left arrow key does nothing while I'm typing in a field", async () => {
    const user = await renderApp();
    await next(user, 3);
    const card = onScreen();
    cardLimitInput().focus();

    await user.keyboard('{ArrowLeft}{ArrowLeft}');

    expect(onScreen()).toEqual(card);
  });
});

describe('what Back remembers', () => {
  test('when a card I saw has since been shuffled out by Shuffle In Cards, Back skips it and goes to the card before it', async () => {
    const user = await renderApp(makeDecks({ N5: 30, N4: 30 }));
    await enterCardLimit(user, '3');
    await user.click(document.body);
    const deck = (await deckContents(user)).map((c) => c.word);
    // Cards 1, 2, 3, 1 seen, now on card 2.
    await next(user, 4);
    expect(counter().position).toBe(2);
    await shuffleIn(user, '1');
    const shuffledIn = currentWord();
    expect(shuffledIn).not.toBe(deck[1]);

    await back(user);
    expect(onScreen()).toEqual({ word: deck[0], position: 1 });
    await back(user);
    expect(onScreen()).toEqual({ word: deck[2], position: 3 });
    // Card 2 was seen before card 3, but it has been shuffled out: Back skips it.
    await back(user);
    expect(onScreen()).toEqual({ word: deck[0], position: 1 });
    expectRealCard();
  });

  test('when cards I saw have since been removed by a smaller card limit, Back skips them and goes to the card before them', async () => {
    const user = await renderApp();
    // Cards 1 to 10, then 1 seen, now on card 2.
    const seen = await wordsSeenWithNext(user, 11);
    expect(counter().position).toBe(2);
    await enterCardLimit(user, '5');
    await user.click(document.body);

    await back(user);
    expect(onScreen()).toEqual({ word: seen[0], position: 1 });
    // Cards 10 to 6 are no longer in the deck, so Back goes to card 5, seen before them.
    await back(user);
    expect(onScreen()).toEqual({ word: seen[4], position: 5 });
    expectRealCard();
    await back(user);
    expect(counter()).toEqual({ position: 4, total: 5 });
  });

  test('when a smaller card limit leaves one card, Back stays on it even though I saw other cards before', async () => {
    const user = await renderApp();
    await next(user, 2);
    await enterCardLimit(user, '1');
    await user.click(document.body);
    expect(counter()).toEqual({ position: 1, total: 1 });
    const only = currentWord();

    await back(user, 3);

    expect(currentWord()).toBe(only);
    expectRealCard();
  });

  test('Deck Shuffle, Shuffle In Cards and a card limit change keep the cards I saw', async () => {
    const user = await renderApp(makeDecks({ N5: 30, N4: 30 }));
    const first = onScreen();
    await deckShuffleTo(user, 4);
    const second = onScreen();
    await next(user);
    await shuffleIn(user, '1');
    await enterCardLimit(user, '12');
    await user.click(document.body);

    await back(user);
    expect(onScreen()).toEqual(second);
    await back(user);
    expect(onScreen()).toEqual(first);
  });

  test('changing the deck I study clears the cards I saw, so Back goes to the card before in the new deck', async () => {
    const user = await renderApp(makeDecks({ N5: 30, N4: 30 }));
    await next(user, 3);
    await chooseDeck(user, 'JLPT N4');
    // Straight back to JLPT N5: cards 1 to 3 seen before are in the deck again, but they were cleared.
    await chooseDeck(user, 'JLPT N5');
    await user.click(document.body);
    expect(counter()).toEqual({ position: 1, total: 10 });
    await back(user);
    expect(counter().position).toBe(10);
    expect(currentCardLevel()).toBe('JLPT N5');

    await chooseDeck(user, 'JLPT N4');
    await user.click(document.body);
    await back(user);
    expect(counter().position).toBe(10);
    expect(currentCardLevel()).toBe('JLPT N4');
  });

  test('the cards I saw are not kept after a reload, and Back saves nothing', async () => {
    const user = await renderApp();
    await next(user, 3);
    const saved = storageContents();
    const setItem = vi.spyOn(Storage.prototype, 'setItem');

    await back(user);
    await user.keyboard('{ArrowLeft}');

    expect(setItem).not.toHaveBeenCalled();
    expect(storageContents()).toEqual(saved);

    const reloaded = await reload(makeWords(200));
    expect(counter().position).toBe(1);
    await back(reloaded);
    // Nothing seen yet after the reload: Back wraps to the last card.
    expect(counter().position).toBe(10);
  });

  test('Back remembers the last 50 cards I saw, then carries on in deck order', async () => {
    const user = await renderApp();
    // With the random source fixed at 0, Deck Shuffle goes between cards 1 and 2.
    vi.spyOn(Math, 'random').mockReturnValue(0);
    await user.click(document.body);
    for (let i = 0; i < 60; i++) await user.keyboard('s');
    expect(counter().position).toBe(1);

    for (let i = 0; i < 50; i++) await user.keyboard('{ArrowLeft}');
    // 50 cards back, still going between cards 2 and 1.
    expect(counter().position).toBe(1);

    await user.keyboard('{ArrowLeft}');
    // The 10 older cards have dropped off, so Back goes on in deck order: wrapping to the last card,
    // not to card 2.
    expect(counter().position).toBe(10);
  }, 60_000);

  test('going Back counts as moving on from a "New" card, so its badge goes', async () => {
    const user = await renderApp(makeDecks({ N5: 30, N4: 30 }));
    await shuffleIn(user, '1');
    const shuffledIn = currentWord();
    expect(onScreenIsNew()).toBe(true);

    await back(user);
    expect(currentWord()).not.toBe(shuffledIn);
    await next(user);

    expect(currentWord()).toBe(shuffledIn);
    expect(onScreenIsNew()).toBe(false);
  });

  test('a "New" card I reach with Back shows its badge until I move on from it', async () => {
    const user = await renderApp(makeDecks({ N5: 30, N4: 30 }));
    // Every card is shuffled in, so every card is new.
    await shuffleIn(user, '10');
    await user.click(document.body);
    expect(onScreenIsNew()).toBe(true);

    // Nothing seen yet, so Back goes to the last card, which I haven't moved on from.
    await back(user);
    expect(counter().position).toBe(10);
    expect(onScreenIsNew()).toBe(true);

    // Card 1 was moved on from by going Back, so it is no longer new.
    await next(user);
    expect(counter().position).toBe(1);
    expect(onScreenIsNew()).toBe(false);
    // Card 10 has now been moved on from too.
    await back(user);
    expect(counter().position).toBe(10);
    expect(onScreenIsNew()).toBe(false);
  });
});

describe('the Back button on screen', () => {
  test('Back is a real button named "Back", in the card controls before Next, with Deck Shuffle below them', async () => {
    await renderApp();
    {
      const controls = screen.getByRole('navigation', { name: 'Card controls' });
      const buttons = within(controls).getAllByRole('button');
      expect(buttons.map((b) => b.textContent)).toEqual(['← Back', 'Next →', '🔀 Deck Shuffle']);
      expect(buttons.map((b) => b.tagName)).toEqual(['BUTTON', 'BUTTON', 'BUTTON']);
      // The arrow is decorative, so screen readers hear just "Back".
      expect(backButton()).toHaveAccessibleName('Back');
      // Two rows: Back | Next, then Deck Shuffle across both columns (class check, as jsdom has no layout).
      expect(controls).toHaveClass('grid-cols-2');
      expect(deckShuffleButton()).toHaveClass('col-span-2');
      for (const b of buttons) expect(b).toHaveClass('min-h-12', 'rounded-xl');
    }
  });

  test('Back is an outline button with a visible focus ring that can be told apart in forced-colours mode', async () => {
    await renderApp();
    // Colours, focus rings and forced colours can't be seen in jsdom, so this checks the classes.
    // Since FEAT5 the colours are colour mode tokens; in Light they are the same colours as before
    // (white, a slate-400 border, slate-900 text, slate-100 under the pointer).
    expect(backButton()).toHaveClass('border', 'border-back-line', 'bg-back', 'text-ink-strong', 'font-semibold');
    expect(backButton()).toHaveClass('hover:bg-back-hover');
    expect(backButton()).toHaveClass('focus-visible:outline-2', 'focus-visible:outline-ink-strong');
    expect(backButton()).toHaveClass('forced-colors:border-[color:ButtonText]');
    expect(MODE_COLORS.light['back-line']).toBe(tailwindColor('slate-400'));
    expect(MODE_COLORS.light.back).toBe('#fff');
    expect(MODE_COLORS.light['back-hover']).toBe(tailwindColor('slate-100'));
    expect(MODE_COLORS.light['ink-strong']).toBe(tailwindColor('slate-900'));
    // Next and Deck Shuffle keep their colours (Next: slate-900 with white text in Light).
    expect(nextButton()).toHaveClass('bg-next', 'text-next-ink');
    expect(MODE_COLORS.light.next).toBe(tailwindColor('slate-900'));
    expect(MODE_COLORS.light['next-ink']).toBe('#fff');
    expect(deckShuffleButton()).toHaveClass('bg-indigo-600', 'text-white');
  });

  test('the keyboard hint mentions the Left arrow for Back', async () => {
    await renderApp();
    expect(screen.getByText('Keyboard: ← back · → next · S deck shuffle')).toBeInTheDocument();
  });

  test('going Back, the card slides in from the opposite side to Next', async () => {
    setReducedMotion(false);
    const user = await renderApp();
    await next(user);
    expect(arrivingCard()).toHaveClass('deal-next');

    await back(user);

    // Animations can't run in jsdom, so this checks the class that draws the slide.
    expect(arrivingCard()).toHaveClass('deal-back');
    expect(arrivingCard()).not.toHaveClass('deal-next');
  });

  test('with "reduce motion" on, going Back has no slide animation', async () => {
    setReducedMotion(true);
    const user = await renderApp();
    await next(user);

    await back(user);

    expect(counter().position).toBe(1);
    expect(arrivingCard()).not.toHaveClass('deal-back');
  });
});
