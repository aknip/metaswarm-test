import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  addClient,
  removeClient,
  getClientCount,
  broadcast,
  clearClients,
} from '../sse.js';

describe('SSE Module', () => {
  beforeEach(() => {
    clearClients();
  });

  // SUC-03: addClient
  describe('addClient', () => {
    it('adds a client to the set', () => {
      const client = { send: vi.fn(), close: vi.fn() };
      addClient(client);
      expect(getClientCount()).toBe(1);
    });

    it('supports multiple clients', () => {
      addClient({ send: vi.fn(), close: vi.fn() });
      addClient({ send: vi.fn(), close: vi.fn() });
      addClient({ send: vi.fn(), close: vi.fn() });
      expect(getClientCount()).toBe(3);
    });
  });

  // SUC-03: removeClient
  describe('removeClient', () => {
    it('removes a client from the set', () => {
      const client = { send: vi.fn(), close: vi.fn() };
      addClient(client);
      expect(getClientCount()).toBe(1);

      removeClient(client);
      expect(getClientCount()).toBe(0);
    });

    it('does nothing if client not in set', () => {
      const client = { send: vi.fn(), close: vi.fn() };
      removeClient(client);
      expect(getClientCount()).toBe(0);
    });
  });

  // SUC-04: broadcast
  describe('broadcast', () => {
    it('sends event to all connected clients', () => {
      const client1 = { send: vi.fn(), close: vi.fn() };
      const client2 = { send: vi.fn(), close: vi.fn() };
      addClient(client1);
      addClient(client2);

      broadcast({
        event: 'todo:created',
        data: {
          id: 'test-id',
          title: 'Test',
          completed: false,
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
        },
      });

      expect(client1.send).toHaveBeenCalledOnce();
      expect(client2.send).toHaveBeenCalledOnce();

      const message = client1.send.mock.calls[0]?.[0] as string;
      expect(message).toContain('event: todo:created');
      expect(message).toContain('"title":"Test"');
    });

    // SUC-04/5a: no clients
    it('handles no connected clients gracefully', () => {
      expect(() =>
        broadcast({
          event: 'todo:created',
          data: {
            id: 'test',
            title: 'Test',
            completed: false,
            createdAt: '',
            updatedAt: '',
          },
        })
      ).not.toThrow();
    });

    // SUC-04/5b: write to closed connection
    it('removes client if send throws', () => {
      const goodClient = { send: vi.fn(), close: vi.fn() };
      const badClient = {
        send: vi.fn().mockImplementation(() => {
          throw new Error('Connection closed');
        }),
        close: vi.fn(),
      };
      addClient(goodClient);
      addClient(badClient);

      broadcast({
        event: 'todo:updated',
        data: {
          id: 'test',
          title: 'Updated',
          completed: true,
          createdAt: '',
          updatedAt: '',
        },
      });

      // Bad client removed, good client still there
      expect(getClientCount()).toBe(1);
      expect(goodClient.send).toHaveBeenCalledOnce();
    });

    // SUC-04: todo:created event format
    it('formats todo:created event correctly', () => {
      const client = { send: vi.fn(), close: vi.fn() };
      addClient(client);

      const todo = {
        id: 'abc-123',
        title: 'New todo',
        completed: false,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      broadcast({ event: 'todo:created', data: todo });

      const message = client.send.mock.calls[0]?.[0] as string;
      expect(message).toBe(
        `event: todo:created\ndata: ${JSON.stringify(todo)}\n\n`
      );
    });

    // SUC-04: todo:updated event format
    it('formats todo:updated event correctly', () => {
      const client = { send: vi.fn(), close: vi.fn() };
      addClient(client);

      broadcast({
        event: 'todo:updated',
        data: {
          id: 'abc-123',
          title: 'Updated',
          completed: true,
          createdAt: '',
          updatedAt: '',
        },
      });

      const message = client.send.mock.calls[0]?.[0] as string;
      expect(message).toContain('event: todo:updated');
    });

    // SUC-04: todo:deleted event format
    it('formats todo:deleted event correctly', () => {
      const client = { send: vi.fn(), close: vi.fn() };
      addClient(client);

      broadcast({ event: 'todo:deleted', data: { id: 'deleted-id' } });

      const message = client.send.mock.calls[0]?.[0] as string;
      expect(message).toBe(
        `event: todo:deleted\ndata: ${JSON.stringify({ id: 'deleted-id' })}\n\n`
      );
    });
  });

  // clearClients
  describe('clearClients', () => {
    it('removes all clients', () => {
      addClient({ send: vi.fn(), close: vi.fn() });
      addClient({ send: vi.fn(), close: vi.fn() });
      expect(getClientCount()).toBe(2);

      clearClients();
      expect(getClientCount()).toBe(0);
    });
  });
});
