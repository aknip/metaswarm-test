import type { ChatMessage as ChatMessageType } from '@shared/types.js';

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  return (
    <div className={`chat-message ${message.role}`}>
      <p>{message.content}</p>
    </div>
  );
}
