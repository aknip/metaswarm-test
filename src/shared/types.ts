export interface Todo {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTodoInput {
  title: string;
}

export interface UpdateTodoInput {
  title?: string;
  completed?: boolean;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  message: string;
  history: ChatMessage[];
}

export interface ChatResponse {
  message: string;
}

export type SSEEventType = 'todo:created' | 'todo:updated' | 'todo:deleted';

export interface SSEEvent {
  event: SSEEventType;
  data: Todo | { id: string };
}
