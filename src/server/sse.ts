import { Hono } from 'hono'
import { streamSSE } from 'hono/streaming'
import type { Todo } from '../shared/types.js'

export type SSEClient = {
  id: string
  send: (event: string, data: string) => void
}

const clients = new Set<SSEClient>()

export function getClients(): Set<SSEClient> {
  return clients
}

export function addClient(client: SSEClient): void {
  clients.add(client)
}

export function removeClient(client: SSEClient): void {
  clients.delete(client)
}

export function broadcast(event: string, data: Todo | { id: string }): void {
  const json = JSON.stringify(data)
  for (const client of clients) {
    client.send(event, json)
  }
}

export function createClientFromStream(stream: {
  writeSSE: (data: { event: string; data: string }) => Promise<void>
}): SSEClient {
  return {
    id: crypto.randomUUID(),
    send: (event, data) => {
      stream.writeSSE({ event, data }).catch(() => {})
    },
  }
}

export function createSSERouter(): Hono {
  const router = new Hono()

  /* v8 ignore start -- streamSSE callback runs inside Hono's streaming infra; logic tested via extracted functions */
  router.get('/events', (c) => {
    return streamSSE(c, async (stream) => {
      const client = createClientFromStream(stream)
      addClient(client)
      stream.onAbort(() => removeClient(client))

      while (true) {
        await stream.writeSSE({ event: 'ping', data: '' })
        await stream.sleep(30_000)
      }
    })
  })
  /* v8 ignore stop */

  return router
}
