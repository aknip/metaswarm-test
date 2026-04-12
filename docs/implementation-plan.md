# Implementation Plan: Real-Time Todo List with AI Chat

## Work Unit Decomposition

### WU-1: Project Scaffolding & Configuration
**Priority**: 1 (first — everything depends on this)
**Dependencies**: None
**DoD Items**:
1. package.json with all dependencies defined
2. TypeScript config (tsconfig.json) in strict mode
3. Vite config with Hono dev server plugin
4. Vitest config with v8 coverage at 100% thresholds
5. ESLint + Prettier configs
6. Directory structure: src/server/, src/client/, src/shared/
7. `npm install` succeeds
8. `npm run typecheck` passes on empty project

**File Scope**:
- package.json
- tsconfig.json, tsconfig.node.json
- vite.config.ts
- vitest.config.ts (or integrated in vite.config.ts)
- .eslintrc.cjs / eslint.config.js
- .prettierrc
- src/server/index.ts (entry stub)
- src/client/main.tsx (entry stub)
- src/client/App.tsx (stub)
- src/client/index.html → index.html
- src/shared/types.ts

---

### WU-2: Database Layer
**Priority**: 2
**Dependencies**: WU-1
**Realizes**: SUC-01, SUC-07 (partial)
**DoD Items**:
1. SQLite database initialization with schema
2. CRUD functions: createTodo, getAllTodos, getTodoById, updateTodo, deleteTodo
3. Input validation utility functions
4. 100% test coverage on database module
5. 100% test coverage on validation module

**File Scope**:
- src/server/db.ts (database init + CRUD functions)
- src/server/validation.ts (input validation)
- src/shared/types.ts (Todo type definition)
- src/server/__tests__/db.test.ts
- src/server/__tests__/validation.test.ts

**Test Cases** (mapped to use cases):
- DB init creates todos table → SUC-01
- createTodo inserts and returns todo → SUC-01, UC-01
- getAllTodos returns all todos → UC-02
- getAllTodos returns empty array when none exist → UC-02/5a
- getTodoById returns specific todo → SUC-02
- getTodoById returns undefined for non-existent → SUC-02
- updateTodo modifies title → UC-03
- updateTodo toggles completed → UC-04
- updateTodo returns null for non-existent → UC-03/5b
- deleteTodo removes todo → UC-05
- deleteTodo returns false for non-existent → UC-05/5a
- Validation: empty title rejected → UC-01/5a, SUC-07/5a
- Validation: title >500 chars rejected → UC-01/5b, SUC-07/5c
- Validation: valid title accepted → SUC-07
- Validation: missing required field → SUC-07/5a
- Validation: invalid type (non-string title) → SUC-07/5b
- Validation: valid UUID accepted → SUC-07
- Validation: invalid UUID rejected → SUC-07

---

### WU-3: REST API (Todo CRUD Routes)
**Priority**: 3
**Dependencies**: WU-2
**Realizes**: SUC-02
**DoD Items**:
1. GET /api/todos endpoint
2. POST /api/todos endpoint with validation
3. PATCH /api/todos/:id endpoint with validation
4. DELETE /api/todos/:id endpoint
5. Proper HTTP status codes and error responses
6. 100% test coverage on API routes

**File Scope**:
- src/server/routes/todos.ts
- src/server/app.ts (Hono app setup)
- src/server/__tests__/todos-api.test.ts
- src/server/__tests__/app.test.ts

**Test Cases** (mapped to use cases):
- GET /api/todos returns 200 + array → UC-02, SUC-02
- GET /api/todos empty returns 200 + [] → UC-02/5a
- POST /api/todos creates todo → UC-01, SUC-02
- POST /api/todos with empty title returns 400 → UC-01/5a, SUC-07
- POST /api/todos with long title returns 400 → UC-01/5b, SUC-07
- POST /api/todos with invalid JSON returns 400 → SUC-02/5a
- POST /api/todos server error returns 500 → UC-01/5c, SUC-02/5d
- PATCH /api/todos/:id updates title → UC-03, SUC-02
- PATCH /api/todos/:id toggles completed → UC-04, SUC-02
- PATCH /api/todos/:id not found returns 404 → UC-03/5b, UC-04/5a
- PATCH /api/todos/:id empty title returns 400 → UC-03/5a, SUC-07
- DELETE /api/todos/:id returns 204 → UC-05, SUC-02
- DELETE /api/todos/:id not found returns 404 → UC-05/5a
- App error handler returns 500 for uncaught errors → SUC-02/5d
- App handles CORS and JSON content type → SUC-02

---

### WU-4: SSE Real-Time Events
**Priority**: 4
**Dependencies**: WU-3
**Realizes**: SUC-03, SUC-04
**DoD Items**:
1. SSE connection manager (add/remove clients)
2. GET /api/todos/events SSE endpoint
3. Broadcasting on create, update, delete
4. Connection cleanup on disconnect
5. Integration with todo routes (broadcast after mutation)
6. 100% test coverage on SSE module

**File Scope**:
- src/server/sse.ts (connection manager + broadcast)
- src/server/routes/todos.ts (add broadcast calls — modify)
- src/server/__tests__/sse.test.ts

