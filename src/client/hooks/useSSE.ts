import { useEffect, useRef } from 'react';
import type { SSEEvent } from '@shared/types.js';

export function useSSE(
  onEvent: (event: SSEEvent) => void,
  onReconnect: () => void
) {
  const onEventRef = useRef(onEvent);
  const onReconnectRef = useRef(onReconnect);
  onEventRef.current = onEvent;
  onReconnectRef.current = onReconnect;

  useEffect(() => {
    const es = new EventSource('/api/events');

    const handleEvent = (type: SSEEvent['type']) => (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        onEventRef.current({ type, data } as SSEEvent);
      } catch {
        // Ignore malformed events
      }
    };

    es.addEventListener('todo:created', handleEvent('todo:created'));
    es.addEventListener('todo:updated', handleEvent('todo:updated'));
    es.addEventListener('todo:deleted', handleEvent('todo:deleted'));

    es.onerror = () => {
      // EventSource auto-reconnects; refetch state on reconnect
      if (es.readyState === EventSource.CONNECTING) {
        onReconnectRef.current();
      }
    };

    return () => es.close();
  }, []);
}
