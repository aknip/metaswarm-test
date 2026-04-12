# Real-Time Todo List with AI Chat — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full-stack real-time todo list with AI chat integration, achieving 100% test coverage via TDD with use-case traceability.

**Architecture:** Hono API server (Node.js) with SQLite persistence, SSE for real-time sync, OpenRouter API for AI chat with tool_use. React 19 + Vite 6 frontend. Monolithic server serves API; Vite dev server proxies in development.

**Tech Stack:** TypeScript (strict, ESM), Hono, better-sqlite3, React 19, Vite 6, Vitest, Playwright, OpenRouter API

**Design Spec:** `docs/superpowers/specs/2026-04-12-realtime-todo-ai-chat-design.md`

---

## File Map

### Created Files (by task)

**Task 1 — Foundation:**
- `package.json` — dependencies, scripts
- `tsconfig.json` — strict TypeScript config
- `tsconfig.node.json` — Node-specific TS config for server
- `vite.config.ts` — Vite + proxy config
- `vitest.config.ts` — test runner config
- `eslint.config.js` — ESLint flat config
- `.prettierrc` — Prettier config
- `playwright.config.ts` — Playwright config
- `.github/workflows/ci.yml` — CI pipeline
- `src/shared/types.ts` — shared Todo, ChatMessage, SSEEvent types
- `src/server/db.ts` — SQLite database layer (UC-S10)
- `src/server/index.ts` — Hono app entry point
- `src/server/routes/todos.ts` — GET /api/todos route
- `src/server/__tests__/db.test.ts` — DB layer tests
- `src/server/__tests__/todos.test.ts` — Route tests (GET)
- `src/client/index.html` — HTML entry
- `src/client/main.tsx` — React root
- `src/client/App.tsx` — Main layout
- `src/client/App.css` — Styles
- `src/client/components/TodoList.tsx` — Todo list component
- `src/client/api/client.ts` — HTTP client
- `src/client/hooks/useTodos.ts` — Todo state hook
- `e2e/todo-crud.spec.ts` — E2E tests (view empty)

**Task 2 — Create Todo:**
- `src/server/validation.ts` — Input validation (UC-S11)
- `src/server/__tests__/validation.test.ts` — Validation tests
- Modify: `src/server/routes/todos.ts` — add POST
- Modify: `src/server/__tests__/todos.test.ts` — add POST tests
- Modify: `src/client/components/TodoList.tsx` — add form
- Modify: `src/client/api/client.ts` — add createTodo
- Modify: `src/client/hooks/useTodos.ts` — add create
- Modify: `e2e/todo-crud.spec.ts` — add create tests

**Task 3 — Toggle + Update:**
- `src/client/components/TodoItem.tsx` — Individual todo item
- Modify: `src/server/routes/todos.ts` — add PATCH, PATCH toggle
- Modify: `src/server/__tests__/todos.test.ts` — add update/toggle tests
- Modify: `src/client/components/TodoList.tsx` — use TodoItem
- Modify: `src/client/api/client.ts` — add update/toggle
- Modify: `src/client/hooks/useTodos.ts` — add update/toggle
- Modify: `e2e/todo-crud.spec.ts` — add update tests
- `e2e/todo-toggle.spec.ts` — Toggle E2E tests

**Task 4 — Delete:**
- Modify: `src/server/routes/todos.ts` — add DELETE
- Modify: `src/server/__tests__/todos.test.ts` — add delete tests
- Modify: `src/client/api/client.ts` — add deleteTodo
- Modify: `src/client/hooks/useTodos.ts` — add delete
- Modify: `src/client/components/TodoItem.tsx` — add delete button
- Modify: `e2e/todo-crud.spec.ts` — add delete tests

**Task 5 — SSE:**
- `src/server/sse.ts` — SSE manager (UC-S06, UC-S07)
- `src/server/routes/events.ts` — SSE endpoint
- `src/server/__tests__/sse.test.ts` — SSE tests
- `src/client/hooks/useSSE.ts` — SSE connection hook
- Modify: `src/server/routes/todos.ts` — add SSE broadcasts
- Modify: `src/server/index.ts` — mount events route
- Modify: `src/client/hooks/useTodos.ts` — integrate SSE
- `e2e/realtime-sync.spec.ts` — Multi-tab SSE tests

**Task 6 — AI Chat:**
- `src/server/ai/openrouter.ts` — OpenRouter API client
- `src/server/ai/tools.ts` — Tool definitions + executor (UC-S09)
- `src/server/routes/chat.ts` — Chat route (UC-S08)
- `src/server/__tests__/ai-tools.test.ts` — Tool executor tests
- `src/server/__tests__/chat.test.ts` — Chat route tests
- `src/client/components/ChatPanel.tsx` — Chat UI
- `src/client/components/ChatMessage.tsx` — Message bubble
- `src/client/hooks/useChat.ts` — Chat state hook
- Modify: `src/client/api/client.ts` — add sendChatMessage
- Modify: `src/client/App.tsx` — add ChatPanel
- Modify: `src/server/index.ts` — mount chat route
- `e2e/ai-chat.spec.ts` — AI chat E2E tests

**Task 7 — Coverage Hardening:**
- Modify: various test files to fill coverage gaps
- Modify: `src/server/validation.ts` — ensure all branches covered

---

## Task 1: Foundation + View Empty Todo List + CI Pipeline

**Use Cases:** UC-U02, UC-S02, UC-S10 (partial)
**Goal:** App loads, shows empty todo list; backend serves empty array; CI green from day one

### Step 1: Initialize package.json and install dependencies

- [ ] **1.1: Create package.json**

```bash
cd /Users/aknipschild/github/metaswarm-test
npm init -y
```

Then overwrite with:

```json
{
  "name": "metaswarm-test",
  "version": "1.0.0",
  "type": "module",
  "private": true,
  "scripts": {
    "dev": "tsx watch src/server/index.ts",
    "dev:client": "vite --config vite.config.ts",
    "build": "tsc --noEmit && vite build --config vite.config.ts",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:cov": "vitest run --coverage",
    "test:e2e": "playwright test",
    "lint": "eslint src/ e2e/",
    "format": "prettier --check 'src/**/*.{ts,tsx}' 'e2e/**/*.ts'",
    "format:fix": "prettier --write 'src/**/*.{ts,tsx}' 'e2e/**/*.ts'",
    "typecheck": "tsc --noEmit"
  }
}
```

- [ ] **1.2: Install dependencies**

```bash
# Production deps
npm install hono @hono/node-server better-sqlite3 react react-dom

# Dev deps
npm install -D typescript tsx vite @vitejs/plugin-react vitest @vitest/coverage-v8 \
  eslint @eslint/js typescript-eslint prettier eslint-config-prettier \
  @playwright/test @types/better-sqlite3 @types/node @types/react @types/react-dom
```

- [ ] **1.3: Install Playwright browsers**

```bash
npx playwright install chromium
```

### Step 2: Create TypeScript and tooling configs

