import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from '@hono/node-server/serve-static'
import Anthropic from '@anthropic-ai/sdk'
import { createDatabase, createTodoRepo } from './db.js'
import { createTodoRouter } from './routes.js'
import { createSSERouter } from './sse.js'
import { createChatRouter } from './chat.js'

export function createApp() {
  const db = createDatabase('todos.db')
  const repo = createTodoRepo(db)
  const client = new Anthropic()

  const app = new Hono()

  app.use('*', cors())

  app.route('/api/todos', createTodoRouter(repo))
  app.route('/api/sse', createSSERouter())
  app.route('/api/chat', createChatRouter({ client, repo }))

  // Serve static files in production
  app.use('/*', serveStatic({ root: './dist/client' }))

  return app
}

/* v8 ignore start -- server startup is integration-only */
const port = parseInt(process.env.PORT ?? '3000', 10)
const app = createApp()
serve({ fetch: app.fetch, port }, () => {
  console.log(`Server running on http://localhost:${port}`)
})
/* v8 ignore stop */
