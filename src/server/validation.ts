const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const MAX_TITLE_LENGTH = 500;

export interface ValidationError {
  field: string;
  message: string;
}

export function validateTitle(
  title: unknown
): { valid: true; value: string } | { valid: false; error: ValidationError } {
  if (title === undefined || title === null) {
    return {
      valid: false,
      error: { field: 'title', message: 'Title is required' },
    };
  }
  if (typeof title !== 'string') {
    return {
      valid: false,
      error: { field: 'title', message: 'Title must be a string' },
    };
  }
  const trimmed = title.trim();
  if (trimmed.length === 0) {
    return {
      valid: false,
      error: { field: 'title', message: 'Title cannot be empty' },
    };
  }
  if (trimmed.length > MAX_TITLE_LENGTH) {
    return {
      valid: false,
      error: {
        field: 'title',
        message: `Title cannot exceed ${MAX_TITLE_LENGTH} characters`,
      },
    };
  }
  return { valid: true, value: trimmed };
}

export function validateUUID(
  id: unknown
): { valid: true; value: string } | { valid: false; error: ValidationError } {
  if (typeof id !== 'string') {
    return {
      valid: false,
      error: { field: 'id', message: 'ID must be a string' },
    };
  }
  if (!UUID_REGEX.test(id)) {
    return {
      valid: false,
      error: { field: 'id', message: 'ID must be a valid UUID' },
    };
  }
  return { valid: true, value: id };
}

export function validateCompleted(
  completed: unknown
): { valid: true; value: boolean } | { valid: false; error: ValidationError } {
  if (completed === undefined) {
    return { valid: true, value: false };
  }
  if (typeof completed !== 'boolean') {
    return {
      valid: false,
      error: { field: 'completed', message: 'Completed must be a boolean' },
    };
  }
  return { valid: true, value: completed };
}
