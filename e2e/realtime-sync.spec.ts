import { test, expect } from '@playwright/test';
import { clearAllTodos, waitForTodoList } from './helpers';

test.beforeEach(async ({ page }) => {
  await clearAllTodos(page);
});

// UC-09, BUC-03: Todo changes sync across tabs
test('todo changes sync across tabs via SSE', async ({ page, context }) => {
  // Open first tab
  await page.goto('/');
  await waitForTodoList(page);

  // Open second tab
  const page2 = await context.newPage();
  await page2.goto('/');
  await waitForTodoList(page2);

  // Create a todo in the first tab
  await page.getByLabel('New todo title').fill('Synced todo');
  await page.getByRole('button', { name: 'Add' }).click();

  // Verify it appears in the first tab
  await expect(page.getByTestId('todo-item')).toHaveCount(1);

  // Verify it syncs to the second tab via SSE
  await expect(page2.getByTestId('todo-item')).toHaveCount(1, {
    timeout: 5000,
  });
  await expect(page2.getByTestId('todo-title')).toHaveText('Synced todo');

  await page2.close();
});

// UC-08 + UC-09, BUC-02 + BUC-03: AI changes sync to other tabs
test('AI-created changes sync to other tabs', async ({ page, context }) => {
  // Open first tab (will receive SSE updates)
  await page.goto('/');
  await waitForTodoList(page);

  // Open second tab (will create todo via mock AI)
  const page2 = await context.newPage();
  await page2.goto('/');
  await waitForTodoList(page2);

  // Mock chat in second tab to create a todo via API (simulating AI tool call)
  await page2.route('/api/chat', async (route) => {
    await page2.request.post('/api/todos', {
      data: { title: 'AI synced todo' },
    });
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'Created!' }),
    });
  });

  // Send chat message in second tab
  await page2.getByRole('textbox', { name: 'Chat message' }).fill('Add a synced todo');
  await page2.getByRole('button', { name: 'Send' }).click();

  // Verify the todo appears in the second tab (from SSE)
  await expect(page2.getByTestId('todo-item')).toHaveCount(1, {
    timeout: 5000,
  });

  // Verify it syncs to the first tab via SSE
  await expect(page.getByTestId('todo-item')).toHaveCount(1, {
    timeout: 5000,
  });
  await expect(page.getByTestId('todo-title')).toHaveText('AI synced todo');

  await page2.close();
});
