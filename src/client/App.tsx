import { TodoList } from './components/TodoList.js';
import { useTodos } from './hooks/useTodos.js';

export function App() {
  const { todos, loading, error } = useTodos();

  return (
    <div className="app">
      <h1>Todo + AI Chat</h1>
      <div className="panels">
        <TodoList todos={todos} loading={loading} error={error} />
      </div>
    </div>
  );
}