- [ ] **2.1: Create tsconfig.json**

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "paths": {
      "@shared/*": ["./src/shared/*"]
    },
    "baseUrl": "."
  },
  "include": ["src/**/*.ts", "src/**/*.tsx", "e2e/**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **2.2: Create tsconfig.node.json**

Create `tsconfig.node.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "paths": {
      "@shared/*": ["./src/shared/*"]
    },
    "baseUrl": "."
  },
  "include": ["src/server/**/*.ts", "src/shared/**/*.ts"]
}
```

- [ ] **2.3: Create vite.config.ts**

Create `vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  root: 'src/client',
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, 'src/shared'),
    },
  },
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
  build: {
    outDir: '../../dist/client',
    emptyOutDir: true,
  },
});
```

- [ ] **2.4: Create vitest.config.ts**

Create `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, 'src/shared'),
    },
  },
  test: {
    globals: true,
    coverage: {
      provider: 'v8',
      include: ['src/server/**/*.ts'],
      exclude: ['src/server/__tests__/**', 'src/server/index.ts'],
      thresholds: {
        lines: 100,
        branches: 100,
        functions: 100,
        statements: 100,
      },
    },
  },
});
```

- [ ] **2.5: Create eslint.config.js**

Create `eslint.config.js`:

```javascript
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_' },
      ],
    },
  },
  {
    ignores: ['dist/', 'node_modules/', 'coverage/'],
  },
];
```

- [ ] **2.6: Create .prettierrc**

Create `.prettierrc`:

```json
{
  "singleQuote": true,
  "semi": true,
  "trailingComma": "es5",
  "printWidth": 80
}
```

- [ ] **2.7: Create playwright.config.ts**

Create `playwright.config.ts`:

```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  retries: 0,
  use: {
    baseURL: 'http://localhost:5173',
    headless: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
  webServer: [
    {
      command: 'npm run dev',
      port: 3000,
      reuseExistingServer: true,
    },
    {
      command: 'npm run dev:client',
      port: 5173,
      reuseExistingServer: true,
    },
  ],
});
```

- [ ] **2.8: Create CI pipeline**

Create `.github/workflows/ci.yml`:

```yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run typecheck
      - run: npm run lint
      - run: npm run format
      - run: npm test -- --coverage
      - run: npm run build
      - run: npx playwright install --with-deps chromium
      - run: npm run test:e2e
        env:
          OPENROUTER_API_KEY: ${{ secrets.OPENROUTER_API_KEY }}
```

- [ ] **2.9: Update CLAUDE.md and .coverage-thresholds.json**

In `CLAUDE.md`, change `Anthropic Claude SDK with tool_use` to `OpenRouter API (OpenAI-compatible)` and change coverage thresholds references from 80 to 100.

In `.coverage-thresholds.json`:

```json
{
  "lines": 100,
  "branches": 100,
  "functions": 100,
  "statements": 100
}
```

### Step 3: Write failing backend tests (UC-S10, UC-S02)

- [ ] **3.1: Create shared types**

Create `src/shared/types.ts`:

```typescript
export interface Todo {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
}

export interface ChatResponse {
  response: string;
  messages: ChatMessage[];
}

export type SSEEvent =
  | { type: 'todo:created'; data: Todo }
  | { type: 'todo:updated'; data: Todo }
  | { type: 'todo:deleted'; data: { id: string } };

export interface ApiError {
  error: string;
}
```

- [ ] **3.2: Write failing db.test.ts**

Create `src/server/__tests__/db.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { createDatabase, getAllTodos } from '../db.js';
import Database from 'better-sqlite3';

describe('Database Layer (UC-S10)', () => {
  let db: Database.Database;

  beforeEach(() => {
    db = new Database(':memory:');
    createDatabase(db);
  });

  describe('createDatabase (UC-S10, Main Flow step 2)', () => {
    it('creates the todos table', () => {
      const tables = db
        .prepare(
          "SELECT name FROM sqlite_master WHERE type='table' AND name='todos'"
        )
        .all();
      expect(tables).toHaveLength(1);
    });

    it('enables WAL mode', () => {
      const result = db.pragma('journal_mode') as { journal_mode: string }[];
      expect(result[0]?.journal_mode).toBe('wal');
    });
  });

  describe('getAllTodos (UC-S10, used by UC-S02)', () => {
    it('returns empty array when no todos exist (UC-S02, Alt 5a)', () => {
      const todos = getAllTodos(db);
      expect(todos).toEqual([]);
    });
  });
});
```

- [ ] **3.3: Write failing todos.test.ts (GET only)**

Create `src/server/__tests__/todos.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { Hono } from 'hono';
import Database from 'better-sqlite3';
import { createDatabase } from '../db.js';
import { todosRoutes } from '../routes/todos.js';

describe('Todo Routes', () => {
  let app: Hono;
  let db: Database.Database;

  beforeEach(() => {
    db = new Database(':memory:');
    createDatabase(db);
    app = new Hono();
    todosRoutes(app, db);
  });

  describe('GET /api/todos (UC-S02)', () => {
    it('returns 200 with empty array when no todos exist (UC-S02, Main Flow)', async () => {
      const res = await app.request('/api/todos');
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual([]);
    });
  });
});
```

- [ ] **3.4: Run tests to verify they fail**

```bash
npm test
```

Expected: FAIL — modules `../db.js` and `../routes/todos.js` do not exist.

### Step 4: Implement minimal backend (UC-S10, UC-S02)

- [ ] **4.1: Create src/server/db.ts**

Create `src/server/db.ts`:

```typescript
import Database from 'better-sqlite3';
import { randomUUID } from 'crypto';
import type { Todo } from '@shared/types.js';

export function createDatabase(db: Database.Database): void {
  db.pragma('journal_mode = WAL');
  db.exec(`
    CREATE TABLE IF NOT EXISTS todos (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
}

interface TodoRow {
  id: string;
  title: string;
  completed: number;
  created_at: string;
  updated_at: string;
}

function rowToTodo(row: TodoRow): Todo {
  return {
    id: row.id,
    title: row.title,
    completed: row.completed === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function getAllTodos(db: Database.Database): Todo[] {
  const rows = db
    .prepare('SELECT * FROM todos ORDER BY created_at ASC')
    .all() as TodoRow[];
  return rows.map(rowToTodo);
}

export function getTodoById(
  db: Database.Database,
  id: string
): Todo | undefined {
  const row = db
    .prepare('SELECT * FROM todos WHERE id = ?')
    .get(id) as TodoRow | undefined;
  return row ? rowToTodo(row) : undefined;
}

export function createTodo(
  db: Database.Database,
  title: string
): Todo {
  const id = randomUUID();
  const now = new Date().toISOString();
  db.prepare(
    'INSERT INTO todos (id, title, completed, created_at, updated_at) VALUES (?, ?, 0, ?, ?)'
  ).run(id, title.trim(), now, now);
  return { id, title: title.trim(), completed: false, createdAt: now, updatedAt: now };
}

export function updateTodo(
  db: Database.Database,
  id: string,
  fields: { title?: string; completed?: boolean }
): Todo | undefined {
  const existing = getTodoById(db, id);
  if (!existing) return undefined;

  const title = fields.title !== undefined ? fields.title.trim() : existing.title;
  const completed = fields.completed !== undefined ? fields.completed : existing.completed;
  const now = new Date().toISOString();

  db.prepare(
    'UPDATE todos SET title = ?, completed = ?, updated_at = ? WHERE id = ?'
  ).run(title, completed ? 1 : 0, now, id);

  return { id, title, completed, createdAt: existing.createdAt, updatedAt: now };
}

export function deleteTodo(
  db: Database.Database,
  id: string
): boolean {
  const result = db
    .prepare('DELETE FROM todos WHERE id = ?')
    .run(id);
  return result.changes > 0;
}

export function toggleTodo(
  db: Database.Database,
  id: string
): Todo | undefined {
  const row = db
    .prepare(
      "UPDATE todos SET completed = NOT completed, updated_at = datetime('now') WHERE id = ? RETURNING *"
    )
    .get(id) as TodoRow | undefined;
  return row ? rowToTodo(row) : undefined;
}
```

- [ ] **4.2: Create src/server/routes/todos.ts (GET only)**

Create `src/server/routes/todos.ts`:

```typescript
import type { Hono } from 'hono';
import type Database from 'better-sqlite3';
import { getAllTodos } from '../db.js';

export function todosRoutes(app: Hono, db: Database.Database): void {
  app.get('/api/todos', (c) => {
    const todos = getAllTodos(db);
    return c.json(todos);
  });
}
```

- [ ] **4.3: Create src/server/index.ts**

Create `src/server/index.ts`:

```typescript
import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import Database from 'better-sqlite3';
import { createDatabase } from './db.js';
import { todosRoutes } from './routes/todos.js';

const app = new Hono();
const db = new Database('todos.db');
createDatabase(db);

todosRoutes(app, db);

const port = Number(process.env.PORT) || 3000;
serve({ fetch: app.fetch, port }, () => {
  console.log(`Server running on http://localhost:${port}`);
});

export default app;
```

- [ ] **4.4: Run backend tests to verify they pass**

```bash
npm test
```

Expected: PASS — both db.test.ts and todos.test.ts pass.

### Step 5: Write failing E2E test + implement frontend

- [ ] **5.1: Create E2E test for empty state**

Create `e2e/todo-crud.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Todo CRUD (UC-U01, UC-U02, UC-U03, UC-U04)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('shows empty state when no todos exist (UC-U02, Alt 5a)', async ({
    page,
  }) => {
    await expect(page.getByText('No todos yet')).toBeVisible();
  });

  test('displays the app title (UC-U02, Main Flow step 1)', async ({
    page,
  }) => {
    await expect(
      page.getByRole('heading', { name: /todo/i })
    ).toBeVisible();
  });
});
```

- [ ] **5.1b: Run E2E tests to verify they fail (TDD red phase)**

```bash
npm run test:e2e
```

Expected: FAIL — no frontend exists yet, page cannot load.

- [ ] **5.2: Create client entry HTML**

Create `src/client/index.html`:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Todo + AI Chat</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/main.tsx"></script>
  </body>
</html>
```

- [ ] **5.3: Create client main.tsx**

Create `src/client/main.tsx`:

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App.js';
import './App.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

- [ ] **5.4: Create API client**

Create `src/client/api/client.ts`:

```typescript
import type { Todo } from '@shared/types.js';

const BASE = '/api';

export async function fetchTodos(): Promise<Todo[]> {
  const res = await fetch(`${BASE}/todos`);
  if (!res.ok) throw new Error('Failed to fetch todos');
  return res.json();
}
```

- [ ] **5.5: Create useTodos hook**

Create `src/client/hooks/useTodos.ts`:

```typescript
import { useState, useEffect, useCallback } from 'react';
import type { Todo } from '@shared/types.js';
import { fetchTodos } from '../api/client.js';

export function useTodos() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTodos = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchTodos();
      setTodos(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTodos();
  }, [loadTodos]);

  return { todos, loading, error, setTodos, loadTodos };
}
```

- [ ] **5.6: Create TodoList component**

Create `src/client/components/TodoList.tsx`:

```tsx
import type { Todo } from '@shared/types.js';

interface TodoListProps {
  todos: Todo[];
  loading: boolean;
  error: string | null;
}

export function TodoList({ todos, loading, error }: TodoListProps) {
  if (loading) return <p>Loading...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div className="todo-list">
      <h2>Todo List</h2>
      {todos.length === 0 ? (
        <p className="empty-state">No todos yet</p>
      ) : (
        <ul>
          {todos.map((todo) => (
            <li key={todo.id} data-testid={`todo-${todo.id}`}>
              <span className={todo.completed ? 'completed' : ''}>
                {todo.title}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

- [ ] **5.7: Create App component**

Create `src/client/App.tsx`:

```tsx
import { TodoList } from './components/TodoList.js';
import { useTodos } from './hooks/useTodos.js';

export function App() {
  const { todos, loading, error } = useTodos();

  return (
    <div className="app">
      <h1>Todo + AI Chat</h1>
      <div className="panels">
        <TodoList todos={todos} loading={loading} error={error} />
      </div>
    </div>
  );
}
```

- [ ] **5.8: Create App.css**

Create `src/client/App.css`:

```css
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
    sans-serif;
  background: #f5f5f5;
  color: #333;
}

