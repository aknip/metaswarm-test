# Knowledge Base

## Architecture Decisions

- **Backend**: Hono on Node.js — lightweight, Web Standards-based HTTP framework
- **Frontend**: React 19 + Vite — fast HMR, modern build tooling
- **Database**: SQLite via better-sqlite3 — embedded, zero-config, single-file DB
- **Real-time**: Server-Sent Events (SSE) — unidirectional server-to-client streaming
- **AI Integration**: Anthropic Claude SDK — for AI-powered features
- **Testing**: Vitest — native Vite integration, fast execution, v8 coverage

## Conventions

- TypeScript strict mode throughout
- ESM modules (type: "module" in package.json)
- Vitest for all unit and integration tests
- 80% coverage threshold enforced

## Patterns

- Hono routes organized by feature domain
- React components use function components + hooks
- SQLite accessed via synchronous better-sqlite3 API
- SSE endpoints stream newline-delimited JSON events
- Claude SDK calls wrapped in service layer with error handling
