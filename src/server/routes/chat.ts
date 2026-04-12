import { Hono } from 'hono';
import { processChat } from '../ai/chat-service.js';
import type { ChatRequest } from '../../shared/types.js';

const chatRoutes = new Hono();

// UC-06, SUC-05: Chat with AI
chatRoutes.post('/', async (c) => {
  const body = await c.req.json<ChatRequest>().catch(() => null);
  if (!body) {
    return c.json({ error: 'Invalid JSON body' }, 400);
  }

  if (
    !body.message ||
    typeof body.message !== 'string' ||
    body.message.trim().length === 0
  ) {
    return c.json({ error: 'Message is required' }, 400);
  }

  const history = Array.isArray(body.history) ? body.history : [];

  try {
    const response = await processChat(body.message, history);
    return c.json({ message: response });
  } catch (error: unknown) {
    if (error instanceof Error) {
      // SUC-05/5a: API key invalid
      if (
        error.message.includes('401') ||
        error.message.includes('authentication')
      ) {
        return c.json({ error: 'AI service authentication failed' }, 500);
      }
      // SUC-05/5b: Rate limited
      if (error.message.includes('429') || error.message.includes('rate')) {
        return c.json(
          { error: 'AI service rate limited. Please try again.' },
          429
        );
      }
    }
    return c.json({ error: 'AI service error' }, 500);
  }
});

export { chatRoutes };
