import { useState } from 'react';
import type { Todo } from '../../shared/types.js';

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: string, completed: boolean) => Promise<void>;
  onEdit: (id: string, title: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function TodoItem({ todo, onToggle, onEdit, onDelete }: TodoItemProps) {
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(todo.title);

  const handleToggle = () => {
    onToggle(todo.id, !todo.completed);
  };

  const handleEdit = async () => {
    const trimmed = editTitle.trim();
    if (trimmed && trimmed !== todo.title) {
      await onEdit(todo.id, trimmed);
    }
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleEdit();
    } else if (e.key === 'Escape') {
      setEditTitle(todo.title);
      setEditing(false);
    }
  };

  const startEditing = () => {
    setEditTitle(todo.title);
    setEditing(true);
  };

  return (
    <li
      className={`todo-item ${todo.completed ? 'completed' : ''}`}
      data-testid="todo-item"
    >
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={handleToggle}
        aria-label={`Mark "${todo.title}" as ${todo.completed ? 'incomplete' : 'complete'}`}
      />
      {editing ? (
        <input
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onBlur={handleEdit}
          onKeyDown={handleKeyDown}
          autoFocus
          aria-label="Edit todo title"
          className="edit-input"
        />
      ) : (
        <span
          className="todo-title"
          onDoubleClick={startEditing}
          data-testid="todo-title"
        >
          {todo.title}
        </span>
      )}
      <button
        onClick={() => onDelete(todo.id)}
        className="delete-btn"
        aria-label={`Delete "${todo.title}"`}
      >
        ×
      </button>
    </li>
  );
}
