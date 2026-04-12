import type { Todo, ChatMessage, ChatResponse } from '../../shared/types.js';

const API_BASE = '/api';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(
      (body as { error?: string | { message: string } }).error
        ? typeof (body as { error: string | { message: string } }).error ===
          'string'
          ? ((body as { error: string }).error as string)
          : (
              (body as { error: { message: string } }).error as {
                message: string;
              }
            ).message
        : `HTTP ${response.status}`
    );
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return response.json() as Promise<T>;
}

export async function fetchTodos(): Promise<Todo[]> {
  const response = await fetch(`${API_BASE}/todos`);
  return handleResponse<Todo[]>(response);
}

export async function createTodo(title: string): Promise<Todo> {
  const response = await fetch(`${API_BASE}/todos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  });
  return handleResponse<Todo>(response);
}

export async function updateTodo(
  id: string,
  updates: { title?: string; completed?: boolean }
): Promise<Todo> {
  const response = await fetch(`${API_BASE}/todos/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  return handleResponse<Todo>(response);
}

export async function deleteTodo(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/todos/${id}`, {
    method: 'DELETE',
  });
  return handleResponse<void>(response);
}

export async function sendChatMessage(
  message: string,
  history: ChatMessage[]
): Promise<ChatResponse> {
  const response = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history }),
  });
  return handleResponse<ChatResponse>(response);
}
