import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  initDb,
  closeDb,
  getDb,
  createTodo,
  getAllTodos,
  getTodoById,
  updateTodo,
  deleteTodo,
} from '../db.js';

describe('Database Layer', () => {
  beforeEach(() => {
    initDb(':memory:');
  });

  afterEach(() => {
    closeDb();
  });

  // SUC-01: Initialize Database Schema
  describe('Schema initialization', () => {
    it('creates the todos table on init', () => {
      const db = getDb();
      const tables = db
        .prepare(
          "SELECT name FROM sqlite_master WHERE type='table' AND name='todos'"
        )
        .all();
      expect(tables).toHaveLength(1);
    });

    it('has correct columns', () => {
      const db = getDb();
      const columns = db.prepare('PRAGMA table_info(todos)').all() as {
        name: string;
      }[];
      const columnNames = columns.map((c) => c.name);
      expect(columnNames).toEqual([
        'id',
        'title',
        'completed',
        'createdAt',
        'updatedAt',
      ]);
    });
  });

  // SUC-01: getDb
  describe('getDb', () => {
    it('returns the initialized database', () => {
      const db = getDb();
      expect(db).toBeDefined();
    });

    it('throws if database not initialized', () => {
      closeDb();
      expect(() => getDb()).toThrow(
        'Database not initialized. Call initDb() first.'
      );
      // Re-init for afterEach cleanup
      initDb(':memory:');
    });
  });

  // SUC-01, UC-01: createTodo
  describe('createTodo', () => {
    it('inserts and returns a todo with correct fields', () => {
      const todo = createTodo({ title: 'Test todo' });

      expect(todo.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      );
      expect(todo.title).toBe('Test todo');
      expect(todo.completed).toBe(false);
      expect(todo.createdAt).toBeTruthy();
      expect(todo.updatedAt).toBeTruthy();
    });

    it('trims whitespace from title', () => {
      const todo = createTodo({ title: '  Trimmed  ' });
      expect(todo.title).toBe('Trimmed');
    });

    it('persists the todo to the database', () => {
      const todo = createTodo({ title: 'Persisted' });
      const found = getTodoById(todo.id);
      expect(found).toBeDefined();
      expect(found?.title).toBe('Persisted');
    });
  });

  // UC-02: getAllTodos
  describe('getAllTodos', () => {
    it('returns all todos', () => {
      createTodo({ title: 'First' });
      createTodo({ title: 'Second' });

      const todos = getAllTodos();
      expect(todos).toHaveLength(2);
      expect(todos[0]?.title).toBe('First');
      expect(todos[1]?.title).toBe('Second');
    });

    // UC-02/5a: empty list
    it('returns empty array when no todos exist', () => {
      const todos = getAllTodos();
      expect(todos).toEqual([]);
    });
  });

  // SUC-02: getTodoById
  describe('getTodoById', () => {
    it('returns a specific todo by id', () => {
      const created = createTodo({ title: 'Find me' });
      const found = getTodoById(created.id);

      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
      expect(found?.title).toBe('Find me');
    });

    it('returns undefined for non-existent id', () => {
      const found = getTodoById('00000000-0000-0000-0000-000000000000');
      expect(found).toBeUndefined();
    });
  });

  // UC-03: updateTodo (title)
  describe('updateTodo', () => {
    it('modifies the title', () => {
      const created = createTodo({ title: 'Original' });
      const updated = updateTodo(created.id, { title: 'Updated' });

      expect(updated).toBeDefined();
      expect(updated?.title).toBe('Updated');
      expect(updated?.updatedAt).toBeTruthy();
      expect(updated?.createdAt).toBe(created.createdAt);

      // Verify persisted
      const fetched = getTodoById(created.id);
      expect(fetched?.title).toBe('Updated');
    });

    // UC-04: toggle completed
    it('toggles completed status', () => {
      const created = createTodo({ title: 'Toggle me' });
      expect(created.completed).toBe(false);

      const toggled = updateTodo(created.id, { completed: true });
      expect(toggled?.completed).toBe(true);

      const toggledBack = updateTodo(created.id, { completed: false });
      expect(toggledBack?.completed).toBe(false);
    });

    it('trims title on update', () => {
      const created = createTodo({ title: 'Original' });
      const updated = updateTodo(created.id, { title: '  Trimmed  ' });
      expect(updated?.title).toBe('Trimmed');
    });

    // UC-03/5b: not found
    it('returns undefined for non-existent todo', () => {
      const result = updateTodo('00000000-0000-0000-0000-000000000000', {
        title: 'Nope',
      });
      expect(result).toBeUndefined();
    });

    it('preserves existing fields when only updating one', () => {
      const created = createTodo({ title: 'Keep title' });
      const updated = updateTodo(created.id, { completed: true });

      expect(updated?.title).toBe('Keep title');
      expect(updated?.completed).toBe(true);
    });
  });

  // UC-05: deleteTodo
  describe('deleteTodo', () => {
    it('removes a todo and returns true', () => {
      const created = createTodo({ title: 'Delete me' });
      const result = deleteTodo(created.id);

      expect(result).toBe(true);
      expect(getTodoById(created.id)).toBeUndefined();
    });

    // UC-05/5a: not found
    it('returns false for non-existent todo', () => {
      const result = deleteTodo('00000000-0000-0000-0000-000000000000');
      expect(result).toBe(false);
    });
  });
});
