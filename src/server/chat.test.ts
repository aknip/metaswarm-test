import { describe, it, expect, beforeEach, vi } from 'vitest'
import { executeTool, createChatRouter, getSessions } from './chat.js'
import { createDatabase, createTodoRepo, type TodoRepo } from './db.js'
import type Database from 'better-sqlite3'

vi.mock('./sse.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./sse.js')>()
  return {
    ...actual,
    broadcast: vi.fn(),
  }
})

describe('executeTool', () => {
  let db: Database.Database
  let repo: TodoRepo

  beforeEach(() => {
    db = createDatabase(':memory:')
    repo = createTodoRepo(db)
  })

  it('list_todos returns all todos', () => {
    repo.create('Task 1')
    const result = JSON.parse(executeTool(repo, 'list_todos', {}))
    expect(result).toHaveLength(1)
    expect(result[0].title).toBe('Task 1')
  })

  it('get_todo returns a todo', () => {
    const todo = repo.create('Task')
    const result = JSON.parse(executeTool(repo, 'get_todo', { id: todo.id }))
    expect(result.title).toBe('Task')
  })

  it('get_todo returns error for missing todo', () => {
    const result = JSON.parse(executeTool(repo, 'get_todo', { id: 'nope' }))
    expect(result.error).toBe('Not found')
  })

  it('create_todo creates and returns a todo', () => {
    const result = JSON.parse(executeTool(repo, 'create_todo', { title: 'New' }))
    expect(result.title).toBe('New')
    expect(repo.list()).toHaveLength(1)
  })

  it('update_todo updates title and completed', () => {
    const todo = repo.create('Old')
    const result = JSON.parse(
      executeTool(repo, 'update_todo', { id: todo.id, title: 'New', completed: true })
    )
    expect(result.title).toBe('New')
    expect(result.completed).toBe(1)
  })

  it('update_todo preserves existing fields when not provided', () => {
    const todo = repo.create('Keep')
    const result = JSON.parse(
      executeTool(repo, 'update_todo', { id: todo.id })
    )
    expect(result.title).toBe('Keep')
    expect(result.completed).toBe(0)
  })

  it('update_todo returns error for missing todo', () => {
    const result = JSON.parse(
      executeTool(repo, 'update_todo', { id: 'nope', title: 'X', completed: false })
    )
    expect(result.error).toBe('Not found')
  })

  it('delete_todo deletes and returns success', () => {
    const todo = repo.create('Del')
    const result = JSON.parse(executeTool(repo, 'delete_todo', { id: todo.id }))
    expect(result.deleted).toBe(true)
    expect(repo.list()).toHaveLength(0)
  })

  it('delete_todo returns error for missing todo', () => {
    const result = JSON.parse(executeTool(repo, 'delete_todo', { id: 'nope' }))
    expect(result.error).toBe('Not found')
  })

  it('unknown tool returns error', () => {
    const result = JSON.parse(executeTool(repo, 'unknown_tool', {}))
    expect(result.error).toBe('Unknown tool: unknown_tool')
  })
})

describe('Chat Router', () => {
  let db: Database.Database
  let repo: TodoRepo
  let mockClient: any

  beforeEach(() => {
    db = createDatabase(':memory:')
    repo = createTodoRepo(db)
    getSessions().clear()
  })

  function makeMockClient(responses: any[]) {
    let callIndex = 0
    return {
      messages: {
        create: vi.fn(async () => {
          return responses[callIndex++]
        }),
      },
    }
  }

  it('returns 400 if sessionId or message missing', async () => {
    mockClient = makeMockClient([])
    const router = createChatRouter({ client: mockClient as any, repo })

    const res = await router.request('/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: '', message: '' }),
    })
    expect(res.status).toBe(400)
  })

  it('returns text response for simple message', async () => {
    mockClient = makeMockClient([
      {
        stop_reason: 'end_turn',
        content: [{ type: 'text', text: 'Hello! How can I help?' }],
      },
    ])
    const router = createChatRouter({ client: mockClient as any, repo })

    const res = await router.request('/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: 'sess1', message: 'Hi' }),
    })
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.response).toBe('Hello! How can I help?')
  })

  it('handles tool_use loop', async () => {
    repo.create('Buy milk')

    mockClient = makeMockClient([
      {
        stop_reason: 'tool_use',
        content: [
          {
            type: 'tool_use',
            id: 'tool_1',
            name: 'list_todos',
            input: {},
          },
        ],
      },
      {
        stop_reason: 'end_turn',
        content: [{ type: 'text', text: 'You have 1 todo: Buy milk' }],
      },
    ])
    const router = createChatRouter({ client: mockClient as any, repo })

    const res = await router.request('/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: 'sess2', message: 'What are my todos?' }),
    })
    const data = await res.json()
    expect(data.response).toBe('You have 1 todo: Buy milk')
    expect(mockClient.messages.create).toHaveBeenCalledTimes(2)
  })

  it('handles multiple tool calls in one response', async () => {
    mockClient = makeMockClient([
      {
        stop_reason: 'tool_use',
        content: [
          { type: 'tool_use', id: 'tool_1', name: 'create_todo', input: { title: 'A' } },
          { type: 'tool_use', id: 'tool_2', name: 'create_todo', input: { title: 'B' } },
        ],
      },
      {
        stop_reason: 'end_turn',
        content: [{ type: 'text', text: 'Created 2 todos' }],
      },
    ])
    const router = createChatRouter({ client: mockClient as any, repo })

    const res = await router.request('/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: 'sess3', message: 'Create A and B' }),
    })
    const data = await res.json()
    expect(data.response).toBe('Created 2 todos')
    expect(repo.list()).toHaveLength(2)
  })

  it('preserves session history across calls', async () => {
    mockClient = makeMockClient([
      {
        stop_reason: 'end_turn',
        content: [{ type: 'text', text: 'First reply' }],
      },
      {
        stop_reason: 'end_turn',
        content: [{ type: 'text', text: 'Second reply' }],
      },
    ])
    const router = createChatRouter({ client: mockClient as any, repo })

    await router.request('/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: 'sess4', message: 'First' }),
    })

    await router.request('/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: 'sess4', message: 'Second' }),
    })

    const session = getSessions().get('sess4')
    expect(session).toHaveLength(4) // user, assistant, user, assistant
  })
})
