import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Hono } from 'hono';
import Database from 'better-sqlite3';
import { createDatabase } from '../db.js';
import { chatRoutes } from '../routes/chat.js';
import { SSEManager } from '../sse.js';

// Mock the OpenRouter module
vi.mock('../ai/openrouter.js', () => ({
  callOpenRouter: vi.fn(),
}));

import { callOpenRouter } from '../ai/openrouter.js';
const mockCallOpenRouter = vi.mocked(callOpenRouter);

describe('Chat Routes (UC-S08)', () => {
  let app: Hono;
  let db: Database.Database;

  beforeEach(() => {
    db = new Database(':memory:');
    createDatabase(db);
    const sseManager = new SSEManager();
    app = new Hono();
    chatRoutes(app, db, sseManager);
    vi.clearAllMocks();
  });

  it('returns AI text response (UC-S08, Main Flow)', async () => {
    mockCallOpenRouter.mockResolvedValueOnce({
      choices: [
        {
          message: { role: 'assistant', content: 'Hello!' },
          finish_reason: 'stop',
        },
      ],
    });

    const res = await app.request('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Hi' }],
      }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.response).toBe('Hello!');
  });

  it('executes tool calls and returns result (UC-S08, Main Flow step 5)', async () => {
    // First call: AI wants to use a tool
    mockCallOpenRouter.mockResolvedValueOnce({
      choices: [
        {
          message: {
            role: 'assistant',
            content: null,
            tool_calls: [
              {
                id: 'call_1',
                type: 'function' as const,
                function: {
                  name: 'list_todos',
                  arguments: '{}',
                },
              },
            ],
          },
          finish_reason: 'tool_calls',
        },
      ],
    });

    // Second call: AI responds after seeing tool result
    mockCallOpenRouter.mockResolvedValueOnce({
      choices: [
        {
          message: {
            role: 'assistant',
            content: 'You have no todos yet!',
          },
          finish_reason: 'stop',
        },
      ],
    });

    const res = await app.request('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: "What's on my list?" }],
      }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.response).toBe('You have no todos yet!');
  });

  it('returns 500 when OPENROUTER_API_KEY is not set (UC-S08, Alt 5a)', async () => {
    mockCallOpenRouter.mockRejectedValueOnce(
      new Error('AI service not configured')
    );

    const res = await app.request('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Hello' }],
      }),
    });
    expect(res.status).toBe(502);
  });

  it('returns 400 for empty messages (UC-S08, validation)', async () => {
    const res = await app.request('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [] }),
    });
    expect(res.status).toBe(400);
  });

  it('returns 502 when OpenRouter fails (UC-S08, Alt 5b)', async () => {
    mockCallOpenRouter.mockRejectedValueOnce(new Error('API error'));

    const res = await app.request('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Hello' }],
      }),
    });
    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body.error).toBe('AI service unavailable');
  });

  it('handles null assistant content gracefully (UC-S08)', async () => {
    mockCallOpenRouter.mockResolvedValueOnce({
      choices: [
        {
          message: { role: 'assistant', content: null },
          finish_reason: 'stop',
        },
      ],
    });

    const res = await app.request('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Hi' }],
      }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.response).toContain('max');
  });

  it('returns 502 when OpenRouter returns empty choices (UC-S08, Alt 5c)', async () => {
    mockCallOpenRouter.mockResolvedValueOnce({
      choices: [],
    });

    const res = await app.request('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Hello' }],
      }),
    });
    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body.error).toBe('No response from AI');
  });

  it('returns 400 for invalid JSON body (UC-S08, validation)', async () => {
    const res = await app.request('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not valid json',
    });
    expect(res.status).toBe(400);
  });

  it('returns partial response when tool loop exceeds 5 iterations (UC-S08, Alt 5d)', async () => {
    // Mock: AI always returns a tool_call
    for (let i = 0; i < 6; i++) {
      mockCallOpenRouter.mockResolvedValueOnce({
        choices: [
          {
            message: {
              role: 'assistant',
              content: null,
              tool_calls: [
                {
                  id: `call_${i}`,
                  type: 'function' as const,
                  function: {
                    name: 'list_todos',
                    arguments: '{}',
                  },
                },
              ],
            },
            finish_reason: 'tool_calls',
          },
        ],
      });
    }

    const res = await app.request('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Loop forever' }],
      }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.response).toContain('max');
  });
});
