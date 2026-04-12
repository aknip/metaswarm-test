export interface Todo {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
}

export interface ChatResponse {
  response: string;
  messages: ChatMessage[];
}

export type SSEEvent =
  | { type: 'todo:created'; data: Todo }
  | { type: 'todo:updated'; data: Todo }
  | { type: 'todo:deleted'; data: { id: string } };

export interface ApiError {
  error: string;
}
