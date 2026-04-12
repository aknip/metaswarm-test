import type { Todo } from '@shared/types.js';

const BASE = '/api';

export async function fetchTodos(): Promise<Todo[]> {
  const res = await fetch(`${BASE}/todos`);
  if (!res.ok) throw new Error('Failed to fetch todos');
  return res.json();
}
