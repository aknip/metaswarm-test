import type { SSEEvent } from '../shared/types.js';

type SSEClient = {
  send: (data: string) => void;
  close: () => void;
};

const clients = new Set<SSEClient>();

export function addClient(client: SSEClient): void {
  clients.add(client);
}

export function removeClient(client: SSEClient): void {
  clients.delete(client);
}

export function getClientCount(): number {
  return clients.size;
}

export function broadcast(event: SSEEvent): void {
  const message = `event: ${event.event}\ndata: ${JSON.stringify(event.data)}\n\n`;
  for (const client of clients) {
    try {
      client.send(message);
    } catch {
      clients.delete(client);
    }
  }
}

export function clearClients(): void {
  clients.clear();
}
