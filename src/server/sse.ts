export interface SSEClient {
  send(eventType: string, data: string): void;
}

export class SSEManager {
  private clients = new Map<string, SSEClient>();
  private nextId = 0;

  get clientCount(): number {
    return this.clients.size;
  }

  addClient(client: SSEClient): string {
    const id = String(this.nextId++);
    this.clients.set(id, client);
    return id;
  }

  removeClient(id: string): void {
    this.clients.delete(id);
  }

  broadcast(eventType: string, data: unknown): void {
    const serialized = JSON.stringify(data);
    for (const [id, client] of this.clients) {
      try {
        client.send(eventType, serialized);
      } catch {
        this.clients.delete(id);
      }
    }
  }
}
