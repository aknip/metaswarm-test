import { useEffect, useRef } from 'react';
import type { Todo } from '../../shared/types.js';

type SSEHandler = (eventType: string, data: Todo | { id: string }) => void;

export function useSSE(onEvent: SSEHandler, onReconnect?: () => void) {
  const handlerRef = useRef(onEvent);
  const reconnectRef = useRef(onReconnect);
  handlerRef.current = onEvent;
  reconnectRef.current = onReconnect;

  useEffect(() => {
    const eventSource = new EventSource('/api/todos/events');

    const handleEvent = (type: string) => (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data as string);
        handlerRef.current(type, data);
      } catch {
        // Ignore malformed events
      }
    };

    eventSource.addEventListener('todo:created', handleEvent('todo:created'));
    eventSource.addEventListener('todo:updated', handleEvent('todo:updated'));
    eventSource.addEventListener('todo:deleted', handleEvent('todo:deleted'));

    eventSource.onerror = () => {
      // EventSource will automatically reconnect
      // On reconnect, refetch full state
      if (eventSource.readyState === EventSource.CONNECTING) {
        reconnectRef.current?.();
      }
    };

    return () => {
      eventSource.close();
    };
  }, []);
}
