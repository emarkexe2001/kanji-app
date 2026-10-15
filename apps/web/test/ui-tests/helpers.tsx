import type { WordEntry } from '@kanji/core';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import App from '../../src/app/app';

/** `count` made-up words, each with a unique word and reading so the card on screen can be told apart. */
export function makeWords(count: number): WordEntry[] {
  return Array.from({ length: count }, (_, i) => ({
    id: String(i + 1),
    word: `単語${i + 1}`,
    reading: `たんご${i + 1}`,
    common: false,
    segments: [{ text: `単語${i + 1}`, reading: `たんご${i + 1}`, kind: 'onyomi' }],
    meaning: `word number ${i + 1}`,
  }));
}

/** Makes the app's request for deck.json succeed with `words`. */
export function serveDeck(words: unknown) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({ ok: true, status: 200, json: async () => structuredClone(words) })),
  );
}

/** Renders the whole app with `words` as the dictionary and waits for the first card. */
export async function renderApp(words: WordEntry[] = makeWords(200)) {
  serveDeck(words);
  const user = userEvent.setup();
  render(<App />);
  await screen.findByText(/^Card \d+ \/ \d+$/);
  return user;
}

/** The "Card 3 / 10" counter, as numbers. */
export function counter() {
  const text = screen.getByText(/^Card \d+ \/ \d+$/).textContent ?? '';
  const [, position, total] = /Card (\d+) \/ (\d+)/.exec(text)!;
  return { position: Number(position), total: Number(total) };
}

/** The word on the card currently shown, e.g. "単語7【たんご7】". */
export function currentWord() {
  return screen.getByRole('heading', { level: 2 }).textContent;
}

export function cardLimitInput() {
  return screen.getByLabelText('Card limit');
}

/** Replaces the card limit field's value in one go, like pasting it, then presses Enter to apply it. */
export async function enterCardLimit(user: ReturnType<typeof userEvent.setup>, value: string) {
  const input = cardLimitInput();
  await user.clear(input);
  input.focus();
  if (value !== '') await user.paste(value);
  await user.keyboard('{Enter}');
}

/** Presses Next `count` times and returns every word shown along the way, starting with the current one. */
export async function wordsSeenWithNext(user: ReturnType<typeof userEvent.setup>, count: number) {
  const seen = [currentWord()];
  for (let i = 0; i < count; i++) {
    await user.click(screen.getByRole('button', { name: /next/i }));
    seen.push(currentWord());
  }
  return seen;
}
