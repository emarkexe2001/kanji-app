// FEAT3: Shuffle In Cards from multiple decks, and the "Shuffle in from" switch (One deck | Random | Multiple decks).
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { WordEntry } from '@kanji/core';
import { describe, expect, test, vi } from 'vitest';
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
  enterCardLimit,
  makeDecks,
  makeWords,
  modeRadio,
  oneDeckSelect,
  renderApp,
  serveDeck,
  shuffleIn,
  tickDecks,
  wordsSeenWithNext,
} from './helpers';

/** The app studies JLPT N5 by default; N4, N3 and N2 can be shuffled in from. */
const FOUR_DECKS = makeDecks({ N5: 30, N4: 30, N3: 30, N2: 30 });

/** Closes the app and opens it again with the same storage, like reloading the page. */
async function reload(words: WordEntry[] = FOUR_DECKS) {
  cleanup();
  serveDeck(words);
  render(<App />);
  await screen.findByText(COUNTER);
  return userEvent.setup();
}

const levels = (cards: { level: string | null }[]) => cards.map((c) => c.level);
const count = (items: (string | null)[], value: string) => items.filter((i) => i === value).length;
const switchGroup = () => screen.getByRole('group', { name: 'Shuffle in from' });
const decksGroup = () => screen.queryByRole('group', { name: 'Decks to shuffle in from' });
const checkboxLabels = () =>
  within(decksGroup()!)
    .getAllByRole('checkbox')
    .map((c) => c.closest('label')?.textContent);
const tickedLabels = () =>
  within(decksGroup()!)
    .getAllByRole('checkbox')
    .filter((c) => (c as HTMLInputElement).checked)
    .map((c) => c.closest('label')?.textContent);
/** The amber notice about unticked decks (the summary is the other status on the page). */
const untickedNotice = () => screen.queryByText(/no longer available/);

describe('the "Shuffle in from" switch', () => {
  test('it is a group of three radio buttons, One deck | Random | Multiple decks, with One deck chosen at first', async () => {
    await renderApp(FOUR_DECKS);

    const radios = within(switchGroup()).getAllByRole('radio');
    expect(radios.map((r) => r.closest('label')?.textContent)).toEqual(['One deck', 'Random', 'Multiple decks']);
    expect(modeRadio('One deck')).toBeChecked();
    // One deck shows its dropdown; the checkboxes only show under Multiple decks.
    expect(oneDeckSelect()).toBeInTheDocument();
    expect(decksGroup()).not.toBeInTheDocument();
  });

  test('the arrow keys move between the choices, like any radio group', async () => {
    const user = await renderApp(FOUR_DECKS);
    await user.click(modeRadio('One deck'));

    await user.keyboard('{ArrowRight}');
    expect(modeRadio('Random')).toBeChecked();
    expect(modeRadio('Random')).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(modeRadio('Multiple decks')).toBeChecked();
    expect(decksGroup()).toBeInTheDocument();
  });

  test('Random shows nothing extra, and One deck shows the deck dropdown', async () => {
    const user = await renderApp(FOUR_DECKS);

    await chooseMode(user, 'Random');
    expect(screen.queryByLabelText('Deck to shuffle in from')).not.toBeInTheDocument();
    expect(decksGroup()).not.toBeInTheDocument();

    await chooseMode(user, 'One deck');
    expect(Array.from(oneDeckSelect().options).map((o) => o.text)).toEqual(['JLPT N4', 'JLPT N3', 'JLPT N2']);
  });

  test('the chosen segment is emerald-700 with white text (passing 4.5:1), focus shows inside it, and in a high-contrast mode it uses the system Highlight colours', async () => {
    await renderApp(FOUR_DECKS);

    // jsdom can't show colours or switch on forced colours, so the classes are checked.
    const segment = modeRadio('One deck').closest('label')!;
    expect(segment).toHaveClass(
      'has-checked:bg-emerald-700',
      'has-checked:text-white',
      'has-focus-visible:outline-2',
      'has-focus-visible:outline-current',
      'forced-colors:forced-color-adjust-none',
      'forced-colors:has-checked:bg-[color:Highlight]',
      'forced-colors:has-checked:text-[color:HighlightText]',
    );
    // The radio itself is only visually hidden, so it can still be focused and used with the keyboard.
    expect(modeRadio('One deck')).toHaveClass('sr-only');
  });

  test('with fewer than two other decks, Multiple decks is disabled and says why', async () => {
    await renderApp(makeDecks({ N5: 30, N4: 30 }));

    expect(modeRadio('Multiple decks')).toBeDisabled();
    expect(modeRadio('Multiple decks')).toHaveAccessibleDescription('Needs at least two other decks.');
    expect(modeRadio('One deck')).toBeEnabled();
    expect(modeRadio('Random')).toBeEnabled();
  });

  test('with two or more other decks, Multiple decks can be chosen and there is no hint', async () => {
    await renderApp(makeDecks({ N5: 30, N4: 30, N3: 30 }));

    expect(modeRadio('Multiple decks')).toBeEnabled();
    expect(screen.queryByText('Needs at least two other decks.')).not.toBeInTheDocument();
  });
});

