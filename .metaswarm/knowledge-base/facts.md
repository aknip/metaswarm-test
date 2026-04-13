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

## Gotchas

- **Vite proxy intercepts source imports**: A `/api` proxy in vite.config.ts also catches client-side module imports like `/api/client.ts`. Add a `bypass` function that returns the URL for requests with file extensions (`.ts`, `.tsx`, `.js`) to let Vite serve them. Applies to: `vite.config.ts`.
- **SQLite WAL mode untestable with :memory:**: `better-sqlite3` with `:memory:` databases silently ignores WAL mode and reports `journal_mode = memory`. Use a temporary file-based database to assert WAL mode is enabled. Applies to: `src/server/__tests__/*.test.ts`.
- **Hono route ordering for parameterized paths**: Hono matches routes in registration order. Register specific paths like `/api/todos/:id/toggle` BEFORE generic `/api/todos/:id`, otherwise `toggle` is captured as an `:id` parameter. Applies to: `src/server/routes/*.ts`.
- **Playwright strict mode with regex heading locators**: `getByRole('heading', { name: /partial/i })` matches ALL headings containing the regex. Use `{ name: 'Exact Text', exact: true }` to avoid strict mode violations. Applies to: `e2e/**/*.spec.ts`.
- **Playwright workers must be 1 with shared SSE/DB**: Set `workers: 1` in playwright.config.ts when all E2E tests share a single database and SSE broadcast channel. Parallel workers cause non-deterministic SSE event delivery. Applies to: `playwright.config.ts`.

## Patterns

- **SSE E2E tests need database cleanup**: When tests share a single server with SSE broadcasting, todos from previous tests persist and SSE events leak across tests. Add `beforeEach` cleanup that fetches and deletes all items via API before each test. Applies to: `e2e/**/*.spec.ts`.
- **AI E2E tests: assert response existence, not content**: LLM responses are non-deterministic. E2E tests for AI features should verify the AI responded (e.g. `.chat-message.assistant` visible) but NOT assert specific text content or tool execution outcomes. Deterministic tool behavior belongs in mocked backend unit tests. Applies to: `e2e/ai-chat.spec.ts`.
- **TDD across task boundaries: implement and test in same task**: When a function is needed by code in a later implementation slice, implement AND test it in the same task that first uses it. Deferring tests to a "coverage hardening" task violates TDD and may break 100% coverage CI gates at intermediate commits. Applies to: implementation plans.

## API Behaviors

- **OpenRouter tool_use format**: OpenRouter uses OpenAI-compatible function calling: `tool_calls: [{ id, type: 'function', function: { name, arguments } }]`. Tool results are sent back as `{ role: 'tool', content: resultString, tool_call_id: id }`. Always cap tool loop iterations (e.g. max 5) to prevent infinite loops. Applies to: `src/server/ai/**/*.ts`.
- **Hono streamSSE for SSE endpoints**: Use `streamSSE` from `hono/streaming` with `writeSSE({ event, data })` for proper SSE formatting. Don't write raw SSE strings via `stream.write()` — it bypasses Hono's SSE frame formatting. Wrap SSEManager's broadcast callback to call `writeSSE`. Applies to: `src/server/routes/events.ts`.
