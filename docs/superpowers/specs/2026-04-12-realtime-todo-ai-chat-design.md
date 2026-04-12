# Design: Real-Time Todo List with AI Chat

**Date:** 2026-04-12
**Status:** Approved (Round 2)
**Branch:** v4-usecase-driven-3

### Design Decisions & Constraints

1. **Single-user app** — no authentication, no multi-user. Runs on localhost.
2. **OpenRouter API** — replaces Anthropic SDK stated in initial CLAUDE.md. CLAUDE.md will be updated.
3. **Coverage target: 100%** — overrides the 80% in .coverage-thresholds.json. Both CLAUDE.md and the threshold file will be updated during implementation.
4. **Chat history is ephemeral** — deliberate MVP decision. Lost on page refresh. No persistence planned.
5. **No undo for delete** — MVP trade-off. Immediate delete, no confirmation dialog.
6. **SSE: no deduplication** — server broadcasts to ALL clients including originator. Client applies updates idempotently (React state replacement). No special dedup mechanism needed.
7. **SSE reconnect: full state refetch** — no Last-Event-ID replay. Client fetches full todo list on reconnect.
8. **Max chat history: 50 messages** — client caps conversation history sent to server to prevent context window overflow.

## 1. Overview

A full-stack real-time todo list application with AI chat integration. Users manage todos through a web UI, and an AI assistant can read and modify todos through natural language conversation. All changes sync in real-time across browser tabs via SSE.

**Tech Stack:** Node.js + Hono, React 19 + Vite 6, SQLite (better-sqlite3), SSE, OpenRouter API
**Methodology:** Use-case-driven (RUP), TDD, vertical end-to-end slices

## 2. Definition of Done

1. CRUD operations for todo items via REST API
2. Persistent storage in SQLite
3. Real-time sync across browser tabs via SSE
4. AI chat that can read and modify todos (via OpenRouter API)
5. 100% test coverage on backend (Vitest), based on use cases
6. 100% test coverage on frontend (Playwright E2E), based on use cases
7. CI pipeline for tests and lint (GitHub Actions)

---

## 3. Use Case Hierarchy

### 3.1 Business-Level Use Cases

#### UC-B01: Manage Personal Tasks
**ID:** UC-B01
##### 1. Name, Brief Description
Enable users to organize their daily work by creating, viewing, updating, completing, and deleting tasks through a digital todo list.
##### 2. Actors, Trigger
- **Actor:** End User
- **Trigger:** User opens the application to manage their tasks
##### 3. Pre- and Postconditions
- **Precondition:** Application is accessible via web browser
- **Postcondition (Success):** User has an up-to-date, persistent record of their tasks
- **Postcondition (Abort):** User is informed of any failure; no data corruption
##### 4. Main Flow
1. User opens the todo application in their browser
2. System displays the current list of todos
3. User creates, updates, toggles completion, or deletes todos as needed
4. System persists all changes immediately
5. System confirms each action visually
##### 5. Alternative / Exception Flows
- 5a. Database unavailable: System shows error message, no data loss
- 5b. Invalid input: System rejects with validation message
##### 6. Special Requirements / Remarks
- All operations must be immediately persisted (no "save" button)
- Derives: UC-U01, UC-U02, UC-U03, UC-U04, UC-U05

---

#### UC-B02: AI-Assisted Task Management
**ID:** UC-B02
##### 1. Name, Brief Description
Provide intelligent assistance for task management through a conversational AI interface that can read and modify the user's todo list.
##### 2. Actors, Trigger
- **Actor:** End User
- **Trigger:** User opens AI chat panel and sends a message
##### 3. Pre- and Postconditions
- **Precondition:** Application is running; OpenRouter API key is configured
- **Postcondition (Success):** AI has responded and optionally modified todos as requested
- **Postcondition (Abort):** User informed of AI service unavailability; todos remain unchanged
##### 4. Main Flow
1. User opens the AI chat panel
2. User types a natural language message (e.g., "Add a todo to buy groceries")
3. System sends the message to the AI service with available tools
4. AI determines intent and executes appropriate tool calls
5. System applies tool results to the todo list
6. AI responds with a confirmation message
7. Todo list updates in real-time
##### 5. Alternative / Exception Flows
- 5a. AI service unavailable: System shows error; no todo modifications
- 5b. AI misunderstands intent: User can rephrase; no destructive changes without confirmation
- 5c. AI responds without tool calls: Simple conversational response displayed
##### 6. Special Requirements / Remarks
- AI must have access to: list, create, update, delete, toggle todos
- AI changes must trigger the same SSE events as manual changes
- Derives: UC-U06, UC-U07, UC-U08, UC-U09

---

#### UC-B03: Multi-Device Synchronization
**ID:** UC-B03
##### 1. Name, Brief Description
Keep the todo list consistent across multiple browser tabs/windows in real-time without manual refresh.
##### 2. Actors, Trigger
- **Actor:** End User (with multiple tabs open)
- **Trigger:** Any todo modification (manual or AI-driven) in any tab
##### 3. Pre- and Postconditions
- **Precondition:** Multiple browser tabs/windows are open to the application
- **Postcondition (Success):** All tabs reflect the same todo state within 1 second
- **Postcondition (Abort):** Tabs recover on reconnection; no stale data persists
##### 4. Main Flow
1. User has the application open in two or more browser tabs
2. User modifies a todo in Tab A (create, update, delete, or toggle)
3. Server broadcasts the change event via SSE
4. Tab B receives the event and updates its UI automatically
5. Both tabs show identical todo state
##### 5. Alternative / Exception Flows
- 5a. SSE connection drops: Client reconnects automatically and fetches current state
- 5b. Server restarts: Clients reconnect; full state sync on reconnection
##### 6. Special Requirements / Remarks
- SSE is unidirectional (server-to-client); modifications go through REST API
- Derives: UC-U10

