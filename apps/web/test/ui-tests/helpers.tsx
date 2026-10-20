import type { JlptLevel, WordEntry } from '@kanji/core';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import App from '../../src/app/app';

export type User = ReturnType<typeof userEvent.setup>;

/**
 * `count` made-up words, each with a unique word and reading so the card on screen can be told apart.
 * By default they are common words with no JLPT level, so they make up a single "Common words" deck.
 * `jlpt` puts them in a JLPT deck instead (and makes them not common, so the decks don't overlap).
 */
export function makeWords(count: number, jlpt?: JlptLevel): WordEntry[] {
  const tag = jlpt ?? '';
  return Array.from({ length: count }, (_, i) => ({
    id: jlpt ? `${jlpt}-${i + 1}` : String(i + 1),
    word: `${tag}単語${i + 1}`,
    reading: `たんご${i + 1}`,
    common: !jlpt,
    ...(jlpt && { jlpt }),
    segments: [{ text: `${tag}単語${i + 1}`, reading: `たんご${i + 1}`, kind: 'onyomi' }],
    meaning: `word number ${i + 1}`,
  }));
}

/** Words for several decks, e.g. `makeDecks({ N5: 30, N4: 20 })`. */
export function makeDecks(sizes: Partial<Record<JlptLevel | 'common', number>>): WordEntry[] {
  return Object.entries(sizes).flatMap(([deck, n]) =>
    deck === 'common' ? makeWords(n) : makeWords(n, deck as JlptLevel),
  );
}

/** Makes the app's request for deck.json succeed with `words`. */
export function serveDeck(words: unknown) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({ ok: true, status: 200, json: async () => structuredClone(words) })),
  );
}

export const COUNTER = /^Card \d+ of \d+$/;

/** Renders the whole app with `words` as the dictionary and waits for the first card. */
export async function renderApp(words: WordEntry[] = makeWords(200)) {
  serveDeck(words);
  const user = userEvent.setup();
  render(<App />);
  await screen.findByText(COUNTER);
  return user;
}

/** The "Card 3 of 10" counter, as numbers. */
export function counter() {
  const text = screen.getByText(COUNTER).textContent ?? '';
  const [, position, total] = /Card (\d+) of (\d+)/.exec(text)!;
  return { position: Number(position), total: Number(total) };
}

/** The word on the card currently shown, e.g. "単語7【たんご7】". */
export function currentWord() {
  return screen.getByRole('heading', { level: 2 }).textContent;
}

/** The label at the top of the card on screen: "JLPT N5" etc., or "Vocabulary" for a word with no level. */
export function currentCardLevel() {
  return screen.getByRole('article').querySelector('header')?.textContent ?? null;
}

export function cardLimitInput() {
  return screen.getByLabelText('Card limit');
}

/** Replaces the card limit field's value in one go, like pasting it, then presses Enter to apply it. */
export async function enterCardLimit(user: User, value: string) {
  const input = cardLimitInput();
  await user.clear(input);
  input.focus();
  if (value !== '') await user.paste(value);
  await user.keyboard('{Enter}');
}

/** Presses Next `count` times and returns every word shown along the way, starting with the current one. */
export async function wordsSeenWithNext(user: User, count: number) {
  const seen = [currentWord()];
  for (let i = 0; i < count; i++) {
    await user.click(screen.getByRole('button', { name: 'Next →' }));
    seen.push(currentWord());
  }
  return seen;
}

/**
 * Every card in the deck with its level label, by pressing Next all the way round, starting
 * with the one on screen. Ends back on the card it started on.
 */
export async function deckContents(user: User) {
  const cards: { word: string | null; level: string | null }[] = [];
  const { total } = counter();
  for (let i = 0; i < total; i++) {
    cards.push({ word: currentWord(), level: currentCardLevel() });
    await user.click(screen.getByRole('button', { name: 'Next →' }));
  }
  return cards;
}

export const deckShuffleButton = () => screen.getByRole('button', { name: 'Deck Shuffle' });
export const shuffleInButton = () => screen.getByRole('button', { name: 'Shuffle In Cards' });

/** Picks the deck being studied, e.g. "JLPT N5". */
export async function chooseDeck(user: User, label: string) {
  await user.selectOptions(screen.getByLabelText('Deck'), label);
}

/** Picks where Shuffle In Cards takes cards from, e.g. "JLPT N4" or "Random deck for each card". */
export async function chooseSource(user: User, label: string) {
  await user.selectOptions(screen.getByLabelText('Shuffle in from'), label);
}

/** Sets how many cards to shuffle in (like pasting it) and presses Shuffle In Cards. */
export async function shuffleIn(user: User, count = '1') {
  const input = screen.getByLabelText('Cards to shuffle in');
  await user.clear(input);
  input.focus();
  if (count !== '') await user.paste(count);
  await user.click(shuffleInButton());
}
