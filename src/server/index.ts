import { serve } from '@hono/node-server';
import { app } from './app.js';
import { initDb } from './db.js';

const port = Number(process.env.PORT) || 3000;
const dbPath = process.env.NODE_ENV === 'test' ? 'test-todos.db' : 'todos.db';

initDb(dbPath);

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`Server running on http://localhost:${info.port}`);
});
