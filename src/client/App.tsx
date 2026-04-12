import { useState, useEffect, useCallback, useRef } from 'react'
import type { Todo, ChatMessage } from '../shared/types'

const API = '/api'

function useTodos() {
  const [todos, setTodos] = useState<Todo[]>([])

  const fetchTodos = useCallback(async () => {
    const res = await fetch(`${API}/todos`)
    setTodos(await res.json())
  }, [])

  useEffect(() => {
    fetchTodos()
  }, [fetchTodos])

  useEffect(() => {
    const es = new EventSource(`${API}/sse/events`)

    es.addEventListener('created', (e) => {
      const todo: Todo = JSON.parse(e.data)
      setTodos((prev) => [todo, ...prev])
    })

    es.addEventListener('updated', (e) => {
      const todo: Todo = JSON.parse(e.data)
      setTodos((prev) => prev.map((t) => (t.id === todo.id ? todo : t)))
    })

    es.addEventListener('deleted', (e) => {
      const { id } = JSON.parse(e.data)
      setTodos((prev) => prev.filter((t) => t.id !== id))
    })

    return () => es.close()
  }, [])

  const createTodo = async (title: string) => {
    await fetch(`${API}/todos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    })
  }

  const updateTodo = async (id: string, title: string, completed: boolean) => {
    await fetch(`${API}/todos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, completed }),
    })
  }

  const deleteTodo = async (id: string) => {
    await fetch(`${API}/todos/${id}`, { method: 'DELETE' })
  }

  return { todos, createTodo, updateTodo, deleteTodo }
}

function TodoList() {
  const { todos, createTodo, updateTodo, deleteTodo } = useTodos()
  const [newTitle, setNewTitle] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) return
    createTodo(newTitle.trim())
    setNewTitle('')
  }

  const handleEdit = (todo: Todo) => {
    setEditingId(todo.id)
    setEditTitle(todo.title)
  }

  const handleSaveEdit = (id: string, completed: boolean) => {
    if (!editTitle.trim()) return
    updateTodo(id, editTitle.trim(), completed)
    setEditingId(null)
  }

  return (
    <div style={{ flex: 1 }}>
      <h2>Todos</h2>
      <form onSubmit={handleCreate} style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Add a todo..."
          data-testid="todo-input"
          style={{ flex: 1, padding: '8px', fontSize: '14px' }}
        />
        <button type="submit" data-testid="add-button" style={{ padding: '8px 16px' }}>
          Add
        </button>
      </form>
      <ul style={{ listStyle: 'none', padding: 0 }} data-testid="todo-list">
        {todos.map((todo) => (
          <li
            key={todo.id}
            data-testid={`todo-item-${todo.id}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px',
              borderBottom: '1px solid #eee',
            }}
          >
            <input
              type="checkbox"
              checked={!!todo.completed}
              onChange={() => updateTodo(todo.id, todo.title, !todo.completed)}
              data-testid={`todo-checkbox-${todo.id}`}
            />
            {editingId === todo.id ? (
              <>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveEdit(todo.id, !!todo.completed)
                    if (e.key === 'Escape') setEditingId(null)
                  }}
                  data-testid="edit-input"
                  style={{ flex: 1, padding: '4px' }}
                  autoFocus
                />
                <button onClick={() => handleSaveEdit(todo.id, !!todo.completed)} data-testid="save-button">Save</button>
                <button onClick={() => setEditingId(null)} data-testid="cancel-button">Cancel</button>
              </>
            ) : (
              <>
                <span
                  style={{
                    flex: 1,
                    textDecoration: todo.completed ? 'line-through' : 'none',
                    opacity: todo.completed ? 0.6 : 1,
                    cursor: 'pointer',
                  }}
                  onClick={() => handleEdit(todo)}
                  data-testid={`todo-title-${todo.id}`}
                >
                  {todo.title}
                </span>
                <button
                  onClick={() => deleteTodo(todo.id)}
                  data-testid={`delete-button-${todo.id}`}
                  style={{ color: 'red', border: 'none', cursor: 'pointer' }}
                >
                  Delete
                </button>
              </>
            )}
          </li>
        ))}
      </ul>
      {todos.length === 0 && <p data-testid="empty-state" style={{ color: '#999', textAlign: 'center' }}>No todos yet</p>}
    </div>
  )
}

function ChatPanel() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionId] = useState(() => crypto.randomUUID())
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMessage = input.trim()
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }])
    setLoading(true)

    try {
      const res = await fetch(`${API}/chat/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, message: userMessage }),
      })
      const data = await res.json()
      setMessages((prev) => [...prev, { role: 'assistant', content: data.response }])
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, something went wrong.' },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderLeft: '1px solid #ddd', paddingLeft: '16px' }}>
      <h2>AI Chat</h2>
      <div style={{ flex: 1, overflowY: 'auto', marginBottom: '8px' }} data-testid="chat-messages">
        {messages.map((msg, i) => (
          <div
            key={i}
            data-testid={`chat-message-${msg.role}-${i}`}
            style={{
              padding: '8px',
              margin: '4px 0',
              borderRadius: '8px',
              background: msg.role === 'user' ? '#e3f2fd' : '#f5f5f5',
            }}
          >
            <strong>{msg.role === 'user' ? 'You' : 'AI'}:</strong> {msg.content}
          </div>
        ))}
        {loading && (
          <div data-testid="chat-loading" style={{ padding: '8px', color: '#999' }}>AI is thinking...</div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSend} style={{ display: 'flex', gap: '8px' }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask the AI about your todos..."
          disabled={loading}
          data-testid="chat-input"
          style={{ flex: 1, padding: '8px', fontSize: '14px' }}
        />
        <button type="submit" disabled={loading} data-testid="chat-send" style={{ padding: '8px 16px' }}>
          Send
        </button>
      </form>
    </div>
  )
}

export function App() {
  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '16px', fontFamily: 'system-ui' }}>
      <h1 data-testid="app-title">Todo + AI Chat</h1>
      <div style={{ display: 'flex', gap: '16px' }}>
        <TodoList />
        <ChatPanel />
      </div>
    </div>
  )
}
