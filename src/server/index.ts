import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import Database from 'better-sqlite3';
import { createDatabase } from './db.js';
import { todosRoutes } from './routes/todos.js';

const app = new Hono();
const db = new Database('todos.db');
createDatabase(db);

todosRoutes(app, db);

const port = Number(process.env.PORT) || 3000;
serve({ fetch: app.fetch, port }, () => {
  console.log(`Server running on http://localhost:${port}`);
});

export default app;
