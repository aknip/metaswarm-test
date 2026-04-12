import type { ChatMessage as ChatMessageType } from '../../shared/types.js';

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  return (
    <div className={`chat-message ${message.role}`} data-testid="chat-message">
      <span className="chat-role">
        {message.role === 'user' ? 'You' : 'AI'}
      </span>
      <p className="chat-content">{message.content}</p>
    </div>
  );
}
