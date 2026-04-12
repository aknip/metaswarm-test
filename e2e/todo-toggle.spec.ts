import { test, expect } from '@playwright/test';

test.describe('Todo Toggle (UC-U05)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('toggles todo completion by clicking checkbox (UC-U05, Main Flow)', async ({
    page,
  }) => {
    const input = page.getByPlaceholder('Add a todo...');
    await input.fill('Test toggle');
    await input.press('Enter');
    await expect(page.getByText('Test toggle')).toBeVisible();

    const checkbox = page.getByRole('checkbox', {
      name: /toggle test toggle/i,
    });
    await expect(checkbox).not.toBeChecked();
    await checkbox.click();
    await expect(checkbox).toBeChecked();
    await expect(page.locator('.completed')).toBeVisible();

    await checkbox.click();
    await expect(checkbox).not.toBeChecked();
  });
});
