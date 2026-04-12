import { useState, useEffect, useCallback } from 'react';
import type { Todo } from '../../shared/types.js';
import * as api from '../api/client.js';

export function useTodos() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTodos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.fetchTodos();
      setTodos(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load todos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTodos();
  }, [loadTodos]);

  const addTodo = useCallback(async (title: string) => {
    const todo = await api.createTodo(title);
    // Dedup: SSE event may have already added this todo
    setTodos((prev) =>
      prev.some((t) => t.id === todo.id) ? prev : [...prev, todo]
    );
    return todo;
  }, []);

  const toggleTodo = useCallback(async (id: string, completed: boolean) => {
    const updated = await api.updateTodo(id, { completed });
    setTodos((prev) => prev.map((t) => (t.id === id ? updated : t)));
  }, []);

  const editTodo = useCallback(async (id: string, title: string) => {
    const updated = await api.updateTodo(id, { title });
    setTodos((prev) => prev.map((t) => (t.id === id ? updated : t)));
  }, []);

  const removeTodo = useCallback(async (id: string) => {
    await api.deleteTodo(id);
    setTodos((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleSSEEvent = useCallback(
    (eventType: string, data: Todo | { id: string }) => {
      switch (eventType) {
        case 'todo:created':
          setTodos((prev) => {
            const todo = data as Todo;
            if (prev.some((t) => t.id === todo.id)) return prev;
            return [...prev, todo];
          });
          break;
        case 'todo:updated':
          setTodos((prev) =>
            prev.map((t) => (t.id === (data as Todo).id ? (data as Todo) : t))
          );
          break;
        case 'todo:deleted':
          setTodos((prev) =>
            prev.filter((t) => t.id !== (data as { id: string }).id)
          );
          break;
      }
    },
    []
  );

  return {
    todos,
    loading,
    error,
    addTodo,
    toggleTodo,
    editTodo,
    removeTodo,
    handleSSEEvent,
    refreshTodos: loadTodos,
  };
}
