import { test, expect } from '@playwright/test';
import { clearAllTodos, createTodoViaAPI, waitForTodoList } from './helpers';

test.beforeEach(async ({ page }) => {
  await clearAllTodos(page);
  await page.goto('/');
  await waitForTodoList(page);
});

// UC-01, BUC-01: Create a new todo
test('create a new todo', async ({ page }) => {
  await page.getByLabel('New todo title').fill('Buy groceries');
  await page.getByRole('button', { name: 'Add' }).click();

  await expect(page.getByTestId('todo-item')).toHaveCount(1);
  await expect(page.getByTestId('todo-title')).toHaveText('Buy groceries');
});

// UC-02, BUC-01: View todo list
test('view todo list', async ({ page }) => {
  await createTodoViaAPI(page, 'First todo');
  await createTodoViaAPI(page, 'Second todo');
  await page.reload();
  await waitForTodoList(page);

  await expect(page.getByTestId('todo-item')).toHaveCount(2);
});

// UC-03, BUC-01: Edit todo title
test('edit todo title', async ({ page }) => {
  await createTodoViaAPI(page, 'Original title');
  await page.reload();
  await waitForTodoList(page);

  await page.getByTestId('todo-title').dblclick();
  const editInput = page.getByLabel('Edit todo title');
  await editInput.clear();
  await editInput.fill('Updated title');
  await editInput.press('Enter');

  await expect(page.getByTestId('todo-title')).toHaveText('Updated title');
});

// UC-03/5c: Cancel edit via Escape key
test('cancel edit via Escape key', async ({ page }) => {
  await createTodoViaAPI(page, 'Original title');
  await page.reload();
  await waitForTodoList(page);

  await page.getByTestId('todo-title').dblclick();
  const editInput = page.getByLabel('Edit todo title');
  await editInput.clear();
  await editInput.fill('Changed');
  await editInput.press('Escape');

  await expect(page.getByTestId('todo-title')).toHaveText('Original title');
});

// UC-04, BUC-01: Toggle todo completion
test('toggle todo completion', async ({ page }) => {
  await createTodoViaAPI(page, 'Toggle me');
  await page.reload();
  await waitForTodoList(page);

  const checkbox = page.getByRole('checkbox');
  await expect(checkbox).not.toBeChecked();

  await checkbox.click();
  await expect(checkbox).toBeChecked();
  await expect(page.locator('.todo-item')).toHaveClass(/completed/);
});

// UC-05, BUC-01: Delete a todo
test('delete a todo', async ({ page }) => {
  await createTodoViaAPI(page, 'Delete me');
  await page.reload();
  await waitForTodoList(page);

  await expect(page.getByTestId('todo-item')).toHaveCount(1);
  await page.getByLabel('Delete "Delete me"').click();
  await expect(page.getByTestId('todo-item')).toHaveCount(0);
});

// UC-02/5a: Empty state display
test('empty state display', async ({ page }) => {
  await expect(page.getByTestId('empty-state')).toBeVisible();
  await expect(page.getByTestId('empty-state')).toHaveText(
    'No todos yet. Add one above!'
  );
});

// UC-01/5a: Validation error on empty title
test('validation error on empty title', async ({ page }) => {
  await page.getByRole('button', { name: 'Add' }).click();
  await expect(page.getByRole('alert')).toHaveText('Title is required');
});
