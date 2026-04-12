const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function validateUUID(id: string): string {
  if (!UUID_REGEX.test(id)) {
    throw new Error('Invalid ID format');
  }
  return id;
}

export function validateChatMessages(body: unknown): {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
} {
  const obj = body as Record<string, unknown>;
  if (!obj || !Array.isArray(obj.messages)) {
    throw new Error('Messages array is required');
  }
  if (obj.messages.length === 0) {
    throw new Error('Messages array must not be empty');
  }
  if (obj.messages.length > 50) {
    throw new Error('Messages array must not exceed 50 messages');
  }
  for (const msg of obj.messages) {
    const m = msg as Record<string, unknown>;
    if (m.role !== 'user' && m.role !== 'assistant') {
      throw new Error('Invalid message role');
    }
    if (typeof m.content !== 'string' || m.content.trim().length === 0) {
      throw new Error('Message content must be a non-empty string');
    }
  }
  return obj as {
    messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  };
}

export function validateCreateTodo(body: unknown): { title: string } {
  const obj = body as Record<string, unknown>;
  if (!obj || typeof obj.title !== 'string' || obj.title.trim().length === 0) {
    throw new Error('Title is required');
  }
  if (obj.title.trim().length > 500) {
    throw new Error('Title must be 500 characters or less');
  }
  return { title: obj.title.trim() };
}

export function validateUpdateTodo(body: unknown): {
  title?: string;
  completed?: boolean;
} {
  const obj = body as Record<string, unknown>;
  const result: { title?: string; completed?: boolean } = {};

  if (obj.title !== undefined) {
    if (typeof obj.title !== 'string' || obj.title.trim().length === 0) {
      throw new Error('Title is required');
    }
    if (obj.title.trim().length > 500) {
      throw new Error('Title must be 500 characters or less');
    }
    result.title = obj.title.trim();
  }

  if (obj.completed !== undefined) {
    if (typeof obj.completed !== 'boolean') {
      throw new Error('Completed must be a boolean');
    }
    result.completed = obj.completed;
  }

  if (result.title === undefined && result.completed === undefined) {
    throw new Error('No fields to update');
  }

  return result;
}
