import { expect, test } from '@playwright/test';

test('home, demo, and memories work together', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Today' })).toBeVisible();
  await expect(page.getByText('A sentence is enough.')).toBeVisible();

  await page.goto('/profile');
  await expect(page.getByRole('heading', { name: 'Your book' })).toBeVisible();
  await page.getByRole('button', { name: 'Load', exact: true }).click();
  await expect(page.getByText('Demo pages loaded')).toBeVisible({ timeout: 20_000 });

  await page.goto('/memories');
  await expect(
    page.getByRole('heading', { name: 'What the days remember' }),
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Marked days' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Month in review' })).toBeVisible();
});

test('unknown routes stay quiet', async ({ page }) => {
  await page.goto('/not-a-real-page');
  await expect(
    page.getByRole('heading', { name: 'This page is not in the book.' }),
  ).toBeVisible();
});
