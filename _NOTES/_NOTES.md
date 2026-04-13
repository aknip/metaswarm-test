# Metaswarm - Notes

**Plugin dependencies configured in `.claude/settings.json`**

## About Metaswarm

https://rywalker.com/research/metaswarm
https://rywalker.com/research/autonomous-agentic-engineering-tools?__readwiseLocation=

Metaswarm is Dave Sifry's multi-agent orchestration framework for Claude Code, coordinating 18 specialized agents through an 11-phase pipeline from GitHub issue to merged PR. Its distinguishing features are cross-model adversarial review (Claude writes, Codex or Gemini reviews) and blocking quality gates that prevent FAIL→COMMIT transitions. Built on BEADS for git-native issue tracking and Superpowers for foundational workflows.
Metaswarm provides a full orchestration layer that breaks work into phases, assigns each to a specialist agent, iterates through multiple reviews, and coordinates handoffs through PR creation and shepherding.

For complex tasks with written specs, every work unit runs through a 4-phase loop:
Implement, Validate, Adversarial Review, Commit. On failure: fix, re-validate, spawn a fresh reviewer (never the same one), retry up to 3 times before escalating.
Self-Improving Knowledge Base: Metaswarm maintains a JSONL knowledge base in your repo — patterns, gotchas, architectural decisions, anti-patterns. After every merged PR, the self-reflect workflow analyzes what happened and writes new entries.

## Prerequisites (see doc on Github)

- One of: Claude Code, Gemini CLI, or Codex CLI
- BEADS CLI (bd) — Git-native issue tracking (recommended)
- GitHub CLI (gh) — For PR automation (recommended)
- Superpowers Plugin (optional, Claude Code only) 



================================================================================

## v1. Test in Claude:

Enter
/metaswarm:setup 
Press TAB and copy paste the following task after the command:
```
Tech stack: Node.js + Hono, React + Vite, SQLite, SSE, Claude SDK.
Do not ask additional questions, decide for best recommended options.
```

Enter:
/metaswarm:start-task 
Press TAB and copy paste the following task after the command:
```
I want you to build a real-time todo list with AI chat.

Tech stack: Node.js + Hono, React + Vite, SQLite, SSE, Claude SDK.

Definition of Done:
1. CRUD operations for todo items via REST API
2. Persistent storage in SQLite
3. Real-time sync across browser tabs via SSE
4. AI chat that can read and modify todos 
5. 100% test coverage on backend
6. CI pipeline for tests and lint

Use the full metaswarm orchestration workflow:
research, plan, design review gate, decompose into work units,
and execute each through the 4-phase loop. No human checkpoints.
When all work units pass, commit and push.
```

start: 16:04 - 16:15


================================================================================


## v2. Test in Claude:

Enter
/metaswarm:setup 
Press TAB and copy paste the following task after the command:
```
Tech stack: Node.js + Hono, React + Vite, SQLite, SSE, Claude SDK.
Do not ask additional questions, decide for best recommended options.
```

Enter:
/metaswarm:start-task 
Press TAB and copy paste the following task after the command:
```
I want you to build a real-time todo list with AI chat.

Tech stack: Node.js + Hono, React + Vite, SQLite, SSE, Claude SDK.

Definition of Done:
1. CRUD operations for todo items via REST API
2. Persistent storage in SQLite
3. Real-time sync across browser tabs via SSE
4. AI chat that can read and modify todos 
5. 100% test coverage on backend
6. 100% test coverage on frontend by playwright end-to-end-tests
7. CI pipeline for tests and lint

For research, planning and testing:
- Use a usecase-driven-approach
- define detailed usecases on business-level, user-level, system-level
- use these usecases to define testcases for backend and frontend
- save all usecases in a structured, humand readable format

Use the full metaswarm orchestration workflow:
research, plan, design review gate, decompose into work units,
and execute each through the 4-phase loop. No human checkpoints.
When all work units pass, commit and push.
```
16:25 - 16:37


================================================================================

## v3. Test in Claude:

Enter
/metaswarm:setup 
Press TAB and copy paste the following task after the command:
```
Tech stack: Node.js + Hono, React + Vite, SQLite, SSE, Claude SDK.
Do not ask additional questions, decide for best recommended options.
```

