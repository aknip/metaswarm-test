import type { Todo } from '../../shared/types.js';
import { TodoItem } from './TodoItem.js';
import { AddTodo } from './AddTodo.js';

interface TodoListProps {
  todos: Todo[];
  loading: boolean;
  error: string | null;
  onAdd: (title: string) => Promise<unknown>;
  onToggle: (id: string, completed: boolean) => Promise<void>;
  onEdit: (id: string, title: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function TodoList({
  todos,
  loading,
  error,
  onAdd,
  onToggle,
  onEdit,
  onDelete,
}: TodoListProps) {
  return (
    <div className="todo-list-container">
      <h2>Todos</h2>
      <AddTodo onAdd={onAdd} />
      {loading && <p className="loading">Loading todos...</p>}
      {error && <p className="error">{error}</p>}
      {!loading && !error && todos.length === 0 && (
        <p className="empty-state" data-testid="empty-state">
          No todos yet. Add one above!
        </p>
      )}
      {todos.length > 0 && (
        <ul className="todo-list" aria-label="Todo list">
          {todos.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              onToggle={onToggle}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
