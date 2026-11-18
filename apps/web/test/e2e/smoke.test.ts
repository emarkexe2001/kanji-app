import { expect, test, type Locator, type Page } from '@playwright/test';
import { DECK_LOAD_TIMEOUT, currentCard, openApp, waitForDeck } from './helpers';

/** Presses `button` and checks the card on screen changes (its word, reading and meaning). */
async function pressAndExpectNewCard(card: Locator, button: Locator) {
  // textContent, which toHaveText compares against (innerText reads the text differently, so it
  // would never match and the check below would always pass).
  const before = (await card.textContent()) ?? '';
  expect(before).not.toBe('');
  await button.click();
  await expect(card).not.toHaveText(before);
}

/**
 * Waits until the page has downloaded `file` from the deck data, going by the page's own record of
 * what it downloaded (Resource Timing), so it works whether the file arrived before or after now.
 */
async function waitForDeckFile(page: Page, file: string) {
  await expect
    .poll(
      () =>
        page.evaluate(
          (name) =>
            performance
              .getEntriesByType('resource')
              .some(
                (entry) => entry.name.endsWith(`/data/${name}`) && (entry as PerformanceResourceTiming).responseEnd > 0,
              ),
          file,
        ),
      { timeout: DECK_LOAD_TIMEOUT },
    )
    .toBe(true);
}

// The main flow, quickly (TEST7): if this fails, the app is broken for everyone.
test('opens in the saved colour mode with a card, and Next, Deck Shuffle and Shuffle In Cards each change the card, with no page errors', async ({
  page,
}) => {
  // Dark is saved on a light device, so the page can only be dark if the saved mode was used.
  const errors = await openApp(page, { colorMode: 'dark', device: 'light' });

  await waitForDeck(page);
  const card = currentCard(page);
  await expect(card.getByRole('heading', { level: 2 })).not.toBeEmpty();
  await expect(page.locator('html')).toHaveAttribute('data-color-mode', 'dark');
  // A mode is saved, so the colour mode start page isn't shown.
  await expect(page.getByRole('heading', { name: 'Choose how the app looks' })).toHaveCount(0);
  await expect(page.getByText(/^Card 1 of \d+$/)).toBeVisible();

  await pressAndExpectNewCard(card, page.getByRole('button', { name: 'Next →', exact: true }));
  await expect(page.getByText(/^Card 2 of \d+$/)).toBeVisible();

  await pressAndExpectNewCard(card, page.getByRole('button', { name: 'Deck Shuffle', exact: true }));

  // Shuffle In Cards takes cards from JLPT N4, whose file downloads in the background after the
  // first card (ARCH2). Waiting for it first means the card changes on the press itself.
  await waitForDeckFile(page, 'n4.json');
  await pressAndExpectNewCard(card, page.getByRole('button', { name: 'Shuffle In Cards', exact: true }));
  await expect(page.getByRole('button', { name: /^Shuffled out \(1\)/ })).toBeVisible();

  expect(errors).toEqual([]);
});
