import { test, expect } from '@playwright/test';

test.describe('Todo CRUD (UC-U01, UC-U02, UC-U03, UC-U04)', () => {
  test.beforeEach(async ({ page, request }) => {
    // Clean up all existing todos before each test
    const res = await request.get('http://localhost:3000/api/todos');
    const todos = (await res.json()) as { id: string }[];
    for (const todo of todos) {
      await request.delete(`http://localhost:3000/api/todos/${todo.id}`);
    }
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

  test('creates a todo by typing and pressing Enter (UC-U01, Main Flow)', async ({
    page,
  }) => {
    const input = page.getByPlaceholder('Add a todo...');
    await input.fill('Buy milk');
    await input.press('Enter');
    await expect(page.getByText('Buy milk')).toBeVisible();
    await expect(input).toHaveValue('');
  });

  test('does not create todo with empty input (UC-U01, Alt 5a)', async ({
    page,
  }) => {
    const todosBefore = await page.locator('.todo-list li').count();
    const input = page.getByPlaceholder('Add a todo...');
    await input.press('Enter');
    // Verify no new todo was added
    const todosAfter = await page.locator('.todo-list li').count();
    expect(todosAfter).toBe(todosBefore);
  });

  test('edits a todo title by double-clicking (UC-U03, Main Flow)', async ({
    page,
  }) => {
    const input = page.getByPlaceholder('Add a todo...');
    await input.fill('Original title');
    await input.press('Enter');
    await expect(page.getByText('Original title')).toBeVisible();

    await page.getByText('Original title').dblclick();
    const editInput = page.locator('.edit-input');
    await editInput.fill('Updated title');
    await editInput.press('Enter');
    await expect(page.getByText('Updated title')).toBeVisible();
  });

  test('deletes a todo by clicking the delete button (UC-U04, Main Flow)', async ({
    page,
  }) => {
    const input = page.getByPlaceholder('Add a todo...');
    await input.fill('To be deleted');
    await input.press('Enter');
    await expect(page.getByText('To be deleted')).toBeVisible();

    await page.getByRole('button', { name: /delete to be deleted/i }).click();
    await expect(page.getByText('To be deleted')).not.toBeVisible();
  });
});
