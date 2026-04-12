import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createTodoRouter } from './routes.js'
import { createDatabase, createTodoRepo, type TodoRepo } from './db.js'
import type Database from 'better-sqlite3'

vi.mock('./sse.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./sse.js')>()
  return {
    ...actual,
    broadcast: vi.fn(),
  }
})

import { broadcast } from './sse.js'

describe('Todo Routes', () => {
  let db: Database.Database
  let repo: TodoRepo
  let app: ReturnType<typeof createTodoRouter>

  beforeEach(() => {
    vi.clearAllMocks()
    db = createDatabase(':memory:')
    repo = createTodoRepo(db)
    app = createTodoRouter(repo)
  })

  describe('GET / (SUC-2)', () => {
    it('RT-1a: returns empty array when no todos', async () => {
      const res = await app.request('/')
      expect(res.status).toBe(200)
      expect(await res.json()).toEqual([])
    })

    it('RT-1b: returns all todos', async () => {
      repo.create('Todo 1')
      repo.create('Todo 2')
      const res = await app.request('/')
      const data = await res.json()
      expect(data).toHaveLength(2)
    })
  })

  describe('GET /:id (SUC-3)', () => {
    it('RT-2a: returns a todo by id', async () => {
      const todo = repo.create('Test')
      const res = await app.request(`/${todo.id}`)
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.title).toBe('Test')
    })

    it('RT-2b: returns 404 for non-existent id', async () => {
      const res = await app.request('/nonexistent')
      expect(res.status).toBe(404)
      const data = await res.json()
      expect(data.error).toBe('Todo not found')
    })
  })

  describe('POST / (SUC-1)', () => {
    it('RT-3: creates a todo and broadcasts', async () => {
      const res = await app.request('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New todo' }),
      })
      expect(res.status).toBe(201)
      const data = await res.json()
      expect(data.title).toBe('New todo')
      expect(data.completed).toBe(0)
      expect(broadcast).toHaveBeenCalledWith('created', expect.objectContaining({ title: 'New todo' }))
    })

    it('RT-4a: returns 400 for empty title', async () => {
      const res = await app.request('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: '' }),
      })
      expect(res.status).toBe(400)
    })

    it('RT-4b: returns 400 for missing title', async () => {
      const res = await app.request('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      expect(res.status).toBe(400)
    })
  })

  describe('PATCH /:id (SUC-4)', () => {
    it('RT-5: updates a todo and broadcasts', async () => {
      const todo = repo.create('Original')
      const res = await app.request(`/${todo.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Updated', completed: true }),
      })
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.title).toBe('Updated')
      expect(data.completed).toBe(1)
      expect(broadcast).toHaveBeenCalledWith('updated', expect.objectContaining({ title: 'Updated' }))
    })

    it('RT-6: returns 404 for non-existent todo', async () => {
      const res = await app.request('/nonexistent', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Updated', completed: false }),
      })
      expect(res.status).toBe(404)
    })

    it('RT-6b: returns 400 for invalid body', async () => {
      const todo = repo.create('Test')
      const res = await app.request(`/${todo.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: '', completed: true }),
      })
      expect(res.status).toBe(400)
    })
  })

  describe('DELETE /:id (SUC-5)', () => {
    it('RT-7: deletes a todo and broadcasts', async () => {
      const todo = repo.create('To delete')
      const res = await app.request(`/${todo.id}`, { method: 'DELETE' })
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.id).toBe(todo.id)
      expect(broadcast).toHaveBeenCalledWith('deleted', { id: todo.id })
    })

    it('RT-8: returns 404 for non-existent todo', async () => {
      const res = await app.request('/nonexistent', { method: 'DELETE' })
      expect(res.status).toBe(404)
    })
  })
})