.app {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.app h1 {
  margin-bottom: 20px;
  font-size: 24px;
}

.panels {
  display: flex;
  gap: 20px;
}

.todo-list {
  flex: 1;
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.todo-list h2 {
  margin-bottom: 16px;
  font-size: 18px;
}

.todo-list ul {
  list-style: none;
}

.todo-list li {
  display: flex;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #eee;
  gap: 10px;
}

.todo-list li:last-child {
  border-bottom: none;
}

.completed {
  text-decoration: line-through;
  opacity: 0.6;
}

.empty-state {
  color: #999;
  font-style: italic;
}

.error {
  color: #e53e3e;
}

.todo-form {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.todo-form input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.todo-form button {
  padding: 8px 16px;
  background: #3182ce;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.todo-form button:hover {
  background: #2c5282;
}

input[type='checkbox'] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.todo-title {
  flex: 1;
  cursor: default;
}

.delete-btn {
  opacity: 0;
  background: none;
  border: none;
  color: #e53e3e;
  cursor: pointer;
  font-size: 18px;
  padding: 0 4px;
  transition: opacity 0.15s;
}

.todo-list li:hover .delete-btn {
  opacity: 1;
}

.edit-input {
  flex: 1;
  padding: 4px 8px;
  border: 1px solid #3182ce;
  border-radius: 4px;
  font-size: 14px;
}

.chat-panel {
  flex: 1;
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  max-height: 600px;
}

.chat-panel h2 {
  margin-bottom: 16px;
  font-size: 18px;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  margin-bottom: 16px;
  min-height: 200px;
}

.chat-message {
  margin-bottom: 12px;
  padding: 8px 12px;
  border-radius: 8px;
  max-width: 80%;
}

.chat-message.user {
  background: #ebf8ff;
  margin-left: auto;
}

.chat-message.assistant {
  background: #f0f0f0;
}

.chat-form {
  display: flex;
  gap: 8px;
}

.chat-form input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.chat-form button {
  padding: 8px 16px;
  background: #38a169;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.chat-form button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .panels {
    flex-direction: column;
  }
}
```

- [ ] **5.9: Run E2E tests**

```bash
npm run test:e2e
```

Expected: PASS — app loads and shows "No todos yet".

- [ ] **5.10: Run all quality gates**

```bash
npm run typecheck && npm run lint && npm run format && npm test && npm run build
```

Expected: All pass.

- [ ] **5.11: Commit Task 1**

```bash
git add -A
git commit -m "feat: foundation + view empty todo list + CI pipeline (Slice 1)

- Project scaffolding: package.json, tsconfig, vite, eslint, prettier
- CI pipeline: .github/workflows/ci.yml
- SQLite database layer with todos table (UC-S10)
- GET /api/todos returns empty array (UC-S02)
- React frontend with empty state (UC-U02)
- Backend unit tests (db.test.ts, todos.test.ts)
- E2E test: app loads with empty state

Use Cases: UC-U02, UC-S02, UC-S10"
```

---

## Task 2: Create Todo

**Use Cases:** UC-U01, UC-S01, UC-S10, UC-S11 (partial)
**Goal:** User can type a title and create a todo; it appears in the list

### Step 1: Write failing backend tests

- [ ] **1.1: Write validation tests**

Create `src/server/__tests__/validation.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { validateCreateTodo } from '../validation.js';

describe('Input Validation (UC-S11)', () => {
  describe('validateCreateTodo (UC-S11, Main Flow)', () => {
    it('accepts valid title (UC-S11, Main Flow)', () => {
      const result = validateCreateTodo({ title: 'Buy milk' });
      expect(result).toEqual({ title: 'Buy milk' });
    });

    it('trims whitespace from title', () => {
      const result = validateCreateTodo({ title: '  Buy milk  ' });
      expect(result).toEqual({ title: 'Buy milk' });
    });

    it('rejects missing title (UC-S11, Alt 5a)', () => {
      expect(() => validateCreateTodo({})).toThrow('Title is required');
    });

    it('rejects empty title (UC-S01, Alt 5a)', () => {
      expect(() => validateCreateTodo({ title: '' })).toThrow(
        'Title is required'
      );
    });

    it('rejects whitespace-only title (UC-U01, Alt 5b)', () => {
      expect(() => validateCreateTodo({ title: '   ' })).toThrow(
        'Title is required'
      );
    });

    it('rejects non-string title (UC-S11, Alt 5b)', () => {
      expect(() => validateCreateTodo({ title: 123 })).toThrow(
        'Title is required'
      );
    });

    it('rejects title over 500 characters (UC-S01, Alt 5b)', () => {
      const longTitle = 'a'.repeat(501);
      expect(() => validateCreateTodo({ title: longTitle })).toThrow(
        'Title must be 500 characters or less'
      );
    });

    it('accepts title of exactly 500 characters', () => {
      const title = 'a'.repeat(500);
      const result = validateCreateTodo({ title });
      expect(result.title).toBe(title);
    });
  });
});
```

- [ ] **1.2: Write failing POST /api/todos tests**

Add to `src/server/__tests__/todos.test.ts`:

```typescript
  describe('POST /api/todos (UC-S01)', () => {
    it('creates a todo with valid title (UC-S01, Main Flow)', async () => {
      const res = await app.request('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Buy milk' }),
      });
      expect(res.status).toBe(201);
      const todo = await res.json();
      expect(todo.title).toBe('Buy milk');
      expect(todo.completed).toBe(false);
      expect(todo.id).toBeDefined();
      expect(todo.createdAt).toBeDefined();
      expect(todo.updatedAt).toBeDefined();
    });

    it('returns the created todo in subsequent GET (UC-S01 + UC-S02)', async () => {
      await app.request('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Buy milk' }),
      });
      const res = await app.request('/api/todos');
      const todos = await res.json();
      expect(todos).toHaveLength(1);
      expect(todos[0].title).toBe('Buy milk');
    });

    it('rejects empty title with 400 (UC-S01, Alt 5a)', async () => {
      const res = await app.request('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: '' }),
      });
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Title is required');
    });

    it('rejects title over 500 chars with 400 (UC-S01, Alt 5b)', async () => {
      const res = await app.request('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'a'.repeat(501) }),
      });
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Title must be 500 characters or less');
    });
  });
```

- [ ] **1.3: Run tests to verify they fail**

```bash
npm test
```

Expected: FAIL — `validation.js` module not found, POST route not implemented.

### Step 2: Implement validation + POST route

- [ ] **2.1: Create src/server/validation.ts**

Create `src/server/validation.ts` (ONLY `validateCreateTodo` — other validators added in their respective tasks per TDD):

```typescript
export function validateCreateTodo(body: unknown): { title: string } {
  const obj = body as Record<string, unknown>;
  if (
    !obj ||
    typeof obj.title !== 'string' ||
    obj.title.trim().length === 0
  ) {
    throw new Error('Title is required');
  }
  if (obj.title.trim().length > 500) {
    throw new Error('Title must be 500 characters or less');
  }
  return { title: obj.title.trim() };
}
```

- [ ] **2.2: Add POST route to todos.ts**

Modify `src/server/routes/todos.ts`:

```typescript
import type { Hono } from 'hono';
import type Database from 'better-sqlite3';
import { getAllTodos, createTodo } from '../db.js';
import { validateCreateTodo } from '../validation.js';

export function todosRoutes(app: Hono, db: Database.Database): void {
  app.get('/api/todos', (c) => {
    const todos = getAllTodos(db);
    return c.json(todos);
  });

  app.post('/api/todos', async (c) => {
    try {
      const body = await c.req.json();
      const { title } = validateCreateTodo(body);
      const todo = createTodo(db, title);
      return c.json(todo, 201);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Bad request';
      return c.json({ error: message }, 400);
    }
  });
}
```

- [ ] **2.3: Run backend tests**

```bash
npm test
```

Expected: PASS.

### Step 3: Write failing E2E test + implement create UI

- [ ] **3.1: Add create E2E test**

Add to `e2e/todo-crud.spec.ts`:

```typescript
  test('creates a todo by typing and pressing Enter (UC-U01, Main Flow)', async ({
    page,
  }) => {
    const input = page.getByPlaceholder('Add a todo...');
    await input.fill('Buy milk');
    await input.press('Enter');
    await expect(page.getByText('Buy milk')).toBeVisible();
    await expect(input).toHaveValue('');
  });

  test('does not create todo with empty input (UC-U01, Alt 5a)', async ({
    page,
  }) => {
    const input = page.getByPlaceholder('Add a todo...');
    await input.press('Enter');
    await expect(page.getByText('No todos yet')).toBeVisible();
  });
```

- [ ] **3.2: Update TodoList with create form**

Modify `src/client/components/TodoList.tsx` — add a form with input and button that calls createTodo, then refreshes the list:

```tsx
import { useState } from 'react';
import type { Todo } from '@shared/types.js';
import { createTodo as apiCreateTodo } from '../api/client.js';

interface TodoListProps {
  todos: Todo[];
  loading: boolean;
  error: string | null;
  onTodoCreated: (todo: Todo) => void;
}