describe('Shuffle In Cards from multiple decks', () => {
  test('when I first choose Multiple decks, a checkbox is shown for each other deck and none is ticked', async () => {
    const user = await renderApp(FOUR_DECKS);

    await chooseMode(user, 'Multiple decks');

    expect(checkboxLabels()).toEqual(['JLPT N4', 'JLPT N3', 'JLPT N2']);
    expect(tickedLabels()).toEqual([]);
    expect(screen.queryByLabelText('Deck to shuffle in from')).not.toBeInTheDocument();
  });

  test('the deck being studied is never offered as a checkbox', async () => {
    const user = await renderApp(FOUR_DECKS);
    await chooseMode(user, 'Multiple decks');
    expect(checkboxLabels()).not.toContain('JLPT N5');

    await chooseDeck(user, 'JLPT N3');
    expect(checkboxLabels()).toEqual(['JLPT N5', 'JLPT N4', 'JLPT N2']);
  });

  test('the checkboxes are laid out 2 per row', async () => {
    const user = await renderApp(FOUR_DECKS);
    await chooseMode(user, 'Multiple decks');

    // jsdom has no layout, so the grid's class is checked. The layout itself needs a real browser check.
    expect(within(decksGroup()!).getAllByRole('checkbox')[0].closest('label')!.parentElement).toHaveClass(
      'grid-cols-2',
    );
  });

  test('when I choose Multiple decks and tick two decks, the new cards only come from the decks I ticked', async () => {
    const user = await renderApp(FOUR_DECKS);
    await tickDecks(user, 'JLPT N4', 'JLPT N2');

    await shuffleIn(user, '10');

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    const cardLevels = levels(await deckContents(user));
    expect(cardLevels).toHaveLength(10);
    expect(cardLevels.every((l) => l === 'JLPT N4' || l === 'JLPT N2')).toBe(true);
  });

  test('when I shuffle in several cards from multiple decks, my deck size still matches my card limit and the card that was on screen is gone', async () => {
    const user = await renderApp(FOUR_DECKS);
    await wordsSeenWithNext(user, 2); // card 3 of 10
    const before = currentWord();
    await tickDecks(user, 'JLPT N4', 'JLPT N3');

    await shuffleIn(user, '4');

    expect(['JLPT N4', 'JLPT N3']).toContain(currentCardLevel());
    expect(counter()).toEqual({ position: 3, total: 10 });
    expect(screen.getByRole('status')).toHaveTextContent(/^Shuffled out cards \d+, \d+, \d+ and \d+ of 10$/);
    const cards = await deckContents(user);
    expect(cards).toHaveLength(10);
    expect(new Set(cards.map((c) => c.word)).size).toBe(10);
    expect(cards.map((c) => c.word)).not.toContain(before);
    expect(count(levels(cards), 'JLPT N4') + count(levels(cards), 'JLPT N3')).toBe(4);
    expect(count(levels(cards), 'JLPT N5')).toBe(6);
  });

  test('cards are picked at random from the ticked decks combined, so a bigger deck gives more cards', async () => {
    // N4 has 1 new card and N3 has 9. Pooled together (N4 first) a pick of 0.15 lands on the
    // second card, an N3 card; picking a deck evenly first would have picked N4 with 0.15.
    const user = await renderApp(makeDecks({ N5: 30, N4: 1, N3: 9 }));
    await tickDecks(user, 'JLPT N4', 'JLPT N3');
    vi.spyOn(Math, 'random').mockReturnValue(0.15);

    await shuffleIn(user, '1');
    expect(currentCardLevel()).toBe('JLPT N3');
  });

  test('a card in two ticked decks (e.g. JLPT N4 and Common words) is only counted and shuffled in once', async () => {
    // Every N4 word is also common, so Common words holds the same 5 cards as N4.
    const words = [...makeWords(30, 'N5'), ...makeWords(5, 'N4').map((w) => ({ ...w, common: true })), ...makeWords(1)];
    const user = await renderApp(words);
    await tickDecks(user, 'JLPT N4', 'Common words');
    const before = await deckContents(user);

    // 6 different cards between them (5 shared, 1 only in Common words), not 11.
    await shuffleIn(user, '7');
    expect(screen.getByRole('alert')).toHaveTextContent(
      'The ticked decks only have 6 new cards left. Tick more decks or shuffle in fewer cards.',
    );
    expect(await deckContents(user)).toEqual(before);

    await shuffleIn(user, '6');
    const cards = (await deckContents(user)).map((c) => c.word);
    expect(cards).toHaveLength(10);
    expect(new Set(cards).size).toBe(10);
  });

  test('cards shuffled out from multiple decks go into the Shuffled-out cards list', async () => {
    const user = await renderApp(FOUR_DECKS);
    const before = currentWord();
    await tickDecks(user, 'JLPT N4', 'JLPT N3');

    await shuffleIn(user, '3');

    await user.click(screen.getByRole('button', { name: 'Shuffled out (3)' }));
    const listed = within(screen.getByRole('group', { name: 'Add back' }))
      .getAllByRole('checkbox')
      .map((c) => c.getAttribute('aria-label'));
    expect(listed).toHaveLength(3);
    expect(listed).toContain(before);
  });

  test('when I reload the app, my Multiple decks choice and the ticked decks are remembered', async () => {
    const user = await renderApp(FOUR_DECKS);
    await tickDecks(user, 'JLPT N4', 'JLPT N2');

    const reloaded = await reload();

    expect(modeRadio('Multiple decks')).toBeChecked();
    expect(tickedLabels()).toEqual(['JLPT N4', 'JLPT N2']);
    expect(untickedNotice()).not.toBeInTheDocument();
    await shuffleIn(reloaded, '10');
    expect(levels(await deckContents(reloaded)).every((l) => l === 'JLPT N4' || l === 'JLPT N2')).toBe(true);
  });

  test('when I switch from Multiple decks back to One deck, shuffling in works as it does in FEAT1', async () => {
    const user = await renderApp(FOUR_DECKS);
    await tickDecks(user, 'JLPT N4', 'JLPT N2');

    await chooseSource(user, 'JLPT N3');
    await shuffleIn(user, '3');

    expect(currentCardLevel()).toBe('JLPT N3');
    expect(count(levels(await deckContents(user)), 'JLPT N3')).toBe(3);
    expect(decksGroup()).not.toBeInTheDocument();
  });

  test('when I switch from Multiple decks back to Random, shuffling in works as it does in FEAT1', async () => {
    // N5 has plenty of new cards, so a Random that used it would show up here.
    const user = await renderApp(makeDecks({ N5: 200, N4: 3, N3: 3, N2: 5 }));
    await tickDecks(user, 'JLPT N4', 'JLPT N3');

    await chooseMode(user, 'Random');
    await shuffleIn(user, '10');

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    const cardLevels = levels(await deckContents(user));
    expect(cardLevels.every((l) => l !== 'JLPT N5')).toBe(true);
    // Random uses every other deck, not just the ticked ones: N4 and N3 only have 6 cards between them.
    expect(count(cardLevels, 'JLPT N2')).toBeGreaterThanOrEqual(4);
  });

  test('my ticks are kept while I use another choice, and are there again when I go back to Multiple decks, even after a reload', async () => {
    const user = await renderApp(FOUR_DECKS);
    await tickDecks(user, 'JLPT N3', 'JLPT N2');
    await chooseSource(user, 'JLPT N4');

    const reloaded = await reload();
    expect(modeRadio('One deck')).toBeChecked();
    expect(oneDeckSelect()).toHaveValue('N4');

    await chooseMode(reloaded, 'Multiple decks');
    expect(tickedLabels()).toEqual(['JLPT N3', 'JLPT N2']);
  });
});

