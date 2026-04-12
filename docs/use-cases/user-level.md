# User-Level Use Cases

## Overview

These use cases describe the concrete interactions between users and the system.
Each is derived from a business-level use case and realized by system-level use cases.

---

# Use Case Name: Create Todo Item, ID: UC-01

## 1. Name, Brief Description
**Create Todo Item** — User creates a new todo item by providing a title.
The new item is saved to the database and appears in the list.

## 2. Actors, Trigger
- **Primary Actor**: End User
- **Trigger**: User clicks "Add" button or presses Enter after typing a title

## 3. Pre- and Postconditions (Success, Abort)
- **Preconditions**: Application is loaded in browser
- **Success Postcondition**: New todo exists in database with status "not completed"; UI shows the new item
- **Abort Postcondition**: No todo created; user sees validation error

## 4. Main Flow (Standard Scenario)
1. User types a title into the input field
2. User submits the form (click button or press Enter)
3. Client sends POST /api/todos with { title }
4. Server validates the input
5. Server inserts the todo into SQLite
6. Server broadcasts "todo:created" SSE event
7. Server responds with 201 and the created todo
8. Client adds the new todo to the list

## 5. Alternative / Exception Flows
- **5a. Empty title**: Client prevents submission; shows "Title is required" error
- **5b. Title too long (>500 chars)**: Server returns 400; client shows error
- **5c. Server error**: Client shows "Failed to create todo" message

## 6. Special Requirements / Remarks
- **Derived from**: BUC-01
- **Realized by**: SUC-02, SUC-04, SUC-07
- Default completed status is `false`
- Timestamps (createdAt, updatedAt) set automatically by server

---

# Use Case Name: View Todo List, ID: UC-02

## 1. Name, Brief Description
**View Todo List** — User views all existing todo items displayed in a list,
showing title and completion status.

## 2. Actors, Trigger
- **Primary Actor**: End User
- **Trigger**: User loads/refreshes the application

## 3. Pre- and Postconditions (Success, Abort)
- **Preconditions**: Application is accessible
- **Success Postcondition**: All todos from database are displayed in the UI
- **Abort Postcondition**: Error message shown; user can retry

## 4. Main Flow (Standard Scenario)
1. User navigates to the application URL
2. Client sends GET /api/todos
3. Server queries all todos from SQLite
4. Server responds with 200 and array of todos
5. Client renders the todo list

## 5. Alternative / Exception Flows
- **5a. No todos exist**: Client shows empty state message
- **5b. Server unreachable**: Client shows connection error with retry option

## 6. Special Requirements / Remarks
- **Derived from**: BUC-01
- **Realized by**: SUC-02
- Todos returned in creation order (newest first or oldest first — consistent)

---

# Use Case Name: Update Todo Item, ID: UC-03

## 1. Name, Brief Description
**Update Todo Item** — User modifies the title of an existing todo item.

## 2. Actors, Trigger
- **Primary Actor**: End User
- **Trigger**: User edits a todo's title (e.g., double-click to edit, inline edit)

## 3. Pre- and Postconditions (Success, Abort)
- **Preconditions**: At least one todo exists (UC-01 is precondition)
- **Success Postcondition**: Todo title updated in database; all clients see the change
- **Abort Postcondition**: Original title preserved; error shown

## 4. Main Flow (Standard Scenario)
1. User clicks/activates edit mode on a todo item
2. User modifies the title text
3. User confirms the edit (press Enter or click save)
4. Client sends PATCH /api/todos/:id with { title }
5. Server validates input
6. Server updates the todo in SQLite
7. Server broadcasts "todo:updated" SSE event
8. Server responds with 200 and updated todo
9. Client updates the item in the list

## 5. Alternative / Exception Flows
- **5a. Empty title**: Validation prevents save; shows error
- **5b. Todo not found (deleted by another tab)**: Server returns 404; client removes item from list
- **5c. Cancel edit**: User presses Escape; original title restored

## 6. Special Requirements / Remarks
- **Derived from**: BUC-01
- **Precondition**: UC-01 (todo must exist)
- **Realized by**: SUC-02, SUC-04, SUC-07
- updatedAt timestamp refreshed on update

---

# Use Case Name: Toggle Todo Completion, ID: UC-04

## 1. Name, Brief Description
**Toggle Todo Completion** — User toggles the completion status of a todo item
between completed and not completed.

