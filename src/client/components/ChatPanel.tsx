import { useState, useRef, useEffect } from 'react';
import type { ChatMessage as ChatMessageType } from '../../shared/types.js';
import { ChatMessage } from './ChatMessage.js';

interface ChatPanelProps {
  messages: ChatMessageType[];
  loading: boolean;
  error: string | null;
  onSend: (message: string) => Promise<void>;
  onClear: () => void;
}

export function ChatPanel({
  messages,
  loading,
  error,
  onSend,
  onClear,
}: ChatPanelProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || loading) return;
    setInput('');
    await onSend(trimmed);
  };

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <h2>AI Chat</h2>
        {messages.length > 0 && (
          <button
            onClick={onClear}
            className="clear-btn"
            aria-label="Clear chat"
          >
            Clear
          </button>
        )}
      </div>
      <div className="chat-messages" aria-label="Chat messages">
        {messages.length === 0 && (
          <p className="chat-empty">
            Ask me to manage your todos! Try "Add a todo to buy groceries"
          </p>
        )}
        {messages.map((msg, i) => (
          <ChatMessage key={i} message={msg} />
        ))}
        {loading && (
          <div className="chat-loading" data-testid="chat-loading">
            AI is thinking...
          </div>
        )}
        {error && <p className="chat-error">{error}</p>}
        <div ref={messagesEndRef} />
      </div>
      <form
        onSubmit={handleSubmit}
        className="chat-input-form"
        aria-label="Send message"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask AI to manage your todos..."
          aria-label="Chat message"
          disabled={loading}
        />
        <button type="submit" disabled={loading || !input.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}
