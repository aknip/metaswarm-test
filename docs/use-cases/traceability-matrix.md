# Use Case Traceability Matrix

## Business → User Level Mapping

| Business UC | User UCs |
|-------------|----------|
| BUC-01: Task Management | UC-01, UC-02, UC-03, UC-04, UC-05 |
| BUC-02: AI-Assisted Productivity | UC-06, UC-07, UC-08 |
| BUC-03: Real-Time Collaboration | UC-09 |

## User → System Level Mapping

| User UC | System UCs |
|---------|------------|
| UC-01: Create Todo | SUC-01 (precondition), SUC-02, SUC-04, SUC-07 |
| UC-02: View Todos | SUC-01 (precondition), SUC-02 |
| UC-03: Update Todo | SUC-01 (precondition), SUC-02, SUC-04, SUC-07 |
| UC-04: Toggle Completion | SUC-01 (precondition), SUC-02, SUC-04 |
| UC-05: Delete Todo | SUC-01 (precondition), SUC-02, SUC-04 |
| UC-06: Chat with AI | SUC-05, SUC-06 |
| UC-07: AI Reads Todos | SUC-01 (precondition), SUC-05, SUC-06 |
| UC-08: AI Modifies Todos | SUC-01 (precondition), SUC-05, SUC-06, SUC-04 |
| UC-09: Real-Time Updates | SUC-03, SUC-04 |

## Precondition Dependencies

| Use Case | Precondition Use Cases |
|----------|----------------------|
| UC-03: Update Todo | UC-01 (todo must exist) |
| UC-04: Toggle Completion | UC-01 (todo must exist) |
| UC-05: Delete Todo | UC-01 (todo must exist) |
| UC-07: AI Reads Todos | UC-06 (chat session) |
| UC-08: AI Modifies Todos | UC-06 (chat session) |
| SUC-02: REST API | SUC-01 (database init) |
| SUC-04: Broadcast Events | SUC-03 (connections exist) |
| SUC-05: Claude SDK | ANTHROPIC_API_KEY set |
| SUC-06: Tool Execution | SUC-01 (database), SUC-05 (Claude call) |

## Test Case → Use Case Mapping

### Backend Unit Tests (Vitest)

