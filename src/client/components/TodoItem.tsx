import { useState } from 'react';
import type { Todo } from '@shared/types.js';

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: string) => void;
  onUpdate: (id: string, title: string) => void;
  onDelete?: (id: string) => void;
}

export function TodoItem({
  todo,
  onToggle,
  onUpdate,
  onDelete,
}: TodoItemProps) {
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(todo.title);

  const handleDoubleClick = () => {
    setEditing(true);
    setEditTitle(todo.title);
  };

  const handleSave = () => {
    if (editTitle.trim() && editTitle.trim() !== todo.title) {
      onUpdate(todo.id, editTitle.trim());
    }
    setEditing(false);
    setEditTitle(todo.title);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') {
      setEditing(false);
      setEditTitle(todo.title);
    }
  };

  return (
    <li data-testid={`todo-${todo.id}`}>
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => onToggle(todo.id)}
        aria-label={`Toggle ${todo.title}`}
      />
      {editing ? (
        <input
          className="edit-input"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          autoFocus
          maxLength={500}
        />
      ) : (
        <span
          className={`todo-title ${todo.completed ? 'completed' : ''}`}
          onDoubleClick={handleDoubleClick}
        >
          {todo.title}
        </span>
      )}
      {onDelete && (
        <button
          className="delete-btn"
          onClick={() => onDelete(todo.id)}
          aria-label={`Delete ${todo.title}`}
        >
          x
        </button>
      )}
    </li>
  );
}
