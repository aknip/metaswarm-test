import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { todoRoutes } from './routes/todos.js';
import { chatRoutes } from './routes/chat.js';
import { sseRoute } from './routes/events.js';

const app = new Hono();

app.use('/api/*', cors());

// SSE events endpoint MUST be registered before /api/todos/:id
// to prevent "events" from being captured as a todo ID parameter.
app.route('/api/todos/events', sseRoute);
app.route('/api/todos', todoRoutes);
app.route('/api/chat', chatRoutes);

export { app };
