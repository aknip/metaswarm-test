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

  describe('GET /', () => {
    it('returns empty array when no todos', async () => {
      const res = await app.request('/')
      expect(res.status).toBe(200)
      expect(await res.json()).toEqual([])
    })

    it('returns all todos', async () => {
      repo.create('Todo 1')
      repo.create('Todo 2')
      const res = await app.request('/')
      const data = await res.json()
      expect(data).toHaveLength(2)
    })
  })

  describe('GET /:id', () => {
    it('returns a todo by id', async () => {
      const todo = repo.create('Test')
      const res = await app.request(`/${todo.id}`)
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.title).toBe('Test')
    })

    it('returns 404 for non-existent id', async () => {
      const res = await app.request('/nonexistent')
      expect(res.status).toBe(404)
      const data = await res.json()
      expect(data.error).toBe('Todo not found')
    })
  })

  describe('POST /', () => {
    it('creates a todo', async () => {
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

    it('returns 400 for empty title', async () => {
      const res = await app.request('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: '' }),
      })
      expect(res.status).toBe(400)
      const data = await res.json()
      expect(data.error).toBeTruthy()
    })

    it('returns 400 for missing title', async () => {
      const res = await app.request('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      expect(res.status).toBe(400)
    })
  })

  describe('PATCH /:id', () => {
    it('updates a todo', async () => {
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

    it('returns 404 for non-existent todo', async () => {
      const res = await app.request('/nonexistent', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Updated', completed: false }),
      })
      expect(res.status).toBe(404)
    })

    it('returns 400 for invalid body', async () => {
      const todo = repo.create('Test')
      const res = await app.request(`/${todo.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: '', completed: true }),
      })
      expect(res.status).toBe(400)
    })
  })

  describe('DELETE /:id', () => {
    it('deletes a todo', async () => {
      const todo = repo.create('To delete')
      const res = await app.request(`/${todo.id}`, { method: 'DELETE' })
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.id).toBe(todo.id)
      expect(broadcast).toHaveBeenCalledWith('deleted', { id: todo.id })
    })

    it('returns 404 for non-existent todo', async () => {
      const res = await app.request('/nonexistent', { method: 'DELETE' })
      expect(res.status).toBe(404)
    })
  })
})
