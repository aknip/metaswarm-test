import { test, expect } from '@playwright/test';

test.describe('Real-Time SSE Sync (UC-U10)', () => {
  test.beforeEach(async ({ request }) => {
    // Clean up all existing todos before each test
    const res = await request.get('http://localhost:3000/api/todos');
    const todos = (await res.json()) as { id: string }[];
    for (const todo of todos) {
      await request.delete(`http://localhost:3000/api/todos/${todo.id}`);
    }
  });

  test('syncs new todo across browser contexts (UC-U10, Main Flow)', async ({
    browser,
  }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    await page1.goto('/');
    await page2.goto('/');

    // Both tabs show empty state
    await expect(page1.getByText('No todos yet')).toBeVisible();
    await expect(page2.getByText('No todos yet')).toBeVisible();

    // Create todo in tab 1
    const input = page1.getByPlaceholder('Add a todo...');
    await input.fill('Synced todo');
    await input.press('Enter');

    // Tab 1 sees it immediately
    await expect(page1.getByText('Synced todo')).toBeVisible();

    // Tab 2 sees it via SSE
    await expect(page2.getByText('Synced todo')).toBeVisible({
      timeout: 5000,
    });

    await context1.close();
    await context2.close();
  });
});
