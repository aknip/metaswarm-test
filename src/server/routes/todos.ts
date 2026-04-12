import type { Hono } from 'hono';
import type Database from 'better-sqlite3';
import { getAllTodos } from '../db.js';

export function todosRoutes(app: Hono, db: Database.Database): void {
  app.get('/api/todos', (c) => {
    const todos = getAllTodos(db);
    return c.json(todos);
  });
}