export function TodoList({
  todos,
  loading,
  error,
  onTodoCreated,
}: TodoListProps) {
  const [title, setTitle] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const todo = await apiCreateTodo(title.trim());
    onTodoCreated(todo);
    setTitle('');
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div className="todo-list">
      <h2>Todo List</h2>
      <form className="todo-form" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Add a todo..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={500}
        />
        <button type="submit">Add</button>
      </form>
      {todos.length === 0 ? (
        <p className="empty-state">No todos yet</p>
      ) : (
        <ul>
          {todos.map((todo) => (
            <li key={todo.id} data-testid={`todo-${todo.id}`}>
              <span className={todo.completed ? 'completed' : ''}>
                {todo.title}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

- [ ] **3.3: Add createTodo to API client**

Add to `src/client/api/client.ts`:

```typescript
export async function createTodo(title: string): Promise<Todo> {
  const res = await fetch(`${BASE}/todos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error('Failed to create todo');
  return res.json();
}
```

- [ ] **3.4: Update useTodos with addTodo**

Add `addTodo` callback to `useTodos`:

```typescript
  const addTodo = useCallback((todo: Todo) => {
    setTodos((prev) => [...prev, todo]);
  }, []);

  return { todos, loading, error, setTodos, loadTodos, addTodo };
```

- [ ] **3.5: Update App.tsx to pass onTodoCreated**

```tsx
export function App() {
  const { todos, loading, error, addTodo } = useTodos();

  return (
    <div className="app">
      <h1>Todo + AI Chat</h1>
      <div className="panels">
        <TodoList
          todos={todos}
          loading={loading}
          error={error}
          onTodoCreated={addTodo}
        />
      </div>
    </div>
  );
}
```

- [ ] **3.6: Run E2E tests**

```bash
npm run test:e2e
```

Expected: PASS.

- [ ] **3.7: Commit Task 2**

```bash
git add -A
git commit -m "feat: create todo with validation (Slice 2)

- POST /api/todos with title validation (UC-S01, UC-S11)
- Input validation: empty, whitespace, max 500 chars
- React form with Enter/button submit (UC-U01)
- Backend tests for create + validation
- E2E tests for create flow

Use Cases: UC-U01, UC-S01, UC-S10, UC-S11"
```

---

## Task 3: Toggle Completion + Update Title

**Use Cases:** UC-U03, UC-U05, UC-S03, UC-S05
**Goal:** User can check/uncheck todos and edit titles inline

### Step 1: Write failing backend tests

- [ ] **1.1: Add toggle and update tests to todos.test.ts**

Add to the describe block in `src/server/__tests__/todos.test.ts`:

```typescript
  describe('PATCH /api/todos/:id (UC-S03)', () => {
    it('updates todo title (UC-S03, Main Flow)', async () => {
      const createRes = await app.request('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Original' }),
      });
      const created = await createRes.json();

      const res = await app.request(`/api/todos/${created.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Updated' }),
      });
      expect(res.status).toBe(200);
      const updated = await res.json();
      expect(updated.title).toBe('Updated');
      expect(updated.id).toBe(created.id);
    });

    it('returns 404 for non-existent todo (UC-S03, Alt 5b)', async () => {
      const res = await app.request(
        '/api/todos/00000000-0000-4000-8000-000000000000',
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: 'Updated' }),
        }
      );
      expect(res.status).toBe(404);
    });

    it('returns 400 for empty body (UC-S03, Alt 5c)', async () => {
      const createRes = await app.request('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Test' }),
      });
      const created = await createRes.json();

      const res = await app.request(`/api/todos/${created.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      expect(res.status).toBe(400);
    });

    it('updates completed field (UC-S03, Main Flow)', async () => {
      const createRes = await app.request('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Test' }),
      });
      const created = await createRes.json();

      const res = await app.request(`/api/todos/${created.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: true }),
      });
      expect(res.status).toBe(200);
      const updated = await res.json();
      expect(updated.completed).toBe(true);
    });
  });

  describe('PATCH /api/todos/:id/toggle (UC-S05)', () => {
    it('toggles completion status (UC-S05, Main Flow)', async () => {
      const createRes = await app.request('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Test' }),
      });
      const created = await createRes.json();
      expect(created.completed).toBe(false);

      const res = await app.request(`/api/todos/${created.id}/toggle`, {
        method: 'PATCH',
      });
      expect(res.status).toBe(200);
      const toggled = await res.json();
      expect(toggled.completed).toBe(true);

      const res2 = await app.request(`/api/todos/${created.id}/toggle`, {
        method: 'PATCH',
      });
      const toggled2 = await res2.json();
      expect(toggled2.completed).toBe(false);
    });

    it('returns 404 for non-existent todo (UC-S05, Alt 5a)', async () => {
      const res = await app.request(
        '/api/todos/00000000-0000-4000-8000-000000000000/toggle',
        { method: 'PATCH' }
      );
      expect(res.status).toBe(404);
    });
  });
```

- [ ] **1.2: Add validation tests for update**

Add to `src/server/__tests__/validation.test.ts`:

```typescript
  describe('validateUpdateTodo (UC-S11, for UC-S03)', () => {
    it('accepts title update', () => {
      const result = validateUpdateTodo({ title: 'New title' });
      expect(result).toEqual({ title: 'New title' });
    });

    it('accepts completed update', () => {
      const result = validateUpdateTodo({ completed: true });
      expect(result).toEqual({ completed: true });
    });

    it('accepts both fields', () => {
      const result = validateUpdateTodo({ title: 'New', completed: true });
      expect(result).toEqual({ title: 'New', completed: true });
    });

    it('rejects empty body (UC-S03, Alt 5c)', () => {
      expect(() => validateUpdateTodo({})).toThrow('No fields to update');
    });

    it('rejects empty title (UC-S03, Alt 5d)', () => {
      expect(() => validateUpdateTodo({ title: '' })).toThrow(
        'Title is required'
      );
    });

    it('rejects non-boolean completed', () => {
      expect(() => validateUpdateTodo({ completed: 'yes' })).toThrow(
        'Completed must be a boolean'
      );
    });
  });
```

Import `validateUpdateTodo` at the top of the file.

- [ ] **1.3: Run tests to verify failures**

```bash
npm test
```

Expected: FAIL — `validateUpdateTodo` not exported from `validation.ts`, PATCH routes not implemented.

### Step 2: Implement validateUpdateTodo + PATCH routes

- [ ] **2.0: Add validateUpdateTodo to validation.ts (TDD — tests written in 1.2)**

Add to `src/server/validation.ts`:

```typescript
export function validateUpdateTodo(
  body: unknown
): { title?: string; completed?: boolean } {
  const obj = body as Record<string, unknown>;
  const result: { title?: string; completed?: boolean } = {};

  if (obj.title !== undefined) {
    if (typeof obj.title !== 'string' || obj.title.trim().length === 0) {
      throw new Error('Title is required');
    }
    if (obj.title.trim().length > 500) {
      throw new Error('Title must be 500 characters or less');
    }
    result.title = obj.title.trim();
  }

  if (obj.completed !== undefined) {
    if (typeof obj.completed !== 'boolean') {
      throw new Error('Completed must be a boolean');
    }
    result.completed = obj.completed;
  }

  if (result.title === undefined && result.completed === undefined) {
    throw new Error('No fields to update');
  }

  return result;
}
```

- [ ] **2.1: Add PATCH and toggle routes to todos.ts**

Add to `src/server/routes/todos.ts`:

```typescript
import { getAllTodos, createTodo, updateTodo, toggleTodo } from '../db.js';
import { validateCreateTodo, validateUpdateTodo } from '../validation.js';

  // Inside todosRoutes function, after post:

  app.patch('/api/todos/:id/toggle', (c) => {
    const id = c.req.param('id');
    const todo = toggleTodo(db, id);
    if (!todo) {
      return c.json({ error: 'Todo not found' }, 404);
    }
    return c.json(todo);
  });

  app.patch('/api/todos/:id', async (c) => {
    const id = c.req.param('id');
    try {
      const body = await c.req.json();
      const fields = validateUpdateTodo(body);
      const todo = updateTodo(db, id, fields);
      if (!todo) {
        return c.json({ error: 'Todo not found' }, 404);
      }
      return c.json(todo);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Bad request';
      return c.json({ error: message }, 400);
    }
  });
```

**IMPORTANT:** The `/toggle` route MUST be registered before the `/:id` route to avoid Hono matching `toggle` as an `:id` parameter.

- [ ] **2.2: Run backend tests**

```bash
npm test
```

Expected: PASS.

### Step 3: Implement frontend toggle + edit

- [ ] **3.1: Create TodoItem component**

Create `src/client/components/TodoItem.tsx`:

```tsx
import { useState } from 'react';
import type { Todo } from '@shared/types.js';

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: string) => void;
  onUpdate: (id: string, title: string) => void;
  onDelete?: (id: string) => void;  // Optional — added in Task 4
}

export function TodoItem({ todo, onToggle, onUpdate, onDelete }: TodoItemProps) {
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(todo.title);

  const handleDoubleClick = () => {
    setEditing(true);
    setEditTitle(todo.title);
  };

  const handleSave = () => {
    if (editTitle.trim() && editTitle.trim() !== todo.title) {
      onUpdate(todo.id, editTitle.trim());
    }
    setEditing(false);
    setEditTitle(todo.title);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') {
      setEditing(false);
      setEditTitle(todo.title);
    }
  };

  return (
    <li data-testid={`todo-${todo.id}`}>
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => onToggle(todo.id)}
        aria-label={`Toggle ${todo.title}`}
      />
      {editing ? (
        <input
          className="edit-input"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          autoFocus
          maxLength={500}
        />
      ) : (
        <span
          className={`todo-title ${todo.completed ? 'completed' : ''}`}
          onDoubleClick={handleDoubleClick}
        >
          {todo.title}
        </span>
      )}
      {onDelete && (
        <button
          className="delete-btn"
          onClick={() => onDelete(todo.id)}
          aria-label={`Delete ${todo.title}`}
        >
          x
        </button>
      )}
    </li>
  );
}
```

- [ ] **3.2: Add toggle/update to API client**

Add to `src/client/api/client.ts`:

```typescript
export async function toggleTodo(id: string): Promise<Todo> {
  const res = await fetch(`${BASE}/todos/${id}/toggle`, { method: 'PATCH' });
  if (!res.ok) throw new Error('Failed to toggle todo');
  return res.json();
}

export async function updateTodo(
  id: string,
  title: string
): Promise<Todo> {
  const res = await fetch(`${BASE}/todos/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error('Failed to update todo');
  return res.json();
}
```

- [ ] **3.3: Add toggle/update to useTodos hook**

Add to `useTodos`:

```typescript
  const toggleTodoItem = useCallback(async (id: string) => {
    const updated = await apiToggleTodo(id);
    setTodos((prev) => prev.map((t) => (t.id === id ? updated : t)));
  }, []);

  const updateTodoItem = useCallback(async (id: string, title: string) => {
    const updated = await apiUpdateTodo(id, title);
    setTodos((prev) => prev.map((t) => (t.id === id ? updated : t)));
  }, []);

  return {
    todos, loading, error, setTodos, loadTodos,
    addTodo, toggleTodo: toggleTodoItem, updateTodo: updateTodoItem,
  };
```

Import `toggleTodo as apiToggleTodo, updateTodo as apiUpdateTodo` from the client.

- [ ] **3.4: Update TodoList to use TodoItem**

Replace the `<ul>` section in `TodoList` with:

```tsx
<ul>
  {todos.map((todo) => (
    <TodoItem
      key={todo.id}
      todo={todo}
      onToggle={onToggle}
      onUpdate={onUpdate}
      onDelete={onDelete}
    />
  ))}
</ul>
```

Add `onToggle`, `onUpdate` to the props interface (required). Add `onDelete?` as optional — it will be wired in Task 4.

- [ ] **3.5: Update App.tsx to wire toggle/update/delete**

```tsx
export function App() {
  const { todos, loading, error, addTodo, toggleTodo, updateTodo } = useTodos();

  return (
    <div className="app">
      <h1>Todo + AI Chat</h1>
      <div className="panels">
        <TodoList
          todos={todos}
          loading={loading}
          error={error}
          onTodoCreated={addTodo}
          onToggle={toggleTodo}
          onUpdate={updateTodo}
          // onDelete added in Task 4
        />
      </div>
    </div>
  );
}
```

- [ ] **3.6: Write and run E2E tests**

Add to `e2e/todo-crud.spec.ts`:

```typescript
  test('edits a todo title by double-clicking (UC-U03, Main Flow)', async ({
    page,
  }) => {
    const input = page.getByPlaceholder('Add a todo...');
    await input.fill('Original title');
    await input.press('Enter');
    await expect(page.getByText('Original title')).toBeVisible();

    await page.getByText('Original title').dblclick();
    const editInput = page.locator('.edit-input');
    await editInput.fill('Updated title');
    await editInput.press('Enter');
    await expect(page.getByText('Updated title')).toBeVisible();
  });
```

Create `e2e/todo-toggle.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Todo Toggle (UC-U05)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('toggles todo completion by clicking checkbox (UC-U05, Main Flow)', async ({
    page,
  }) => {
    const input = page.getByPlaceholder('Add a todo...');
    await input.fill('Test toggle');
    await input.press('Enter');
    await expect(page.getByText('Test toggle')).toBeVisible();

    const checkbox = page.getByRole('checkbox', { name: /toggle test toggle/i });
    await expect(checkbox).not.toBeChecked();
    await checkbox.click();
    await expect(checkbox).toBeChecked();
    await expect(page.locator('.completed')).toBeVisible();

    await checkbox.click();
    await expect(checkbox).not.toBeChecked();
  });
});
```

```bash
npm run test:e2e
```

Expected: PASS.

- [ ] **3.7: Commit Task 3**

```bash
git add -A
git commit -m "feat: toggle completion + update title (Slice 3)

- PATCH /api/todos/:id for title/completed update (UC-S03)
- PATCH /api/todos/:id/toggle for atomic toggle (UC-S05)
- Inline edit via double-click (UC-U03)
- Checkbox toggle (UC-U05)
- TodoItem component with edit/toggle/delete UI
- Validation for update fields
- Backend + E2E tests

Use Cases: UC-U03, UC-U05, UC-S03, UC-S05"
```

---

## Task 4: Delete Todo

**Use Cases:** UC-U04, UC-S04
**Goal:** User can delete todos

### Step 1: Write failing backend tests

- [ ] **1.1: Add delete tests to todos.test.ts**

```typescript
  describe('DELETE /api/todos/:id (UC-S04)', () => {
    it('deletes an existing todo (UC-S04, Main Flow)', async () => {
      const createRes = await app.request('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'To delete' }),
      });
      const created = await createRes.json();

      const res = await app.request(`/api/todos/${created.id}`, {
        method: 'DELETE',
      });
      expect(res.status).toBe(204);

      const listRes = await app.request('/api/todos');
      const todos = await listRes.json();
      expect(todos).toHaveLength(0);
    });

    it('returns 404 for non-existent todo (UC-S04, Alt 5a)', async () => {
      const res = await app.request(
        '/api/todos/00000000-0000-4000-8000-000000000000',
        { method: 'DELETE' }
      );
      expect(res.status).toBe(404);
    });
  });
```

- [ ] **1.2: Run tests — verify fail**

```bash
npm test
```

Expected: FAIL — DELETE route not implemented.

### Step 2: Implement DELETE route

- [ ] **2.1: Add DELETE route to todos.ts**

Add to `src/server/routes/todos.ts`:

```typescript
import { getAllTodos, createTodo, updateTodo, toggleTodo, deleteTodo } from '../db.js';

  app.delete('/api/todos/:id', (c) => {
    const id = c.req.param('id');
    const deleted = deleteTodo(db, id);
    if (!deleted) {
      return c.json({ error: 'Todo not found' }, 404);
    }
    return c.body(null, 204);
  });
```

- [ ] **2.2: Run backend tests**

```bash
npm test
```

Expected: PASS.

### Step 3: Implement frontend delete + E2E

- [ ] **3.1: Add deleteTodo to API client**

Add to `src/client/api/client.ts`:

```typescript
export async function deleteTodo(id: string): Promise<void> {
  const res = await fetch(`${BASE}/todos/${id}`, { method: 'DELETE' });
  if (!res.ok && res.status !== 404) throw new Error('Failed to delete todo');
}
```

- [ ] **3.2: Add deleteTodo to useTodos**

```typescript
  const deleteTodoItem = useCallback(async (id: string) => {
    await apiDeleteTodo(id);
    setTodos((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return {
    todos, loading, error, setTodos, loadTodos,
    addTodo, toggleTodo: toggleTodoItem, updateTodo: updateTodoItem,
    deleteTodo: deleteTodoItem,
  };
```

- [ ] **3.4: Add delete E2E test**

Add to `e2e/todo-crud.spec.ts`:

```typescript
  test('deletes a todo by clicking the delete button (UC-U04, Main Flow)', async ({
    page,
  }) => {
    const input = page.getByPlaceholder('Add a todo...');
    await input.fill('To be deleted');
    await input.press('Enter');
    await expect(page.getByText('To be deleted')).toBeVisible();

    await page.getByRole('button', { name: /delete to be deleted/i }).click();
    await expect(page.getByText('To be deleted')).not.toBeVisible();
    await expect(page.getByText('No todos yet')).toBeVisible();
  });
```

- [ ] **3.4b: Run E2E tests to verify they fail (TDD red phase)**

```bash
npm run test:e2e
```

Expected: FAIL — delete button not yet wired (onDelete not passed to TodoList/TodoItem).

- [ ] **3.5: Wire deleteTodo in App.tsx and pass onDelete to TodoList**

Pass `onDelete={deleteTodo}` to TodoList. In TodoList, pass `onDelete` to each TodoItem.

- [ ] **3.6: Run E2E tests**

```bash
npm run test:e2e
```

Expected: PASS.

- [ ] **3.7: Commit Task 4**

```bash
git add -A
git commit -m "feat: delete todo (Slice 4)

- DELETE /api/todos/:id with 404 handling (UC-S04)
- Delete button visible on hover (UC-U04)
- Backend + E2E tests

Use Cases: UC-U04, UC-S04"
```

---

## Task 5: Real-Time SSE Sync

**Use Cases:** UC-U10, UC-S06, UC-S07
**Goal:** Changes in one tab appear in another tab without refresh

### Step 1: Write failing backend tests

- [ ] **1.1: Create sse.test.ts**

Create `src/server/__tests__/sse.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { SSEManager } from '../sse.js';

describe('SSE Manager (UC-S06, UC-S07)', () => {
  let manager: SSEManager;

  beforeEach(() => {
    manager = new SSEManager();
  });

  describe('addClient / removeClient (UC-S06, Main Flow)', () => {
    it('tracks connected clients', () => {
      const mockWriter = { write: () => {} };
      const id = manager.addClient(mockWriter as unknown as WritableStreamDefaultWriter);
      expect(manager.clientCount).toBe(1);
      manager.removeClient(id);
      expect(manager.clientCount).toBe(0);
    });
  });

  describe('broadcast (UC-S07, Main Flow)', () => {
    it('sends events to all connected clients', () => {
      const messages: string[] = [];
      const mockWriter = {
        write: (data: string) => {
          messages.push(data);
        },
      };
      manager.addClient(mockWriter as unknown as WritableStreamDefaultWriter);

      manager.broadcast('todo:created', { id: '1', title: 'Test' });

      expect(messages).toHaveLength(1);
      expect(messages[0]).toContain('event: todo:created');
      expect(messages[0]).toContain('"id":"1"');
    });

    it('sends to multiple clients (UC-S07, Main Flow step 3)', () => {
      const messages1: string[] = [];
      const messages2: string[] = [];
      manager.addClient({
        write: (data: string) => { messages1.push(data); },
      } as unknown as WritableStreamDefaultWriter);
      manager.addClient({
        write: (data: string) => { messages2.push(data); },
      } as unknown as WritableStreamDefaultWriter);

      manager.broadcast('todo:updated', { id: '1' });

      expect(messages1).toHaveLength(1);
      expect(messages2).toHaveLength(1);
    });

    it('drops when no clients connected (UC-S07, Alt 5a)', () => {
      // Should not throw
      manager.broadcast('todo:created', { id: '1' });
      expect(manager.clientCount).toBe(0);
    });

    it('removes dead clients on write failure (UC-S07, Alt 5b)', () => {
      manager.addClient({
        write: () => {
          throw new Error('Connection closed');
        },
      } as unknown as WritableStreamDefaultWriter);
      expect(manager.clientCount).toBe(1);

      manager.broadcast('todo:created', { id: '1' });
      expect(manager.clientCount).toBe(0);
    });
  });
});
```

- [ ] **1.2: Run tests — verify fail**

```bash
npm test
```

Expected: FAIL — `../sse.js` module not found.

### Step 2: Implement SSE manager + route

- [ ] **2.1: Create src/server/sse.ts**

```typescript
export class SSEManager {
  private clients = new Map<string, WritableStreamDefaultWriter>();
  private nextId = 0;

  get clientCount(): number {
    return this.clients.size;
  }

  addClient(writer: WritableStreamDefaultWriter): string {
    const id = String(this.nextId++);
    this.clients.set(id, writer);
    return id;
  }

  removeClient(id: string): void {
    this.clients.delete(id);
  }

  broadcast(eventType: string, data: unknown): void {
    const message = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const [id, writer] of this.clients) {
      try {
        writer.write(message);
      } catch {
        this.clients.delete(id);
      }
    }
  }
}
```

- [ ] **2.2: Create src/server/routes/events.ts**

```typescript
import type { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import type { SSEManager } from '../sse.js';

export function eventsRoutes(app: Hono, sseManager: SSEManager): void {
  app.get('/api/events', (c) => {
    return streamSSE(c, async (stream) => {
      // Register a writer that uses Hono's streamSSE writeSSE method
      const writer = {
        write: (rawMessage: string) => {
          // Parse the raw SSE message to extract event type and data
          const eventMatch = rawMessage.match(/^event: (.+)\n/);
          const dataMatch = rawMessage.match(/^data: (.+)\n/m);
          if (eventMatch && dataMatch) {
            stream.writeSSE({
              event: eventMatch[1],
              data: dataMatch[1],
            });
          }
        },
      };

      const clientId = sseManager.addClient(
        writer as unknown as WritableStreamDefaultWriter
      );

      stream.onAbort(() => {
        sseManager.removeClient(clientId);
      });

      // Keep-alive loop
      while (true) {
        await stream.writeSSE({ data: '', event: 'keepalive' });
        await stream.sleep(30000);
      }
    });
  });
}
```

- [ ] **2.3: Wire SSE into todos routes**

Modify `src/server/routes/todos.ts` to accept and use SSEManager:

```typescript
import type { SSEManager } from '../sse.js';

export function todosRoutes(
  app: Hono,
  db: Database.Database,
  sseManager: SSEManager
): void {
  // In POST handler, after creating:
  sseManager.broadcast('todo:created', todo);

  // In PATCH update handler, after updating:
  sseManager.broadcast('todo:updated', todo);

  // In PATCH toggle handler, after toggling:
  sseManager.broadcast('todo:updated', todo);

  // In DELETE handler, after deleting:
  sseManager.broadcast('todo:deleted', { id });
}
```

- [ ] **2.4: Update server index.ts**

```typescript
import { SSEManager } from './sse.js';
import { eventsRoutes } from './routes/events.js';

const sseManager = new SSEManager();
todosRoutes(app, db, sseManager);
eventsRoutes(app, sseManager);
```

- [ ] **2.5: Update test setup**

Update `todos.test.ts` beforeEach to pass an SSEManager:

```typescript
import { SSEManager } from '../sse.js';

  let sseManager: SSEManager;

  beforeEach(() => {
    // ...existing...
    sseManager = new SSEManager();
    todosRoutes(app, db, sseManager);
  });
```

- [ ] **2.6: Run backend tests**

```bash
npm test
```

Expected: PASS.

### Step 3: Implement frontend SSE + E2E

- [ ] **3.1: Create useSSE hook**

Create `src/client/hooks/useSSE.ts`:

```typescript
import { useEffect, useRef } from 'react';
import type { SSEEvent } from '@shared/types.js';

export function useSSE(
  onEvent: (event: SSEEvent) => void,
  onReconnect: () => void
) {
  const onEventRef = useRef(onEvent);
  const onReconnectRef = useRef(onReconnect);
  onEventRef.current = onEvent;
  onReconnectRef.current = onReconnect;

  useEffect(() => {
    const es = new EventSource('/api/events');

    const handleEvent = (type: SSEEvent['type']) => (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        onEventRef.current({ type, data } as SSEEvent);
      } catch {
        // Ignore malformed events
      }
    };

    es.addEventListener('todo:created', handleEvent('todo:created'));
    es.addEventListener('todo:updated', handleEvent('todo:updated'));
    es.addEventListener('todo:deleted', handleEvent('todo:deleted'));

    es.onerror = () => {
      // EventSource auto-reconnects; refetch state on reconnect
      if (es.readyState === EventSource.CONNECTING) {
        onReconnectRef.current();
      }
    };

    return () => es.close();
  }, []);
}
```

- [ ] **3.2: Integrate SSE into useTodos**

Modify `useTodos` to call `useSSE`:

```typescript
import { useSSE } from './useSSE.js';
import type { SSEEvent, Todo } from '@shared/types.js';

  // Inside useTodos:
  const handleSSEEvent = useCallback((event: SSEEvent) => {
    switch (event.type) {
      case 'todo:created':
        setTodos((prev) => {
          if (prev.some((t) => t.id === event.data.id)) return prev;
          return [...prev, event.data];
        });
        break;
      case 'todo:updated':
        setTodos((prev) =>
          prev.map((t) => (t.id === event.data.id ? event.data : t))
        );
        break;
      case 'todo:deleted':
        setTodos((prev) => prev.filter((t) => t.id !== event.data.id));
        break;
    }
  }, []);

  useSSE(handleSSEEvent, loadTodos);
```

- [ ] **3.3: Write multi-tab E2E test**

Create `e2e/realtime-sync.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Real-Time SSE Sync (UC-U10)', () => {
  test('syncs new todo across browser contexts (UC-U10, Main Flow)', async ({
    browser,
  }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    await page1.goto('/');
    await page2.goto('/');

    // Both tabs show empty state
    await expect(page1.getByText('No todos yet')).toBeVisible();
    await expect(page2.getByText('No todos yet')).toBeVisible();

    // Create todo in tab 1
    const input = page1.getByPlaceholder('Add a todo...');
    await input.fill('Synced todo');
    await input.press('Enter');

    // Tab 1 sees it immediately
    await expect(page1.getByText('Synced todo')).toBeVisible();

    // Tab 2 sees it via SSE
    await expect(page2.getByText('Synced todo')).toBeVisible({ timeout: 5000 });

    await context1.close();
    await context2.close();
  });
});
```

- [ ] **3.4: Run E2E tests**

```bash
npm run test:e2e
```

Expected: PASS.

- [ ] **3.5: Commit Task 5**

```bash
git add -A
git commit -m "feat: real-time SSE sync across tabs (Slice 5)

- SSE manager with broadcast to all clients (UC-S06, UC-S07)
- GET /api/events SSE endpoint with keepalive
- useSSE hook for client-side event handling
- CRUD operations broadcast SSE events
- Multi-tab E2E test verifies real-time sync

Use Cases: UC-U10, UC-S06, UC-S07"
```

---

## Task 6: AI Chat Integration

**Use Cases:** UC-U06, UC-U07, UC-U08, UC-U09, UC-S08, UC-S09
**Goal:** User chats with AI; AI can read and modify todos

### Step 1: Write failing backend tests

- [ ] **1.1: Create ai-tools.test.ts**

Create `src/server/__tests__/ai-tools.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { createDatabase, createTodo } from '../db.js';
import { executeTool, TOOL_DEFINITIONS } from '../ai/tools.js';
import { SSEManager } from '../sse.js';

describe('AI Tool Execution (UC-S09)', () => {
  let db: Database.Database;
  let sseManager: SSEManager;

  beforeEach(() => {
    db = new Database(':memory:');
    createDatabase(db);
    sseManager = new SSEManager();
  });

  it('has 5 tool definitions', () => {
    expect(TOOL_DEFINITIONS).toHaveLength(5);
    const names = TOOL_DEFINITIONS.map((t) => t.function.name);
    expect(names).toContain('list_todos');
    expect(names).toContain('create_todo');
    expect(names).toContain('update_todo');
    expect(names).toContain('delete_todo');
    expect(names).toContain('toggle_todo');
  });

  describe('list_todos (UC-S09, for UC-U09)', () => {
    it('returns empty array when no todos', async () => {
      const result = await executeTool(db, sseManager, 'list_todos', '{}');
      expect(JSON.parse(result)).toEqual([]);
    });

    it('returns all todos', async () => {
      createTodo(db, 'Test 1');
      createTodo(db, 'Test 2');
      const result = await executeTool(db, sseManager, 'list_todos', '{}');
      const todos = JSON.parse(result);
      expect(todos).toHaveLength(2);
    });
  });

  describe('create_todo (UC-S09, for UC-U07)', () => {
    it('creates a todo and broadcasts SSE', async () => {
      const broadcasts: string[] = [];
      const mockSse = {
        broadcast: (_type: string, _data: unknown) => {
          broadcasts.push(_type);
        },
      } as unknown as SSEManager;

      const result = await executeTool(
        db,
        mockSse,
        'create_todo',
        JSON.stringify({ title: 'AI todo' })
      );
      const todo = JSON.parse(result);
      expect(todo.title).toBe('AI todo');
      expect(broadcasts).toContain('todo:created');
    });
  });

  describe('toggle_todo (UC-S09, for UC-U08)', () => {
    it('toggles a todo', async () => {
      const todo = createTodo(db, 'Test');
      const result = await executeTool(
        db,
        sseManager,
        'toggle_todo',
        JSON.stringify({ id: todo.id })
      );
      const toggled = JSON.parse(result);
      expect(toggled.completed).toBe(true);
    });

    it('returns error for non-existent todo', async () => {
      const result = await executeTool(
        db,
        sseManager,
        'toggle_todo',
        JSON.stringify({ id: '00000000-0000-4000-8000-000000000000' })
      );
      expect(result).toContain('not found');
    });
  });

  describe('delete_todo (UC-S09, for UC-U08)', () => {
    it('deletes a todo', async () => {
      const todo = createTodo(db, 'Test');
      const result = await executeTool(
        db,
        sseManager,
        'delete_todo',
        JSON.stringify({ id: todo.id })
      );
      expect(result).toContain('deleted');
    });
  });

  describe('update_todo (UC-S09, for UC-U08)', () => {
    it('updates a todo title', async () => {
      const todo = createTodo(db, 'Old');
      const result = await executeTool(
        db,
        sseManager,
        'update_todo',
        JSON.stringify({ id: todo.id, title: 'New' })
      );
      expect(JSON.parse(result).title).toBe('New');
    });
  });

  describe('unknown tool (UC-S09, Alt 5a)', () => {
    it('returns error for unknown tool', async () => {
      const result = await executeTool(
        db,
        sseManager,
        'unknown_tool',
        '{}'
      );
      expect(result).toContain('Unknown tool');
    });
  });

  describe('malformed arguments (UC-S09, Alt 5b)', () => {
    it('throws on invalid JSON arguments', async () => {
      await expect(
        executeTool(db, sseManager, 'create_todo', 'not json')
      ).rejects.toThrow();
    });
  });
});
```

- [ ] **1.2: Create chat.test.ts**

Create `src/server/__tests__/chat.test.ts`:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Hono } from 'hono';
import Database from 'better-sqlite3';
import { createDatabase } from '../db.js';
import { chatRoutes } from '../routes/chat.js';
import { SSEManager } from '../sse.js';

// Mock the OpenRouter module
vi.mock('../ai/openrouter.js', () => ({
  callOpenRouter: vi.fn(),
}));

import { callOpenRouter } from '../ai/openrouter.js';
const mockCallOpenRouter = vi.mocked(callOpenRouter);

describe('Chat Routes (UC-S08)', () => {
  let app: Hono;
  let db: Database.Database;

  beforeEach(() => {
    db = new Database(':memory:');
    createDatabase(db);
    const sseManager = new SSEManager();
    app = new Hono();
    chatRoutes(app, db, sseManager);
    vi.clearAllMocks();
  });

  it('returns AI text response (UC-S08, Main Flow)', async () => {
    mockCallOpenRouter.mockResolvedValueOnce({
      choices: [
        {
          message: { role: 'assistant', content: 'Hello!' },
          finish_reason: 'stop',
        },
      ],
    });

    const res = await app.request('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Hi' }],
      }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.response).toBe('Hello!');
  });

  it('executes tool calls and returns result (UC-S08, Main Flow step 5)', async () => {
    // First call: AI wants to use a tool
    mockCallOpenRouter.mockResolvedValueOnce({
      choices: [
        {
          message: {
            role: 'assistant',
            content: null,
            tool_calls: [
              {
                id: 'call_1',
                type: 'function',
                function: {
                  name: 'list_todos',
                  arguments: '{}',
                },
              },
            ],
          },
          finish_reason: 'tool_calls',
        },
      ],
    });

    // Second call: AI responds after seeing tool result
    mockCallOpenRouter.mockResolvedValueOnce({
      choices: [
        {
          message: {
            role: 'assistant',
            content: 'You have no todos yet!',
          },
          finish_reason: 'stop',
        },
      ],
    });

    const res = await app.request('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: "What's on my list?" }],
      }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.response).toBe('You have no todos yet!');
  });

  it('returns 500 when OPENROUTER_API_KEY is not set (UC-S08, Alt 5a)', async () => {
    mockCallOpenRouter.mockRejectedValueOnce(
      new Error('AI service not configured')
    );

    const res = await app.request('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Hello' }],
      }),
    });
    expect(res.status).toBe(502);
  });

  it('returns 400 for empty messages (UC-S08, validation)', async () => {
    const res = await app.request('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [] }),
    });
    expect(res.status).toBe(400);
  });

  it('returns 502 when OpenRouter fails (UC-S08, Alt 5b)', async () => {
    mockCallOpenRouter.mockRejectedValueOnce(new Error('API error'));

    const res = await app.request('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Hello' }],
      }),
    });
    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body.error).toBe('AI service unavailable');
  });

  it('returns partial response when tool loop exceeds 5 iterations (UC-S08, Alt 5d)', async () => {
    // Mock: AI always returns a tool_call
    for (let i = 0; i < 6; i++) {
      mockCallOpenRouter.mockResolvedValueOnce({
        choices: [
          {
            message: {
              role: 'assistant',
              content: null,
              tool_calls: [
                {
                  id: `call_${i}`,
                  type: 'function',
                  function: { name: 'list_todos', arguments: '{}' },
                },
              ],
            },
            finish_reason: 'tool_calls',
          },
        ],
      });
    }

    const res = await app.request('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Loop forever' }],
      }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.response).toContain('max');
  });
});
```

- [ ] **1.3: Run tests — verify fail**

```bash
npm test
```

Expected: FAIL — ai modules and chat route don't exist.

### Step 2: Implement AI tools + OpenRouter client + chat route

- [ ] **2.0a: Add validateChatMessages and validateUUID to validation.ts (TDD — tests in Task 7)**

Add to `src/server/validation.ts`:

```typescript
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function validateUUID(id: string): string {
  if (!UUID_REGEX.test(id)) {
    throw new Error('Invalid ID format');
  }
  return id;
}

export function validateChatMessages(
  body: unknown
): { messages: Array<{ role: 'user' | 'assistant'; content: string }> } {
  const obj = body as Record<string, unknown>;
  if (!obj || !Array.isArray(obj.messages)) {
    throw new Error('Messages array is required');
  }
  if (obj.messages.length === 0) {
    throw new Error('Messages array must not be empty');
  }
  if (obj.messages.length > 50) {
    throw new Error('Messages array must not exceed 50 messages');
  }
  for (const msg of obj.messages) {
    const m = msg as Record<string, unknown>;
    if (m.role !== 'user' && m.role !== 'assistant') {
      throw new Error('Invalid message role');
    }
    if (typeof m.content !== 'string' || m.content.trim().length === 0) {
      throw new Error('Message content must be a non-empty string');
    }
  }
  return obj as { messages: Array<{ role: 'user' | 'assistant'; content: string }> };
}
```

Note: These validators are needed by chat.ts. Their unit tests follow immediately in Step 2.0b (TDD — tests right after implementation, same task).

- [ ] **2.0b: Write tests for validateChatMessages and validateUUID (TDD — implementation was 2.0a)**

Add to `src/server/__tests__/validation.test.ts`:

```typescript
import { validateUUID, validateChatMessages } from '../validation.js';

  describe('validateUUID (UC-S11)', () => {
    it('accepts valid UUID v4', () => {
      expect(validateUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(
        '550e8400-e29b-41d4-a716-446655440000'
      );
    });

    it('rejects invalid UUID format', () => {
      expect(() => validateUUID('not-a-uuid')).toThrow('Invalid ID format');
    });
  });

  describe('validateChatMessages (UC-S11, for UC-S08)', () => {
    it('accepts valid messages', () => {
      const result = validateChatMessages({
        messages: [{ role: 'user', content: 'Hello' }],
      });
      expect(result.messages).toHaveLength(1);
    });

    it('rejects missing messages field', () => {
      expect(() => validateChatMessages({})).toThrow(
        'Messages array is required'
      );
    });

    it('rejects empty messages array', () => {
      expect(() => validateChatMessages({ messages: [] })).toThrow(
        'Messages array must not be empty'
      );
    });

    it('rejects more than 50 messages', () => {
      const messages = Array.from({ length: 51 }, (_, i) => ({
        role: 'user',
        content: `msg ${i}`,
      }));
      expect(() => validateChatMessages({ messages })).toThrow(
        'Messages array must not exceed 50 messages'
      );
    });

    it('rejects invalid role', () => {
      expect(() =>
        validateChatMessages({
          messages: [{ role: 'system', content: 'hi' }],
        })
      ).toThrow('Invalid message role');
    });

    it('rejects empty content', () => {
      expect(() =>
        validateChatMessages({
          messages: [{ role: 'user', content: '' }],
        })
      ).toThrow('Message content must be a non-empty string');
    });

    it('rejects non-string content', () => {
      expect(() =>
        validateChatMessages({
          messages: [{ role: 'user', content: 123 }],
        })
      ).toThrow('Message content must be a non-empty string');
    });
  });
```

Run: `npm test` — Expected: PASS (validators implemented in 2.0a).

- [ ] **2.1: Create src/server/ai/openrouter.ts**

```typescript
const OPENROUTER_API_URL =
  'https://openrouter.ai/api/v1/chat/completions';

interface OpenRouterMessage {
  role: string;
  content: string | null;
  tool_calls?: Array<{
    id: string;
    type: 'function';
    function: { name: string; arguments: string };
  }>;
  tool_call_id?: string;
}

interface OpenRouterResponse {
  choices: Array<{
    message: OpenRouterMessage;
    finish_reason: string;
  }>;
}

export async function callOpenRouter(
  messages: OpenRouterMessage[],
  tools: unknown[]
): Promise<OpenRouterResponse> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('AI service not configured');
  }

  const res = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL || 'anthropic/claude-sonnet-4-20250514',
      messages,
      tools,
      tool_choice: 'auto',
    }),
  });

  if (!res.ok) {
    throw new Error(`OpenRouter API error: ${res.status}`);
  }

  return res.json();
}
```

- [ ] **2.2: Create src/server/ai/tools.ts**

```typescript
import type Database from 'better-sqlite3';
import {
  getAllTodos,
  createTodo,
  updateTodo,
  deleteTodo,
  toggleTodo,
} from '../db.js';
import type { SSEManager } from '../sse.js';

export const TOOL_DEFINITIONS = [
  {
    type: 'function' as const,
    function: {
      name: 'list_todos',
      description: 'Get all todo items',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'create_todo',
      description: 'Create a new todo item',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'The todo title' },
        },
        required: ['title'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'update_todo',
      description: 'Update an existing todo item',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'The todo ID' },
          title: { type: 'string', description: 'New title' },
          completed: { type: 'boolean', description: 'Completion status' },
        },
        required: ['id'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'delete_todo',
      description: 'Delete a todo item',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'The todo ID to delete' },
        },
        required: ['id'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'toggle_todo',
      description: 'Toggle a todo item completion status',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'The todo ID to toggle' },
        },
        required: ['id'],
      },
    },
  },
];

export async function executeTool(
  db: Database.Database,
  sseManager: SSEManager,
  name: string,
  args: string
): Promise<string> {
  const parsed = JSON.parse(args);

  switch (name) {
    case 'list_todos': {
      const todos = getAllTodos(db);
      return JSON.stringify(todos);
    }
    case 'create_todo': {
      const todo = createTodo(db, parsed.title);
      sseManager.broadcast('todo:created', todo);
      return JSON.stringify(todo);
    }
    case 'update_todo': {
      const fields: { title?: string; completed?: boolean } = {};
      if (parsed.title !== undefined) fields.title = parsed.title;
      if (parsed.completed !== undefined) fields.completed = parsed.completed;
      const todo = updateTodo(db, parsed.id, fields);
      if (!todo) return JSON.stringify({ error: 'Todo not found' });
      sseManager.broadcast('todo:updated', todo);
      return JSON.stringify(todo);
    }
    case 'delete_todo': {
      const deleted = deleteTodo(db, parsed.id);
      if (!deleted) return JSON.stringify({ error: 'Todo not found' });
      sseManager.broadcast('todo:deleted', { id: parsed.id });
      return JSON.stringify({ success: true, message: 'Todo deleted' });
    }
    case 'toggle_todo': {
      const todo = toggleTodo(db, parsed.id);
      if (!todo) return JSON.stringify({ error: 'Todo not found' });
      sseManager.broadcast('todo:updated', todo);
      return JSON.stringify(todo);
    }
    default:
      return JSON.stringify({ error: `Unknown tool: ${name}` });
  }
}
```

- [ ] **2.3: Create src/server/routes/chat.ts**

```typescript
import type { Hono } from 'hono';
import type Database from 'better-sqlite3';
import type { SSEManager } from '../sse.js';
import { callOpenRouter } from '../ai/openrouter.js';
import { executeTool, TOOL_DEFINITIONS } from '../ai/tools.js';
import { validateChatMessages } from '../validation.js';

const MAX_TOOL_ITERATIONS = 5;

const SYSTEM_PROMPT = `You are a helpful AI assistant that manages a todo list. You can:
- List all todos
- Create new todos
- Update todo titles and completion status
- Delete todos
- Toggle todo completion

Be concise and helpful. When the user asks you to manage their todos, use the available tools.`;

export function chatRoutes(
  app: Hono,
  db: Database.Database,
  sseManager: SSEManager
): void {
  app.post('/api/chat', async (c) => {
    try {
      const body = await c.req.json();
      const { messages } = validateChatMessages(body);

      const apiMessages: Array<{
        role: string;
        content: string | null;
        tool_calls?: Array<{
          id: string;
          type: 'function';
          function: { name: string; arguments: string };
        }>;
        tool_call_id?: string;
      }> = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      ];

      let iterations = 0;
      let finalResponse = '';

      while (iterations < MAX_TOOL_ITERATIONS) {
        iterations++;

        let result;
        try {
          result = await callOpenRouter(apiMessages, TOOL_DEFINITIONS);
        } catch {
          return c.json({ error: 'AI service unavailable' }, 502);
        }

        const choice = result.choices[0];
        if (!choice) {
          return c.json({ error: 'No response from AI' }, 502);
        }

        const assistantMessage = choice.message;
        apiMessages.push(assistantMessage);

        if (
          !assistantMessage.tool_calls ||
          assistantMessage.tool_calls.length === 0
        ) {
          finalResponse = assistantMessage.content || '';
          break;
        }

        // Execute tool calls
        for (const toolCall of assistantMessage.tool_calls) {
          const toolResult = await executeTool(
            db,
            sseManager,
            toolCall.function.name,
            toolCall.function.arguments
          );
          apiMessages.push({
            role: 'tool',
            content: toolResult,
            tool_call_id: toolCall.id,
          });
        }
      }

      if (!finalResponse) {
        finalResponse =
          'I reached the maximum number of tool calls. Here is what I was able to do so far.';
      }

      const responseMessages = [
        ...messages,
        { role: 'assistant' as const, content: finalResponse },
      ];

      return c.json({
        response: finalResponse,
        messages: responseMessages,
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Bad request';
      if (message.includes('AI service not configured')) {
        return c.json({ error: message }, 500);
      }
      return c.json({ error: message }, 400);
    }
  });
}
```

- [ ] **2.4: Mount chat route in index.ts**

Add to `src/server/index.ts`:

```typescript
import { chatRoutes } from './routes/chat.js';

chatRoutes(app, db, sseManager);
```

- [ ] **2.5: Run backend tests**

```bash
npm test
```

Expected: PASS.

### Step 3: Implement frontend chat + E2E

- [ ] **3.1: Add sendChatMessage to API client**

Add to `src/client/api/client.ts`:

```typescript
import type { ChatMessage, ChatResponse } from '@shared/types.js';

export async function sendChatMessage(
  messages: ChatMessage[]
): Promise<ChatResponse> {
  const res = await fetch(`${BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
  });
  if (!res.ok) throw new Error('Failed to send message');
  return res.json();
}
```

- [ ] **3.2: Create useChat hook**

Create `src/client/hooks/useChat.ts`:

```typescript
import { useState, useCallback } from 'react';
import type { ChatMessage } from '@shared/types.js';
import { sendChatMessage } from '../api/client.js';

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(
    async (content: string) => {
      const userMessage: ChatMessage = { role: 'user', content };
      const updated = [...messages, userMessage].slice(-50);
      setMessages(updated);
      setLoading(true);
      setError(null);

      try {
        const result = await sendChatMessage(updated);
        setMessages(result.messages.slice(-50));
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Unknown error');
        const errorMsg: ChatMessage = {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setLoading(false);
      }
    },
    [messages]
  );

  return { messages, loading, error, sendMessage };
}
```

- [ ] **3.3: Create ChatMessage component**

Create `src/client/components/ChatMessage.tsx`:

```tsx
import type { ChatMessage as ChatMessageType } from '@shared/types.js';

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  return (
    <div className={`chat-message ${message.role}`}>
      <p>{message.content}</p>
    </div>
  );
}
```

- [ ] **3.4: Create ChatPanel component**

Create `src/client/components/ChatPanel.tsx`:

```tsx
import { useState } from 'react';
import type { ChatMessage as ChatMessageType } from '@shared/types.js';
import { ChatMessage } from './ChatMessage.js';

