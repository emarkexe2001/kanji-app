// CHORE8: each place that uses a card's data handles a card whose data is missing (FEAT2_6), on purpose.
import { act, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import type { WordEntry } from '@kanji/core';
import App from '../../src/app/app';
import type { Library } from '../../src/features/deck/utils/decks';
import {
  counter,
  currentWord,
  enterCardLimit,
  makeDecks,
  makeWords,
  renderApp,
  serveDeck,
  shuffleIn,
  type User,
} from './helpers';

/**
 * The ids whose data is missing when the app loads, and the library the app built, so a test can
 * also make a card's data go missing while the app is open. The app checks the dictionary and saved
 * cards as it loads them, so a card with no data at all can't be set up through them (see
 * missing-card-data.test.tsx, which does the same).
 */
const missing = vi.hoisted(() => ({ ids: [] as string[], library: null as Library | null }));

vi.mock('../../src/features/deck/utils/decks', async (importOriginal) => {
  const real = await importOriginal<typeof import('../../src/features/deck/utils/decks')>();
  return {
    ...real,
    buildLibrary: (words: WordEntry[]) => {
      const library = real.buildLibrary(words);
      for (const id of missing.ids) library.byId.set(id, undefined as unknown as WordEntry);
      missing.library = library;
      return library;
    },
  };
});

/** Makes card `id`'s data go missing while the app is open. */
function loseData(id: string) {
  missing.library!.byId.set(id, undefined as unknown as WordEntry);
}

const MESSAGE = "This card can't be shown.";
const DECK_MESSAGE = 'Something went wrong showing the cards. Please reload the page to try again.';

const shuffledOutButton = () => screen.getByRole('button', { name: /^Shuffled out \(\d+\)$/ });
const shownCount = () => Number(/\((\d+)\)/.exec(shuffledOutButton().textContent ?? '')![1]);
const panel = () => screen.queryByRole('region', { name: 'Shuffled-out cards' });
const addBackGroup = () => within(screen.getByRole('group', { name: 'Add back' }));
const takeOutGroup = () => within(screen.getByRole('group', { name: /^Take out of your deck/ }));
const cardOf = (checkbox: HTMLElement) => checkbox.closest('label')!;
const nextButton = () => screen.getByRole('button', { name: 'Next →' });
const backButton = () => screen.getByRole('button', { name: 'Back' });

/** A saved deck of JLPT N5 cards 1 to `size`, with the card limit set to match. */
function saveN5Deck(size: number) {
  localStorage.setItem('kanji.deckSize', String(size));
  localStorage.setItem(
    'kanji.savedDeck',
    JSON.stringify({
      deck: 'N5',
      cards: Array.from({ length: size }, (_, i) => ({ id: `N5-${i + 1}`, deck: 'N5' })),
      newIds: [],
    }),
  );
}

/** JLPT N3 cards shuffled out earlier, newest first (N3 isn't the deck being studied). */
function saveShuffledOutN3(...ids: string[]) {
  localStorage.setItem(
    'kanji.removedCards',
    JSON.stringify(ids.map((id, i) => ({ id, deck: 'N3', reason: 'shuffled-out', removedAt: ids.length - i }))),
  );
}

// ---- A small stand-in for the Web Animations API, which jsdom doesn't have (see card-slides.test.tsx) ----
interface FakeAnimation {
  el: HTMLElement;
  onfinish: (() => void) | null;
  cancelled: boolean;
}
let animations: FakeAnimation[] = [];

function fakeAnimate() {
  animations = [];
  function animate(this: HTMLElement) {
    const a: FakeAnimation = { el: this, onfinish: null, cancelled: false };
    animations.push(a);
    return Object.assign(a, { cancel: () => (a.cancelled = true) });
  }
  Object.defineProperty(Element.prototype, 'animate', { value: animate, configurable: true, writable: true });
}

/** The slides still running, oldest first. */
const sliding = () => animations.filter((a) => !a.cancelled && a.el.isConnected);
/** Lands every card still sliding, one by one. */
function landAll() {
  while (sliding().length) act(() => sliding()[0].onfinish?.());
}
/** The cards drawn sliding, in the order they started. */
const flyers = () => [...document.querySelectorAll<HTMLElement>('[data-card-flights] .card-flyer')];
/** The word on a sliding card, or null for a blank card back. */
const flyerWord = (el: HTMLElement) => el.querySelector('h2')?.textContent ?? null;

let consoleError: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  missing.ids = [];
  missing.library = null;
  delete (Element.prototype as { animate?: unknown }).animate;
  vi.restoreAllMocks();
});