describe('Shuffle In Cards from multiple decks: failure paths', () => {
  test('when I choose Multiple decks but tick none, a validation message is shown and my deck does not change', async () => {
    const user = await renderApp(FOUR_DECKS);
    await chooseMode(user, 'Multiple decks');
    const before = await deckContents(user);

    await shuffleIn(user, '1');

    expect(screen.getByRole('alert')).toHaveTextContent('Tick at least two decks to shuffle in from.');
    // Shown under the checkboxes, and linked to them.
    expect(decksGroup()).toContainElement(screen.getByRole('alert'));
    expect(decksGroup()).toHaveAccessibleDescription('Tick at least two decks to shuffle in from.');
    expect(await deckContents(user)).toEqual(before);
    expect(screen.getByRole('status')).toHaveTextContent('');
  });

  test('when I choose Multiple decks but tick only one, a validation message asks me to tick at least two or use One deck, and my deck does not change', async () => {
    const user = await renderApp(FOUR_DECKS);
    await tickDecks(user, 'JLPT N3');
    const before = await deckContents(user);

    await shuffleIn(user, '2');

    expect(screen.getByRole('alert')).toHaveTextContent('Tick at least two decks, or choose One deck instead.');
    expect(await deckContents(user)).toEqual(before);
  });

  test("when the ticked decks together don't have enough new cards left, a message says how many and my deck does not change", async () => {
    const user = await renderApp(makeDecks({ N5: 30, N4: 1, N3: 1, N2: 30 }));
    await tickDecks(user, 'JLPT N4', 'JLPT N3');
    const before = await deckContents(user);

    await shuffleIn(user, '3');

    expect(screen.getByRole('alert')).toHaveTextContent(
      'The ticked decks only have 2 new cards left. Tick more decks or shuffle in fewer cards.',
    );
    expect(screen.getByLabelText('Cards to shuffle in')).toHaveAttribute('aria-invalid', 'true');
    expect(await deckContents(user)).toEqual(before);
    expect(screen.getByRole('status')).toHaveTextContent('');
  });

  test('the not-enough-cards message says "1 new card" for one card, and "no new cards" when none are left', async () => {
    const user = await renderApp(makeDecks({ N5: 30, N4: 1, N3: 1, N2: 30 }));
    await tickDecks(user, 'JLPT N4', 'JLPT N3');

    // Shuffling in replaces the card on screen, so Next moves off each shuffled-in card first.
    const next = () => user.click(screen.getByRole('button', { name: 'Next →' }));
    await shuffleIn(user, '1');
    await next();
    await shuffleIn(user, '2');
    expect(screen.getByRole('alert')).toHaveTextContent(
      'The ticked decks only have 1 new card left. Tick more decks or shuffle in fewer cards.',
    );

    await shuffleIn(user, '1');
    await next();
    const before = await deckContents(user);
    await shuffleIn(user, '1');
    expect(screen.getByRole('alert')).toHaveTextContent(
      'The ticked decks have no new cards left. Tick other decks to shuffle in from.',
    );
    expect(await deckContents(user)).toEqual(before);
  });

  test('when a deck I had ticked no longer exists after a reload, it is unticked and I am told', async () => {
    const user = await renderApp(makeDecks({ N5: 30, N4: 30, N3: 30, N1: 30 }));
    await tickDecks(user, 'JLPT N4', 'JLPT N3', 'JLPT N1');

    await reload(makeDecks({ N5: 30, N4: 30, N3: 30 }));

    expect(modeRadio('Multiple decks')).toBeChecked();
    expect(checkboxLabels()).toEqual(['JLPT N4', 'JLPT N3']);
    expect(tickedLabels()).toEqual(['JLPT N4', 'JLPT N3']);
    const notice = screen.getByText('JLPT N1 is no longer available, so it has been unticked.');
    expect(notice).toHaveAttribute('role', 'status');
    // jsdom can't show colours, so the class is checked: amber, which passes 4.5:1 on the panel.
    expect(notice).toHaveClass('text-amber-700');
    // It is saved unticked, so it isn't reported again on the next reload.
    await reload(makeDecks({ N5: 30, N4: 30, N3: 30 }));
    expect(untickedNotice()).not.toBeInTheDocument();
  });

  test('when several ticked decks are gone after a reload, they are all named', async () => {
    const user = await renderApp(makeDecks({ N5: 30, N4: 30, N3: 30, N2: 30, N1: 30 }));
    await tickDecks(user, 'JLPT N4', 'JLPT N2', 'JLPT N1');

    const reloaded = await reload(makeDecks({ N5: 30, N4: 30, N3: 30 }));

    expect(untickedNotice()).toHaveTextContent(
      'JLPT N2 and JLPT N1 are no longer available, so they have been unticked.',
    );
    expect(tickedLabels()).toEqual(['JLPT N4']);
    // The gone decks no longer count as ticked: only one deck is left.
    const before = await deckContents(reloaded);
    await shuffleIn(reloaded, '1');
    expect(screen.getByRole('alert')).toHaveTextContent('Tick at least two decks, or choose One deck instead.');
    expect(await deckContents(reloaded)).toEqual(before);
  });

  test('when a ticked deck becomes the deck I study, it is unticked and I am told', async () => {
    const user = await renderApp(FOUR_DECKS);
    await tickDecks(user, 'JLPT N4', 'JLPT N3');

    await chooseDeck(user, 'JLPT N4');

    expect(untickedNotice()).toHaveTextContent('JLPT N4 is no longer available, so it has been unticked.');
    expect(checkboxLabels()).toEqual(['JLPT N5', 'JLPT N3', 'JLPT N2']);
    expect(tickedLabels()).toEqual(['JLPT N3']);
  });

  test('when only one other deck is left after a reload, Multiple decks falls back to One deck and the gone deck is named', async () => {
    const user = await renderApp(FOUR_DECKS);
    await tickDecks(user, 'JLPT N4', 'JLPT N3');

    await reload(makeDecks({ N5: 30, N4: 30 }));

    expect(modeRadio('Multiple decks')).toBeDisabled();
    expect(modeRadio('One deck')).toBeChecked();
    expect(oneDeckSelect()).toHaveValue('N4');
    // The gone deck is named, but the fall-back itself gets no extra notice: the greyed hint is enough.
    expect(untickedNotice()).toHaveTextContent(/^JLPT N3 is no longer available, so it has been unticked\.$/);
    expect(modeRadio('Multiple decks')).toHaveAccessibleDescription('Needs at least two other decks.');
  });

  test('the messages go away when I change my ticks, the choice or the number of cards', async () => {
    const user = await renderApp(FOUR_DECKS);
    await chooseMode(user, 'Multiple decks');

    await shuffleIn(user, '1');
    expect(screen.getByRole('alert')).toBeInTheDocument();
    await user.click(deckCheckbox('JLPT N4'));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    await shuffleIn(user, '1');
    expect(screen.getByRole('alert')).toBeInTheDocument();
    await chooseMode(user, 'Random');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    await chooseMode(user, 'Multiple decks');
    await shuffleIn(user, '1');
    expect(screen.getByRole('alert')).toBeInTheDocument();
    await user.type(screen.getByLabelText('Cards to shuffle in'), '{Backspace}');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  test('when I pick another deck to study or change my card limit, the shuffle-in messages go away', async () => {
    const user = await renderApp(FOUR_DECKS);
    await chooseMode(user, 'Multiple decks');
    await shuffleIn(user, '1');
    expect(screen.getByRole('alert')).toHaveTextContent('Tick at least two decks to shuffle in from.');

    await chooseDeck(user, 'JLPT N3');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    await tickDecks(user, 'JLPT N5', 'JLPT N4');
    await shuffleIn(user, '11');
    expect(screen.getByRole('alert')).toHaveTextContent("You can't shuffle in more than 10 cards, your card limit.");

    await enterCardLimit(user, '20');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Cards to shuffle in')).not.toHaveAttribute('aria-invalid');
  });

  test.each([
    ['One deck', { kind: 'deck', deck: 'N4' }],
    ['Random', { kind: 'random' }],
  ] as const)(
    'with %s saved, a ticked deck that is gone after a reload is unticked without a notice',
    async (mode, saved) => {
      localStorage.setItem('kanji.shuffleSource', JSON.stringify({ ...saved, decks: ['N4', 'N3', 'N1'] }));

      const user = await renderApp(FOUR_DECKS);

      expect(modeRadio(mode)).toBeChecked();
      expect(untickedNotice()).not.toBeInTheDocument();
      await chooseMode(user, 'Multiple decks');
      expect(tickedLabels()).toEqual(['JLPT N4', 'JLPT N3']);
      expect(untickedNotice()).not.toBeInTheDocument();
    },
  );

  test.each(['One deck', 'Random'] as const)(
    'on %s, studying a ticked deck unticks it without a notice',
    async (mode) => {
      const user = await renderApp(FOUR_DECKS);
      await tickDecks(user, 'JLPT N4', 'JLPT N3');
      await chooseMode(user, mode);

      await chooseDeck(user, 'JLPT N4');

      expect(untickedNotice()).not.toBeInTheDocument();
      await chooseMode(user, 'Multiple decks');
      expect(tickedLabels()).toEqual(['JLPT N3']);
      expect(untickedNotice()).not.toBeInTheDocument();
    },
  );

  test('the unticked notice goes away when I change my ticks or the number of cards', async () => {
    const user = await renderApp(makeDecks({ N5: 30, N4: 30, N3: 30, N1: 30 }));
    await tickDecks(user, 'JLPT N4', 'JLPT N3', 'JLPT N1');
    const words = makeDecks({ N5: 30, N4: 30, N3: 30, N2: 30 });

    let reloaded = await reload(words);
    expect(untickedNotice()).toBeInTheDocument();
    await reloaded.click(deckCheckbox('JLPT N2'));
    expect(untickedNotice()).not.toBeInTheDocument();

    localStorage.setItem('kanji.shuffleSource', JSON.stringify({ kind: 'multiple', deck: 'N4', decks: ['N4', 'N1'] }));
    reloaded = await reload(words);
    expect(untickedNotice()).toBeInTheDocument();
    await reloaded.type(screen.getByLabelText('Cards to shuffle in'), '{Backspace}');
    expect(untickedNotice()).not.toBeInTheDocument();
  });

  test('when browser storage is blocked, shuffling in from multiple decks still works for the current session', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('Access denied', 'SecurityError');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Access denied', 'SecurityError');
    });

    const user = await renderApp(FOUR_DECKS);
    await tickDecks(user, 'JLPT N3', 'JLPT N2');
    await shuffleIn(user, '2');

    expect(['JLPT N3', 'JLPT N2']).toContain(currentCardLevel());
    expect(count(levels(await deckContents(user)), 'JLPT N5')).toBe(8);
  });
});

