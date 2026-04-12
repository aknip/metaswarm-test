import { describe, it, expect, beforeEach } from 'vitest';
import { Hono } from 'hono';
import Database from 'better-sqlite3';
import { createDatabase } from '../db.js';
import { todosRoutes } from '../routes/todos.js';

describe('Todo Routes', () => {
  let app: Hono;
  let db: Database.Database;

  beforeEach(() => {
    db = new Database(':memory:');
    createDatabase(db);
    app = new Hono();
    todosRoutes(app, db);
  });

  describe('GET /api/todos (UC-S02)', () => {
    it('returns 200 with empty array when no todos exist (UC-S02, Main Flow)', async () => {
      const res = await app.request('/api/todos');
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual([]);
    });
  });

  describe('POST /api/todos (UC-S01)', () => {
    it('creates a todo with valid title (UC-S01, Main Flow)', async () => {
      const res = await app.request('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Buy milk' }),
      });
      expect(res.status).toBe(201);
      const todo = await res.json();
      expect(todo.title).toBe('Buy milk');
      expect(todo.completed).toBe(false);
      expect(todo.id).toBeDefined();
      expect(todo.createdAt).toBeDefined();
      expect(todo.updatedAt).toBeDefined();
    });

    it('returns the created todo in subsequent GET (UC-S01 + UC-S02)', async () => {
      await app.request('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Buy milk' }),
      });
      const res = await app.request('/api/todos');
      const todos = await res.json();
      expect(todos).toHaveLength(1);
      expect(todos[0].title).toBe('Buy milk');
    });

    it('rejects empty title with 400 (UC-S01, Alt 5a)', async () => {
      const res = await app.request('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: '' }),
      });
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Title is required');
    });

    it('rejects title over 500 chars with 400 (UC-S01, Alt 5b)', async () => {
      const res = await app.request('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'a'.repeat(501) }),
      });
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Title must be 500 characters or less');
    });
  });

  describe('PATCH /api/todos/:id (UC-S03)', () => {
    it('updates todo title (UC-S03, Main Flow)', async () => {
      const createRes = await app.request('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Original' }),
      });
      const created = await createRes.json();

      const res = await app.request(`/api/todos/${created.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Updated' }),
      });
      expect(res.status).toBe(200);
      const updated = await res.json();
      expect(updated.title).toBe('Updated');
      expect(updated.id).toBe(created.id);
    });

    it('returns 404 for non-existent todo (UC-S03, Alt 5b)', async () => {
      const res = await app.request(
        '/api/todos/00000000-0000-4000-8000-000000000000',
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: 'Updated' }),
        }
      );
      expect(res.status).toBe(404);
    });

    it('returns 400 for empty body (UC-S03, Alt 5c)', async () => {
      const createRes = await app.request('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Test' }),
      });
      const created = await createRes.json();

      const res = await app.request(`/api/todos/${created.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      expect(res.status).toBe(400);
    });

    it('updates completed field (UC-S03, Main Flow)', async () => {
      const createRes = await app.request('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Test' }),
      });
      const created = await createRes.json();

      const res = await app.request(`/api/todos/${created.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: true }),
      });
      expect(res.status).toBe(200);
      const updated = await res.json();
      expect(updated.completed).toBe(true);
    });
  });

  describe('PATCH /api/todos/:id/toggle (UC-S05)', () => {
    it('toggles completion status (UC-S05, Main Flow)', async () => {
      const createRes = await app.request('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Test' }),
      });
      const created = await createRes.json();
      expect(created.completed).toBe(false);

      const res = await app.request(`/api/todos/${created.id}/toggle`, {
        method: 'PATCH',
      });
      expect(res.status).toBe(200);
      const toggled = await res.json();
      expect(toggled.completed).toBe(true);

      const res2 = await app.request(`/api/todos/${created.id}/toggle`, {
        method: 'PATCH',
      });
      const toggled2 = await res2.json();
      expect(toggled2.completed).toBe(false);
    });

    it('returns 404 for non-existent todo (UC-S05, Alt 5a)', async () => {
      const res = await app.request(
        '/api/todos/00000000-0000-4000-8000-000000000000/toggle',
        { method: 'PATCH' }
      );
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/todos/:id (UC-S04)', () => {
    it('deletes an existing todo (UC-S04, Main Flow)', async () => {
      const createRes = await app.request('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'To delete' }),
      });
      const created = await createRes.json();

      const res = await app.request(`/api/todos/${created.id}`, {
        method: 'DELETE',
      });
      expect(res.status).toBe(204);

      const listRes = await app.request('/api/todos');
      const todos = await listRes.json();
      expect(todos).toHaveLength(0);
    });

    it('returns 404 for non-existent todo (UC-S04, Alt 5a)', async () => {
      const res = await app.request(
        '/api/todos/00000000-0000-4000-8000-000000000000',
        { method: 'DELETE' }
      );
      expect(res.status).toBe(404);
    });
  });
});
