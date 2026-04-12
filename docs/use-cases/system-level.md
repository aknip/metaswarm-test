# System-Level Use Cases

## Overview

These use cases describe the technical/system-level interactions that realize the user-level use cases.
They define how internal components interact to fulfill user requirements.

---

# Use Case Name: Initialize Database Schema, ID: SUC-01

## 1. Name, Brief Description
**Initialize Database Schema** — On server startup, the system creates the SQLite database
and ensures the todos table exists with the correct schema.

## 2. Actors, Trigger
- **Primary Actor**: Server Process
- **Trigger**: Server application starts

## 3. Pre- and Postconditions (Success, Abort)
- **Preconditions**: SQLite database file path is accessible
- **Success Postcondition**: `todos` table exists with columns: id, title, completed, createdAt, updatedAt
- **Abort Postcondition**: Server fails to start; error logged

## 4. Main Flow (Standard Scenario)
1. Server process starts
2. Database module opens/creates SQLite database file
3. Database module runs CREATE TABLE IF NOT EXISTS for todos table
4. Schema: id (TEXT PRIMARY KEY), title (TEXT NOT NULL), completed (INTEGER DEFAULT 0), createdAt (TEXT), updatedAt (TEXT)
5. Database connection is ready for queries

## 5. Alternative / Exception Flows
- **5a. Database file locked**: Retry with backoff; fail after 3 attempts
- **5b. Disk full**: Log error; server exits with non-zero code

## 6. Special Requirements / Remarks
- **Realizes**: All UC-* that involve database operations
- **Precondition for**: SUC-02, SUC-06
- Uses better-sqlite3 synchronous API
- Uses UUID v4 for primary keys
- Timestamps stored as ISO 8601 strings

---

# Use Case Name: Handle REST API Requests, ID: SUC-02

## 1. Name, Brief Description
**Handle REST API Requests** — The server exposes RESTful endpoints for todo CRUD operations
using the Hono framework, processing requests and returning JSON responses.

## 2. Actors, Trigger
- **Primary Actor**: HTTP Client (browser frontend)
- **Trigger**: HTTP request received on /api/todos endpoints

## 3. Pre- and Postconditions (Success, Abort)
- **Preconditions**: Server running; database initialized (SUC-01)
- **Success Postcondition**: Request processed; correct HTTP response returned; database updated if write operation
- **Abort Postcondition**: Appropriate HTTP error code returned; database unchanged for failed writes

## 4. Main Flow (Standard Scenario)
1. Client sends HTTP request to endpoint
2. Hono router matches the route
3. Request handler validates input (SUC-07)
4. Handler executes database query/mutation
5. If write operation: broadcast SSE event (SUC-04)
6. Handler returns JSON response with appropriate status code

### Endpoints:
- **GET /api/todos** — List all todos → 200 + Todo[]
- **POST /api/todos** — Create todo → 201 + Todo
- **PATCH /api/todos/:id** — Update todo → 200 + Todo
- **DELETE /api/todos/:id** — Delete todo → 204

## 5. Alternative / Exception Flows
- **5a. Invalid JSON body**: 400 Bad Request
- **5b. Todo not found (PATCH/DELETE)**: 404 Not Found
- **5c. Validation error**: 400 with error details
- **5d. Internal error**: 500 Internal Server Error

## 6. Special Requirements / Remarks
- **Realizes**: UC-01, UC-02, UC-03, UC-04, UC-05
- **Depends on**: SUC-01 (database must be initialized)
- All responses are JSON (Content-Type: application/json)
- Parameterized SQL queries (no string interpolation)

---

# Use Case Name: Manage SSE Connections, ID: SUC-03

## 1. Name, Brief Description
**Manage SSE Connections** — The server manages Server-Sent Events connections,
maintaining a set of active client connections for broadcasting events.

## 2. Actors, Trigger
- **Primary Actor**: HTTP Client (browser EventSource)
- **Trigger**: Client connects to GET /api/todos/events

## 3. Pre- and Postconditions (Success, Abort)
- **Preconditions**: Server running
- **Success Postcondition**: Client added to active connections set; receives events
- **Abort Postcondition**: Connection cleaned up; client removed from set

## 4. Main Flow (Standard Scenario)
1. Client sends GET /api/todos/events
2. Server sets response headers: Content-Type: text/event-stream, Cache-Control: no-cache, Connection: keep-alive
3. Server adds the response stream to the active connections set
4. Server sends initial "connected" event
5. Connection remains open for streaming events
6. When client disconnects, server removes the stream from active connections

## 5. Alternative / Exception Flows
- **5a. Client aborts connection**: Server detects close, removes from set
- **5b. Server shutdown**: All connections closed gracefully

## 6. Special Requirements / Remarks
- **Realizes**: UC-09
- **Precondition for**: SUC-04
- Must handle connection cleanup to prevent memory leaks
- Uses Hono's streaming response API

---

# Use Case Name: Broadcast SSE Events, ID: SUC-04

## 1. Name, Brief Description
**Broadcast SSE Events** — When a todo is created, updated, or deleted, the server
broadcasts an SSE event to all connected clients.

## 2. Actors, Trigger
- **Primary Actor**: Server (internal)
- **Trigger**: Todo mutation occurs (via REST API or AI tool call)

## 3. Pre- and Postconditions (Success, Abort)
- **Preconditions**: At least one SSE connection exists (SUC-03)
- **Success Postcondition**: All connected clients receive the event
- **Abort Postcondition**: Failed sends are logged; dead connections cleaned up

## 4. Main Flow (Standard Scenario)
1. Todo mutation completes successfully
2. Server constructs SSE event: { event: "todo:<action>", data: JSON.stringify(todo) }
3. Server iterates over all active connections
4. Server writes the event to each connection stream
5. Clients receive and process the event

