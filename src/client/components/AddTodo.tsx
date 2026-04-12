import { useState } from 'react';

interface AddTodoProps {
  onAdd: (title: string) => Promise<unknown>;
}

export function AddTodo({ onAdd }: AddTodoProps) {
  const [title, setTitle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) {
      setError('Title is required');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await onAdd(trimmed);
      setTitle('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add todo');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="add-todo" aria-label="Add todo">
      <input
        type="text"
        value={title}
        onChange={(e) => {
          setTitle(e.target.value);
          if (error) setError(null);
        }}
        placeholder="What needs to be done?"
        aria-label="New todo title"
        disabled={submitting}
      />
      <button type="submit" disabled={submitting}>
        Add
      </button>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