---

### 3.2 User-Level Use Cases

#### UC-U01: Create Todo Item
**ID:** UC-U01 | **Derived from:** UC-B01
##### 1. Name, Brief Description
User creates a new todo item with a title. The item is added to the list with "not completed" status.
##### 2. Actors, Trigger
- **Actor:** End User
- **Trigger:** User types a title and submits the form
##### 3. Pre- and Postconditions
- **Precondition:** Todo list page is loaded
- **Postcondition (Success):** New todo appears in the list; persisted in database
- **Postcondition (Abort):** Validation error displayed; no todo created
##### 4. Main Flow
1. User types a todo title into the input field
2. User presses Enter or clicks the add button
3. Input field clears
4. New todo appears at the bottom of the list with unchecked status
##### 5. Alternative / Exception Flows
- 5a. Empty title: Form does not submit; input retains focus
- 5b. Whitespace-only title: Treated as empty (5a)
##### 6. Special Requirements / Remarks
- Title must be non-empty after trimming
- Maximum title length: 500 characters

---

#### UC-U02: View Todo List
**ID:** UC-U02 | **Derived from:** UC-B01
##### 1. Name, Brief Description
User views all existing todo items. The list shows title and completion status for each item.
##### 2. Actors, Trigger
- **Actor:** End User
- **Trigger:** User navigates to the application
##### 3. Pre- and Postconditions
- **Precondition:** Application is accessible
- **Postcondition (Success):** All todos displayed with current state
- **Postcondition (Abort):** Error message shown if data cannot be loaded
##### 4. Main Flow
1. User opens the application URL in browser
2. System fetches all todos from the server
3. System renders the todo list with each item's title and completion status
4. Completed todos are visually distinguished (strikethrough)
##### 5. Alternative / Exception Flows
- 5a. No todos exist: "No todos yet" empty state displayed
- 5b. Server unreachable: Error message with retry option
##### 6. Special Requirements / Remarks
- Todos ordered by creation time ascending (oldest first, newest at bottom — `created_at ASC`)

---

#### UC-U03: Update Todo Title
**ID:** UC-U03 | **Derived from:** UC-B01
##### 1. Name, Brief Description
User edits the title of an existing todo item.
##### 2. Actors, Trigger
- **Actor:** End User
- **Trigger:** User double-clicks a todo title
##### 3. Pre- and Postconditions
- **Precondition:** At least one todo exists in the list
- **Postcondition (Success):** Todo title updated in UI and database
- **Postcondition (Abort):** Original title restored; error shown
##### 4. Main Flow
1. User double-clicks on a todo title
2. Title becomes an editable input field with current text
3. User modifies the text
4. User presses Enter or clicks away (blur)
5. Updated title is saved and displayed
##### 5. Alternative / Exception Flows
- 5a. User presses Escape: Edit cancelled, original title restored
- 5b. Empty/whitespace title on save: Revert to original title
##### 6. Special Requirements / Remarks
- Same validation as UC-U01 (non-empty, max 500 chars)

---

#### UC-U04: Delete Todo Item
**ID:** UC-U04 | **Derived from:** UC-B01
##### 1. Name, Brief Description
User permanently removes a todo item from the list.
##### 2. Actors, Trigger
- **Actor:** End User
- **Trigger:** User clicks the delete button on a todo
##### 3. Pre- and Postconditions
- **Precondition:** At least one todo exists
- **Postcondition (Success):** Todo removed from list and database
- **Postcondition (Abort):** Todo remains; error shown
##### 4. Main Flow
1. User hovers over a todo item, revealing the delete button
2. User clicks the delete button
3. Todo is immediately removed from the list
4. System deletes the todo from the database
##### 5. Alternative / Exception Flows
- 5a. Todo already deleted (concurrent): 404 returned but UI handles gracefully (removes from list)
##### 6. Special Requirements / Remarks
- No confirmation dialog (immediate delete) — MVP trade-off, may revisit
- Delete is immediate — no undo

---

#### UC-U05: Toggle Todo Completion
**ID:** UC-U05 | **Derived from:** UC-B01
##### 1. Name, Brief Description
User marks a todo as completed or uncompleted by toggling its checkbox.
##### 2. Actors, Trigger
- **Actor:** End User
- **Trigger:** User clicks the checkbox next to a todo
##### 3. Pre- and Postconditions
- **Precondition:** At least one todo exists
- **Postcondition (Success):** Completion status toggled; visual update applied
- **Postcondition (Abort):** Status reverted; error shown
##### 4. Main Flow
1. User clicks the checkbox of a todo item
2. Completion status toggles (completed <-> not completed)
3. Visual style updates (strikethrough for completed)
4. Change is persisted to database
##### 5. Alternative / Exception Flows
- 5a. Server error: Checkbox reverts to previous state; error shown
##### 6. Special Requirements / Remarks
- Toggle is a single PATCH operation, not separate "complete"/"uncomplete"

---

