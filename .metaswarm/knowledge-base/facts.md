# Knowledge Base

## Architecture Decisions

- **Hono over Express:** Chosen for lightweight, type-safe routing with native TypeScript support.
- **better-sqlite3 over ORMs:** Direct SQLite access for simplicity and performance. No async overhead.
- **SSE over WebSockets:** Server-Sent Events for unidirectional real-time updates. Simpler than WebSocket for this use case.
- **Vitest over Jest:** Native ESM support, Vite-compatible, faster execution.
- **React 19:** Latest React with concurrent features.

## Patterns

- Server routes are organized by domain in `src/server/routes/`.
- AI integration uses Claude's tool_use feature for structured actions.
- Shared types ensure type safety across client/server boundary.
- Path alias `@shared` avoids fragile relative imports.

## Known Constraints

- SQLite is single-writer. Suitable for development and small deployments.
- SSE connections are per-client. No horizontal scaling without shared event bus.
- E2E tests require the full stack running (server + client).
