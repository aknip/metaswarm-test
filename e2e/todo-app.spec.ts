import { test, expect, chromium, type Page } from '@playwright/test'

// Mock the chat API to avoid real Claude calls
async function mockChatAPI(page: Page, response: string) {
  await page.route('**/api/chat/message', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ response }),
    })
  })
}

// Mock chat API that also creates a todo via the real API
async function mockChatWithTodoCreation(page: Page, todoTitle: string, chatResponse: string) {
  await page.route('**/api/chat/message', async (route) => {
    // Actually create the todo via the real API so it triggers SSE
    const baseURL = 'http://localhost:3000'
    await fetch(`${baseURL}/api/todos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: todoTitle }),
    })
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ response: chatResponse }),
    })
  })
}

// Helper: delete all todos via API for clean state
async function clearTodos() {
  const res = await fetch('http://localhost:3000/api/todos')
  const todos = await res.json()
  for (const todo of todos) {
    await fetch(`http://localhost:3000/api/todos/${todo.id}`, { method: 'DELETE' })
  }
}

test.beforeEach(async () => {
  await clearTodos()
})

// --- UC-2: View All Todos ---
test('E2E-1: page loads and shows empty state', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByTestId('app-title')).toBeVisible()
  await expect(page.getByTestId('empty-state')).toHaveText('No todos yet')
})

// --- UC-1: Create a Todo ---
test('E2E-2: create a todo via form', async ({ page }) => {
  await page.goto('/')
  await page.getByTestId('todo-input').fill('Buy groceries')
  await page.getByTestId('add-button').click()

  // Wait for SSE to deliver the created event
  const todoList = page.getByTestId('todo-list')
  await expect(todoList).toContainText('Buy groceries')
  // Empty state should be gone
  await expect(page.getByTestId('empty-state')).not.toBeVisible()
})

// --- UC-3: Toggle Todo Completion ---
test('E2E-3: toggle todo completion', async ({ page }) => {
  await page.goto('/')

  // Create a todo first
  await page.getByTestId('todo-input').fill('Test toggle')
  await page.getByTestId('add-button').click()
  await expect(page.getByTestId('todo-list')).toContainText('Test toggle')

  // Find the checkbox and click it
  const checkbox = page.locator('[data-testid^="todo-checkbox-"]').first()
  await checkbox.click()

  // Verify the todo title has strikethrough (via style)
  const title = page.locator('[data-testid^="todo-title-"]').first()
  await expect(title).toHaveCSS('text-decoration-line', 'line-through')
})

// --- UC-4: Edit Todo Title ---
test('E2E-4: edit todo title (save and cancel)', async ({ page }) => {
  await page.goto('/')

  // Create a todo
  await page.getByTestId('todo-input').fill('Original title')
  await page.getByTestId('add-button').click()
  await expect(page.getByTestId('todo-list')).toContainText('Original title')

  // Click on the title to edit
  const title = page.locator('[data-testid^="todo-title-"]').first()
  await title.click()

  // Edit input should appear
  const editInput = page.getByTestId('edit-input')
  await expect(editInput).toBeVisible()

  // Type new title and save
  await editInput.fill('Updated title')
  await page.getByTestId('save-button').click()

  // Verify updated
  await expect(page.getByTestId('todo-list')).toContainText('Updated title')

  // Now test cancel: click to edit again
  const updatedTitle = page.locator('[data-testid^="todo-title-"]').first()
  await updatedTitle.click()
  await expect(page.getByTestId('edit-input')).toBeVisible()
  await page.getByTestId('cancel-button').click()
  // Edit input should be gone
  await expect(page.getByTestId('edit-input')).not.toBeVisible()
})

// --- UC-5: Delete a Todo ---
test('E2E-5: delete a todo', async ({ page }) => {
  await page.goto('/')

  // Create a todo
  await page.getByTestId('todo-input').fill('To be deleted')
  await page.getByTestId('add-button').click()
  await expect(page.getByTestId('todo-list')).toContainText('To be deleted')

  // Delete it
  const deleteButton = page.locator('[data-testid^="delete-button-"]').first()
  await deleteButton.click()

  // Should show empty state again
  await expect(page.getByTestId('empty-state')).toBeVisible()
})

// --- UC-6: Real-Time Sync (Create) ---
test('E2E-6: SSE sync — create in Tab A, appears in Tab B', async () => {
  const browser = await chromium.launch()
  const context1 = await browser.newContext()
  const context2 = await browser.newContext()
  const page1 = await context1.newPage()
  const page2 = await context2.newPage()

  await page1.goto('http://localhost:5173/')
  await page2.goto('http://localhost:5173/')

  // Both should show empty state
  await expect(page1.getByTestId('empty-state')).toBeVisible()
  await expect(page2.getByTestId('empty-state')).toBeVisible()

  // Create todo in Tab A
  await page1.getByTestId('todo-input').fill('Synced todo')
  await page1.getByTestId('add-button').click()

  // Verify it appears in Tab B via SSE
  await expect(page2.getByTestId('todo-list')).toContainText('Synced todo')

  await browser.close()
})

// --- UC-6: Real-Time Sync (Delete) ---
test('E2E-7: SSE sync — delete in Tab A, removed from Tab B', async () => {
  const browser = await chromium.launch()
  const context1 = await browser.newContext()
  const context2 = await browser.newContext()
  const page1 = await context1.newPage()
  const page2 = await context2.newPage()

  await page1.goto('http://localhost:5173/')
  await page2.goto('http://localhost:5173/')

  // Create todo in Tab A
  await page1.getByTestId('todo-input').fill('Will be deleted')
  await page1.getByTestId('add-button').click()

  // Wait for it to appear in both tabs
  await expect(page1.getByTestId('todo-list')).toContainText('Will be deleted')
  await expect(page2.getByTestId('todo-list')).toContainText('Will be deleted')

  // Delete in Tab A
  const deleteButton = page1.locator('[data-testid^="delete-button-"]').first()
  await deleteButton.click()

  // Verify it's removed from Tab B
  await expect(page2.getByTestId('empty-state')).toBeVisible()

  await browser.close()
})

// --- UC-7: Send a Chat Message ---
test('E2E-8: send chat message, receive AI response', async ({ page }) => {
  await mockChatAPI(page, 'Hello! I can help you manage your todos.')

  await page.goto('/')
  await page.getByTestId('chat-input').fill('Hello')
  await page.getByTestId('chat-send').click()

  // User message appears
  const chatMessages = page.getByTestId('chat-messages')
  await expect(chatMessages).toContainText('Hello')

  // AI response appears (mocked)
  await expect(chatMessages).toContainText('Hello! I can help you manage your todos.')
})

// --- UC-8,9: AI Creates a Todo via Chat ---
test('E2E-9: AI creates a todo via chat, appears in list', async ({ page }) => {
  await mockChatWithTodoCreation(page, 'AI-created task', 'I created a todo called "AI-created task" for you.')

  await page.goto('/')
  await page.getByTestId('chat-input').fill('Create a todo called AI-created task')
  await page.getByTestId('chat-send').click()

  // AI response confirms creation
  const chatMessages = page.getByTestId('chat-messages')
  await expect(chatMessages).toContainText('I created a todo called "AI-created task" for you.')

  // Todo appears in the list via SSE
  await expect(page.getByTestId('todo-list')).toContainText('AI-created task')
})