#### UC-U06: Chat with AI Assistant
**ID:** UC-U06 | **Derived from:** UC-B02
##### 1. Name, Brief Description
User has a conversation with the AI assistant about their todos or general topics.
##### 2. Actors, Trigger
- **Actor:** End User
- **Trigger:** User types a message in the chat input and sends it
##### 3. Pre- and Postconditions
- **Precondition:** Chat panel is visible
- **Postcondition (Success):** AI response displayed in chat history
- **Postcondition (Abort):** Error message in chat; no side effects
##### 4. Main Flow
1. User types a message in the chat input
2. User presses Enter or clicks send
3. User's message appears in chat history
4. Loading indicator shows while AI processes
5. AI response streams/appears in chat history
##### 5. Alternative / Exception Flows
- 5a. Empty message: No submission
- 5b. AI service error: Error message displayed in chat
- 5c. Network error: Error message with retry suggestion
##### 6. Special Requirements / Remarks
- Chat history maintained for the session (in-memory, not persisted)
- Messages displayed in chronological order

---

#### UC-U07: AI Creates Todo
**ID:** UC-U07 | **Derived from:** UC-B02
##### 1. Name, Brief Description
User asks the AI to create one or more todo items through natural language.
##### 2. Actors, Trigger
- **Actor:** End User
- **Trigger:** User sends a chat message requesting todo creation
##### 3. Pre- and Postconditions
- **Precondition:** Chat is active; AI service available
- **Postcondition (Success):** Requested todo(s) created; AI confirms in chat; todo list updated
- **Postcondition (Abort):** AI explains failure; no partial changes
##### 4. Main Flow
1. User sends message like "Add a todo to buy milk"
2. AI interprets the intent and calls the create_todo tool
3. Server creates the todo in the database
4. SSE event broadcasts the new todo
5. AI responds confirming the creation
6. Todo list updates in real-time
##### 5. Alternative / Exception Flows
- 5a. Ambiguous request: AI asks for clarification
- 5b. Invalid todo data: AI reports the validation error
##### 6. Special Requirements / Remarks
- AI-created todos are identical to manually created ones
- Depends on: UC-U06 (chat), UC-S01 (create API)

---

#### UC-U08: AI Modifies Todo
**ID:** UC-U08 | **Derived from:** UC-B02
##### 1. Name, Brief Description
User asks the AI to update, toggle, or delete existing todos.
##### 2. Actors, Trigger
- **Actor:** End User
- **Trigger:** User sends a chat message requesting todo modification
##### 3. Pre- and Postconditions
- **Precondition:** Target todo(s) exist; chat is active
- **Postcondition (Success):** Todo(s) modified as requested; AI confirms
- **Postcondition (Abort):** AI explains what went wrong; no partial changes
##### 4. Main Flow
1. User sends message like "Mark 'buy milk' as done" or "Delete all completed todos"
2. AI lists current todos (if needed) to identify targets
3. AI calls appropriate tool(s) (update, toggle, delete)
4. Server applies changes; SSE broadcasts updates
5. AI responds confirming the modifications
##### 5. Alternative / Exception Flows
- 5a. Todo not found: AI informs user
- 5b. Multiple matches: AI asks for clarification
##### 6. Special Requirements / Remarks
- AI may chain multiple tool calls in one response
- Depends on: UC-U06, UC-S03, UC-S04, UC-S05

---

#### UC-U09: AI Lists Todos
**ID:** UC-U09 | **Derived from:** UC-B02
##### 1. Name, Brief Description
User asks the AI to describe or summarize the current todo list.
##### 2. Actors, Trigger
- **Actor:** End User
- **Trigger:** User asks about their todos in chat
##### 3. Pre- and Postconditions
- **Precondition:** Chat is active
- **Postcondition (Success):** AI provides accurate summary of current todos
- **Postcondition (Abort):** AI reports inability to fetch todos
##### 4. Main Flow
1. User asks "What's on my todo list?" or "How many todos do I have?"
2. AI calls the list_todos tool
3. AI formats and presents the todos in a readable response
##### 5. Alternative / Exception Flows
- 5a. No todos exist: AI reports the list is empty
##### 6. Special Requirements / Remarks
- Read-only operation; no side effects
- Depends on: UC-U06, UC-S02

---

#### UC-U10: Real-Time Sync Across Tabs
**ID:** UC-U10 | **Derived from:** UC-B03
##### 1. Name, Brief Description
Changes to todos made in one tab are reflected in all other open tabs in real-time.
##### 2. Actors, Trigger
- **Actor:** End User (with multiple tabs)
- **Trigger:** Any todo CRUD operation in any tab (manual or AI-driven)
##### 3. Pre- and Postconditions
- **Precondition:** Multiple tabs open; SSE connections established
- **Postcondition (Success):** All tabs show identical todo state
- **Postcondition (Abort):** Stale tab recovers on next reconnect
##### 4. Main Flow
1. User modifies a todo in Tab A
2. Server processes the API request and persists the change
3. Server broadcasts an SSE event (type: created/updated/deleted, payload: todo data)
4. Tab B receives the event via its SSE connection
5. Tab B updates its local state without a full page reload
##### 5. Alternative / Exception Flows
- 5a. SSE disconnects: Client auto-reconnects; fetches full state on reconnect
- 5b. Event missed during disconnect: Full state fetch on reconnect ensures consistency
##### 6. Special Requirements / Remarks
- SSE events: `todo:created`, `todo:updated`, `todo:deleted`
- No client-side deduplication needed: SSE events update state idempotently (full todo object replaces existing state). Originator tab receives the event and React reconciles without double-render.
- Depends on: UC-S06, UC-S07