describe('the card on screen with missing data (answer 5)', () => {
  test('moving on to a card whose data is missing shows the deck-wide message, not "This card can\'t be shown.", and logs "Card on screen has no data"', async () => {
    missing.ids = ['N5-2'];
    saveN5Deck(5);
    const user = await renderApp(makeDecks({ N5: 30, N4: 30 }));
    expect(currentWord()).toBe('N5単語1【たんご1】');
    expect(consoleError).not.toHaveBeenCalled();

    await user.click(nextButton());

    expect(screen.getByRole('alert')).toHaveTextContent(DECK_MESSAGE);
    expect(screen.queryByText(MESSAGE)).not.toBeInTheDocument();
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
    // Thrown on purpose, not a crash on the missing data (a TypeError).
    expect(consoleError).toHaveBeenCalledWith(
      'Error while rendering the deck:',
      expect.objectContaining({ message: 'Card on screen has no data' }),
      expect.anything(),
    );
    expect(consoleError).not.toHaveBeenCalledWith(
      'Error while rendering the deck:',
      expect.any(TypeError),
      expect.anything(),
    );
  });

  test('opening the app on a card whose data is missing shows the deck-wide message and logs "Card on screen has no data"', async () => {
    missing.ids = ['N5-1'];
    saveN5Deck(5);
    // Not renderApp, which waits for a card that never comes here.
    serveDeck(makeDecks({ N5: 30, N4: 30 }));
    render(<App />);
    expect(await screen.findByRole('alert')).toHaveTextContent(DECK_MESSAGE);
    expect(screen.queryByText(MESSAGE)).not.toBeInTheDocument();
    expect(consoleError).toHaveBeenCalledWith(
      'Error while rendering the deck:',
      expect.objectContaining({ message: 'Card on screen has no data' }),
      expect.anything(),
    );
  });
});

describe('a pick card with missing data (answer 4, addition)', () => {
  test('it shows the same message, drawn the same way, as a card that breaks while it is drawn, and only the broken card logs an error', async () => {
    // N3 word 1 breaks while it is drawn (no reading breakdown); N3 word 2's data is missing.
    missing.ids = ['N3-2'];
    const n3 = makeWords(2, 'N3');
    saveShuffledOutN3('N3-2', 'N3-1');
    const user = await renderApp([
      ...makeDecks({ N5: 30, N4: 30 }),
      { ...n3[0], segments: null } as unknown as WordEntry,
      n3[1],
    ]);
    await user.click(shuffledOutButton());

    const [missingItem, brokenItem] = addBackGroup().getAllByRole('listitem');
    const missingMessage = within(missingItem).getByText(MESSAGE);
    const brokenMessage = within(brokenItem).getByText(MESSAGE);
    // The same element with the same look: comparing the markup is the only way to see the look in jsdom.
    expect(missingMessage.outerHTML).toBe(brokenMessage.outerHTML);
    expect(addBackGroup().queryAllByRole('checkbox')).toHaveLength(0);
    // Only the broken card reached its error boundary, so the error is logged once.
    expect(consoleError).toHaveBeenCalledWith('Error while drawing a card:', expect.any(TypeError), expect.anything());
    expect(consoleError.mock.calls.filter((c: unknown[]) => c[0] === 'Error while drawing a card:')).toHaveLength(1);
  });
});

