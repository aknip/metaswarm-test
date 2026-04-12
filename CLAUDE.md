# CLAUDE.md — metaswarm-test

## Project Overview

Real-time todo list with AI chat. Full-stack TypeScript application: Hono backend, React + Vite frontend, SQLite database, SSE real-time sync, Claude SDK tool_use integration.

## Tech Stack

| Layer      | Technology             |
|------------|------------------------|
| Backend    | Node.js + Hono         |
| Frontend   | React + Vite           |
| Database   | SQLite (better-sqlite3)|
| Real-time  | Server-Sent Events     |
| AI         | Anthropic Claude SDK   |
| Testing    | Vitest + v8 coverage   |
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
    *.test.ts      # Tests (100% coverage enforced)
  client/
    App.tsx        # React app (TodoList + ChatPanel)
    main.tsx       # Entry point
    index.html     # HTML shell
  shared/
    types.ts       # Shared TypeScript types
```

## Commands

```bash
npm run dev          # Start dev server (Vite + Hono via concurrently)
npm run build        # Production build
npm run test         # Run tests with Vitest
npm run test:cov     # Run tests with 100% coverage thresholds
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

## Development Guidelines

- TypeScript strict mode — no `any` without justification
- 100% backend test coverage enforced via vitest thresholds
- ESM imports throughout
- SQLite queries use parameterized prepared statements
- In-memory SQLite (`:memory:`) for test isolation
- Claude SDK mock in tests — no real API calls

## Metaswarm

This project uses metaswarm for quality-gated development:
- Config: `.metaswarm/project-profile.json`
- Knowledge base: `.metaswarm/knowledge-base/`