### Event Types:
- **todo:created** — data: full todo object
- **todo:updated** — data: full updated todo object
- **todo:deleted** — data: { id: "<deleted-todo-id>" }

## 5. Alternative / Exception Flows
- **5a. No active connections**: Events are not queued (fire-and-forget)
- **5b. Write to closed connection fails**: Remove connection from set; continue broadcasting to others

## 6. Special Requirements / Remarks
- **Realizes**: UC-01 (create), UC-03 (update), UC-04 (toggle), UC-05 (delete), UC-08 (AI modify)
- **Depends on**: SUC-03 (connections must exist)
- Events follow SSE format: "event: <type>\ndata: <json>\n\n"
- Broadcasting must not block the original request

---

# Use Case Name: Process Claude SDK Calls, ID: SUC-05

## 1. Name, Brief Description
**Process Claude SDK Calls** — The server uses the Anthropic Claude SDK to send
messages to the Claude API, including tool definitions for todo operations.

## 2. Actors, Trigger
- **Primary Actor**: Server (chat endpoint)
- **Secondary Actor**: Claude API (external)
- **Trigger**: POST /api/chat request received

## 3. Pre- and Postconditions (Success, Abort)
- **Preconditions**: ANTHROPIC_API_KEY environment variable set
- **Success Postcondition**: Claude response received; any tool calls identified
- **Abort Postcondition**: Error returned to client; no side effects

## 4. Main Flow (Standard Scenario)
1. Chat endpoint receives user message and conversation history
2. Server constructs Claude API request:
   - System prompt describing the AI assistant role
   - Conversation history (user + assistant messages)
   - Tool definitions: list_todos, create_todo, update_todo, delete_todo
3. Server calls `anthropic.messages.create()` with the request
4. Claude returns a response (text and/or tool_use blocks)
5. If tool_use blocks present: execute tools (SUC-06), then continue conversation
6. Final text response returned to the chat endpoint

## 5. Alternative / Exception Flows
- **5a. API key invalid**: 401 from Claude; server returns 500 to client
- **5b. Rate limited**: 429 from Claude; server returns 429 to client
- **5c. Tool call loop**: Max 5 tool call rounds to prevent infinite loops

## 6. Special Requirements / Remarks
- **Realizes**: UC-06, UC-07, UC-08
- **Depends on**: ANTHROPIC_API_KEY environment variable
- Uses @anthropic-ai/sdk npm package
- Tool definitions follow Claude tool_use schema
- Model: claude-sonnet-4-20250514 (configurable)

---

# Use Case Name: Execute AI Tool Calls, ID: SUC-06

## 1. Name, Brief Description
**Execute AI Tool Calls** — When Claude returns tool_use blocks, the server executes
the requested tool operations against the todo database.

## 2. Actors, Trigger
- **Primary Actor**: Server (tool executor)
- **Trigger**: Claude response contains tool_use blocks

## 3. Pre- and Postconditions (Success, Abort)
- **Preconditions**: SUC-05 has received tool_use from Claude; database ready (SUC-01)
- **Success Postcondition**: Tool operations executed; results returned to Claude for next turn
- **Abort Postcondition**: Error result returned to Claude; database unchanged

## 4. Main Flow (Standard Scenario)
1. Server receives tool_use block from Claude response
2. Server identifies the tool name and extracts input parameters
3. Server executes the corresponding operation:
   - `list_todos`: Query all todos from SQLite
   - `create_todo`: Insert new todo (same logic as POST /api/todos)
   - `update_todo`: Update todo fields (same logic as PATCH /api/todos/:id)
   - `delete_todo`: Delete todo (same logic as DELETE /api/todos/:id)
4. For write operations: broadcast SSE event (SUC-04)
5. Server constructs tool_result and feeds back to Claude

## 5. Alternative / Exception Flows
- **5a. Unknown tool name**: Return error result to Claude
- **5b. Validation failure**: Return validation error to Claude
- **5c. Todo not found**: Return "not found" error to Claude

## 6. Special Requirements / Remarks
- **Realizes**: UC-07, UC-08
- **Depends on**: SUC-01 (database), SUC-05 (Claude call)
- Tool execution reuses the same database functions as REST endpoints
- Write operations trigger SSE broadcasts (same as manual edits)

---

# Use Case Name: Validate Input Data, ID: SUC-07

## 1. Name, Brief Description
**Validate Input Data** — The server validates all incoming data from REST API requests
and AI tool calls before processing, ensuring data integrity.

## 2. Actors, Trigger
- **Primary Actor**: Server (validation layer)
- **Trigger**: Any data-mutating operation (create, update)

## 3. Pre- and Postconditions (Success, Abort)
- **Preconditions**: Raw input data received
- **Success Postcondition**: Data is valid and safe to process
- **Abort Postcondition**: Validation error returned; no database operation performed

## 4. Main Flow (Standard Scenario)
1. Server receives input data (from request body or tool call)
2. Server validates required fields are present
3. Server validates field types and constraints:
   - title: non-empty string, max 500 characters, trimmed
   - completed: boolean
   - id: valid UUID format (for update/delete)
4. If all validations pass: continue to database operation
5. If any validation fails: return 400 with error details

## 5. Alternative / Exception Flows
- **5a. Missing required field**: Return specific "field required" error
- **5b. Type mismatch**: Return specific "invalid type" error
- **5c. Constraint violation**: Return specific constraint error

## 6. Special Requirements / Remarks
- **Realizes**: UC-01 (create validation), UC-03 (update validation)
- Validation logic is shared between REST endpoints and AI tool calls
- No external validation library needed — simple manual validation
- Sanitize strings to prevent injection attacks
