# metaswarm-test

Real-time todo list application with AI chat integration.

## Tech Stack

- **Backend:** Node.js + Hono, SQLite (better-sqlite3), SSE for real-time
- **Frontend:** React 19 + Vite 6
- **Language:** TypeScript (strict mode, ESM)
- **AI:** OpenRouter API (OpenAI-compatible)

## Project Structure

```
src/
  server/          # Hono API server
    __tests__/     # Vitest unit tests
    ai/            # AI chat service & tools
    routes/        # API endpoints (chat, todos, events/SSE)
    db.ts          # SQLite database layer
    sse.ts         # SSE utilities
    validation.ts  # Input validation
  client/          # React SPA
    components/    # React components
    hooks/         # Custom hooks (useChat, useSSE, useTodos)
    api/           # HTTP client
  shared/          # Shared types between client/server
    types.ts
e2e/               # Playwright E2E tests
```

## Commands

```bash
npm run dev           # Start server (tsx watch)
npm run dev:client    # Start Vite dev server
npm run build         # Production build (vite build + tsc)
npm test              # Run unit tests (vitest)
npm run test:watch    # Unit tests in watch mode
npm run test:cov      # Unit tests with coverage
npm run test:e2e      # Playwright E2E tests
npm run lint          # ESLint
npm run format        # Prettier check
npm run typecheck     # TypeScript type checking
```

## Development Guidelines

### Testing

- **Unit tests:** Vitest with v8 coverage. Tests live in `src/server/__tests__/`.
- **E2E tests:** Playwright with Chromium. Tests live in `e2e/`.
- **Coverage thresholds:** 100% lines, branches, functions, statements.
- Write tests for all new server-side code. Use TDD when possible.

### Code Style

- ESLint + Prettier enforced. No explicit `any` allowed.
- Single quotes, semicolons, trailing commas (es5), 80 char width.
- Unused variables must be prefixed with `_`.
- ESM modules (`import`/`export`), not CommonJS.

### TypeScript

- Strict mode enabled with `noUncheckedIndexedAccess`.
- Shared types go in `src/shared/types.ts`.
- Path alias: `@shared` maps to `src/shared`.

### Architecture

- Backend uses Hono framework on Node.js with `@hono/node-server`.
- SQLite via `better-sqlite3` for persistence.
- Real-time updates via Server-Sent Events (SSE).
- Frontend proxies `/api` to backend on port 3000.

### Git & CI

- GitHub Actions CI runs on push/PR to main.
- CI pipeline: typecheck -> lint -> format -> test (with coverage) -> build -> e2e.
- Write meaningful commit messages. Keep PRs focused.

## Quality Gates

Before submitting a PR, ensure:
1. `npm run typecheck` passes
2. `npm run lint` passes
3. `npm run format` passes
4. `npm test` passes with coverage thresholds met
5. `npm run build` succeeds
6. `npm run test:e2e` passes (when UI changes are involved)
