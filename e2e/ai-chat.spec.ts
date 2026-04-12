import { test, expect } from '@playwright/test';
import { clearAllTodos, createTodoViaAPI, waitForTodoList } from './helpers';

test.beforeEach(async ({ page }) => {
  await clearAllTodos(page);
  await page.goto('/');
  await waitForTodoList(page);
});

/**
 * Helper to mock the /api/chat endpoint with a predetermined response.
 * This avoids real Claude API calls in E2E tests.
 */
async function mockChatResponse(
  page: import('@playwright/test').Page,
  response: { message: string }
) {
  await page.route('/api/chat', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(response),
    });
  });
}

/**
 * Helper to mock /api/chat to simulate a tool call that creates a todo.
 * The mock first creates the todo via the real API, then returns a chat response.
 */
async function mockChatWithTodoCreation(
  page: import('@playwright/test').Page,
  todoTitle: string,
  chatResponse: string
) {
  await page.route('/api/chat', async (route) => {
    // Create the todo via real API (simulating what the AI tool would do)
    await page.request.post('/api/todos', {
      data: { title: todoTitle },
    });
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ message: chatResponse }),
    });
  });
}

/**
 * Helper to mock /api/chat to simulate a tool call that updates a todo.
 */
async function mockChatWithTodoUpdate(
  page: import('@playwright/test').Page,
  todoId: string,
  updates: { title?: string; completed?: boolean },
  chatResponse: string
) {
  await page.route('/api/chat', async (route) => {
    await page.request.patch(`/api/todos/${todoId}`, {
      data: updates,
    });
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ message: chatResponse }),
    });
  });
}

/**
 * Helper to mock /api/chat to simulate a tool call that deletes a todo.
 */
async function mockChatWithTodoDeletion(
  page: import('@playwright/test').Page,
  todoId: string,
  chatResponse: string
) {
  await page.route('/api/chat', async (route) => {
    await page.request.delete(`/api/todos/${todoId}`);
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ message: chatResponse }),
    });
  });
}

// UC-06, BUC-02: Send message and get response
test('send message and get AI response', async ({ page }) => {
  await mockChatResponse(page, { message: 'Hello! How can I help you?' });

  await page.getByRole('textbox', { name: 'Chat message' }).fill('Hello');
  await page.getByRole('button', { name: 'Send' }).click();

  // Check user message appears
  const messages = page.getByTestId('chat-message');
  await expect(messages.first()).toContainText('Hello');

  // Check AI response appears
  await expect(messages.nth(1)).toContainText(
    'Hello! How can I help you?'
  );
});

// UC-07, BUC-02: AI reads todos
test('AI reads todos', async ({ page }) => {
  await createTodoViaAPI(page, 'Test todo');
  await page.reload();
  await waitForTodoList(page);

  await mockChatResponse(page, {
    message: 'You have 1 todo: "Test todo" (not completed)',
  });

  await page.getByRole('textbox', { name: 'Chat message' }).fill('What are my todos?');
  await page.getByRole('button', { name: 'Send' }).click();

  const messages = page.getByTestId('chat-message');
  await expect(messages.nth(1)).toContainText('You have 1 todo');
});

// UC-08, BUC-02: AI creates a todo
test('AI creates a todo', async ({ page }) => {
  await mockChatWithTodoCreation(
    page,
    'Buy milk',
    'Done! I created a todo "Buy milk" for you.'
  );

  await page.getByRole('textbox', { name: 'Chat message' }).fill('Add buy milk to my list');
  await page.getByRole('button', { name: 'Send' }).click();

  // Wait for AI response
  const messages = page.getByTestId('chat-message');
  await expect(messages.nth(1)).toContainText('Done! I created a todo');

  // The SSE event should update the todo list
  await expect(page.getByTestId('todo-item')).toHaveCount(1, {
    timeout: 5000,
  });
  await expect(page.getByTestId('todo-title')).toHaveText('Buy milk');
});

// UC-08, BUC-02: AI updates a todo
test('AI updates a todo', async ({ page }) => {
  const todo = await createTodoViaAPI(page, 'Original');
  await page.reload();
  await waitForTodoList(page);

  await mockChatWithTodoUpdate(
    page,
    todo.id,
    { title: 'Updated by AI' },
    'I updated the todo title to "Updated by AI".'
  );

  await page.getByRole('textbox', { name: 'Chat message' }).fill('Rename that to Updated by AI');
  await page.getByRole('button', { name: 'Send' }).click();

  const messages = page.getByTestId('chat-message');
  await expect(messages.nth(1)).toContainText('Updated by AI');

  // SSE should update the UI
  await expect(page.getByTestId('todo-title')).toHaveText('Updated by AI', {
    timeout: 5000,
  });
});

// UC-08, BUC-02: AI deletes a todo
test('AI deletes a todo', async ({ page }) => {
  const todo = await createTodoViaAPI(page, 'Delete this');
  await page.reload();
  await waitForTodoList(page);
  await expect(page.getByTestId('todo-item')).toHaveCount(1);

  await mockChatWithTodoDeletion(
    page,
    todo.id,
    'I deleted "Delete this" from your list.'
  );

  await page.getByRole('textbox', { name: 'Chat message' }).fill('Delete that todo');
  await page.getByRole('button', { name: 'Send' }).click();

  const messages = page.getByTestId('chat-message');
  await expect(messages.nth(1)).toContainText('deleted');

  // SSE should remove from UI
  await expect(page.getByTestId('todo-item')).toHaveCount(0, {
    timeout: 5000,
  });
});
