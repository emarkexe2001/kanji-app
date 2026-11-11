import { expect, test } from '@playwright/test';
import { COLOR_MODE_KEY, currentCard, openApp } from './helpers';

// The shared setup in helpers.ts (TEST7), which later e2e tests rely on.
test('saveColorMode saves the mode before the first load only, so a mode chosen afterwards is kept after a reload', async ({
  page,
}) => {
  const errors = await openApp(page, { colorMode: 'dark' });
  await expect(currentCard(page)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Colour mode: Dark', exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Colour mode: Dark', exact: true }).click();
  await page.getByRole('menu', { name: 'Colour mode' }).getByRole('menuitemradio', { name: 'Light' }).click();
  await page.reload();

  await expect(currentCard(page)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Colour mode: Light', exact: true })).toBeVisible();
  expect(await page.evaluate((key) => localStorage.getItem(key), COLOR_MODE_KEY)).toBe('light');
  expect(errors).toEqual([]);
});