Enter:
/metaswarm:start-task 
Press TAB and copy paste the following task after the command:
```
I want you to build a real-time todo list with AI chat.

Tech stack: Node.js + Hono, React + Vite, SQLite, SSE, Claude SDK.

Definition of Done:
1. CRUD operations for todo items via REST API
2. Persistent storage in SQLite
3. Real-time sync across browser tabs via SSE
4. AI chat that can read and modify todos 
5. 100% test coverage on backend, based on usecses
6. 100% test coverage on frontend by playwright end-to-end-tests, based on usecses
7. CI pipeline for tests and lint

For research, planning and testing: Stick to a usecase-driven-approach (RUP)
- define detailed usecases on business-level, user-level, system-level.
- the three levels are interdependent and relate to each other (eg. user-level usecases are derived from business-level use-cases, usecase A is a precondition of usecase B etc.)
- use these usecases to define testcases for backend and frontend. All testcases must refer to a usecase and this must be documented in the testcaes
- save all usecases in a structured, human readable format: 
  Template:
```
# Use Case Name: [Title], ID: [UC-ID]
## 1. Name, Brief Description
## 2. Actors, Trigger
## 3. Pre- and Postconditions (Success, Abort)
## 4. Main Flow (Standard Scenario)
1.  [Step 1...]
2.  [Step 2...]
3.  [Step 3...]
## 5. Alternative / Exception Flows
## 6. Special Requirements / Remarks
```

Use the full metaswarm orchestration workflow:
research, plan, design review gate, decompose into work units,
and execute each through the 4-phase loop. No human checkpoints.
When all work units pass, commit and push.
```




================================================================================

## v4. Test in Claude:


/metaswarm:setup Tech stack: Node.js + Hono, React + Vite, SQLite, SSE.
Do not ask additional questions, decide for best recommended options.

Enter:
/metaswarm:start-task  I want you to build a real-time todo list with AI chat.

Tech stack: Node.js + Hono, React + Vite, SQLite, SSE

Definition of Done:
1. CRUD operations for todo items via REST API
2. Persistent storage in SQLite
3. Real-time sync across browser tabs via SSE
4. AI chat that can read and modify todos (via OpenRouter API, key is available in Environment Variable)
5. 100% test coverage on backend, based on usecses
6. 100% test coverage on frontend by playwright end-to-end-tests, based on usecses
7. CI pipeline for tests and lint

For research, planning and testing: Stick to a usecase-driven-approach (RUP)
- define detailed usecases on business-level, user-level, system-level.
- the three levels are interdependent and relate to each other (eg. user-level usecases are derived from business-level use-cases, usecase A is a precondition of usecase B etc.)
- use these usecases to define testcases for backend and frontend. All testcases must refer to a usecase and this must be documented in the testcaes
- save all usecases in a structured, human readable format: 
  Template:
```
# Use Case Name: [Title], ID: [UC-ID]
## 1. Name, Brief Description
## 2. Actors, Trigger
## 3. Pre- and Postconditions (Success, Abort)
## 4. Main Flow (Standard Scenario, described step by step)
## 5. Alternative / Exception Flows
## 6. Special Requirements / Remarks
```

Design the implementation plan as a sequence of strictly vertical, end-to-end slices. Ensure that every single iteration results in a fully runnable, user-testable UI that progressively expands in functionality. Never implement backend-only phases; frontend and backend must evolve concurrently. For each slice, apply strict TDD: first, write failing frontend and backend tests that define the expected user behavior. Next, implement the minimal full-stack logic (from UI down to the database) required to pass the tests. Verify that the increment is fully functional and testable via the UI before proceeding to the next slice.

Use the full metaswarm orchestration workflow:
research, plan, design review gate, decompose into work units,
and execute each through the 4-phase loop. No human checkpoints.
When all work units pass, commit and push.
```

21:10 - 22:15
(20 min for specs and plans, incl. reviews)

================================================================================


# SCRATCHPAD

Use the full metaswarm orchestration workflow:
research, plan, design review gate, decompose into work units,
and execute each through the 4-phase loop. Set human checkpoints
after the database schema and after the AI integration.
When all work units pass, create a PR.















