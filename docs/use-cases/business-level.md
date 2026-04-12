# Business-Level Use Cases

## Overview

These use cases represent the high-level business goals the system must fulfill.
Each business use case is realized by one or more user-level use cases.

---

# Use Case Name: Task Management, ID: BUC-01

## 1. Name, Brief Description
**Task Management** — The system provides comprehensive task (todo) management capabilities,
allowing users to create, organize, track, and complete tasks through a web interface.

## 2. Actors, Trigger
- **Primary Actor**: End User (any person using the application)
- **Trigger**: User needs to manage personal tasks/todos

## 3. Pre- and Postconditions (Success, Abort)
- **Preconditions**: Application is deployed and accessible via web browser
- **Success Postcondition**: User can reliably create, read, update, and delete tasks with persistent storage
- **Abort Postcondition**: System remains in consistent state; no data corruption occurs

## 4. Main Flow (Standard Scenario)
1. User accesses the application in a web browser
2. System displays the current list of todos
3. User performs CRUD operations on todos (create, view, update, delete, toggle completion)
4. System persists all changes to the database
5. System confirms each operation visually

## 5. Alternative / Exception Flows
- **No todos exist**: System displays empty state with prompt to create first todo
- **Database unavailable**: System displays error message; no data loss occurs

## 6. Special Requirements / Remarks
- **Realizes**: UC-01, UC-02, UC-03, UC-04, UC-05
- Storage must be persistent across server restarts (SQLite)
- Response time for CRUD operations < 200ms

---

# Use Case Name: AI-Assisted Productivity, ID: BUC-02

## 1. Name, Brief Description
**AI-Assisted Productivity** — The system provides an AI chat assistant (powered by Claude)
that can understand, discuss, and directly manipulate the user's todo list, enabling
natural-language task management.

## 2. Actors, Trigger
- **Primary Actor**: End User
- **Secondary Actor**: AI Assistant (Claude)
- **Trigger**: User wants AI help with task management or asks questions about their todos

## 3. Pre- and Postconditions (Success, Abort)
- **Preconditions**: Application is running; Claude API key is configured
- **Success Postcondition**: AI can read and modify todos; changes are persisted and broadcast
- **Abort Postcondition**: If AI fails, user can still manage todos manually; no data corruption

## 4. Main Flow (Standard Scenario)
1. User opens the AI chat panel
2. User sends a natural-language message (e.g., "Add a todo to buy groceries")
3. AI processes the message and determines required actions
4. AI executes tool calls to read/modify todos
5. System persists changes and broadcasts updates
6. AI responds with confirmation in natural language

## 5. Alternative / Exception Flows
- **API key missing/invalid**: System displays configuration error
- **AI rate limited**: System queues or retries; informs user of delay
- **Ambiguous request**: AI asks clarifying question before acting

## 6. Special Requirements / Remarks
- **Realizes**: UC-06, UC-07, UC-08
- **Depends on**: BUC-01 (todo CRUD must work for AI to manipulate todos)
- AI must use Claude SDK tool_use for structured interactions
- AI modifications trigger the same SSE broadcasts as manual edits

---

# Use Case Name: Real-Time Collaboration, ID: BUC-03

## 1. Name, Brief Description
**Real-Time Collaboration** — The system synchronizes todo list state across all connected
browser tabs/sessions in real-time via Server-Sent Events, ensuring every view is always current.

## 2. Actors, Trigger
- **Primary Actor**: End User (multiple tabs/sessions)
- **Trigger**: Any modification to the todo list (manual or AI-initiated)

## 3. Pre- and Postconditions (Success, Abort)
- **Preconditions**: At least two browser tabs/sessions connected
- **Success Postcondition**: All connected clients display the same todo state within 1 second
- **Abort Postcondition**: If SSE disconnects, client reconnects automatically; no data loss

## 4. Main Flow (Standard Scenario)
1. User opens the application in multiple browser tabs
2. Each tab establishes an SSE connection to the server
3. User modifies a todo in one tab
4. Server broadcasts the change event to all connected SSE clients
5. All other tabs update their UI to reflect the change

## 5. Alternative / Exception Flows
- **SSE connection drops**: Client automatically reconnects with retry logic
- **Server restart**: All clients reconnect; full state is re-fetched

## 6. Special Requirements / Remarks
- **Realizes**: UC-09
- **Depends on**: BUC-01 (changes to sync originate from CRUD operations)
- Uses Server-Sent Events (not WebSocket) for unidirectional server-to-client streaming
- Must handle connection cleanup to prevent memory leaks
