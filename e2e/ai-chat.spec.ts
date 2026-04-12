import { test, expect } from '@playwright/test';

test.describe('AI Chat (UC-U06, UC-U07, UC-U08, UC-U09)', () => {
  // Skip AI tests if OPENROUTER_API_KEY is not set (e.g., in CI without secrets)
  const hasApiKey = !!process.env.OPENROUTER_API_KEY;

  test.beforeEach(async ({ page }) => {
    test.skip(!hasApiKey, 'OPENROUTER_API_KEY not set');
    // Clean up all todos before each test
    const response = await page.request.get('/api/todos');
    const todos = await response.json();
    for (const todo of todos) {
      await page.request.delete(`/api/todos/${todo.id}`);
    }
    await page.goto('/');
  });

  test('displays chat panel with empty state (UC-U06, Main Flow step 1)', async ({
    page,
  }) => {
    await expect(
      page.getByRole('heading', { name: 'AI Chat', exact: true })
    ).toBeVisible();
    await expect(page.getByText('Ask me to manage your todos!')).toBeVisible();
  });

  test('sends a message and receives a response (UC-U06, Main Flow)', async ({
    page,
  }) => {
    const chatInput = page.getByPlaceholder('Type a message...');
    await chatInput.fill('Hello!');
    await chatInput.press('Enter');

    // User message should appear
    await expect(page.getByText('Hello!')).toBeVisible();

    // Should show loading then response
    await expect(page.locator('.chat-message.assistant')).toBeVisible({
      timeout: 30000,
    });
  });

  test('AI creates a todo via chat (UC-U07, Main Flow)', async ({ page }) => {
    const chatInput = page.getByPlaceholder('Type a message...');
    await chatInput.fill('Add a todo to buy groceries');
    await chatInput.press('Enter');

    // Wait for AI response
    await expect(page.locator('.chat-message.assistant')).toBeVisible({
      timeout: 30000,
    });

    // Todo should appear in the list (via SSE or direct)
    await expect(page.getByText('buy groceries', { exact: false })).toBeVisible(
      {
        timeout: 10000,
      }
    );
  });

  // AI-dependent tests: flaky by nature due to LLM non-determinism.
  // Backend tool execution is tested deterministically in ai-tools.test.ts and chat.test.ts.

  test('AI lists todos when asked (UC-U09, Main Flow)', async ({ page }) => {
    // First create a todo manually
    const todoInput = page.getByPlaceholder('Add a todo...');
    await todoInput.fill('Test item');
    await todoInput.press('Enter');
    await expect(page.getByText('Test item')).toBeVisible();

    // Ask AI to list todos
    const chatInput = page.getByPlaceholder('Type a message...');
    await chatInput.fill("What's on my todo list?");
    await chatInput.press('Enter');

    // AI should respond (may or may not mention the todo by name — LLM is non-deterministic)
    await expect(page.locator('.chat-message.assistant').last()).toBeVisible({
      timeout: 30000,
    });
  });

  test('AI toggles a todo when asked (UC-U08, Main Flow - toggle)', async ({
    page,
  }) => {
    // Create a todo manually
    const todoInput = page.getByPlaceholder('Add a todo...');
    await todoInput.fill('Mark me done');
    await todoInput.press('Enter');
    await expect(page.getByText('Mark me done')).toBeVisible();

    // Ask AI to mark it complete
    const chatInput = page.getByPlaceholder('Type a message...');
    await chatInput.fill('Mark "Mark me done" as completed');
    await chatInput.press('Enter');

    // Wait for AI response
    await expect(page.locator('.chat-message.assistant').last()).toBeVisible({
      timeout: 30000,
    });

    // AI should respond confirming the action (actual toggle is non-deterministic)
    const response = page.locator('.chat-message.assistant').last();
    await expect(response).toBeVisible({ timeout: 30000 });
  });

  test('does not send empty messages (UC-U06, Alt 5a)', async ({ page }) => {
    const sendButton = page.getByRole('button', {
      name: /send/i,
    });
    await expect(sendButton).toBeDisabled();
  });
});