---

### 3.3 System-Level Use Cases

#### UC-S01: REST API - Create Todo (POST /api/todos)
**ID:** UC-S01 | **Derived from:** UC-U01, UC-U07
##### 1. Name, Brief Description
API endpoint to create a new todo item. Accepts JSON body with `title`, returns the created todo.
##### 2. Actors, Trigger
- **Actor:** Client Application, AI Tool Executor
- **Trigger:** POST request to `/api/todos`
##### 3. Pre- and Postconditions
- **Precondition:** Valid JSON body with `title` field
- **Postcondition (Success):** 201 Created; todo in database; SSE event broadcast
- **Postcondition (Abort):** 400 Bad Request with validation errors
##### 4. Main Flow
1. Receive POST /api/todos with body `{ "title": "..." }`
2. Validate: title is non-empty string, max 500 chars
3. Insert into `todos` table with `completed = false`, `created_at = now()`
4. Broadcast `todo:created` SSE event with full todo object
5. Return 201 with created todo JSON
##### 5. Alternative / Exception Flows
- 5a. Missing title: 400 `{ "error": "Title is required" }`
- 5b. Title too long: 400 `{ "error": "Title must be 500 characters or less" }`
- 5c. DB error: 500 `{ "error": "Internal server error" }`
##### 6. Special Requirements / Remarks
- Response schema: `{ id, title, completed, createdAt, updatedAt }`
- `id` is a UUID v4

---

#### UC-S02: REST API - List Todos (GET /api/todos)
**ID:** UC-S02 | **Derived from:** UC-U02, UC-U09
##### 1. Name, Brief Description
API endpoint to retrieve all todo items, ordered by creation time ascending.
##### 2. Actors, Trigger
- **Actor:** Client Application, AI Tool Executor
- **Trigger:** GET request to `/api/todos`
##### 3. Pre- and Postconditions
- **Precondition:** None
- **Postcondition (Success):** 200 OK with array of todos
- **Postcondition (Abort):** 500 if database error
##### 4. Main Flow
1. Receive GET /api/todos
2. Query `todos` table ordered by `created_at ASC`
3. Return 200 with JSON array of todos
##### 5. Alternative / Exception Flows
- 5a. No todos: Return 200 with empty array `[]`
- 5b. DB error: 500 `{ "error": "Internal server error" }`
##### 6. Special Requirements / Remarks
- No pagination needed (single-user app)

---

#### UC-S03: REST API - Update Todo (PATCH /api/todos/:id)
**ID:** UC-S03 | **Derived from:** UC-U03, UC-U08
##### 1. Name, Brief Description
API endpoint to update a todo's title and/or completion status.
##### 2. Actors, Trigger
- **Actor:** Client Application, AI Tool Executor
- **Trigger:** PATCH request to `/api/todos/:id`
##### 3. Pre- and Postconditions
- **Precondition:** Todo with given ID exists
- **Postcondition (Success):** 200 OK; todo updated; SSE event broadcast
- **Postcondition (Abort):** 404 Not Found or 400 Bad Request
##### 4. Main Flow
1. Receive PATCH /api/todos/:id with body `{ "title"?: "...", "completed"?: boolean }`
2. Validate ID format (UUID) and body fields
3. Find todo by ID; return 404 if not found
4. Update provided fields; set `updated_at = now()`
5. Broadcast `todo:updated` SSE event
6. Return 200 with updated todo
##### 5. Alternative / Exception Flows
- 5a. Invalid ID: 400
- 5b. Todo not found: 404 `{ "error": "Todo not found" }`
- 5c. Empty body: 400 `{ "error": "No fields to update" }`
- 5d. Invalid title (empty/too long): 400 with validation error
##### 6. Special Requirements / Remarks
- Partial update — only provided fields are changed

---

#### UC-S04: REST API - Delete Todo (DELETE /api/todos/:id)
**ID:** UC-S04 | **Derived from:** UC-U04, UC-U08
##### 1. Name, Brief Description
API endpoint to permanently delete a todo item.
##### 2. Actors, Trigger
- **Actor:** Client Application, AI Tool Executor
- **Trigger:** DELETE request to `/api/todos/:id`
##### 3. Pre- and Postconditions
- **Precondition:** Todo with given ID exists
- **Postcondition (Success):** 204 No Content; todo removed from DB; SSE event broadcast
- **Postcondition (Abort):** 404 Not Found
##### 4. Main Flow
1. Receive DELETE /api/todos/:id
2. Validate ID format
3. Delete from `todos` table; check rows affected
4. If deleted: broadcast `todo:deleted` SSE event with `{ id }`
5. Return 204 No Content
##### 5. Alternative / Exception Flows
- 5a. Todo not found: 404 `{ "error": "Todo not found" }`
##### 6. Special Requirements / Remarks
- Strict delete: returns 404 for non-existent todo (not idempotent). Client handles 404 gracefully.

---

