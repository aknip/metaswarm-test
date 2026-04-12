# CLAUDE.md — metaswarm-test

## Project Overview

Full-stack TypeScript application: Hono backend, React + Vite frontend, SQLite database, SSE real-time updates, Claude SDK integration.

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
  server/        # Hono backend (routes, middleware, services)
  client/        # React frontend (components, hooks, pages)
  shared/        # Shared types and utilities
```

## Commands

```bash
npm run dev          # Start dev server (Vite + Hono)
npm run build        # Production build
npm run test         # Run tests with Vitest
npm run test:cov     # Run tests with coverage
npm run lint         # ESLint check
npm run format       # Prettier format
npm run typecheck    # TypeScript type checking
```

## Development Guidelines

- Write TypeScript strict mode — no `any` types without justification
- All new code must have tests (80% coverage threshold)
- Use ESM imports throughout (`import`/`export`, not `require`)
- React components are function components with hooks
- SQLite queries use parameterized statements (never string interpolation)
- SSE endpoints return `text/event-stream` content type

## Testing

- Runner: Vitest
- Coverage: v8 provider, 80% threshold
- Run `npm test` before committing
- Integration tests can use in-memory SQLite

## Metaswarm

This project uses metaswarm for quality-gated development:
- `/metaswarm:start` — begin tracked work on a task
- `/metaswarm:orchestrated-execution` — 4-phase execution loop
- `/metaswarm:pr-shepherd` — monitor PRs through to merge
- Config: `.metaswarm/project-profile.json`
- Knowledge base: `.metaswarm/knowledge-base/`
