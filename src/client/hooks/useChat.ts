import { useState, useCallback } from 'react';
import type { ChatMessage } from '@shared/types.js';
import { sendChatMessage } from '../api/client.js';

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(
    async (content: string) => {
      const userMessage: ChatMessage = { role: 'user', content };
      const updated = [...messages, userMessage].slice(-50);
      setMessages(updated);
      setLoading(true);
      setError(null);

      try {
        const result = await sendChatMessage(updated);
        setMessages(result.messages.slice(-50));
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Unknown error');
        const errorMsg: ChatMessage = {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setLoading(false);
      }
    },
    [messages]
  );

  return { messages, loading, error, sendMessage };
}
