import type { Hono } from 'hono';
import type Database from 'better-sqlite3';
import type { SSEManager } from '../sse.js';
import { callOpenRouter } from '../ai/openrouter.js';
import { executeTool, TOOL_DEFINITIONS } from '../ai/tools.js';
import { validateChatMessages } from '../validation.js';
import { errorMessage } from './todos.js';

const MAX_TOOL_ITERATIONS = 5;

const SYSTEM_PROMPT = `You are a helpful AI assistant that manages a todo list. You can:
- List all todos
- Create new todos
- Update todo titles and completion status
- Delete todos
- Toggle todo completion

Be concise and helpful. When the user asks you to manage their todos, use the available tools.`;

export function chatRoutes(
  app: Hono,
  db: Database.Database,
  sseManager: SSEManager
): void {
  app.post('/api/chat', async (c) => {
    try {
      const body = await c.req.json();
      const { messages } = validateChatMessages(body);

      const apiMessages: Array<{
        role: string;
        content: string | null;
        tool_calls?: Array<{
          id: string;
          type: 'function';
          function: { name: string; arguments: string };
        }>;
        tool_call_id?: string;
      }> = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      ];

      let iterations = 0;
      let finalResponse = '';

      while (iterations < MAX_TOOL_ITERATIONS) {
        iterations++;

        let result;
        try {
          result = await callOpenRouter(apiMessages, TOOL_DEFINITIONS);
        } catch {
          return c.json({ error: 'AI service unavailable' }, 502);
        }

        const choice = result.choices[0];
        if (!choice) {
          return c.json({ error: 'No response from AI' }, 502);
        }

        const assistantMessage = choice.message;
        apiMessages.push(assistantMessage);

        if (
          !assistantMessage.tool_calls ||
          assistantMessage.tool_calls.length === 0
        ) {
          finalResponse = assistantMessage.content || '';
          break;
        }

        // Execute tool calls
        for (const toolCall of assistantMessage.tool_calls) {
          const toolResult = await executeTool(
            db,
            sseManager,
            toolCall.function.name,
            toolCall.function.arguments
          );
          apiMessages.push({
            role: 'tool',
            content: toolResult,
            tool_call_id: toolCall.id,
          });
        }
      }

      if (!finalResponse) {
        finalResponse =
          'I reached the maximum number of tool calls. Here is what I was able to do so far.';
      }

      const responseMessages = [
        ...messages,
        { role: 'assistant' as const, content: finalResponse },
      ];

      return c.json({
        response: finalResponse,
        messages: responseMessages,
      });
    } catch (e) {
      return c.json({ error: errorMessage(e) }, 400);
    }
  });
}
