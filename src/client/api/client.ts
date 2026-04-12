import type { Todo } from '@shared/types.js';

const BASE = '/api';

export async function fetchTodos(): Promise<Todo[]> {
  const res = await fetch(`${BASE}/todos`);
  if (!res.ok) throw new Error('Failed to fetch todos');
  return res.json();
}

export async function createTodo(title: string): Promise<Todo> {
  const res = await fetch(`${BASE}/todos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error('Failed to create todo');
  return res.json();
}

export async function toggleTodo(id: string): Promise<Todo> {
  const res = await fetch(`${BASE}/todos/${id}/toggle`, {
    method: 'PATCH',
  });
  if (!res.ok) throw new Error('Failed to toggle todo');
  return res.json();
}

export async function updateTodo(id: string, title: string): Promise<Todo> {
  const res = await fetch(`${BASE}/todos/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error('Failed to update todo');
  return res.json();
}

export async function deleteTodo(id: string): Promise<void> {
  const res = await fetch(`${BASE}/todos/${id}`, { method: 'DELETE' });
  if (!res.ok && res.status !== 404) throw new Error('Failed to delete todo');
}
