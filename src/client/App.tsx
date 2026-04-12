import { TodoList } from './components/TodoList.js';
import { ChatPanel } from './components/ChatPanel.js';
import { useTodos } from './hooks/useTodos.js';
import { useChat } from './hooks/useChat.js';

export function App() {
  const { todos, loading, error, addTodo, toggleTodo, updateTodo, deleteTodo } =
    useTodos();
  const chat = useChat();

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
        <ChatPanel
          messages={chat.messages}
          loading={chat.loading}
          onSendMessage={chat.sendMessage}
        />
      </div>
    </div>
  );
}
