import { TodoList } from './components/TodoList.js';
import { ChatPanel } from './components/ChatPanel.js';
import { useTodos } from './hooks/useTodos.js';
import { useSSE } from './hooks/useSSE.js';
import { useChat } from './hooks/useChat.js';
import './App.css';

export function App() {
  const {
    todos,
    loading,
    error,
    addTodo,
    toggleTodo,
    editTodo,
    removeTodo,
    handleSSEEvent,
    refreshTodos,
  } = useTodos();

  const chat = useChat();

  useSSE(handleSSEEvent, refreshTodos);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Todo List with AI Chat</h1>
      </header>
      <main className="app-main">
        <TodoList
          todos={todos}
          loading={loading}
          error={error}
          onAdd={addTodo}
          onToggle={toggleTodo}
          onEdit={editTodo}
          onDelete={removeTodo}
        />
        <ChatPanel
          messages={chat.messages}
          loading={chat.loading}
          error={chat.error}
          onSend={chat.sendMessage}
          onClear={chat.clearChat}
        />
      </main>
    </div>
  );
}
