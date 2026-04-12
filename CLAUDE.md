# CLAUDE.md — metaswarm-test

## Project Overview

Real-time todo list with AI chat. Use-case driven development with structured traceability from business goals to test cases.

## Tech Stack

| Layer      | Technology             |
|------------|------------------------|
| Backend    | Node.js + Hono         |
| Frontend   | React + Vite           |
| Database   | SQLite (better-sqlite3)|
| Real-time  | Server-Sent Events     |
| AI         | Anthropic Claude SDK   |
| Unit Tests | Vitest + v8 (100%)     |
| E2E Tests  | Playwright             |
| Linting    | ESLint + Prettier      |

## Project Structure

```
src/
  server/
    db.ts          # SQLite database layer (factory + TodoRepo)
    routes.ts      # REST CRUD routes with Zod validation
    sse.ts         # SSE broadcast system
    chat.ts        # AI chat with Claude tool_use loop
    index.ts       # Server entry, CORS, route mounting
    *.test.ts      # Unit tests (100% coverage, use-case traced)
  client/
    App.tsx        # React app (TodoList + ChatPanel) with data-testid
    main.tsx       # Entry point
    index.html     # HTML shell
  shared/
    types.ts       # Shared TypeScript types
e2e/
  todo-app.spec.ts # Playwright E2E tests (9 scenarios)
docs/
  usecases.md      # Structured use cases (BUC/UC/SUC levels)
```

## Commands

```bash
npm run dev          # Start dev server (Vite + Hono via concurrently)
npm run build        # Production build
npm run test         # Run unit tests with Vitest
npm run test:cov     # Run unit tests with 100% coverage thresholds
npm run test:e2e     # Run Playwright E2E tests
npm run lint         # ESLint check
npm run format       # Prettier format
npm run typecheck    # TypeScript type checking (tsc --noEmit)
```

## API Routes

- `GET /api/todos` — list all todos
- `GET /api/todos/:id` — get single todo
- `POST /api/todos` — create todo `{ title: string }`
- `PATCH /api/todos/:id` — update todo `{ title: string, completed: boolean }`
- `DELETE /api/todos/:id` — delete todo
- `GET /api/sse/events` — SSE stream (events: created, updated, deleted, ping)
- `POST /api/chat/message` — AI chat `{ sessionId: string, message: string }`

## Use-Case Driven Development

All code traces to use cases in `docs/usecases.md`:
- **BUC-1..3**: Business-level goals (task management, real-time collab, AI assistance)
- **UC-1..9**: User-level interactions (create, view, toggle, edit, delete, sync, chat)
- **SUC-1..9**: System-level contracts (API specs, DB schema, SSE protocol, tool execution)
- **Test IDs**: DB-1..6, RT-1..8, SSE-1..3, CH-1..5, E2E-1..9

## Metaswarm

Config: `.metaswarm/project-profile.json`
Knowledge base: `.metaswarm/knowledge-base/`
