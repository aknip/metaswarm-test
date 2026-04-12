import type { Todo } from '@shared/types.js';

interface TodoListProps {
  todos: Todo[];
  loading: boolean;
  error: string | null;
}

export function TodoList({ todos, loading, error }: TodoListProps) {
  if (loading) return <p>Loading...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div className="todo-list">
      <h2>Todo List</h2>
      {todos.length === 0 ? (
        <p className="empty-state">No todos yet</p>
      ) : (
        <ul>
          {todos.map((todo) => (
            <li key={todo.id} data-testid={`todo-${todo.id}`}>
              <span className={todo.completed ? 'completed' : ''}>
                {todo.title}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
