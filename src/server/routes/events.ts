import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { addClient, removeClient } from '../sse.js';

const sseRoute = new Hono();

// UC-09, SUC-03: SSE connection endpoint
sseRoute.get('/', (c) => {
  return streamSSE(c, async (stream) => {
    const client = {
      send: (data: string) => {
        stream.write(data);
      },
      close: () => {
        stream.close();
      },
    };

    addClient(client);

    await stream.writeSSE({ event: 'connected', data: 'ok' });

    stream.onAbort(() => {
      removeClient(client);
    });

    // Keep connection open
    await new Promise<void>((resolve) => {
      stream.onAbort(() => {
        resolve();
      });
    });
  });
});

export { sseRoute };
