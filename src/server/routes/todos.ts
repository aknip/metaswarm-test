import type { Hono } from 'hono';
import type Database from 'better-sqlite3';
import {
  getAllTodos,
  createTodo,
  updateTodo,
  toggleTodo,
  deleteTodo,
} from '../db.js';
import { validateCreateTodo, validateUpdateTodo } from '../validation.js';
import type { SSEManager } from '../sse.js';

export function errorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  return 'Bad request';
}

export function todosRoutes(
  app: Hono,
  db: Database.Database,
  sseManager: SSEManager
): void {
  app.get('/api/todos', (c) => {
    const todos = getAllTodos(db);
    return c.json(todos);
  });

  app.post('/api/todos', async (c) => {
    try {
      const body = await c.req.json();
      const { title } = validateCreateTodo(body);
      const todo = createTodo(db, title);
      sseManager.broadcast('todo:created', todo);
      return c.json(todo, 201);
    } catch (e) {
      return c.json({ error: errorMessage(e) }, 400);
    }
  });

  // IMPORTANT: /toggle route MUST be registered before /:id
  app.patch('/api/todos/:id/toggle', (c) => {
    const id = c.req.param('id');
    const todo = toggleTodo(db, id);
    if (!todo) {
      return c.json({ error: 'Todo not found' }, 404);
    }
    sseManager.broadcast('todo:updated', todo);
    return c.json(todo);
  });

  app.patch('/api/todos/:id', async (c) => {
    const id = c.req.param('id');
    try {
      const body = await c.req.json();
      const fields = validateUpdateTodo(body);
      const todo = updateTodo(db, id, fields);
      if (!todo) {
        return c.json({ error: 'Todo not found' }, 404);
      }
      sseManager.broadcast('todo:updated', todo);
      return c.json(todo);
    } catch (e) {
      return c.json({ error: errorMessage(e) }, 400);
    }
  });

  app.delete('/api/todos/:id', (c) => {
    const id = c.req.param('id');
    const deleted = deleteTodo(db, id);
    if (!deleted) {
      return c.json({ error: 'Todo not found' }, 404);
    }
    sseManager.broadcast('todo:deleted', { id });
    return c.body(null, 204);
  });
}