interface ChatPanelProps {
  messages: ChatMessageType[];
  loading: boolean;
  onSendMessage: (content: string) => void;
}

export function ChatPanel({
  messages,
  loading,
  onSendMessage,
}: ChatPanelProps) {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    onSendMessage(input.trim());
    setInput('');
  };

  return (
    <div className="chat-panel">
      <h2>AI Chat</h2>
      <div className="chat-messages">
        {messages.length === 0 && (
          <p className="empty-state">
            Ask me to manage your todos!
          </p>
        )}
        {messages.map((msg, i) => (
          <ChatMessage key={i} message={msg} />
        ))}
        {loading && <p className="loading">Thinking...</p>}
      </div>
      <form className="chat-form" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
        />
        <button type="submit" disabled={loading || !input.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}
```

- [ ] **3.5: Add ChatPanel to App.tsx**

```tsx
import { TodoList } from './components/TodoList.js';
import { ChatPanel } from './components/ChatPanel.js';
import { useTodos } from './hooks/useTodos.js';
import { useChat } from './hooks/useChat.js';

export function App() {
  const {
    todos, loading, error, addTodo, toggleTodo, updateTodo, deleteTodo,
  } = useTodos();
  const chat = useChat();

  return (
    <div className="app">
      <h1>Todo + AI Chat</h1>
      <div className="panels">
        <TodoList
          todos={todos}
          loading={loading}
          error={error}
          onTodoCreated={addTodo}
          onToggle={toggleTodo}
          onUpdate={updateTodo}
          onDelete={deleteTodo}
        />
        <ChatPanel
          messages={chat.messages}
          loading={chat.loading}
          onSendMessage={chat.sendMessage}
        />
      </div>
    </div>
  );
}
```

- [ ] **3.6: Write E2E tests for AI chat**

Create `e2e/ai-chat.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('AI Chat (UC-U06, UC-U07, UC-U08, UC-U09)', () => {
  // Skip AI tests if OPENROUTER_API_KEY is not set (e.g., in CI without secrets)
  const hasApiKey = !!process.env.OPENROUTER_API_KEY;

  test.beforeEach(async ({ page }) => {
    test.skip(!hasApiKey, 'OPENROUTER_API_KEY not set');
    await page.goto('/');
  });

  test('displays chat panel with empty state (UC-U06, Main Flow step 1)', async ({
    page,
  }) => {
    await expect(
      page.getByRole('heading', { name: /ai chat/i })
    ).toBeVisible();
    await expect(
      page.getByText('Ask me to manage your todos!')
    ).toBeVisible();
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

  test('AI creates a todo via chat (UC-U07, Main Flow)', async ({
    page,
  }) => {
    const chatInput = page.getByPlaceholder('Type a message...');
    await chatInput.fill('Add a todo to buy groceries');
    await chatInput.press('Enter');

    // Wait for AI response
    await expect(page.locator('.chat-message.assistant')).toBeVisible({
      timeout: 30000,
    });

    // Todo should appear in the list (via SSE or direct)
    await expect(page.getByText('buy groceries', { exact: false })).toBeVisible({
      timeout: 10000,
    });
  });

  test('AI lists todos when asked (UC-U09, Main Flow)', async ({
    page,
  }) => {
    // First create a todo manually
    const todoInput = page.getByPlaceholder('Add a todo...');
    await todoInput.fill('Test item');
    await todoInput.press('Enter');
    await expect(page.getByText('Test item')).toBeVisible();

    // Ask AI to list todos
    const chatInput = page.getByPlaceholder('Type a message...');
    await chatInput.fill("What's on my todo list?");
    await chatInput.press('Enter');

    // AI should mention the existing todo
    await expect(
      page.locator('.chat-message.assistant').last()
    ).toContainText(/test item/i, { timeout: 30000 });
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
    await expect(
      page.locator('.chat-message.assistant').last()
    ).toBeVisible({ timeout: 30000 });

    // Todo should now be marked as completed
    await expect(page.locator('.completed')).toBeVisible({ timeout: 10000 });
  });

  test('does not send empty messages (UC-U06, Alt 5a)', async ({
    page,
  }) => {
    const sendButton = page.getByRole('button', { name: /send/i });
    await expect(sendButton).toBeDisabled();
  });
});
```

- [ ] **3.7: Run all tests**

```bash
npm test && npm run test:e2e
```

Expected: PASS (E2E AI tests require OPENROUTER_API_KEY to be set and will make real API calls).

- [ ] **3.8: Commit Task 6**

```bash
git add -A
git commit -m "feat: AI chat with todo management tools (Slice 6)

- OpenRouter API client with tool_use support (UC-S08)
- 5 AI tools: list, create, update, delete, toggle (UC-S09)
- Chat route with max 5 tool iterations
- ChatPanel + ChatMessage components (UC-U06)
- useChat hook with 50-message history cap
- Mocked backend tests for all AI paths
- E2E tests for chat interaction

Use Cases: UC-U06, UC-U07, UC-U08, UC-U09, UC-S08, UC-S09"
```

---

## Task 7: Coverage Hardening + Polish

**Use Cases:** All (quality assurance)
**Goal:** Ensure 100% coverage; fix any gaps; final quality pass

### Step 1: Run coverage and identify gaps

- [ ] **1.1: Run coverage report**

```bash
npm run test:cov
```

Review the output. Common uncovered branches:
- Error paths in db.ts (constraint violations)
- Edge cases in validation.ts (all validators)
- SSE manager edge cases
- Chat route error paths

### Step 2: Fill coverage gaps

- [ ] **2.1: Add missing db.test.ts tests**

Add tests for:
- `createTodo` returns correct fields
- `getTodoById` returns undefined for non-existent
- `updateTodo` returns undefined for non-existent
- `deleteTodo` returns false for non-existent
- `toggleTodo` returns undefined for non-existent

- [ ] **2.2: Add any remaining validation.test.ts edge cases**

Review coverage report for validation.ts. The UUID and ChatMessages tests were added in Task 6. Add any remaining uncovered branches.

- [ ] **2.3: Run coverage again and verify 100%**

```bash
npm run test:cov
```

Expected: 100% lines, branches, functions, statements.

### Step 3: Final quality gates

- [ ] **3.1: Run all quality checks**

```bash
npm run typecheck && npm run lint && npm run format && npm run test:cov && npm run build && npm run test:e2e
```

Expected: All pass.

- [ ] **3.2: Commit Task 7**

```bash
git add -A
git commit -m "feat: coverage hardening + quality polish (Slice 7)

- Fill all coverage gaps to reach 100%
- Add missing validation tests (UUID, chat messages)
- Add missing DB layer edge case tests
- All quality gates pass: typecheck, lint, format, test, build, e2e

Use Cases: All — quality assurance"
```

- [ ] **3.3: Push to remote**

```bash
git push -u origin v4-usecase-driven-3
```
