import { useState } from 'react';
import type { ChatMessage as ChatMessageType } from '@shared/types.js';
import { ChatMessage } from './ChatMessage.js';

interface ChatPanelProps {
  messages: ChatMessageType[];
  loading: boolean;
  onSendMessage: (content: string) => void;
}

export function ChatPanel({
  messages,
  loading,
  onSendMessage,
}: ChatPanelProps) {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    onSendMessage(input.trim());
    setInput('');
  };

  return (
    <div className="chat-panel">
      <h2>AI Chat</h2>
      <div className="chat-messages">
        {messages.length === 0 && (
          <p className="empty-state">Ask me to manage your todos!</p>
        )}
        {messages.map((msg, i) => (
          <ChatMessage key={i} message={msg} />
        ))}
        {loading && <p className="loading">Thinking...</p>}
      </div>
      <form className="chat-form" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
        />
        <button type="submit" disabled={loading || !input.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}
