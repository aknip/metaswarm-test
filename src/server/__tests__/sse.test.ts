import { describe, it, expect, beforeEach } from 'vitest';
import { SSEManager } from '../sse.js';

describe('SSE Manager (UC-S06, UC-S07)', () => {
  let manager: SSEManager;

  beforeEach(() => {
    manager = new SSEManager();
  });

  describe('addClient / removeClient (UC-S06, Main Flow)', () => {
    it('tracks connected clients', () => {
      const mockClient = { send: () => {} };
      const id = manager.addClient(mockClient);
      expect(manager.clientCount).toBe(1);
      manager.removeClient(id);
      expect(manager.clientCount).toBe(0);
    });
  });

  describe('broadcast (UC-S07, Main Flow)', () => {
    it('sends events to all connected clients', () => {
      const events: { eventType: string; data: string }[] = [];
      const mockClient = {
        send: (eventType: string, data: string) => {
          events.push({ eventType, data });
        },
      };
      manager.addClient(mockClient);

      manager.broadcast('todo:created', { id: '1', title: 'Test' });

      expect(events).toHaveLength(1);
      expect(events[0]?.eventType).toBe('todo:created');
      expect(events[0]?.data).toContain('"id":"1"');
    });

    it('sends to multiple clients (UC-S07, Main Flow step 3)', () => {
      const events1: string[] = [];
      const events2: string[] = [];
      manager.addClient({
        send: (_eventType: string, data: string) => {
          events1.push(data);
        },
      });
      manager.addClient({
        send: (_eventType: string, data: string) => {
          events2.push(data);
        },
      });

      manager.broadcast('todo:updated', { id: '1' });

      expect(events1).toHaveLength(1);
      expect(events2).toHaveLength(1);
    });

    it('drops when no clients connected (UC-S07, Alt 5a)', () => {
      // Should not throw
      manager.broadcast('todo:created', { id: '1' });
      expect(manager.clientCount).toBe(0);
    });

    it('removes dead clients on write failure (UC-S07, Alt 5b)', () => {
      manager.addClient({
        send: () => {
          throw new Error('Connection closed');
        },
      });
      expect(manager.clientCount).toBe(1);

      manager.broadcast('todo:created', { id: '1' });
      expect(manager.clientCount).toBe(0);
    });
  });
});
