// ADJ1: the "Shuffled out (N)" button in the top right of the header, and its panel just below it.
import { render, screen, within } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import App from '../../src/app/app';
import {
  COUNTER,
  currentWord,
  deckContents,
  enterCardLimit,
  makeDecks,
  renderApp,
  shuffleIn,
  shuffleInButton,
  type User,
} from './helpers';

const DECKS = makeDecks({ N5: 30, N4: 30 });

const title = () => screen.getByRole('heading', { level: 1, name: 'Kanji Reading Highlighter' });
const header = () => title().closest('header')!;
const shuffledOutButton = () => screen.getByRole('button', { name: /^Shuffled out \(\d+\)$/ });
const panel = () => screen.queryByRole('region', { name: 'Shuffled-out cards' });
const deckPicker = () => screen.getByLabelText('Deck');

/** True when `a` comes before `b` on the page. */
const isBefore = (a: Node, b: Node) => Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);

/** Shuffles in one card, then moves on, and returns the word that was shuffled out. */
async function shuffleOutOne(user: User) {
  const word = currentWord();
  await shuffleIn(user, '1');
  await user.click(screen.getByRole('button', { name: 'Next →' }));
  return word;
}

describe('Shuffled-out button in the top right of the header', () => {
  test('when I open the app, the "Shuffled out (N)" button is in the header next to the title, and not under Shuffle In Cards', async () => {
    await renderApp(DECKS);

    // There is only one such button, and it is in the header, after the title.
    expect(screen.getAllByRole('button', { name: /^Shuffled out/ })).toHaveLength(1);
    expect(header()).toContainElement(shuffledOutButton());
    expect(isBefore(title(), shuffledOutButton())).toBe(true);
    expect(shuffledOutButton()).toHaveTextContent('Shuffled out (0)');

    // It comes before the deck, not under Shuffle In Cards.
    expect(isBefore(shuffledOutButton(), deckPicker())).toBe(true);
    expect(isBefore(shuffledOutButton(), shuffleInButton())).toBe(true);
    expect(header()).not.toContainElement(shuffleInButton());
  });

  test('the title and the button share one row at the top: the button stays top right and the title wraps when they do not fit', async () => {
    await renderApp(DECKS);

    // jsdom has no layout, so the classes are checked: the header is one row with the title on the
    // left and the button on the right, both at the top; the title may shrink (and so wrap onto
    // two lines), the button never shrinks or wraps. Checked in a real browser at 360/640/1024px.
    expect(header()).toHaveClass('flex', 'items-start', 'justify-between');
    expect(header().className).not.toMatch(/(^|\s)(flex-col|flex-wrap)(\s|$)/);
    expect(title()).toHaveClass('min-w-0');
    expect(title()).not.toHaveClass('truncate', 'whitespace-nowrap');
    expect(shuffledOutButton()).toHaveClass('shrink-0', 'whitespace-nowrap');
    expect(shuffledOutButton()).not.toHaveClass('w-full');
  });

  test('on a narrow phone the button keeps its full "Shuffled out (N)" label, even with 100 cards', async () => {
    const user = await renderApp(makeDecks({ N5: 160 }));
    await enterCardLimit(user, '150');
    await enterCardLimit(user, '1'); // 149 cards drop out; only the newest 100 are kept

    // The full label, not a shorter one such as "Out (100)".
    expect(within(header()).getByRole('button', { name: 'Shuffled out (100)' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Out \(/ })).not.toBeInTheDocument();
  });

  test('when I press the button, the panel opens below the header and above the deck, and pressing it again closes it', async () => {
    const user = await renderApp(DECKS);
    await shuffleOutOne(user);
    expect(shuffledOutButton()).toHaveAttribute('aria-expanded', 'false');
    expect(panel()).not.toBeInTheDocument();

    await user.click(shuffledOutButton());
    expect(shuffledOutButton()).toHaveAttribute('aria-expanded', 'true');
    const open = panel()!;
    expect(shuffledOutButton()).toHaveAttribute('aria-controls', open.id);
    // Below the header (not inside it), above the deck picker, the card and the deck's controls.
    expect(header()).not.toContainElement(open);
    expect(isBefore(header(), open)).toBe(true);
    expect(isBefore(open, deckPicker())).toBe(true);
    expect(isBefore(open, screen.getByText(COUNTER))).toBe(true);
    expect(isBefore(open, shuffleInButton())).toBe(true);

    await user.click(shuffledOutButton());
    expect(shuffledOutButton()).toHaveAttribute('aria-expanded', 'false');
    expect(panel()).not.toBeInTheDocument();
  });

  test('when I close the panel and open it again, the cards I had picked are no longer picked', async () => {
    const user = await renderApp(DECKS);
    const word = await shuffleOutOne(user);
    await user.click(shuffledOutButton());
    await user.click(screen.getByRole('checkbox', { name: word! }).closest('label')!);
    expect(screen.getByRole('checkbox', { name: word! })).toBeChecked();

    await user.click(shuffledOutButton());
    await user.click(shuffledOutButton());
    expect(screen.getByRole('checkbox', { name: word! })).not.toBeChecked();
    expect(screen.queryByRole('group', { name: /^Take out of your deck/ })).not.toBeInTheDocument();
  });

  test('when I add cards back from the panel in its new place, they are in my deck, the same as before', async () => {
    const user = await renderApp(DECKS);
    const word = await shuffleOutOne(user);
    expect(words(await deckContents(user))).not.toContain(word);

    await user.click(shuffledOutButton());
    await user.click(screen.getByRole('checkbox', { name: word! }).closest('label')!);
    const takeOut = within(screen.getByRole('group', { name: /^Take out of your deck/ }));
    await user.click(takeOut.getByRole('checkbox', { name: /^Card 1: / }).closest('label')!);
    await user.click(screen.getByRole('button', { name: 'Add Back Cards' }));

    // The panel closes, the button says so, and the card is back in the deck.
    expect(panel()).not.toBeInTheDocument();
    expect(shuffledOutButton()).toHaveAttribute('aria-expanded', 'false');
    expect(currentWord()).toBe(word);
    expect(words(await deckContents(user))).toContain(word);
    expect(shuffledOutButton()).toHaveTextContent('Shuffled out (1)'); // the swapped-out card
  });

  test('with the keyboard, Tab reaches the button first, then the panel when it is open, then the deck', async () => {
    const user = await renderApp(DECKS);
    const word = await shuffleOutOne(user);
    (document.activeElement as HTMLElement | null)?.blur();

    // Closed: the button, then the deck picker.
    await user.tab();
    expect(shuffledOutButton()).toHaveFocus();
    await user.tab();
    expect(deckPicker()).toHaveFocus();

    // Open: the button, then the panel's cards, then on through the panel to the deck picker.
    shuffledOutButton().focus();
    await user.keyboard('{Enter}');
    expect(shuffledOutButton()).toHaveAttribute('aria-expanded', 'true');
    await user.tab();
    expect(screen.getByRole('checkbox', { name: word! })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Add Back Cards' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Clear List' })).toHaveFocus();
    await user.tab();
    expect(deckPicker()).toHaveFocus();
  });

  test('while the dictionary is loading or fails to load, the title is shown without the button', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Promise.reject(new TypeError('Failed to fetch'))),
    );
    render(<App />);
    expect(screen.getByText('Loading dictionary…')).toBeInTheDocument();
    expect(title()).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Shuffled out/ })).not.toBeInTheDocument();
    await screen.findByText(/Couldn't load the word deck/);
    expect(title()).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Shuffled out/ })).not.toBeInTheDocument();
  });
});

const words = (cards: { word: string | null }[]) => cards.map((c) => c.word);