describe('saved "Shuffle in from" checks (failure paths)', () => {
  const saveChoice = (value: unknown) => localStorage.setItem('kanji.shuffleSource', JSON.stringify(value));

  test('a One deck choice saved before FEAT3 ({ kind: "deck" }) still loads, with nothing ticked', async () => {
    saveChoice({ kind: 'deck', deck: 'N3' });

    const user = await renderApp(FOUR_DECKS);

    expect(modeRadio('One deck')).toBeChecked();
    expect(oneDeckSelect()).toHaveValue('N3');
    await shuffleIn(user, '2');
    expect(count(levels(await deckContents(user)), 'JLPT N3')).toBe(2);
    await chooseMode(user, 'Multiple decks');
    expect(tickedLabels()).toEqual([]);
  });

  test('a Random choice saved before FEAT3 ({ kind: "random" }) still loads', async () => {
    saveChoice({ kind: 'random' });

    const user = await renderApp(FOUR_DECKS);

    expect(modeRadio('Random')).toBeChecked();
    await chooseMode(user, 'One deck');
    expect(oneDeckSelect()).toHaveValue('N4');
  });

  test('unknown or repeated ticked decks in the saved choice are dropped without a notice, and an unknown mode falls back to One deck', async () => {
    saveChoice({ kind: 'multiple', decks: ['N9', 42, 'N4', 'N4', 'N2'] });
    await renderApp(FOUR_DECKS);

    expect(modeRadio('Multiple decks')).toBeChecked();
    expect(tickedLabels()).toEqual(['JLPT N4', 'JLPT N2']);
    expect(untickedNotice()).not.toBeInTheDocument();

    saveChoice({ kind: 'several', decks: ['N4', 'N3'] });
    await reload();
    expect(modeRadio('One deck')).toBeChecked();
    expect(oneDeckSelect()).toHaveValue('N4');
  });
});
