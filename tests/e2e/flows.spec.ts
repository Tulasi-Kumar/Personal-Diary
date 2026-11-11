import { expect, test } from '@playwright/test';

test('a saved piece survives a reload even when the AI route fails', async ({ page }) => {
  await page.route('**/api/ai', (route) =>
    route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'offline in test' }),
    }),
  );

  const entry = 'The kettle clicked off and the kitchen went quiet.';

  await page.goto('/');
  await page.getByLabel("Today's entry").fill(entry);
  await page.getByRole('button', { name: 'Save piece' }).click();

  await expect(page.getByRole('heading', { name: 'Written today' })).toBeVisible();
  await expect(page.getByText(entry)).toBeVisible();
  await expect(page.getByLabel("Today's entry")).toHaveValue('');

  await page.reload();

  await expect(page.getByText(entry)).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Written today' })).toBeVisible();
});

test("a What's next vote stays on this device after a reload", async ({ page }) => {
  await page.goto('/whats-next');
  await expect(page.getByRole('heading', { name: 'Things we are thinking about next.' })).toBeVisible();

  const firstVote = page.getByRole('button', { name: /^I want / }).first();
  const label = await firstVote.getAttribute('aria-label');
  expect(label).toBeTruthy();
  const name = label!.replace('I want ', '');

  await firstVote.click();
  await expect(page.getByRole('button', { name: `Remove your interest in ${name}` })).toHaveAttribute(
    'aria-pressed',
    'true',
  );

  await page.reload();
  await expect(page.getByRole('button', { name: `Remove your interest in ${name}` })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
});

test('the calendar moves between months and marks days with writing', async ({ page }) => {
  await page.goto('/profile');
  await page.getByRole('button', { name: 'Load', exact: true }).click();
  await expect(page.getByText('Demo pages loaded')).toBeVisible({ timeout: 20_000 });

  await page.goto('/calendar');
  const heading = page.getByRole('heading', { level: 1 });
  const currentMonth = await heading.textContent();

  await page.getByRole('button', { name: 'Previous month' }).click();
  await expect(heading).not.toHaveText(currentMonth ?? '');

  await page.getByRole('button', { name: 'Next month' }).click();
  await expect(heading).toHaveText(currentMonth ?? '');

  const marked = page.locator('a.calendar-cell[aria-label*="has writing"]').first();
  await expect(marked).toBeVisible();
  await marked.click();
  await expect(page).toHaveURL(/\/day\/\d{4}-\d{2}-\d{2}$/);
});

test('the debug page is hidden unless the local flag is set', async ({ page }) => {
  await page.goto('/debug');
  await expect(
    page.getByRole('heading', { name: 'This page is not in the book.' }),
  ).toBeVisible();

  await page.evaluate(() => localStorage.setItem('daybook:debug', '1'));
  await page.goto('/debug');
  await expect(page.getByRole('heading', { name: 'Local signals' })).toBeVisible();
});

test('the production shell opens offline after one visit and never caches the AI route', async ({
  page,
  context,
  browserName,
}) => {
  test.skip(browserName !== 'chromium', 'Service worker offline verification runs on Chromium.');

  await page.goto('/');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Today' })).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller)))
    .toBe(true);

  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Today' })).toBeVisible();

  const offlineEntry = 'Offline, the lamp was still warm.';
  await page.getByLabel("Today's entry").fill(offlineEntry);
  await page.getByRole('button', { name: 'Save piece' }).click();
  await expect(page.locator('.piece__preview', { hasText: offlineEntry })).toBeVisible();
  await expect(page.getByLabel("Today's entry")).toHaveValue('');

  const aiCall = await page.evaluate(async () => {
    try {
      const response = await fetch('/api/ai', { method: 'POST' });
      return `status:${response.status}`;
    } catch {
      return 'failed';
    }
  });
  expect(aiCall).toBe('failed');

  await context.setOffline(false);
});

test('primary screens hold their layout at narrow, tablet, and desktop widths', async ({
  page,
}) => {
  for (const width of [320, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of ['/', '/calendar', '/memories', '/profile', '/whats-next']) {
      await page.goto(path);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      );
      expect(overflow, `${path} overflows at ${width}px`).toBe(false);
    }
  }
});

test('demo memories open a marked day and replay it as a dialog', async ({ page }) => {
  await page.goto('/profile');
  await page.getByRole('button', { name: 'Load', exact: true }).click();
  await expect(page.getByText('Demo pages loaded')).toBeVisible({ timeout: 20_000 });

  await page.goto('/memories');
  await expect(page.getByRole('heading', { name: 'Marked days' })).toBeVisible();

  await page.locator('.marked-card').first().click();
  const sheet = page.getByRole('dialog');
  await expect(sheet).toBeVisible();
  await expect(sheet.getByRole('button', { name: 'Close' })).toBeFocused();

  await sheet.getByRole('link', { name: 'Replay this day' }).click();

  const replay = page.getByRole('dialog', { name: 'Day replay' });
  await expect(replay).toBeVisible();
  await expect(replay.getByRole('button', { name: 'Close replay' })).toBeFocused();
  await expect(replay.locator('.replay__stage')).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(replay).toHaveCount(0);
});
