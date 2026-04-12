import Anthropic from '@anthropic-ai/sdk'
import type { MessageParam, ToolResultBlockParam } from '@anthropic-ai/sdk/resources/messages.js'
import { Hono } from 'hono'
import type { TodoRepo } from './db.js'
import { broadcast } from './sse.js'

const SYSTEM_PROMPT =
  'You are a helpful assistant that manages a todo list. Use the provided tools to read and modify todos. Always use tools to answer questions about todos rather than guessing.'

const todoTools: Anthropic.Tool[] = [
  {
    name: 'list_todos',
    description: 'List all todo items',
    input_schema: { type: 'object' as const, properties: {}, required: [] },
  },
  {
    name: 'get_todo',
    description: 'Get a single todo by ID',
    input_schema: {
      type: 'object' as const,
      properties: { id: { type: 'string', description: 'The todo ID' } },
      required: ['id'],
    },
  },
  {
    name: 'create_todo',
    description: 'Create a new todo item',
    input_schema: {
      type: 'object' as const,
      properties: { title: { type: 'string', description: 'The todo title' } },
      required: ['title'],
    },
  },
  {
    name: 'update_todo',
    description: 'Update an existing todo item',
    input_schema: {
      type: 'object' as const,
      properties: {
        id: { type: 'string', description: 'The todo ID' },
        title: { type: 'string', description: 'New title' },
        completed: { type: 'boolean', description: 'Completion status' },
      },
      required: ['id'],
    },
  },
  {
    name: 'delete_todo',
    description: 'Delete a todo item',
    input_schema: {
      type: 'object' as const,
      properties: { id: { type: 'string', description: 'The todo ID' } },
      required: ['id'],
    },
  },
]

export function executeTool(
  repo: TodoRepo,
  name: string,
  input: Record<string, unknown>
): string {
  switch (name) {
    case 'list_todos':
      return JSON.stringify(repo.list())
    case 'get_todo': {
      const todo = repo.get(input.id as string)
      return todo ? JSON.stringify(todo) : JSON.stringify({ error: 'Not found' })
    }
    case 'create_todo': {
      const todo = repo.create(input.title as string)
      broadcast('created', todo)
      return JSON.stringify(todo)
    }
    case 'update_todo': {
      const existing = repo.get(input.id as string)
      if (!existing) return JSON.stringify({ error: 'Not found' })
      const title = (input.title as string) ?? existing.title
      const completed = (input.completed as boolean) ?? !!existing.completed
      const todo = repo.update(input.id as string, title, completed)
      broadcast('updated', todo!)
      return JSON.stringify(todo)
    }
    case 'delete_todo': {
      const todo = repo.delete(input.id as string)
      if (!todo) return JSON.stringify({ error: 'Not found' })
      broadcast('deleted', { id: todo.id })
      return JSON.stringify({ deleted: true })
    }
    default:
      return JSON.stringify({ error: `Unknown tool: ${name}` })
  }
}

export interface ChatDeps {
  client: Anthropic
  repo: TodoRepo
}

const sessions = new Map<string, MessageParam[]>()

export function getSessions(): Map<string, MessageParam[]> {
  return sessions
}

export function createChatRouter(deps: ChatDeps): Hono {
  const { client, repo } = deps
  const router = new Hono()

  router.post('/message', async (c) => {
    const { sessionId, message } = await c.req.json<{
      sessionId: string
      message: string
    }>()

    if (!sessionId || !message) {
      return c.json({ error: 'sessionId and message are required' }, 400)
    }

    const messages: MessageParam[] = sessions.get(sessionId) ?? []
    messages.push({ role: 'user', content: message })

    let response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      tools: todoTools,
      messages,
    })

    // Tool use loop: keep calling tools until we get a final text response
    while (response.stop_reason === 'tool_use') {
      const assistantContent = response.content
      messages.push({ role: 'assistant', content: assistantContent })

      const toolResults: ToolResultBlockParam[] = []
      for (const block of assistantContent) {
        if (block.type === 'tool_use') {
          const result = executeTool(repo, block.name, block.input as Record<string, unknown>)
          toolResults.push({
            type: 'tool_result',
            tool_use_id: block.id,
            content: result,
          })
        }
      }

      messages.push({ role: 'user', content: toolResults })

      response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        tools: todoTools,
        messages,
      })
    }

    // Extract final text
    const textContent = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('')

    messages.push({ role: 'assistant', content: response.content })
    sessions.set(sessionId, messages)

    return c.json({ response: textContent })
  })

  return router
}
