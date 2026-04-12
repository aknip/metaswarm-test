import { Hono } from 'hono'
import { z } from 'zod'
import type { TodoRepo } from './db.js'
import { broadcast } from './sse.js'

const CreateTodoSchema = z.object({
  title: z.string().min(1, 'Title is required'),
})

const UpdateTodoSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  completed: z.boolean(),
})

export function createTodoRouter(repo: TodoRepo): Hono {
  const router = new Hono()

  router.get('/', (c) => {
    return c.json(repo.list())
  })

  router.get('/:id', (c) => {
    const todo = repo.get(c.req.param('id'))
    if (!todo) {
      return c.json({ error: 'Todo not found' }, 404)
    }
    return c.json(todo)
  })

  router.post('/', async (c) => {
    const body = await c.req.json()
    const parsed = CreateTodoSchema.safeParse(body)
    if (!parsed.success) {
      return c.json({ error: parsed.error.issues[0].message }, 400)
    }
    const todo = repo.create(parsed.data.title)
    broadcast('created', todo)
    return c.json(todo, 201)
  })

  router.patch('/:id', async (c) => {
    const id = c.req.param('id')
    const existing = repo.get(id)
    if (!existing) {
      return c.json({ error: 'Todo not found' }, 404)
    }
    const body = await c.req.json()
    const parsed = UpdateTodoSchema.safeParse(body)
    if (!parsed.success) {
      return c.json({ error: parsed.error.issues[0].message }, 400)
    }
    const todo = repo.update(id, parsed.data.title, parsed.data.completed)
    broadcast('updated', todo!)
    return c.json(todo)
  })

  router.delete('/:id', (c) => {
    const id = c.req.param('id')
    const todo = repo.delete(id)
    if (!todo) {
      return c.json({ error: 'Todo not found' }, 404)
    }
    broadcast('deleted', { id: todo.id })
    return c.json({ id: todo.id })
  })

  return router
}
