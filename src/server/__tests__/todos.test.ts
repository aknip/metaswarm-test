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
});
