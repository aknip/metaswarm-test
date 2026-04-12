# Use Cases — Real-Time Todo List with AI Chat

## Business Level

These use cases describe the business goals and value delivered.

### BUC-1: Manage Tasks Efficiently
**Actor**: End User
**Goal**: Users can create, view, edit, and delete tasks to manage their daily work.
**Business Value**: Enables personal productivity and task tracking.
**Success Criteria**: All CRUD operations work reliably with persistent storage.

### BUC-2: Collaborate in Real-Time
**Actor**: End User (multiple browser tabs/devices)
**Goal**: Changes made in one tab are instantly visible in all other open tabs.
**Business Value**: Eliminates stale data and manual refresh; supports multi-device usage.
**Success Criteria**: A todo created/updated/deleted in one tab appears in all other tabs within 1 second.

### BUC-3: AI-Assisted Task Management
**Actor**: End User
**Goal**: Users can interact with an AI assistant that understands and modifies their todo list.
**Business Value**: Natural-language interface for task management; reduces friction for power users.
**Success Criteria**: AI can list, create, update, and delete todos through conversational commands.

---

## User Level

These use cases describe user interactions and expected system behavior.

### UC-1: Create a Todo
**Actor**: User
**Precondition**: App is open in browser.
**Main Flow**:
1. User types a title in the input field.
2. User submits the form (Enter key or Add button).
3. System creates the todo via API.
4. New todo appears at the top of the list.
5. All other connected tabs receive the new todo via SSE.
**Postcondition**: Todo exists in database and is visible in all tabs.
**Validation**: Title must not be empty.

### UC-2: View All Todos
**Actor**: User
**Precondition**: App is open in browser.
**Main Flow**:
1. On page load, system fetches all todos from API.
2. Todos are displayed in reverse chronological order.
3. Each todo shows title, completion status, and delete action.
**Postcondition**: All persisted todos are displayed.
**Alternative**: If no todos exist, show "No todos yet" message.

### UC-3: Toggle Todo Completion
**Actor**: User
**Precondition**: At least one todo exists.
**Main Flow**:
1. User clicks the checkbox next to a todo.
2. System sends PATCH request with toggled completed status.
3. Todo visual state updates (strikethrough for completed).
4. All other tabs receive the update via SSE.
**Postcondition**: Todo completion status is persisted and synced.

### UC-4: Edit Todo Title
**Actor**: User
**Precondition**: At least one todo exists.
**Main Flow**:
1. User clicks on a todo title to enter edit mode.
2. User modifies the title text.
3. User confirms by pressing Enter or clicking Save.
4. System sends PATCH request with new title.
5. Updated title is displayed; all tabs sync via SSE.
**Postcondition**: Updated title is persisted and synced.
**Alternative**: User presses Escape to cancel editing.
**Validation**: Title must not be empty.

### UC-5: Delete a Todo
**Actor**: User
**Precondition**: At least one todo exists.
**Main Flow**:
1. User clicks the Delete button on a todo.
2. System sends DELETE request.
3. Todo is removed from the list.
4. All other tabs remove the todo via SSE.
**Postcondition**: Todo is removed from database and all tabs.

### UC-6: Real-Time Sync Across Tabs
**Actor**: User with multiple browser tabs open.
**Precondition**: App is open in two or more tabs.
**Main Flow**:
1. User performs a mutation (create/update/delete) in Tab A.
2. Tab B receives SSE event within 1 second.
3. Tab B's UI updates to reflect the change without manual refresh.
**Postcondition**: All tabs show identical state.
**Covers**: SSE connection, reconnection, broadcast to multiple clients.

### UC-7: Send a Chat Message
**Actor**: User
**Precondition**: App is open with chat panel visible.
**Main Flow**:
1. User types a message in the chat input.
2. User submits the message.
3. User's message appears in the chat history.
4. System shows "AI is thinking..." indicator.
5. AI response appears in the chat history.
**Postcondition**: Both user message and AI response are in the chat history.

### UC-8: AI Reads Todos
**Actor**: User (via AI chat)
**Precondition**: Todos exist in the database.
**Main Flow**:
1. User asks "What are my todos?" in chat.
2. AI uses list_todos tool to fetch todos.
3. AI responds with a summary of all todos.
**Postcondition**: User receives accurate todo summary.

### UC-9: AI Modifies Todos
**Actor**: User (via AI chat)
**Precondition**: App is open with chat panel.
**Main Flow**:
1. User says "Create a todo called 'Buy groceries'" in chat.
2. AI uses create_todo tool.
3. AI confirms the creation in chat response.
4. New todo appears in the todo list (via SSE broadcast).
**Postcondition**: Todo is created, visible in list, and confirmed by AI.
**Variations**:
- AI updates a todo: "Mark 'Buy groceries' as done"
- AI deletes a todo: "Delete the 'Buy groceries' todo"

---

## System Level

These use cases describe internal system behaviors and technical contracts.

### SUC-1: REST API — Create Todo
**Endpoint**: `POST /api/todos`
**Input**: `{ "title": "string (min 1 char)" }`
**Processing**: Validate input with Zod → Insert into SQLite → Broadcast SSE "created" event
**Output**: `201 { id, title, completed: 0, created_at, updated_at }`
**Error**: `400 { error: "Title is required" }` if title is empty/missing.

### SUC-2: REST API — List Todos
**Endpoint**: `GET /api/todos`
**Input**: None
**Processing**: Query all todos ordered by created_at DESC, rowid DESC
**Output**: `200 [Todo, ...]`

