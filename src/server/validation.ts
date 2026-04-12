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
