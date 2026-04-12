export interface Todo {
  id: string
  title: string
  completed: number
  created_at: string
  updated_at: string
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export type TodoEvent =
  | { event: 'created'; data: Todo }
  | { event: 'updated'; data: Todo }
  | { event: 'deleted'; data: { id: string } }
