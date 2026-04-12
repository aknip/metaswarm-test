import { Page } from '@playwright/test';

/**
 * Clear all todos from the database via API.
 * Used in beforeEach to ensure clean state.
 */
export async function clearAllTodos(page: Page): Promise<void> {
  const response = await page.request.get('/api/todos');
  const todos = (await response.json()) as { id: string }[];
  for (const todo of todos) {
    await page.request.delete(`/api/todos/${todo.id}`);
  }
}

/**
 * Create a todo via API (bypassing UI for setup speed).
 */
export async function createTodoViaAPI(
  page: Page,
  title: string
): Promise<{ id: string; title: string; completed: boolean }> {
  const response = await page.request.post('/api/todos', {
    data: { title },
  });
  return (await response.json()) as {
    id: string;
    title: string;
    completed: boolean;
  };
}

/**
 * Wait for the todo list to be loaded and visible.
 */
export async function waitForTodoList(page: Page): Promise<void> {
  // Wait for the loading state to finish
  await page.waitForFunction(() => {
    const loading = document.querySelector('.loading');
    return !loading;
  });
}
