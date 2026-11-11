import { expect, test } from '@playwright/test';
import { currentCard, openApp } from './helpers';

// THROWAWAY (TEST7 proof): fails on purpose, to show the CI job goes red and uploads the artifact.
test('throwaway: fails on purpose', async ({ page }) => {
  await openApp(page, { colorMode: 'light' });
  await expect(currentCard(page)).toBeVisible();
  await expect(page.getByRole('button', { name: 'This button does not exist' })).toBeVisible({ timeout: 2000 });
});
