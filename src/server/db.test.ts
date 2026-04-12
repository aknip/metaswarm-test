import { describe, it, expect, beforeEach } from 'vitest'
import { createDatabase, createTodoRepo } from './db.js'
import type Database from 'better-sqlite3'

describe('createDatabase', () => {
  it('creates an in-memory database with todos table', () => {
    const db = createDatabase(':memory:')
    const tables = db
      .prepare<[], { name: string }>(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='todos'"
      )
      .all()
    expect(tables).toHaveLength(1)
    expect(tables[0].name).toBe('todos')
    db.close()
  })
})

describe('TodoRepo', () => {
  let db: Database.Database
  let repo: ReturnType<typeof createTodoRepo>

  beforeEach(() => {
    db = createDatabase(':memory:')
    repo = createTodoRepo(db)
  })

  describe('list', () => {
    it('returns empty array when no todos exist', () => {
      expect(repo.list()).toEqual([])
    })

    it('returns all todos ordered by created_at desc', () => {
      repo.create('First')
      repo.create('Second')
      const todos = repo.list()
      expect(todos).toHaveLength(2)
      expect(todos[0].title).toBe('Second')
      expect(todos[1].title).toBe('First')
    })
  })

  describe('get', () => {
    it('returns a todo by id', () => {
      const created = repo.create('Test')
      const found = repo.get(created.id)
      expect(found).toBeDefined()
      expect(found!.title).toBe('Test')
    })

    it('returns undefined for non-existent id', () => {
      expect(repo.get('nonexistent')).toBeUndefined()
    })
  })

  describe('create', () => {
    it('creates a todo with default values', () => {
      const todo = repo.create('New todo')
      expect(todo.title).toBe('New todo')
      expect(todo.completed).toBe(0)
      expect(todo.id).toBeTruthy()
      expect(todo.created_at).toBeTruthy()
      expect(todo.updated_at).toBeTruthy()
    })
  })

  describe('update', () => {
    it('updates title and completed status', () => {
      const created = repo.create('Original')
      const updated = repo.update(created.id, 'Updated', true)
      expect(updated).toBeDefined()
      expect(updated!.title).toBe('Updated')
      expect(updated!.completed).toBe(1)
    })

    it('returns undefined for non-existent id', () => {
      expect(repo.update('nonexistent', 'Title', false)).toBeUndefined()
    })
  })

  describe('delete', () => {
    it('deletes a todo and returns it', () => {
      const created = repo.create('To delete')
      const deleted = repo.delete(created.id)
      expect(deleted).toBeDefined()
      expect(deleted!.id).toBe(created.id)
      expect(repo.list()).toHaveLength(0)
    })

    it('returns undefined for non-existent id', () => {
      expect(repo.delete('nonexistent')).toBeUndefined()
    })
  })
})