**Test Cases** (mapped to use cases):
- SSE manager adds client → SUC-03
- SSE manager removes client on disconnect → SUC-03
- Broadcast sends to all clients → SUC-04
- Broadcast handles no clients → SUC-04/5a
- Broadcast handles write to closed connection (cleanup) → SUC-04/5b
- todo:created event on POST → SUC-04, UC-01
- todo:updated event on PATCH → SUC-04, UC-03/UC-04
- todo:deleted event on DELETE → SUC-04, UC-05

---

### WU-5: AI Chat (Claude SDK Integration)
**Priority**: 5
**Dependencies**: WU-4 (needs broadcasting for AI modifications)
**Realizes**: SUC-05, SUC-06
**DoD Items**:
1. POST /api/chat endpoint
2. Claude SDK integration with tool definitions
3. Tool executor: list_todos, create_todo, update_todo, delete_todo
4. Multi-turn tool call loop (max 5 rounds)
5. AI modifications broadcast SSE events
6. 100% test coverage on chat module (with mocked Claude SDK)

**File Scope**:
- src/server/routes/chat.ts
- src/server/ai/tools.ts (tool definitions + executor)
- src/server/ai/chat-service.ts (Claude SDK wrapper)
- src/server/__tests__/chat.test.ts
- src/server/__tests__/ai-tools.test.ts

**Test Cases** (mapped to use cases):
- POST /api/chat returns AI text response → UC-06, SUC-05
- POST /api/chat with empty message returns 400 → UC-06/5c
- POST /api/chat API rate limited returns 429 → UC-06/5b, SUC-05/5b
- POST /api/chat API key invalid returns 500 → UC-06/5a, SUC-05/5a, BUC-02/5a
- list_todos tool returns all todos → UC-07, SUC-06
- list_todos tool returns empty array → UC-07/5a
- list_todos tool handles DB error → UC-07/5b
- create_todo tool creates and broadcasts → UC-08, SUC-06
- create_todo tool validation failure → UC-08/5b, SUC-06/5b
- update_todo tool updates and broadcasts → UC-08, SUC-06
- update_todo tool not found → UC-08/5a, SUC-06/5c
- delete_todo tool deletes and broadcasts → UC-08, SUC-06
- delete_todo tool not found → UC-08/5a, SUC-06/5c
- Multiple tool calls in sequence → UC-08/5c
- Tool call loop terminates within max rounds → SUC-05/5c
- Unknown tool returns error → SUC-06/5a
- API error handled gracefully → UC-06/5a, SUC-05

---

### WU-6: React Frontend
**Priority**: 6
**Dependencies**: WU-5 (all API endpoints must exist)
**Realizes**: All UC-* (UI layer)
**DoD Items**:
1. Todo list component with create, edit, toggle, delete
2. AI chat panel component with message history
3. SSE hook for real-time updates
4. API client hooks for all endpoints
5. Responsive layout with todo list + chat side by side
6. TypeScript strict, no lint errors

**File Scope**:
- index.html
- src/client/main.tsx
- src/client/App.tsx
- src/client/App.css
- src/client/components/TodoList.tsx
- src/client/components/TodoItem.tsx
- src/client/components/AddTodo.tsx
- src/client/components/ChatPanel.tsx
- src/client/components/ChatMessage.tsx
- src/client/hooks/useTodos.ts
- src/client/hooks/useSSE.ts
- src/client/hooks/useChat.ts
- src/client/api/client.ts

---

### WU-7: Playwright E2E Tests
**Priority**: 7
**Dependencies**: WU-6
**Realizes**: All UC-* (end-to-end verification)
**DoD Items**:
1. Playwright config and setup
2. Todo CRUD E2E tests
3. AI chat E2E tests
4. Real-time sync E2E tests (multi-tab)
5. All E2E tests pass

**File Scope**:
- playwright.config.ts
- e2e/todo-crud.spec.ts
- e2e/ai-chat.spec.ts
- e2e/realtime-sync.spec.ts
- e2e/helpers.ts

**Test Cases** (mapped to use cases):
- Create todo via UI → UC-01
- View todo list → UC-02
- Edit todo title → UC-03
- Cancel edit via Escape key → UC-03/5c
- Toggle todo completion → UC-04
- Delete todo → UC-05
- Empty state shown → UC-02/5a
- Validation on empty title → UC-01/5a
- Chat with AI → UC-06
- AI reads todos → UC-07
- AI creates todo → UC-08
- AI updates todo → UC-08
- AI deletes todo → UC-08
- Real-time sync across tabs → UC-09
- AI changes sync to other tabs → UC-08 + UC-09

Note: E2E AI chat tests use Playwright route interception to mock POST /api/chat,
providing deterministic responses. This avoids CI flakiness and API costs.

---

### WU-8: CI Pipeline
**Priority**: 8
**Dependencies**: WU-7
**Realizes**: DoD item 7
**DoD Items**:
1. GitHub Actions workflow file
2. Runs: install, typecheck, lint, format check, unit tests with coverage, build
3. Playwright E2E test job
4. Pipeline passes on current code

**File Scope**:
- .github/workflows/ci.yml
