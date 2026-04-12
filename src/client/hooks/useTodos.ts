import { useState, useEffect, useCallback } from 'react';
import type { Todo } from '@shared/types.js';
import {
  fetchTodos,
  toggleTodo as apiToggleTodo,
  updateTodo as apiUpdateTodo,
  deleteTodo as apiDeleteTodo,
} from '../api/client.js';

export function useTodos() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTodos = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchTodos();
      setTodos(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTodos();
  }, [loadTodos]);

  const addTodo = useCallback((todo: Todo) => {
    setTodos((prev) => [...prev, todo]);
  }, []);

  const toggleTodoItem = useCallback(async (id: string) => {
    const updated = await apiToggleTodo(id);
    setTodos((prev) => prev.map((t) => (t.id === id ? updated : t)));
  }, []);

  const updateTodoItem = useCallback(async (id: string, title: string) => {
    const updated = await apiUpdateTodo(id, title);
    setTodos((prev) => prev.map((t) => (t.id === id ? updated : t)));
  }, []);

  const deleteTodoItem = useCallback(async (id: string) => {
    await apiDeleteTodo(id);
    setTodos((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return {
    todos,
    loading,
    error,
    setTodos,
    loadTodos,
    addTodo,
    toggleTodo: toggleTodoItem,
    updateTodo: updateTodoItem,
    deleteTodo: deleteTodoItem,
  };
}