### SUC-3: REST API — Get Todo
**Endpoint**: `GET /api/todos/:id`
**Input**: URL param `id`
**Processing**: Query by id
**Output**: `200 Todo` or `404 { error: "Todo not found" }`

### SUC-4: REST API — Update Todo
**Endpoint**: `PATCH /api/todos/:id`
**Input**: `{ "title": "string (min 1 char)", "completed": boolean }`
**Processing**: Validate input → Check exists → Update → Broadcast SSE "updated" event
**Output**: `200 Todo` or `404` or `400`

### SUC-5: REST API — Delete Todo
**Endpoint**: `DELETE /api/todos/:id`
**Input**: URL param `id`
**Processing**: Delete from SQLite → Broadcast SSE "deleted" event
**Output**: `200 { id }` or `404 { error: "Todo not found" }`

### SUC-6: SSE — Event Stream
**Endpoint**: `GET /api/sse/events`
**Protocol**: Server-Sent Events (text/event-stream)
**Events**:
- `created` — data: full Todo JSON
- `updated` — data: full Todo JSON
- `deleted` — data: `{ "id": "string" }`
- `ping` — keep-alive every 30 seconds
**Behavior**: Client added to broadcast set on connect, removed on disconnect/abort.

### SUC-7: Chat — Message Processing
**Endpoint**: `POST /api/chat/message`
**Input**: `{ "sessionId": "string", "message": "string" }`
**Processing**:
1. Retrieve or create session message history.
2. Append user message.
3. Call Claude API with tools (list_todos, get_todo, create_todo, update_todo, delete_todo).
4. Loop: if stop_reason is "tool_use", execute tools and re-call API.
5. Extract final text response.
6. Persist session history.
**Output**: `200 { response: "string" }`
**Error**: `400` if sessionId or message missing.

### SUC-8: Database — Schema & Constraints
**Table**: `todos`
**Columns**:
- `id` TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8))))
- `title` TEXT NOT NULL
- `completed` INTEGER NOT NULL DEFAULT 0
- `created_at` TEXT NOT NULL DEFAULT (datetime('now'))
- `updated_at` TEXT NOT NULL DEFAULT (datetime('now'))
**Mode**: WAL for concurrent read/write.

### SUC-9: Tool Execution — AI CRUD Operations
**Tools**: list_todos, get_todo, create_todo, update_todo, delete_todo
**Behavior**: Each tool executes the corresponding TodoRepo method and broadcasts SSE events for mutations.
**Error Handling**: Returns `{ error: "Not found" }` for missing todos, `{ error: "Unknown tool: X" }` for unknown tools.

---

## Test Case Mapping

### Backend Unit Tests (Vitest — 100% coverage)

| Test Case | Use Case | File | Description |
|-----------|----------|------|-------------|
| DB-1 | SUC-8 | db.test.ts | Creates in-memory DB with todos table |
| DB-2 | SUC-1 | db.test.ts | Creates todo with defaults |
| DB-3 | SUC-2 | db.test.ts | Lists todos in reverse chronological order |
| DB-4 | SUC-3 | db.test.ts | Gets todo by id / returns undefined |
| DB-5 | SUC-4 | db.test.ts | Updates title and completed |
| DB-6 | SUC-5 | db.test.ts | Deletes todo / returns undefined |
| RT-1 | SUC-2 | routes.test.ts | GET / returns all todos |
| RT-2 | SUC-3 | routes.test.ts | GET /:id returns todo or 404 |
| RT-3 | SUC-1 | routes.test.ts | POST / creates todo, broadcasts, returns 201 |
| RT-4 | SUC-1 | routes.test.ts | POST / returns 400 for empty title |
| RT-5 | SUC-4 | routes.test.ts | PATCH /:id updates todo, broadcasts |
| RT-6 | SUC-4 | routes.test.ts | PATCH /:id returns 404 for missing |
| RT-7 | SUC-5 | routes.test.ts | DELETE /:id deletes, broadcasts |
| RT-8 | SUC-5 | routes.test.ts | DELETE /:id returns 404 for missing |
| SSE-1 | SUC-6 | sse.test.ts | Add/remove clients |
| SSE-2 | SUC-6 | sse.test.ts | Broadcast sends to all clients |
| SSE-3 | SUC-6 | sse.test.ts | /events returns text/event-stream |
| CH-1 | SUC-7 | chat.test.ts | Returns 400 if sessionId/message missing |
| CH-2 | SUC-7 | chat.test.ts | Returns text response for simple message |
| CH-3 | SUC-7,9 | chat.test.ts | Handles tool_use loop |
| CH-4 | SUC-9 | chat.test.ts | All tool executions (list, get, create, update, delete) |
| CH-5 | SUC-7 | chat.test.ts | Preserves session history |

### Frontend E2E Tests (Playwright)

| Test Case | Use Case | Description |
|-----------|----------|-------------|
| E2E-1 | UC-2 | Page loads and shows empty state |
| E2E-2 | UC-1 | Create a todo via form |
| E2E-3 | UC-3 | Toggle todo completion |
| E2E-4 | UC-4 | Edit todo title (enter edit, save, cancel) |
| E2E-5 | UC-5 | Delete a todo |
| E2E-6 | UC-6 | Real-time sync: create in Tab A, appears in Tab B |
| E2E-7 | UC-6 | Real-time sync: delete in Tab A, removed from Tab B |
| E2E-8 | UC-7 | Send a chat message, receive AI response |
| E2E-9 | UC-8,9 | AI creates a todo via chat, appears in list |