| Test File | Test Case | Use Cases |
|-----------|-----------|-----------|
| db.test.ts | Schema creation, table exists | SUC-01 |
| db.test.ts | createTodo inserts and returns | SUC-01, UC-01 |
| db.test.ts | getAllTodos returns all | UC-02 |
| db.test.ts | getAllTodos returns empty array | UC-02/5a |
| db.test.ts | getTodoById returns todo | SUC-02 |
| db.test.ts | getTodoById returns undefined for missing | SUC-02 |
| db.test.ts | updateTodo modifies title | UC-03 |
| db.test.ts | updateTodo toggles completed | UC-04 |
| db.test.ts | updateTodo returns null for missing | UC-03/5b |
| db.test.ts | deleteTodo removes todo | UC-05 |
| db.test.ts | deleteTodo returns false for missing | UC-05/5a |
| validation.test.ts | Empty title rejected | UC-01/5a, SUC-07/5a |
| validation.test.ts | Title >500 chars rejected | UC-01/5b, SUC-07/5c |
| validation.test.ts | Valid title accepted | SUC-07 |
| validation.test.ts | Missing required field | SUC-07/5a |
| validation.test.ts | Invalid type (non-string title) | SUC-07/5b |
| validation.test.ts | Valid UUID accepted | SUC-07 |
| validation.test.ts | Invalid UUID rejected | SUC-07 |
| app.test.ts | App error handler returns 500 | SUC-02/5d |
| app.test.ts | App handles CORS and JSON content type | SUC-02 |
| todos-api.test.ts | POST /api/todos — success | UC-01, SUC-02 |
| todos-api.test.ts | POST /api/todos — empty title | UC-01/5a, SUC-07 |
| todos-api.test.ts | POST /api/todos — title too long | UC-01/5b, SUC-07 |
| todos-api.test.ts | POST /api/todos — invalid JSON | SUC-02/5a |
| todos-api.test.ts | POST /api/todos — server error | UC-01/5c, SUC-02/5d |
| todos-api.test.ts | GET /api/todos — returns all | UC-02, SUC-02 |
| todos-api.test.ts | GET /api/todos — empty list | UC-02/5a |
| todos-api.test.ts | PATCH /api/todos/:id — update title | UC-03, SUC-02 |
| todos-api.test.ts | PATCH /api/todos/:id — toggle completed | UC-04, SUC-02 |
| todos-api.test.ts | PATCH /api/todos/:id — not found | UC-03/5b, UC-04/5a |
| todos-api.test.ts | PATCH /api/todos/:id — empty title | UC-03/5a, SUC-07 |
| todos-api.test.ts | DELETE /api/todos/:id — success | UC-05, SUC-02 |
| todos-api.test.ts | DELETE /api/todos/:id — not found | UC-05/5a |
| sse.test.ts | SSE connection established | SUC-03, UC-09 |
| sse.test.ts | SSE removes client on disconnect | SUC-03 |
| sse.test.ts | SSE broadcasts to all clients | SUC-04 |
| sse.test.ts | SSE handles no clients | SUC-04/5a |
| sse.test.ts | SSE handles write to closed connection | SUC-04/5b |
| sse.test.ts | SSE broadcasts on create | SUC-04, UC-01 |
| sse.test.ts | SSE broadcasts on update | SUC-04, UC-03/UC-04 |
| sse.test.ts | SSE broadcasts on delete | SUC-04, UC-05 |
| chat.test.ts | POST /api/chat — text response | UC-06, SUC-05 |
| chat.test.ts | POST /api/chat — empty message 400 | UC-06/5c |
| chat.test.ts | POST /api/chat — rate limited 429 | UC-06/5b, SUC-05/5b |
| chat.test.ts | POST /api/chat — API key invalid 500 | UC-06/5a, SUC-05/5a, BUC-02/5a |
| ai-tools.test.ts | list_todos tool — returns all | UC-07, SUC-06 |
| ai-tools.test.ts | list_todos tool — empty list | UC-07/5a |
| ai-tools.test.ts | list_todos tool — DB error | UC-07/5b |
| ai-tools.test.ts | create_todo tool — success + broadcast | UC-08, SUC-06 |
| ai-tools.test.ts | create_todo tool — validation failure | UC-08/5b, SUC-06/5b |
| ai-tools.test.ts | update_todo tool — success + broadcast | UC-08, SUC-06 |
| ai-tools.test.ts | update_todo tool — not found | UC-08/5a, SUC-06/5c |
| ai-tools.test.ts | delete_todo tool — success + broadcast | UC-08, SUC-06 |
| ai-tools.test.ts | delete_todo tool — not found | UC-08/5a, SUC-06/5c |
| chat.test.ts | Multiple tool calls in sequence | UC-08/5c |
| chat.test.ts | Tool call loop max rounds | SUC-05/5c |
| ai-tools.test.ts | Unknown tool — error | SUC-06/5a |
| chat.test.ts | API error handled gracefully | UC-06/5a, SUC-05 |

### Frontend E2E Tests (Playwright)

| Test File | Test Case | Use Cases |
|-----------|-----------|-----------|
| todo-crud.spec.ts | Create a new todo | UC-01, BUC-01 |
| todo-crud.spec.ts | View todo list | UC-02, BUC-01 |
| todo-crud.spec.ts | Edit todo title | UC-03, BUC-01 |
| todo-crud.spec.ts | Cancel edit via Escape key | UC-03/5c |
| todo-crud.spec.ts | Toggle todo completion | UC-04, BUC-01 |
| todo-crud.spec.ts | Delete a todo | UC-05, BUC-01 |
| todo-crud.spec.ts | Empty state display | UC-02/5a |
| todo-crud.spec.ts | Validation error on empty title | UC-01/5a |
| ai-chat.spec.ts | Send message and get response | UC-06, BUC-02 |
| ai-chat.spec.ts | AI reads todos | UC-07, BUC-02 |
| ai-chat.spec.ts | AI creates a todo | UC-08, BUC-02 |
| ai-chat.spec.ts | AI updates a todo | UC-08, BUC-02 |
| ai-chat.spec.ts | AI deletes a todo | UC-08, BUC-02 |
| realtime-sync.spec.ts | Todo changes sync across tabs | UC-09, BUC-03 |
| realtime-sync.spec.ts | AI changes sync to other tabs | UC-08 + UC-09, BUC-02 + BUC-03 |

Note: E2E AI chat tests use Playwright route interception to mock POST /api/chat,
providing deterministic responses. This avoids CI flakiness and API costs.