#### UC-S05: REST API - Toggle Todo (PATCH /api/todos/:id/toggle)
**ID:** UC-S05 | **Derived from:** UC-U05, UC-U08
##### 1. Name, Brief Description
API endpoint to toggle a todo's completion status. This is a convenience endpoint that reads current state and flips it.
##### 2. Actors, Trigger
- **Actor:** Client Application, AI Tool Executor
- **Trigger:** PATCH request to `/api/todos/:id/toggle`
##### 3. Pre- and Postconditions
- **Precondition:** Todo with given ID exists
- **Postcondition (Success):** 200 OK; completed status flipped; SSE event broadcast
- **Postcondition (Abort):** 404 Not Found
##### 4. Main Flow
1. Receive PATCH /api/todos/:id/toggle
2. Find todo by ID
3. Flip `completed` value (`true <-> false`)
4. Update `updated_at`
5. Broadcast `todo:updated` SSE event
6. Return 200 with updated todo
##### 5. Alternative / Exception Flows
- 5a. Todo not found: 404
##### 6. Special Requirements / Remarks
- Atomic read-modify-write via single SQL: `UPDATE todos SET completed = NOT completed, updated_at = datetime('now') WHERE id = ? RETURNING *`

---

#### UC-S06: SSE Event Stream (GET /api/events)
**ID:** UC-S06 | **Derived from:** UC-U10
##### 1. Name, Brief Description
SSE endpoint that clients connect to for real-time todo change notifications.
##### 2. Actors, Trigger
- **Actor:** Client Application (browser)
- **Trigger:** Client opens EventSource connection to `/api/events`
##### 3. Pre- and Postconditions
- **Precondition:** None
- **Postcondition (Success):** Persistent SSE connection; client receives events
- **Postcondition (Abort):** Connection closes; client auto-reconnects
##### 4. Main Flow
1. Client connects to GET /api/events
2. Server sends SSE headers (`Content-Type: text/event-stream`, etc.)
3. Server registers this connection in the active clients set
4. Server sends periodic keepalive comments (`:keepalive\n\n`) every 30s
5. When a todo changes, server sends event to all connected clients
6. On client disconnect, server removes from active clients set
##### 5. Alternative / Exception Flows
- 5a. Connection timeout: Client reconnects and fetches full state via GET /api/todos (no Last-Event-ID replay)
- 5b. Server restart: All connections drop; clients reconnect and refetch full state
##### 6. Special Requirements / Remarks
- Event format: `event: <type>\ndata: <json>\n\n`
- Event types: `todo:created`, `todo:updated`, `todo:deleted`
- Keep-alive prevents proxy timeouts

---

#### UC-S07: SSE Event Broadcasting
**ID:** UC-S07 | **Derived from:** UC-U10, UC-S01-S05
##### 1. Name, Brief Description
Internal system mechanism that broadcasts events to all connected SSE clients when todos change.
##### 2. Actors, Trigger
- **Actor:** Todo Route Handlers (internal)
- **Trigger:** Successful todo CRUD operation
##### 3. Pre- and Postconditions
- **Precondition:** At least one SSE client connected
- **Postcondition (Success):** All connected clients receive the event
- **Postcondition (Abort):** Failed sends remove dead connections from pool
##### 4. Main Flow
1. A todo route handler completes a CRUD operation
2. Handler calls `broadcast(eventType, payload)` on the SSE manager
3. SSE manager iterates over all connected clients
4. Each client receives the event data
5. Dead connections are cleaned up
##### 5. Alternative / Exception Flows
- 5a. No clients connected: Event is dropped (no persistence needed)
- 5b. Write fails on a client: Remove that client from pool
##### 6. Special Requirements / Remarks
- Fire-and-forget: route handlers don't wait for broadcast completion
- Broadcasting is synchronous within the SSE manager (single-threaded Node.js)

---

#### UC-S08: Chat API (POST /api/chat)
**ID:** UC-S08 | **Derived from:** UC-U06
##### 1. Name, Brief Description
API endpoint for sending chat messages to the AI and receiving responses with optional tool calls.
##### 2. Actors, Trigger
- **Actor:** Client Application
- **Trigger:** POST request with chat message(s)
##### 3. Pre- and Postconditions
- **Precondition:** OPENROUTER_API_KEY environment variable set
- **Postcondition (Success):** 200 OK with AI response (and any tool results)
- **Postcondition (Abort):** Error response with message
##### 4. Main Flow
1. Receive POST /api/chat with `{ "messages": [{ "role": "user", "content": "..." }] }`
2. Validate message format
3. Build system prompt with available tools definition
4. Call OpenRouter API (chat completions with tool_use)
5. If AI returns tool_call(s): execute each tool against the local todo API
6. If further tool calls needed: loop (max 5 iterations)
7. Return final AI response with all messages
##### 5. Alternative / Exception Flows
- 5a. OPENROUTER_API_KEY not set: 500 `{ "error": "AI service not configured" }`
- 5b. OpenRouter API error: 502 `{ "error": "AI service unavailable" }`
- 5c. Tool execution fails: Include error in tool result; let AI handle
- 5d. Max iterations exceeded: Return partial response with warning
##### 6. Special Requirements / Remarks
- OpenRouter API is called with model: `anthropic/claude-sonnet-4-20250514`
- Tool definitions follow OpenAI-compatible function calling format
- Message history is sent from the client (server is stateless per request)

---