## 2. Actors, Trigger
- **Primary Actor**: End User
- **Trigger**: User clicks the checkbox/toggle next to a todo item

## 3. Pre- and Postconditions (Success, Abort)
- **Preconditions**: At least one todo exists (UC-01 is precondition)
- **Success Postcondition**: Todo's completed status is flipped in database; UI reflects change
- **Abort Postcondition**: Status unchanged; error shown

## 4. Main Flow (Standard Scenario)
1. User clicks the checkbox next to a todo item
2. Client sends PATCH /api/todos/:id with { completed: !current }
3. Server updates the completed field in SQLite
4. Server broadcasts "todo:updated" SSE event
5. Server responds with 200 and updated todo
6. Client updates the checkbox visual state

## 5. Alternative / Exception Flows
- **5a. Todo not found**: Server returns 404; client removes item
- **5b. Network error**: Client shows error; reverts checkbox state

## 6. Special Requirements / Remarks
- **Derived from**: BUC-01
- **Precondition**: UC-01 (todo must exist)
- **Realized by**: SUC-02, SUC-04
- Toggle is a single-click action — no confirmation needed

---

# Use Case Name: Delete Todo Item, ID: UC-05

## 1. Name, Brief Description
**Delete Todo Item** — User permanently removes a todo item from the list.

## 2. Actors, Trigger
- **Primary Actor**: End User
- **Trigger**: User clicks the delete button on a todo item

## 3. Pre- and Postconditions (Success, Abort)
- **Preconditions**: At least one todo exists (UC-01 is precondition)
- **Success Postcondition**: Todo removed from database; all clients no longer show it
- **Abort Postcondition**: Todo still exists; error shown

## 4. Main Flow (Standard Scenario)
1. User clicks the delete button on a todo item
2. Client sends DELETE /api/todos/:id
3. Server deletes the todo from SQLite
4. Server broadcasts "todo:deleted" SSE event with the deleted todo's id
5. Server responds with 204 No Content
6. Client removes the item from the list

## 5. Alternative / Exception Flows
- **5a. Todo not found**: Server returns 404; client removes item from UI anyway (idempotent)
- **5b. Network error**: Client shows "Failed to delete" error

## 6. Special Requirements / Remarks
- **Derived from**: BUC-01
- **Precondition**: UC-01 (todo must exist)
- **Realized by**: SUC-02, SUC-04
- Deletion is permanent — no soft delete or undo

---

# Use Case Name: Chat with AI Assistant, ID: UC-06

## 1. Name, Brief Description
**Chat with AI Assistant** — User sends a natural-language message to the AI assistant
and receives a response. The AI can discuss todos, answer questions, and provide suggestions.

## 2. Actors, Trigger
- **Primary Actor**: End User
- **Secondary Actor**: AI Assistant (Claude)
- **Trigger**: User types a message in the chat input and sends it

## 3. Pre- and Postconditions (Success, Abort)
- **Preconditions**: Application loaded; ANTHROPIC_API_KEY configured
- **Success Postcondition**: AI response displayed in chat; any requested actions performed
- **Abort Postcondition**: Error message shown in chat; no side effects

## 4. Main Flow (Standard Scenario)
1. User types a message in the chat input
2. User sends the message (click or Enter)
3. Client sends POST /api/chat with { message, history }
4. Server constructs Claude API request with tool definitions
5. Server calls Claude SDK with the message
6. Claude processes and returns a response (possibly with tool calls)
7. Server processes any tool calls (read/modify todos) — see UC-07, UC-08
8. Server returns the AI response to the client
9. Client displays the AI response in the chat panel

## 5. Alternative / Exception Flows
- **5a. API key not configured**: Server returns 500; client shows "AI not configured" message
- **5b. API rate limited**: Server returns 429; client shows "Please try again"
- **5c. Empty message**: Client prevents submission

## 6. Special Requirements / Remarks
- **Derived from**: BUC-02
- **Depends on**: BUC-01 (AI tools interact with todo CRUD)
- **Realized by**: SUC-05, SUC-06
- Chat history maintained in client state for conversation context
- Claude is given tools: list_todos, create_todo, update_todo, delete_todo

---

# Use Case Name: AI Reads Todos, ID: UC-07

## 1. Name, Brief Description
**AI Reads Todos** — During a chat interaction, the AI assistant reads the current
todo list to answer questions or provide context-aware responses.

## 2. Actors, Trigger
- **Primary Actor**: AI Assistant (Claude)
- **Trigger**: User asks about their todos (e.g., "What's on my list?", "How many todos do I have?")

