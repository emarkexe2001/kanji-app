// What the user sees when something goes wrong outside their control: the dictionary can't be
// loaded, a card can't be drawn, or browser storage is blocked.
import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import App from '../../src/app/app';
import { COUNTER, counter, enterCardLimit, makeWords, renderApp, serveDeck } from './helpers';

describe('failure paths', () => {
  test('if the dictionary fails to download, an error message is shown instead of the deck', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: false, status: 500, json: async () => [] })),
    );

    render(<App />);

    expect(await screen.findByText(/Couldn't load the word deck: HTTP 500/)).toBeInTheDocument();
    expect(screen.queryByText(COUNTER)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /next/i })).not.toBeInTheDocument();
  });

  test('if the network request fails, an error message is shown instead of the deck', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Promise.reject(new TypeError('Failed to fetch'))),
    );

    render(<App />);

    expect(await screen.findByText(/Couldn't load the word deck: Failed to fetch/)).toBeInTheDocument();
    expect(screen.queryByLabelText('Card limit')).not.toBeInTheDocument();
  });

  test('if a card fails to render, a friendly message is shown instead of a blank page', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    // Broken data: every word is missing its reading breakdown, so drawing the card throws.
    serveDeck(makeWords(5).map((word) => ({ ...word, segments: null })));

    render(<App />);

    expect(
      await screen.findByText('Something went wrong showing the cards. Please reload the page to try again.'),
    ).toBeInTheDocument();
    // The rest of the page is still there.
    expect(screen.getByRole('heading', { name: 'Kanji Reading Highlighter' })).toBeInTheDocument();
    expect(screen.getByText(/Dictionary data from/)).toBeInTheDocument();
    // And the error is logged for debugging.
    expect(consoleError).toHaveBeenCalledWith(
      'Error while rendering the deck:',
      expect.any(TypeError),
      expect.anything(),
    );
  });

  test('if browser storage is blocked, the app still works with the default card limit', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('Access denied', 'SecurityError');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Access denied', 'SecurityError');
    });

    const user = await renderApp();
    expect(counter().total).toBe(10);

    await enterCardLimit(user, '4');
    expect(counter().total).toBe(4);
  });

  test.each(['0', '151', '5.5', 'lots'])(
    'if the saved card limit is invalid (%s), the default of 10 is used',
    async (saved) => {
      localStorage.setItem('kanji.deckSize', saved);

      await renderApp();

      expect(counter().total).toBe(10);
    },
  );
});