#### UC-S09: AI Tool Execution
**ID:** UC-S09 | **Derived from:** UC-U07, UC-U08, UC-U09
##### 1. Name, Brief Description
Internal system that executes AI tool calls against the todo database, providing results back to the AI.
##### 2. Actors, Trigger
- **Actor:** Chat Route Handler (internal)
- **Trigger:** AI response contains tool_call(s)
##### 3. Pre- and Postconditions
- **Precondition:** Valid tool call with recognized function name and arguments
- **Postcondition (Success):** Tool executed; result returned to AI for synthesis
- **Postcondition (Abort):** Error result returned to AI
##### 4. Main Flow
1. Parse tool_call: `{ name, arguments }`
2. Match to handler: `list_todos`, `create_todo`, `update_todo`, `delete_todo`, `toggle_todo`
3. Execute the corresponding database operation
4. Broadcast SSE event (for mutating operations)
5. Return result to AI as tool_result message
##### 5. Alternative / Exception Flows
- 5a. Unknown tool: Return error result `{ "error": "Unknown tool" }`
- 5b. Invalid arguments: Return validation error result
- 5c. Database error: Return error result
##### 6. Special Requirements / Remarks
- Tools available to AI:
  - `list_todos()` -> returns all todos
  - `create_todo({ title })` -> creates and returns todo
  - `update_todo({ id, title?, completed? })` -> updates and returns todo
  - `delete_todo({ id })` -> deletes todo, returns success
  - `toggle_todo({ id })` -> toggles and returns todo

---

#### UC-S10: SQLite Persistence Layer
**ID:** UC-S10 | **Derived from:** UC-S01-S05
##### 1. Name, Brief Description
Database layer that provides CRUD operations on the `todos` table using better-sqlite3.
##### 2. Actors, Trigger
- **Actor:** Route Handlers, Tool Executor (internal)
- **Trigger:** Any database operation request
##### 3. Pre- and Postconditions
- **Precondition:** Database file exists and is writable
- **Postcondition (Success):** Data persisted; consistent state
- **Postcondition (Abort):** Transaction rolled back; error propagated
##### 4. Main Flow
1. On server start: create database file if not exists
2. Run migration: create `todos` table if not exists
3. Provide functions: `createTodo`, `getAllTodos`, `getTodoById`, `updateTodo`, `deleteTodo`, `toggleTodo`
4. Each function executes prepared SQL statements
5. UUIDs generated for new records
##### 5. Alternative / Exception Flows
- 5a. DB file locked: better-sqlite3 handles WAL mode
- 5b. Constraint violation: Error propagated to caller
##### 6. Special Requirements / Remarks
- Schema:
  ```sql
  CREATE TABLE todos (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    completed INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  ```
- Use WAL mode for better concurrent read performance
- All operations are synchronous (better-sqlite3 is sync)

---

#### UC-S11: Input Validation
**ID:** UC-S11 | **Derived from:** UC-S01, UC-S03, UC-S08
##### 1. Name, Brief Description
Centralized input validation for all API endpoints to prevent invalid data from reaching the database.
##### 2. Actors, Trigger
- **Actor:** Route Handlers (internal)
- **Trigger:** Incoming API request with body/params
##### 3. Pre- and Postconditions
- **Precondition:** Raw request data available
- **Postcondition (Success):** Validated, typed data passed to handler
- **Postcondition (Abort):** 400 response with specific error messages
##### 4. Main Flow
1. Extract request body/params
2. Apply validation rules:
   - `title`: string, non-empty after trim, max 500 chars
   - `id`: valid UUID v4 format
   - `completed`: boolean
   - `messages`: array of `{ role, content }` objects
3. Return validated data or throw validation error
##### 5. Alternative / Exception Flows
- 5a. Missing required field: 400 with field-specific error
- 5b. Wrong type: 400 with type error
- 5c. Malformed JSON: 400 with parse error
##### 6. Special Requirements / Remarks
- Validation is a pure function layer, no database access
- Consistent error response format: `{ "error": "message" }`

---

## 4. Architecture

### 4.1 High-Level Architecture

```
Browser Tab A ──┐                          ┌── Browser Tab B
  React SPA     │    REST API (JSON)       │    React SPA
  - TodoList    ├──── POST/PATCH/DELETE ──►│    - TodoList
  - ChatPanel   │◄──── SSE Events ────────┤    - ChatPanel
                │                          │
                └──────────┬───────────────┘
                           │
                    Hono Server (Node.js)
                    ├── /api/todos    (CRUD)
                    ├── /api/chat     (AI)
                    ├── /api/events   (SSE)
                    │
                    ├── SSE Manager
                    │   └── broadcasts to all clients
                    │
                    ├── AI Service
                    │   ├── OpenRouter API client
                    │   └── Tool executor
                    │
                    └── SQLite DB (better-sqlite3)
                        └── todos table
```

### 4.2 Data Flow

**Manual Todo Operation:**
1. User action in React UI
2. HTTP request to Hono API
3. Validation -> DB operation -> SSE broadcast
4. HTTP response to originating client
5. SSE event to ALL connected clients (including originator)

**AI Chat Operation:**
1. User sends chat message
2. POST /api/chat with message history
3. Server calls OpenRouter API with tools
4. AI returns tool_calls -> server executes tools (DB + SSE broadcast)
5. Tool results fed back to AI -> AI generates response
6. Response returned to client
7. SSE events already delivered to all tabs during tool execution

### 4.3 File Structure

