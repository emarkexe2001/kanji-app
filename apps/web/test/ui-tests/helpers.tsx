import type { JlptLevel, WordEntry } from '@kanji/core';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import App from '../../src/app/app';
import { COLOR_MODE_KEY, DEVICE_DARK_QUERY } from '../../src/lib/color-mode';
import { WIDE_LAYOUT_QUERY } from '../../src/features/deck/utils/wide-layout';

export type User = ReturnType<typeof userEvent.setup>;
type UserOptions = Parameters<typeof userEvent.setup>[0];

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

/**
 * user-event without its pause after each action (TEST6), for tests that make many clicks or key
 * presses: `renderApp(words, NO_PAUSE)`. By default user-event waits for the next turn of the event
 * loop after every action (`delay: 0`). That wait is most of the time a click takes (about 60ms
 * with it, 25ms without), and it grows on a busy machine. The same events are still fired in the
 * same order and React still updates the page after each one; only timers set by the app (none of
 * which these tests rely on) don't get a chance to run between actions.
 */
export const NO_PAUSE = { delay: null } as const;

/**
 * Renders the whole app with `words` as the dictionary and waits for the first card. `userOptions`
 * go to `userEvent.setup` (e.g. NO_PAUSE).
 */
export async function renderApp(words: WordEntry[] = makeWords(200), userOptions?: UserOptions) {
  serveDeck(words);
  const user = userEvent.setup(userOptions);
  render(<App />);
  await screen.findByText(COUNTER);
  return user;
}

/**
 * Nothing saved for the colour mode, as on a first visit (FEAT5_1). test/setup.ts saves Light
 * before every test so the app opens on the cards; call this first to open on the start page.
 */
export function firstVisit() {
  localStorage.removeItem(COLOR_MODE_KEY);
}

/** The heading of the colour mode start page (FEAT5_1). */
export const startPageHeading = () => screen.queryByRole('heading', { level: 2, name: 'Choose how the app looks' });

/** A tile on the start page: the button named exactly "Light", "Dark" or "High contrast" (FEAT5_5). */
export const startPageTile = (name: 'Light' | 'Dark' | 'High contrast') =>
  within(screen.getByRole('group', { name: 'Choose how the app looks' })).getByRole('button', { name });

/**
 * Stands in for the device's colour scheme setting (FEAT5_1), as jsdom has no media queries
 * (window.matchMedia is replaced; the wide layout and "reduce motion" queries answer no).
 * `setDark` changes it live, as when the device switches, and tells the app's listeners.
 */
export function stubDevice({ dark = false }: { dark?: boolean } = {}) {
  let deviceDark = dark;
  const listeners = new Set<() => void>();
  const addEventListener = vi.fn((type: string, listener: () => void) => {
    if (type === 'change') listeners.add(listener);
  });
  const removeEventListener = vi.fn((type: string, listener: () => void) => {
    if (type === 'change') listeners.delete(listener);
  });
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) =>
      query === DEVICE_DARK_QUERY
        ? {
            get matches() {
              return deviceDark;
            },
            media: query,
            addEventListener,
            removeEventListener,
          }
        : { matches: false, media: query, addEventListener: vi.fn(), removeEventListener: vi.fn() },
    ),
  );
  return {
    setDark(next: boolean) {
      deviceDark = next;
      act(() => [...listeners].forEach((listener) => listener()));
    },
    listeners,
    addEventListener,
    removeEventListener,
  };
}

/** Renders the whole app with `words` as the dictionary, expecting the start page (nothing usable saved). */
export function renderStartPage(words: unknown = makeWords(200)) {
  serveDeck(words);
  const user = userEvent.setup();
  render(<App />);
  if (!startPageHeading()) throw new Error('Expected the colour mode start page');
  return user;
}

/** Chooses a tile on the start page and waits for the first card. */
export async function chooseOnStartPage(user: User, name: 'Light' | 'Dark' | 'High contrast' = 'Light') {
  await user.click(startPageTile(name));
  await screen.findByText(COUNTER);
}

/**
 * Renders the app when it opens on the start page (e.g. storage blocked), chooses a mode there
 * and waits for the first card (FEAT5_1).
 */
export async function renderAppFromStartPage(words: WordEntry[] = makeWords(200), mode: 'Light' | 'Dark' = 'Light') {
  const user = renderStartPage(words);
  await chooseOnStartPage(user, mode);
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

/** A choice of the "Shuffle in from" switch (FEAT3). */
export type ShuffleMode = 'One deck' | 'Random' | 'Multiple decks';

/** The "Shuffle in from" switch's radio button for `mode`. */
export const modeRadio = (mode: ShuffleMode) => screen.getByRole('radio', { name: mode });

/** Picks One deck, Random or Multiple decks on the "Shuffle in from" switch. */
export async function chooseMode(user: User, mode: ShuffleMode) {
  await user.click(modeRadio(mode));
}

/** The deck dropdown shown under One deck. */
export const oneDeckSelect = () => screen.getByLabelText<HTMLSelectElement>('Deck to shuffle in from');

/**
 * Picks where Shuffle In Cards takes cards from: "Random", or one deck such as "JLPT N4"
 * (chosen from the dropdown under One deck).
 */
export async function chooseSource(user: User, label: string) {
  if (label === 'Random') return chooseMode(user, 'Random');
  await chooseMode(user, 'One deck');
  await user.selectOptions(oneDeckSelect(), label);
}

/** The checkbox for a deck under Multiple decks, e.g. "JLPT N4". */
export const deckCheckbox = (label: string) => screen.getByRole('checkbox', { name: label });

/** Chooses Multiple decks and ticks the decks named (each must be unticked). */
export async function tickDecks(user: User, ...labels: string[]) {
  await chooseMode(user, 'Multiple decks');
  for (const label of labels) await user.click(deckCheckbox(label));
}

/** Sets how many cards to shuffle in (like pasting it) and presses Shuffle In Cards. */
export async function shuffleIn(user: User, count = '1') {
  const input = screen.getByLabelText('Cards to shuffle in');
  await user.clear(input);
  input.focus();
  if (count !== '') await user.paste(count);
  await user.click(shuffleInButton());
}

/**
 * Sets what the screen reports, as jsdom has no media queries (window.matchMedia is replaced):
 * `wide` for the wide layout (WIDE_LAYOUT_MIN_WIDTH, 1100px, and up), where the shuffled-out
 * panel floats beside the deck, and the "reduce motion" setting.
 */
export function setScreen({ wide = false, reduceMotion = false }: { wide?: boolean; reduceMotion?: boolean } = {}) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches: (reduceMotion && query === '(prefers-reduced-motion: reduce)') || (wide && query === WIDE_LAYOUT_QUERY),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
}