## 3. Pre- and Postconditions (Success, Abort)
- **Preconditions**: UC-06 chat session active; todos may or may not exist
- **Success Postcondition**: AI has accurate view of current todos; responds with correct information
- **Abort Postcondition**: AI informs user it couldn't read todos

## 4. Main Flow (Standard Scenario)
1. User asks a question about their todos in chat
2. Claude decides to use the `list_todos` tool
3. Server executes the tool: queries all todos from SQLite
4. Tool result (todo list) returned to Claude
5. Claude formulates response using the todo data
6. Response sent to user with accurate todo information

## 5. Alternative / Exception Flows
- **5a. No todos exist**: AI responds indicating the list is empty
- **5b. Database error**: Tool returns error; AI informs user

## 6. Special Requirements / Remarks
- **Derived from**: BUC-02
- **Precondition**: UC-06 (must be in active chat)
- **Realized by**: SUC-05, SUC-06
- Read operation is side-effect free

---

# Use Case Name: AI Modifies Todos, ID: UC-08

## 1. Name, Brief Description
**AI Modifies Todos** — During a chat interaction, the AI assistant creates, updates,
or deletes todos based on user instructions given in natural language.

## 2. Actors, Trigger
- **Primary Actor**: AI Assistant (Claude)
- **Trigger**: User instructs AI to modify todos (e.g., "Add 'buy milk' to my list", "Mark all as done")

## 3. Pre- and Postconditions (Success, Abort)
- **Preconditions**: UC-06 chat session active
- **Success Postcondition**: Todos modified as requested; changes persisted; SSE events broadcast
- **Abort Postcondition**: No modifications made; AI explains what went wrong

## 4. Main Flow (Standard Scenario)
1. User instructs AI to modify todos in chat
2. Claude decides which tool(s) to use (create_todo, update_todo, delete_todo)
3. Server executes the tool call(s) against SQLite
4. Server broadcasts SSE events for each modification
5. Tool results returned to Claude
6. Claude confirms the action(s) to the user in natural language
7. All connected clients see the changes in real-time

## 5. Alternative / Exception Flows
- **5a. Todo not found for update/delete**: Tool returns error; AI informs user
- **5b. Validation failure**: Tool returns validation error; AI asks for correction
- **5c. Multiple operations**: AI chains multiple tool calls (e.g., "Add three items")

## 6. Special Requirements / Remarks
- **Derived from**: BUC-02
- **Precondition**: UC-06 (must be in active chat)
- **Depends on**: BUC-01 (uses same CRUD logic), BUC-03 (triggers real-time sync)
- **Realized by**: SUC-05, SUC-06, SUC-04
- AI modifications MUST go through the same validation as manual edits
- AI modifications MUST trigger the same SSE broadcasts as manual edits

---

# Use Case Name: Receive Real-Time Updates, ID: UC-09

## 1. Name, Brief Description
**Receive Real-Time Updates** — A browser tab receives and applies real-time updates
when todos are modified in another tab or by the AI assistant.

## 2. Actors, Trigger
- **Primary Actor**: End User (observing in a different tab)
- **Trigger**: Todo modification occurs in any connected session

## 3. Pre- and Postconditions (Success, Abort)
- **Preconditions**: Browser tab is open; SSE connection established
- **Success Postcondition**: UI reflects the latest state of all todos
- **Abort Postcondition**: SSE reconnects automatically; state re-fetched on reconnect

## 4. Main Flow (Standard Scenario)
1. Browser tab establishes SSE connection (GET /api/todos/events)
2. Connection remains open, waiting for events
3. Another tab/AI creates, updates, or deletes a todo
4. Server sends SSE event with event type and todo data
5. Client receives the event
6. Client updates the local todo list state accordingly
7. UI re-renders to show the change

## 5. Alternative / Exception Flows
- **5a. SSE connection drops**: Client reconnects automatically (EventSource built-in retry)
- **5b. Server restarts**: Client reconnects; fetches full todo list to resync
- **5c. Stale event**: Client ignores events for todos already in correct state

## 6. Special Requirements / Remarks
- **Derived from**: BUC-03
- **Depends on**: BUC-01 (events originate from CRUD operations)
- **Realized by**: SUC-03, SUC-04
- SSE event types: "todo:created", "todo:updated", "todo:deleted"
- Event data format: JSON with full todo object (or id for deletes)