```
src/
  server/
    index.ts              # Server entry point, Hono app setup
    db.ts                 # SQLite database layer (UC-S10)
    sse.ts                # SSE manager (UC-S06, UC-S07)
    validation.ts         # Input validation (UC-S11)
    routes/
      todos.ts            # Todo CRUD routes (UC-S01-S05)
      chat.ts             # Chat route (UC-S08)
      events.ts           # SSE endpoint (UC-S06)
    ai/
      openrouter.ts       # OpenRouter API client
      tools.ts            # Tool definitions and executor (UC-S09)
    __tests__/
      db.test.ts          # Database layer tests
      todos.test.ts       # Todo routes tests
      chat.test.ts        # Chat route tests
      sse.test.ts         # SSE tests
      validation.test.ts  # Validation tests
      ai-tools.test.ts    # AI tool execution tests
  client/
    index.html            # HTML entry point
    main.tsx              # React root
    App.tsx               # Main layout (split pane)
    api/
      client.ts           # HTTP client for /api/*
    components/
      TodoList.tsx         # Todo list with CRUD operations
      TodoItem.tsx         # Individual todo item
      ChatPanel.tsx        # AI chat interface
      ChatMessage.tsx      # Chat message bubble
    hooks/
      useTodos.ts          # Todo state + SSE sync
      useChat.ts           # Chat state management
      useSSE.ts            # SSE connection hook
  shared/
    types.ts               # Shared TypeScript types
e2e/
  todo-crud.spec.ts        # E2E: create, read, update, delete todos
  todo-toggle.spec.ts      # E2E: toggle completion
  realtime-sync.spec.ts    # E2E: multi-tab SSE sync
  ai-chat.spec.ts          # E2E: AI chat interactions
```

### 4.4 Technology Choices

| Component | Choice | Reason |
|-----------|--------|--------|
| Server | Hono + @hono/node-server | Type-safe routing, lightweight, ESM native |
| Database | better-sqlite3 | Sync API, zero-config, embedded |
| Real-time | SSE (native EventSource) | Unidirectional fits; simpler than WebSocket |
| AI | OpenRouter API | Provider-agnostic; OpenAI-compatible format |
| Frontend | React 19 + Vite 6 | Modern DX, fast HMR, TypeScript support |
| Unit tests | Vitest + v8 coverage | ESM native, Vite compatible |
| E2E tests | Playwright (Chromium) | Reliable, supports multi-tab |
| IDs | UUID v4 (crypto.randomUUID) | No sequential guessing, no auto-increment |

### 4.5 API Contract

#### Todos

| Method | Path | Body | Response | Use Case |
|--------|------|------|----------|----------|
| GET | /api/todos | - | 200: Todo[] | UC-S02 |
| POST | /api/todos | { title } | 201: Todo | UC-S01 |
| PATCH | /api/todos/:id | { title?, completed? } | 200: Todo | UC-S03 |
| DELETE | /api/todos/:id | - | 204 | UC-S04 |
| PATCH | /api/todos/:id/toggle | - | 200: Todo | UC-S05 |

#### Chat

| Method | Path | Body | Response | Use Case |
|--------|------|------|----------|----------|
| POST | /api/chat | { messages } | 200: { response, messages } | UC-S08 |

#### SSE

| Method | Path | Events | Use Case |
|--------|------|--------|----------|
| GET | /api/events | todo:created, todo:updated, todo:deleted | UC-S06 |

#### Types

```typescript
// === Shared types (src/shared/types.ts) — used by both client and server ===

interface Todo {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

// Public chat message types (client <-> server API boundary)
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];  // Max 50 messages enforced by validation
}

interface ChatResponse {
  response: string;         // Final assistant text response
  messages: ChatMessage[];  // Updated history (user + assistant only, no tool internals)
}

// Discriminated union for SSE events — enables safe TypeScript narrowing
type SSEEvent =
  | { type: 'todo:created'; data: Todo }
  | { type: 'todo:updated'; data: Todo }
  | { type: 'todo:deleted'; data: { id: string } };

interface ApiError {
  error: string;
}

// === Server-internal types (NOT shared) ===
// Used within the AI tool-call loop only; never exposed to clients.
// OpenRouter/OpenAI-compatible message roles include 'system', 'tool'.
// These are defined in src/server/ai/openrouter.ts, not in shared types.
```

---

## 5. Vertical Slice Implementation Plan

Each slice is a fully runnable, user-testable increment. TDD within each: write failing tests first, then implement.

### Slice 1: Foundation + View Empty Todo List + CI Pipeline
**Use Cases:** UC-U02, UC-S02, UC-S10 (partial)
**Goal:** App loads, shows empty todo list; backend serves empty array; CI green from day one

- Project scaffolding (package.json, tsconfig, vite.config, eslint, prettier)
- **CI pipeline: .github/workflows/ci.yml** (typecheck -> lint -> format -> test -> build -> e2e)
- SQLite database init with `todos` table
- GET /api/todos returns `[]`
- React app with TodoList showing "No todos yet"
- Update CLAUDE.md: OpenRouter replaces Anthropic SDK, coverage target 100%
- Update .coverage-thresholds.json to 100%
- **Backend tests:** DB init, GET /api/todos returns empty array
- **E2E tests:** App loads, shows empty state message

### Slice 2: Create Todo
**Use Cases:** UC-U01, UC-S01, UC-S10, UC-S11 (partial)
**Goal:** User can type a title and create a todo; it appears in the list

- POST /api/todos endpoint with validation
- React input form with submit
- Todo appears in list after creation
- **Backend tests:** Create todo succeeds, validation rejects empty/long titles
- **E2E tests:** Type title, submit, see todo in list

