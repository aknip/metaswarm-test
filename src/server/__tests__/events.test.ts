import { describe, it, expect, beforeEach } from 'vitest';
import { Hono } from 'hono';
import { SSEManager } from '../sse.js';
import { eventsRoutes } from '../routes/events.js';

describe('Events Route (UC-S06)', () => {
  let app: Hono;
  let sseManager: SSEManager;

  beforeEach(() => {
    app = new Hono();
    sseManager = new SSEManager();
    eventsRoutes(app, sseManager);
  });

  it('returns SSE content-type and streams response', async () => {
    const res = await app.request('/api/events');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/event-stream');
  });

  it('receives broadcast events via the stream', async () => {
    const res = await app.request('/api/events');
    expect(res.status).toBe(200);

    const reader = res.body?.getReader();
    expect(reader).toBeDefined();
    if (!reader) return;

    // Read the initial keepalive event to ensure stream is set up
    const { value: firstChunk } = await reader.read();
    expect(firstChunk).toBeDefined();
    const firstText = new TextDecoder().decode(firstChunk);
    expect(firstText).toContain('event: keepalive');

    // Now broadcast an event while client is connected
    sseManager.broadcast('todo:created', {
      id: '1',
      title: 'Test',
    });

    // Read the broadcast event
    const { value: secondChunk } = await reader.read();
    expect(secondChunk).toBeDefined();
    const secondText = new TextDecoder().decode(secondChunk);
    expect(secondText).toContain('event: todo:created');
    expect(secondText).toContain('"id":"1"');

    await reader.cancel();
  });
});
