import type { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import type { SSEManager, SSEClient } from '../sse.js';

export function eventsRoutes(app: Hono, sseManager: SSEManager): void {
  app.get('/api/events', (c) => {
    return streamSSE(c, async (stream) => {
      const client: SSEClient = {
        send: (eventType: string, data: string) => {
          stream.writeSSE({ event: eventType, data });
        },
      };

      const clientId = sseManager.addClient(client);

      stream.onAbort(() => {
        sseManager.removeClient(clientId);
      });

      // Keep-alive loop
      while (true) {
        await stream.writeSSE({ data: '', event: 'keepalive' });
        await stream.sleep(30000);
      }
    });
  });
}
