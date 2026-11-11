import { expect, test, type Locator } from '@playwright/test';
import { currentCard, openApp } from './helpers';

/** Presses `button` and checks the card on screen changes (its word, reading and meaning). */
async function pressAndExpectNewCard(card: Locator, button: Locator) {
  const before = await card.innerText();
  await button.click();
  await expect(card).not.toHaveText(before);
}

// The main flow, quickly (TEST7): if this fails, the app is broken for everyone.
test('opens in the saved colour mode with a card, and Next, Deck Shuffle and Shuffle In Cards each change the card, with no page errors', async ({
  page,
}) => {
  // Dark is saved on a light device, so the page can only be dark if the saved mode was used.
  const errors = await openApp(page, { colorMode: 'dark', device: 'light' });

  const card = currentCard(page);
  await expect(card).toBeVisible();
  await expect(card.getByRole('heading', { level: 2 })).not.toBeEmpty();
  await expect(page.locator('html')).toHaveAttribute('data-color-mode', 'dark');
  // A mode is saved, so the colour mode start page isn't shown.
  await expect(page.getByRole('heading', { name: 'Choose how the app looks' })).toHaveCount(0);
  await expect(page.getByText(/^Card 1 of \d+$/)).toBeVisible();

  await pressAndExpectNewCard(card, page.getByRole('button', { name: 'Next →', exact: true }));
  await expect(page.getByText(/^Card 2 of \d+$/)).toBeVisible();

  await pressAndExpectNewCard(card, page.getByRole('button', { name: 'Deck Shuffle', exact: true }));

  await pressAndExpectNewCard(card, page.getByRole('button', { name: 'Shuffle In Cards', exact: true }));
  await expect(page.getByRole('button', { name: /^Shuffled out \(1\)/ })).toBeVisible();

  expect(errors).toEqual([]);
});
