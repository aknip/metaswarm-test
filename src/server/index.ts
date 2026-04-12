import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import Database from 'better-sqlite3';
import { createDatabase } from './db.js';
import { SSEManager } from './sse.js';
import { todosRoutes } from './routes/todos.js';
import { eventsRoutes } from './routes/events.js';

const app = new Hono();
const db = new Database('todos.db');
createDatabase(db);

const sseManager = new SSEManager();
todosRoutes(app, db, sseManager);
eventsRoutes(app, sseManager);

const port = Number(process.env.PORT) || 3000;
serve({ fetch: app.fetch, port }, () => {
  console.log(`Server running on http://localhost:${port}`);
});

export default app;
