import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Hono } from 'hono';
import { initDb, closeDb } from '../db.js';
import { todoRoutes } from '../routes/todos.js';
import { clearClients } from '../sse.js';

// Mock the SSE broadcast to track calls
vi.mock('../sse.js', async (importOriginal) => {
  const original = await importOriginal<typeof import('../sse.js')>();
  return {
    ...original,
    broadcast: vi.fn(),
  };
});

import { broadcast } from '../sse.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function json(res: Response): Promise<any> {
  return res.json();
}

function createApp() {
  const app = new Hono();
  app.route('/api/todos', todoRoutes);
  return app;
}

describe('Todo API Routes', () => {
  let app: Hono;

  beforeEach(() => {
    initDb(':memory:');
    vi.clearAllMocks();
    app = createApp();
  });

  afterEach(() => {
    closeDb();
    clearClients();
  });

  // UC-02, SUC-02: GET /api/todos
  describe('GET /api/todos', () => {
    it('returns 200 with empty array when no todos exist', async () => {
      // UC-02/5a
      const res = await app.request('/api/todos');
      expect(res.status).toBe(200);
      const body = await json(res);
      expect(body).toEqual([]);
    });

    it('returns 200 with all todos', async () => {
      // Create two todos first
      await app.request('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'First' }),
      });
      await app.request('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Second' }),
      });

      const res = await app.request('/api/todos');
      expect(res.status).toBe(200);
      const body = await json(res);
      expect(body).toHaveLength(2);
      expect(body[0].title).toBe('First');
      expect(body[1].title).toBe('Second');
    });
  });

  // UC-01, SUC-02: POST /api/todos
  describe('POST /api/todos', () => {
    it('creates a todo and returns 201', async () => {
      const res = await app.request('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New todo' }),
      });

      expect(res.status).toBe(201);
      const body = await json(res);
      expect(body.title).toBe('New todo');
      expect(body.completed).toBe(false);
      expect(body.id).toBeTruthy();
      expect(body.createdAt).toBeTruthy();
    });

    it('broadcasts todo:created event', async () => {
      await app.request('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Broadcast test' }),
      });

      expect(broadcast).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'todo:created',
          data: expect.objectContaining({ title: 'Broadcast test' }),
        })
      );
    });

    // UC-01/5a, SUC-07: empty title
    it('returns 400 for empty title', async () => {
      const res = await app.request('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: '' }),
      });

      expect(res.status).toBe(400);
      const body = await json(res);
      expect(body.error.message).toContain('empty');
    });

    // UC-01/5b, SUC-07: title too long
    it('returns 400 for title exceeding 500 chars', async () => {
      const res = await app.request('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'a'.repeat(501) }),
      });

      expect(res.status).toBe(400);
      const body = await json(res);
      expect(body.error.message).toContain('500');
    });

    // SUC-02/5a: invalid JSON
    it('returns 400 for invalid JSON body', async () => {
      const res = await app.request('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'not json',
      });

      expect(res.status).toBe(400);
      const body = await json(res);
      expect(body.error).toContain('Invalid JSON');
    });

    it('returns 400 for missing title field', async () => {
      const res = await app.request('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      expect(res.status).toBe(400);
    });
  });

  // UC-03, UC-04, SUC-02: PATCH /api/todos/:id
  describe('PATCH /api/todos/:id', () => {
    it('updates the title and returns 200', async () => {
      // Create a todo first
      const createRes = await app.request('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Original' }),
      });
      const created = await json(createRes);

      const res = await app.request(`/api/todos/${created.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Updated' }),
      });

      expect(res.status).toBe(200);
      const body = await json(res);
      expect(body.title).toBe('Updated');
    });

    // UC-04: toggle completed
    it('toggles completed status', async () => {
      const createRes = await app.request('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Toggle me' }),
      });
      const created = await json(createRes);

      const res = await app.request(`/api/todos/${created.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: true }),
      });

      expect(res.status).toBe(200);
      const body = await json(res);
      expect(body.completed).toBe(true);
    });

    it('broadcasts todo:updated event', async () => {
      const createRes = await app.request('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Broadcast' }),
      });
      const created = await json(createRes);
      vi.clearAllMocks();

      await app.request(`/api/todos/${created.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Updated' }),
      });

      expect(broadcast).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'todo:updated',
        })
      );
    });

    // UC-03/5b, UC-04/5a: not found
    it('returns 404 for non-existent todo', async () => {
      const res = await app.request(
        '/api/todos/00000000-0000-0000-0000-000000000000',
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: 'Nope' }),
        }
      );

      expect(res.status).toBe(404);
    });

    // UC-03/5a, SUC-07: empty title
    it('returns 400 for empty title', async () => {
      const createRes = await app.request('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Valid' }),
      });
      const created = await json(createRes);

      const res = await app.request(`/api/todos/${created.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: '' }),
      });

      expect(res.status).toBe(400);
    });

    it('returns 400 for invalid completed type', async () => {
      const createRes = await app.request('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Valid' }),
      });
      const created = await json(createRes);

      const res = await app.request(`/api/todos/${created.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: 'not boolean' }),
      });

      expect(res.status).toBe(400);
    });

    it('returns 400 for invalid JSON body', async () => {
      const createRes = await app.request('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Valid' }),
      });
      const created = await json(createRes);

      const res = await app.request(`/api/todos/${created.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: 'not json',
      });

      expect(res.status).toBe(400);
    });
  });

  // UC-05, SUC-02: DELETE /api/todos/:id
  describe('DELETE /api/todos/:id', () => {
    it('deletes a todo and returns 204', async () => {
      const createRes = await app.request('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Delete me' }),
      });
      const created = await json(createRes);

      const res = await app.request(`/api/todos/${created.id}`, {
        method: 'DELETE',
      });

      expect(res.status).toBe(204);
    });

    it('broadcasts todo:deleted event', async () => {
      const createRes = await app.request('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Broadcast delete' }),
      });
      const created = await json(createRes);
      vi.clearAllMocks();

      await app.request(`/api/todos/${created.id}`, {
        method: 'DELETE',
      });

      expect(broadcast).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'todo:deleted',
          data: { id: created.id },
        })
      );
    });

    // UC-05/5a: not found
    it('returns 404 for non-existent todo', async () => {
      const res = await app.request(
        '/api/todos/00000000-0000-0000-0000-000000000000',
        {
          method: 'DELETE',
        }
      );

      expect(res.status).toBe(404);
    });
  });
});
