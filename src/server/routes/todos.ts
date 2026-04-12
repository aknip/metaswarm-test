import { Hono } from 'hono';
import {
  createTodo,
  getAllTodos,
  getTodoById,
  updateTodo,
  deleteTodo,
} from '../db.js';
import { validateTitle, validateCompleted } from '../validation.js';
import { broadcast } from '../sse.js';

const todoRoutes = new Hono();

// UC-02, SUC-02: List all todos
todoRoutes.get('/', (c) => {
  const todos = getAllTodos();
  return c.json(todos);
});

// UC-01, SUC-02: Create a todo
todoRoutes.post('/', async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body) {
    return c.json({ error: 'Invalid JSON body' }, 400);
  }

  const titleResult = validateTitle(body.title);
  if (!titleResult.valid) {
    return c.json({ error: titleResult.error }, 400);
  }

  const todo = createTodo({ title: titleResult.value });
  broadcast({ event: 'todo:created', data: todo });
  return c.json(todo, 201);
});

// SUC-02: Get /events is handled separately, register before :id
// This comment documents route ordering: /events MUST come before /:id
// to prevent "events" from being captured as a todo ID parameter.

// UC-03, UC-04, SUC-02: Update a todo
todoRoutes.patch('/:id', async (c) => {
  const id = c.req.param('id');
  const existing = getTodoById(id);
  if (!existing) {
    return c.json({ error: 'Todo not found' }, 404);
  }

  const body = await c.req.json().catch(() => null);
  if (!body) {
    return c.json({ error: 'Invalid JSON body' }, 400);
  }

  if (body.title !== undefined) {
    const titleResult = validateTitle(body.title);
    if (!titleResult.valid) {
      return c.json({ error: titleResult.error }, 400);
    }
  }

  if (body.completed !== undefined) {
    const completedResult = validateCompleted(body.completed);
    if (!completedResult.valid) {
      return c.json({ error: completedResult.error }, 400);
    }
  }

  const updated = updateTodo(id, {
    title: body.title,
    completed: body.completed,
  });

  if (updated) {
    broadcast({ event: 'todo:updated', data: updated });
  }

  return c.json(updated);
});

// UC-05, SUC-02: Delete a todo
todoRoutes.delete('/:id', (c) => {
  const id = c.req.param('id');
  const deleted = deleteTodo(id);

  if (!deleted) {
    return c.json({ error: 'Todo not found' }, 404);
  }

  broadcast({ event: 'todo:deleted', data: { id } });
  return c.body(null, 204);
});

export { todoRoutes };
