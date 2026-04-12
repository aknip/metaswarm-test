import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Hono } from 'hono';
import { initDb, closeDb, createTodo } from '../db.js';
import { chatRoutes } from '../routes/chat.js';
import { clearClients } from '../sse.js';
import { setAnthropicClient, getAnthropicClient } from '../ai/chat-service.js';

// Mock SSE broadcast
vi.mock('../sse.js', async (importOriginal) => {
  const original = await importOriginal<typeof import('../sse.js')>();
  return {
    ...original,
    broadcast: vi.fn(),
  };
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function json(res: Response): Promise<any> {
  return res.json();
}

function createApp() {
  const app = new Hono();
  app.route('/api/chat', chatRoutes);
  return app;
}

// Helper to create a mock Anthropic client
function createMockClient(
  responses: Array<{
    content: Array<
      | { type: 'text'; text: string }
      | {
          type: 'tool_use';
          id: string;
          name: string;
          input: Record<string, unknown>;
        }
    >;
    stop_reason?: string;
  }>
) {
  let callIndex = 0;
  return {
    messages: {
      create: vi.fn().mockImplementation(async () => {
        const response = responses[callIndex];
        callIndex++;
        if (!response) {
          return {
            content: [{ type: 'text', text: 'Done' }],
            stop_reason: 'end_turn',
          };
        }
        return response;
      }),
    },
  };
}

describe('Chat API Routes', () => {
  let app: Hono;

  beforeEach(() => {
    initDb(':memory:');
    vi.clearAllMocks();
    app = createApp();
  });

  afterEach(() => {
    closeDb();
    clearClients();
    setAnthropicClient(null);
  });

  describe('getAnthropicClient', () => {
    it('creates a default Anthropic client when none is set', () => {
      setAnthropicClient(null);
      const client = getAnthropicClient();
      expect(client).toBeDefined();
      // Clean up — set back to null so afterEach works
      setAnthropicClient(null);
    });
  });

  // UC-06, SUC-05: text response
  describe('POST /api/chat', () => {
    it('returns AI text response', async () => {
      const mockClient = createMockClient([
        { content: [{ type: 'text', text: 'Hello! How can I help?' }] },
      ]);
      setAnthropicClient(
        mockClient as unknown as import('@anthropic-ai/sdk').default
      );

      const res = await app.request('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Hi', history: [] }),
      });

      expect(res.status).toBe(200);
      const body = await json(res);
      expect(body.message).toBe('Hello! How can I help?');
    });

    // UC-06/5c: empty message
    it('returns 400 for empty message', async () => {
      const res = await app.request('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: '', history: [] }),
      });

      expect(res.status).toBe(400);
      const body = await json(res);
      expect(body.error).toContain('required');
    });

    it('returns 400 for missing message', async () => {
      const res = await app.request('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ history: [] }),
      });

      expect(res.status).toBe(400);
    });

    it('returns 400 for invalid JSON', async () => {
      const res = await app.request('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'not json',
      });

      expect(res.status).toBe(400);
    });

    it('returns 400 for whitespace-only message', async () => {
      const res = await app.request('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: '   ', history: [] }),
      });

      expect(res.status).toBe(400);
    });

    // UC-06/5a, SUC-05/5a, BUC-02/5a: API key invalid
    it('returns 500 for authentication error', async () => {
      const mockClient = {
        messages: {
          create: vi
            .fn()
            .mockRejectedValue(new Error('401 authentication failed')),
        },
      };
      setAnthropicClient(
        mockClient as unknown as import('@anthropic-ai/sdk').default
      );

      const res = await app.request('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Hi', history: [] }),
      });

      expect(res.status).toBe(500);
      const body = await json(res);
      expect(body.error).toContain('authentication');
    });

    // UC-06/5b, SUC-05/5b: rate limited
    it('returns 429 for rate limit error', async () => {
      const mockClient = {
        messages: {
          create: vi
            .fn()
            .mockRejectedValue(new Error('429 rate limit exceeded')),
        },
      };
      setAnthropicClient(
        mockClient as unknown as import('@anthropic-ai/sdk').default
      );

      const res = await app.request('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Hi', history: [] }),
      });

      expect(res.status).toBe(429);
      const body = await json(res);
      expect(body.error).toContain('rate');
    });

    // General API error
    it('returns 500 for generic API error', async () => {
      const mockClient = {
        messages: {
          create: vi.fn().mockRejectedValue(new Error('Something went wrong')),
        },
      };
      setAnthropicClient(
        mockClient as unknown as import('@anthropic-ai/sdk').default
      );

      const res = await app.request('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Hi', history: [] }),
      });

      expect(res.status).toBe(500);
      const body = await json(res);
      expect(body.error).toContain('AI service error');
    });

    // Non-Error thrown
    it('returns 500 for non-Error thrown', async () => {
      const mockClient = {
        messages: {
          create: vi.fn().mockRejectedValue('string error'),
        },
      };
      setAnthropicClient(
        mockClient as unknown as import('@anthropic-ai/sdk').default
      );

      const res = await app.request('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Hi', history: [] }),
      });

      expect(res.status).toBe(500);
    });

    // UC-07, SUC-06: tool call — list_todos
    it('handles list_todos tool call', async () => {
      createTodo({ title: 'Test todo' });

      const mockClient = createMockClient([
        {
          content: [
            {
              type: 'tool_use',
              id: 'call_1',
              name: 'list_todos',
              input: {},
            },
          ],
        },
        {
          content: [{ type: 'text', text: 'You have 1 todo: Test todo' }],
        },
      ]);
      setAnthropicClient(
        mockClient as unknown as import('@anthropic-ai/sdk').default
      );

      const res = await app.request('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'What are my todos?',
          history: [],
        }),
      });

      expect(res.status).toBe(200);
      const body = await json(res);
      expect(body.message).toBe('You have 1 todo: Test todo');
      expect(mockClient.messages.create).toHaveBeenCalledTimes(2);
    });

    // UC-08, SUC-06: tool call — create_todo
    it('handles create_todo tool call', async () => {
      const mockClient = createMockClient([
        {
          content: [
            {
              type: 'tool_use',
              id: 'call_1',
              name: 'create_todo',
              input: { title: 'Buy groceries' },
            },
          ],
        },
        {
          content: [{ type: 'text', text: 'Created "Buy groceries"' }],
        },
      ]);
      setAnthropicClient(
        mockClient as unknown as import('@anthropic-ai/sdk').default
      );

      const res = await app.request('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Add buy groceries',
          history: [],
        }),
      });

      expect(res.status).toBe(200);
      const body = await json(res);
      expect(body.message).toBe('Created "Buy groceries"');
    });

    // UC-08/5c: multiple tool calls in sequence
    it('handles multiple tool calls in sequence', async () => {
      const mockClient = createMockClient([
        {
          content: [
            {
              type: 'tool_use',
              id: 'call_1',
              name: 'create_todo',
              input: { title: 'First' },
            },
            {
              type: 'tool_use',
              id: 'call_2',
              name: 'create_todo',
              input: { title: 'Second' },
            },
          ],
        },
        {
          content: [{ type: 'text', text: 'Created 2 todos' }],
        },
      ]);
      setAnthropicClient(
        mockClient as unknown as import('@anthropic-ai/sdk').default
      );

      const res = await app.request('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Add two todos',
          history: [],
        }),
      });

      expect(res.status).toBe(200);
      const body = await json(res);
      expect(body.message).toBe('Created 2 todos');
    });

    // SUC-05/5c: max rounds
    it('terminates after max tool call rounds', async () => {
      // Create a mock that always returns tool_use (never text)
      const infiniteToolClient = {
        messages: {
          create: vi.fn().mockResolvedValue({
            content: [
              {
                type: 'tool_use',
                id: 'call_loop',
                name: 'list_todos',
                input: {},
              },
            ],
          }),
        },
      };
      setAnthropicClient(
        infiniteToolClient as unknown as import('@anthropic-ai/sdk').default
      );

      const res = await app.request('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Loop forever', history: [] }),
      });

      expect(res.status).toBe(200);
      const body = await json(res);
      expect(body.message).toContain('maximum');
      // Should have been called exactly 5 times (MAX_TOOL_ROUNDS)
      expect(infiniteToolClient.messages.create).toHaveBeenCalledTimes(5);
    });

    // Handles non-array history gracefully
    it('handles missing history field', async () => {
      const mockClient = createMockClient([
        { content: [{ type: 'text', text: 'Hello!' }] },
      ]);
      setAnthropicClient(
        mockClient as unknown as import('@anthropic-ai/sdk').default
      );

      const res = await app.request('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Hi' }),
      });

      expect(res.status).toBe(200);
    });

    // Mixed text + tool_use response
    it('handles response with both text and tool_use blocks', async () => {
      createTodo({ title: 'Existing' });

      const mockClient = createMockClient([
        {
          content: [
            { type: 'text', text: 'Let me check your todos.' },
            {
              type: 'tool_use',
              id: 'call_1',
              name: 'list_todos',
              input: {},
            },
          ],
        },
        {
          content: [{ type: 'text', text: 'You have 1 todo.' }],
        },
      ]);
      setAnthropicClient(
        mockClient as unknown as import('@anthropic-ai/sdk').default
      );

      const res = await app.request('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'List todos', history: [] }),
      });

      expect(res.status).toBe(200);
      const body = await json(res);
      expect(body.message).toBe('You have 1 todo.');
    });

    // With conversation history
    it('passes conversation history to API', async () => {
      const mockClient = createMockClient([
        { content: [{ type: 'text', text: 'I remember!' }] },
      ]);
      setAnthropicClient(
        mockClient as unknown as import('@anthropic-ai/sdk').default
      );

      const res = await app.request('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'What did I say?',
          history: [
            { role: 'user', content: 'Hello' },
            { role: 'assistant', content: 'Hi there!' },
          ],
        }),
      });

      expect(res.status).toBe(200);
      // Verify history was passed
      const createCall = mockClient.messages.create.mock.calls[0]?.[0];
      expect(createCall.messages).toHaveLength(3); // 2 history + 1 new
    });
  });
});
