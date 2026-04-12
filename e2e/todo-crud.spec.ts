import { test, expect } from '@playwright/test';

test.describe('Todo CRUD (UC-U01, UC-U02, UC-U03, UC-U04)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('shows empty state when no todos exist (UC-U02, Alt 5a)', async ({
    page,
  }) => {
    await expect(page.getByText('No todos yet')).toBeVisible();
  });

  test('displays the app title (UC-U02, Main Flow step 1)', async ({
    page,
  }) => {
    await expect(
      page.getByRole('heading', { name: /todo \+ ai chat/i })
    ).toBeVisible();
  });
});