describe('moving cards with missing data (additions)', () => {
  test('a lower card limit takes a missing card out of the deck: one blank card slides into the button, the count goes up as it lands, and the list shows the message', async () => {
    missing.ids = ['N5-5'];
    saveN5Deck(5);
    const user = await renderApp(makeDecks({ N5: 30, N4: 30 }));
    fakeAnimate();

    await enterCardLimit(user, '4');

    expect(flyers()).toHaveLength(1);
    expect(flyerWord(flyers()[0])).toBeNull();
    expect(shownCount()).toBe(0);
    landAll();
    expect(shownCount()).toBe(1);
    expect(counter()).toEqual({ position: 1, total: 4 });

    await user.click(shuffledOutButton());
    const items = addBackGroup().getAllByRole('listitem');
    expect(items).toHaveLength(1);
    expect(within(items[0]).getByText(MESSAGE)).toBeInTheDocument();
    expect(addBackGroup().queryAllByRole('checkbox')).toHaveLength(0);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(consoleError).not.toHaveBeenCalled();
  });

  test('Shuffle In Cards takes a missing card out with the others: the card on screen and blank cards slide into the button, and the list shows the message for it', async () => {
    missing.ids = ['N5-3'];
    saveN5Deck(5);
    const user = await renderApp(makeDecks({ N5: 30, N4: 30 }));
    fakeAnimate();

    await shuffleIn(user, '5');

    // The card that was on screen, then the other 4 (the missing one among them) as blank cards.
    expect(flyers().map(flyerWord)).toEqual(['N5単語1【たんご1】', null, null, null, null]);
    landAll();
    expect(shownCount()).toBe(5);
    expect(currentWord()).not.toMatch(/^N5/);

    await user.click(shuffledOutButton());
    expect(addBackGroup().getAllByRole('listitem')).toHaveLength(5);
    expect(screen.getAllByText(MESSAGE)).toHaveLength(1);
    expect(addBackGroup().getAllByRole('checkbox')).toHaveLength(4);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(consoleError).not.toHaveBeenCalled();
  });

  test("Add Back when a picked card's data goes missing before it slides: the other card still slides in, the panel lifts away and the deck works", async () => {
    saveN5Deck(5);
    saveShuffledOutN3('N3-2', 'N3-1');
    const user = await renderApp([...makeDecks({ N5: 30, N4: 30 }), ...makeWords(2, 'N3')]);
    await pickBoth(user);
    fakeAnimate();

    loseData('N3-1');
    await user.click(screen.getByRole('button', { name: 'Add Back Cards' }));

    // Only the card with data slides; the deck shows the first card added back straight away.
    expect(flyers().map(flyerWord)).toEqual(['N3単語2【たんご2】']);
    expect(currentWord()).toBe('N3単語2【たんご2】');
    landAll();
    await waitFor(() => expect(panel()).not.toBeInTheDocument());
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(counter()).toEqual({ position: 2, total: 5 });
    expect(shownCount()).toBe(2);

    // The missing card is now in the deck, and shows the message in "Take out of your deck".
    await user.click(shuffledOutButton());
    await user.click(cardOf(addBackGroup().getAllByRole('checkbox')[0]));
    const items = takeOutGroup().getAllByRole('listitem');
    expect(within(items[2]).getByText(MESSAGE)).toBeInTheDocument();
    expect(consoleError).not.toHaveBeenCalled();
  });

  test("Add Back when the card on screen's data goes missing before the cards slide in: the deck shows the first card added back straight away, and nothing breaks", async () => {
    saveN5Deck(5);
    saveShuffledOutN3('N3-2', 'N3-1');
    const user = await renderApp([...makeDecks({ N5: 30, N4: 30 }), ...makeWords(2, 'N3')]);
    expect(currentWord()).toBe('N5単語1【たんご1】');
    await pickBoth(user);
    fakeAnimate();

    // Card 1, on screen, stays in the deck (cards 2 and 3 are taken out).
    loseData('N5-1');
    await user.click(screen.getByRole('button', { name: 'Add Back Cards' }));

    // Both cards slide in. With no card on screen to hold, the deck shows the first card added back.
    expect(flyers().map(flyerWord)).toEqual(['N3単語2【たんご2】', 'N3単語1【たんご1】']);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(currentWord()).toBe('N3単語2【たんご2】');
    landAll();
    await waitFor(() => expect(panel()).not.toBeInTheDocument());
    expect(counter()).toEqual({ position: 2, total: 5 });
    await user.click(nextButton());
    expect(currentWord()).toBe('N3単語1【たんご1】');
    expect(consoleError).not.toHaveBeenCalled();
  });
});

/** Opens the panel, picks both N3 cards to add back and takes out deck cards 2 and 3. */
async function pickBoth(user: User) {
  await user.click(shuffledOutButton());
  await user.click(cardOf(addBackGroup().getByRole('checkbox', { name: 'N3単語2【たんご2】' })));
  await user.click(cardOf(addBackGroup().getByRole('checkbox', { name: 'N3単語1【たんご1】' })));
  await user.click(cardOf(takeOutGroup().getByRole('checkbox', { name: /^Card 2: / })));
  await user.click(cardOf(takeOutGroup().getByRole('checkbox', { name: /^Card 3: / })));
}

describe('Back in a deck with a missing card (addition)', () => {
  test('Back goes to the card seen before, and from the first card to the last, past nothing missing', async () => {
    missing.ids = ['N5-3'];
    saveN5Deck(5);
    const user = await renderApp(makeDecks({ N5: 30, N4: 30 }));

    await user.click(nextButton());
    expect(currentWord()).toBe('N5単語2【たんご2】');
    await user.click(backButton());
    expect(currentWord()).toBe('N5単語1【たんご1】');
    await user.click(backButton());
    expect(currentWord()).toBe('N5単語5【たんご5】');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(consoleError).not.toHaveBeenCalled();
  });

  test('Back onto the missing card shows the deck-wide message (answer 5)', async () => {
    missing.ids = ['N5-3'];
    saveN5Deck(5);
    const user = await renderApp(makeDecks({ N5: 30, N4: 30 }));

    await user.click(backButton()); // card 5
    await user.click(backButton()); // card 4
    expect(currentWord()).toBe('N5単語4【たんご4】');
    await user.click(backButton()); // card 3, the missing one

    expect(screen.getByRole('alert')).toHaveTextContent(DECK_MESSAGE);
    expect(consoleError).toHaveBeenCalledWith(
      'Error while rendering the deck:',
      expect.objectContaining({ message: 'Card on screen has no data' }),
      expect.anything(),
    );
  });
});
