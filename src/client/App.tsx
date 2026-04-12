import { TodoList } from './components/TodoList.js';
import { useTodos } from './hooks/useTodos.js';

export function App() {
  const { todos, loading, error, addTodo, toggleTodo, updateTodo, deleteTodo } =
    useTodos();

  return (
    <div className="app">
      <h1>Todo + AI Chat</h1>
      <div className="panels">
        <TodoList
          todos={todos}
          loading={loading}
          error={error}
          onTodoCreated={addTodo}
          onToggle={toggleTodo}
          onUpdate={updateTodo}
          onDelete={deleteTodo}
        />
      </div>
    </div>
  );
}