### Slice 3: Toggle Completion + Update Title
**Use Cases:** UC-U03, UC-U05, UC-S03, UC-S05
**Goal:** User can check/uncheck todos and edit titles inline

- PATCH /api/todos/:id and PATCH /api/todos/:id/toggle
- Checkbox toggle in UI
- Double-click to edit title
- **Backend tests:** Toggle, update, 404 handling
- **E2E tests:** Toggle checkbox, edit title via double-click

### Slice 4: Delete Todo
**Use Cases:** UC-U04, UC-S04
**Goal:** User can delete todos

- DELETE /api/todos/:id endpoint
- Delete button (visible on hover)
- **Backend tests:** Delete, 404 handling
- **E2E tests:** Delete todo, verify removed from list

### Slice 5: Real-Time SSE Sync
**Use Cases:** UC-U10, UC-S06, UC-S07
**Goal:** Changes in one tab appear in another tab without refresh

- SSE endpoint GET /api/events
- SSE manager (broadcast to all clients)
- React useSSE hook
- Wire SSE events into todo state
- **Backend tests:** SSE connection, event broadcasting
- **E2E tests:** Two browser contexts, create in one, see in other

### Slice 6: AI Chat Integration
**Use Cases:** UC-U06, UC-U07, UC-U08, UC-U09, UC-S08, UC-S09
**Goal:** User chats with AI; AI can read and modify todos

- OpenRouter API client
- AI tool definitions and executor
- POST /api/chat endpoint
- React ChatPanel component
- **Backend tests:** Chat endpoint, tool execution (mocked OpenRouter)
- **E2E tests:** Send message, receive response, AI creates/modifies todo

### Slice 7: Coverage Hardening + Polish
**Use Cases:** All (quality assurance)
**Goal:** Ensure 100% coverage; fix any gaps; final quality pass

- Review and fill any coverage gaps across all test files
- Verify all use case traceability comments are present
- Final lint, format, typecheck, build verification
- Production build test (vite build + tsc)

---

## 6. Test Strategy

### 6.1 Backend Unit Tests (Vitest)

Every test references the use case it validates:

| Test File | Use Cases Covered |
|-----------|------------------|
| db.test.ts | UC-S10 (all DB operations) |
| validation.test.ts | UC-S11 (input validation) |
| todos.test.ts | UC-S01, UC-S02, UC-S03, UC-S04, UC-S05 |
| sse.test.ts | UC-S06, UC-S07 |
| chat.test.ts | UC-S08 |
| ai-tools.test.ts | UC-S09 |

**Coverage target:** 100% lines, branches, functions, statements

### 6.1.1 Mock Infrastructure

**OpenRouter API mocking (chat.test.ts, ai-tools.test.ts):**
- Use `vi.mock()` to mock the `openrouter.ts` module at the module boundary
- Mock returns predefined responses: plain text, single tool_call, multi-tool chain, error
- Test the max-iterations (5) limit explicitly: mock returns tool_calls on every iteration to trigger the cap
- Test the 502 fallback: mock throws network error

**Database (all backend tests):**
- Each test file creates a fresh in-memory SQLite database (`:memory:`) via a `beforeEach` helper
- No shared state between tests

**SSE (sse.test.ts):**
- Use mock `WritableStream` / response objects to simulate SSE connections
- Test broadcast to multiple clients, dead connection cleanup

**Test spec for max iterations (UC-S08, Alt 5d):**
```typescript
it('returns partial response when tool loop exceeds 5 iterations (UC-S08, Alt 5d)', async () => {
  // Mock: AI always returns a tool_call, never a final text response
  // Assert: after 5 iterations, response contains warning about max iterations
});
```

### 6.2 E2E Tests (Playwright)

| Test File | Use Cases Covered |
|-----------|------------------|
| todo-crud.spec.ts | UC-U01, UC-U02, UC-U03, UC-U04 |
| todo-toggle.spec.ts | UC-U05 |
| realtime-sync.spec.ts | UC-U10 |
| ai-chat.spec.ts | UC-U06, UC-U07, UC-U08, UC-U09 |

**Coverage target:** 100% of user-visible functionality via use case scenarios

### 6.3 Test-Use Case Traceability

Every test function includes a comment linking to its use case:

```typescript
// Backend example
describe('POST /api/todos (UC-S01)', () => {
  it('creates a todo with valid title (UC-S01, Main Flow)', async () => { ... });
  it('rejects empty title (UC-S01, Alt 5a)', async () => { ... });
});

// E2E example
test('user creates a todo by typing and pressing Enter (UC-U01)', async () => { ... });
```

---

## 7. UI Layout

```
┌─────────────────────────────────────────────────┐
│  Todo + AI Chat                                 │
├───────────────────────────┬─────────────────────┤
│                           │                     │
│  Todo List                │  AI Chat            │
│  ─────────                │  ────────           │
│  [+] Add a todo...        │                     │
│                           │  [messages...]      │
│  ☐ Buy groceries    [x]  │                     │
│  ☑ Walk the dog      [x]  │                     │
│  ☐ Write report      [x]  │                     │
│                           │                     │
│                           │  [Type message...]  │
│                           │                     │
├───────────────────────────┴─────────────────────┤
│                                                 │
└─────────────────────────────────────────────────┘
```

- Left panel: Todo list with add form at top
- Right panel: Chat with messages and input at bottom
- Responsive: panels stack vertically on narrow screens
- Minimal CSS (no framework), clean and functional
