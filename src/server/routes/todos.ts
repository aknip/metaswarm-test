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

export function todosRoutes(app: Hono, db: Database.Database): void {
  app.get('/api/todos', (c) => {
    const todos = getAllTodos(db);
    return c.json(todos);
  });

  app.post('/api/todos', async (c) => {
    try {
      const body = await c.req.json();
      const { title } = validateCreateTodo(body);
      const todo = createTodo(db, title);
      return c.json(todo, 201);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Bad request';
      return c.json({ error: message }, 400);
    }
  });

  // IMPORTANT: /toggle route MUST be registered before /:id
  app.patch('/api/todos/:id/toggle', (c) => {
    const id = c.req.param('id');
    const todo = toggleTodo(db, id);
    if (!todo) {
      return c.json({ error: 'Todo not found' }, 404);
    }
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
      return c.json(todo);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Bad request';
      return c.json({ error: message }, 400);
    }
  });

  app.delete('/api/todos/:id', (c) => {
    const id = c.req.param('id');
    const deleted = deleteTodo(db, id);
    if (!deleted) {
      return c.json({ error: 'Todo not found' }, 404);
    }
    return c.body(null, 204);
  });
}
