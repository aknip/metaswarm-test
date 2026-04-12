import { useState } from 'react';
import type { Todo } from '@shared/types.js';
import { createTodo as apiCreateTodo } from '../api/client.js';
import { TodoItem } from './TodoItem.js';

interface TodoListProps {
  todos: Todo[];
  loading: boolean;
  error: string | null;
  onTodoCreated: (todo: Todo) => void;
  onToggle: (id: string) => void;
  onUpdate: (id: string, title: string) => void;
  onDelete?: (id: string) => void;
}

export function TodoList({
  todos,
  loading,
  error,
  onTodoCreated,
  onToggle,
  onUpdate,
  onDelete,
}: TodoListProps) {
  const [title, setTitle] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const todo = await apiCreateTodo(title.trim());
    onTodoCreated(todo);
    setTitle('');
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div className="todo-list">
      <h2>Todo List</h2>
      <form className="todo-form" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Add a todo..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={500}
        />
        <button type="submit">Add</button>
      </form>
      {todos.length === 0 ? (
        <p className="empty-state">No todos yet</p>
      ) : (
        <ul>
          {todos.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              onToggle={onToggle}
              onUpdate={onUpdate}
              onDelete={onDelete}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
