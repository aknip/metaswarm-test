import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  getClients,
  addClient,
  removeClient,
  broadcast,
  createClientFromStream,
  createSSERouter,
  type SSEClient,
} from './sse.js'

function makeClient(id = 'test-client'): SSEClient {
  return {
    id,
    send: vi.fn(),
  }
}

describe('SSE client management', () => {
  beforeEach(() => {
    for (const c of getClients()) {
      removeClient(c)
    }
  })

  it('starts with no clients', () => {
    expect(getClients().size).toBe(0)
  })

  it('adds a client', () => {
    const client = makeClient()
    addClient(client)
    expect(getClients().size).toBe(1)
    expect(getClients().has(client)).toBe(true)
  })

  it('removes a client', () => {
    const client = makeClient()
    addClient(client)
    removeClient(client)
    expect(getClients().size).toBe(0)
  })
})

describe('broadcast', () => {
  beforeEach(() => {
    for (const c of getClients()) {
      removeClient(c)
    }
  })

  it('sends event to all connected clients', () => {
    const client1 = makeClient('c1')
    const client2 = makeClient('c2')
    addClient(client1)
    addClient(client2)

    const todo = { id: '1', title: 'Test', completed: 0, created_at: '', updated_at: '' }
    broadcast('created', todo)

    expect(client1.send).toHaveBeenCalledWith('created', JSON.stringify(todo))
    expect(client2.send).toHaveBeenCalledWith('created', JSON.stringify(todo))
  })

  it('sends delete event with id only', () => {
    const client = makeClient()
    addClient(client)

    broadcast('deleted', { id: '123' })
    expect(client.send).toHaveBeenCalledWith('deleted', JSON.stringify({ id: '123' }))
  })

  it('handles no clients gracefully', () => {
    expect(() =>
      broadcast('created', { id: '1', title: 'Test', completed: 0, created_at: '', updated_at: '' })
    ).not.toThrow()
  })
})

describe('createClientFromStream', () => {
  it('creates a client that wraps stream.writeSSE', () => {
    const mockStream = {
      writeSSE: vi.fn().mockResolvedValue(undefined),
    }
    const client = createClientFromStream(mockStream as any)

    expect(client.id).toBeTruthy()
    client.send('created', '{"id":"1"}')

    expect(mockStream.writeSSE).toHaveBeenCalledWith({
      event: 'created',
      data: '{"id":"1"}',
    })
  })

  it('catches writeSSE errors silently', async () => {
    const mockStream = {
      writeSSE: vi.fn().mockRejectedValue(new Error('stream closed')),
    }
    const client = createClientFromStream(mockStream as any)

    expect(() => client.send('created', '{}')).not.toThrow()
    // wait for the promise rejection to be caught
    await new Promise((r) => setTimeout(r, 10))
  })
})

describe('createSSERouter', () => {
  it('creates a Hono router with /events endpoint', async () => {
    const router = createSSERouter()
    const res = await router.request('/events')
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('text/event-stream')
  })
})
