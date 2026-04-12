import Database from 'better-sqlite3';
import { randomUUID } from 'crypto';
import type { Todo } from '@shared/types.js';

export function createDatabase(db: Database.Database): void {
  db.pragma('journal_mode = WAL');
  db.exec(`
    CREATE TABLE IF NOT EXISTS todos (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
}

interface TodoRow {
  id: string;
  title: string;
  completed: number;
  created_at: string;
  updated_at: string;
}

function rowToTodo(row: TodoRow): Todo {
  return {
    id: row.id,
    title: row.title,
    completed: row.completed === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function getAllTodos(db: Database.Database): Todo[] {
  const rows = db
    .prepare('SELECT * FROM todos ORDER BY created_at ASC')
    .all() as TodoRow[];
  return rows.map(rowToTodo);
}

export function getTodoById(
  db: Database.Database,
  id: string
): Todo | undefined {
  const row = db.prepare('SELECT * FROM todos WHERE id = ?').get(id) as
    | TodoRow
    | undefined;
  return row ? rowToTodo(row) : undefined;
}

export function createTodo(db: Database.Database, title: string): Todo {
  const id = randomUUID();
  const now = new Date().toISOString();
  db.prepare(
    'INSERT INTO todos (id, title, completed, created_at, updated_at) VALUES (?, ?, 0, ?, ?)'
  ).run(id, title.trim(), now, now);
  return {
    id,
    title: title.trim(),
    completed: false,
    createdAt: now,
    updatedAt: now,
  };
}

export function updateTodo(
  db: Database.Database,
  id: string,
  fields: { title?: string; completed?: boolean }
): Todo | undefined {
  const existing = getTodoById(db, id);
  if (!existing) return undefined;

  const title =
    fields.title !== undefined ? fields.title.trim() : existing.title;
  const completed =
    fields.completed !== undefined ? fields.completed : existing.completed;
  const now = new Date().toISOString();

  db.prepare(
    'UPDATE todos SET title = ?, completed = ?, updated_at = ? WHERE id = ?'
  ).run(title, completed ? 1 : 0, now, id);

  return {
    id,
    title,
    completed,
    createdAt: existing.createdAt,
    updatedAt: now,
  };
}

export function deleteTodo(db: Database.Database, id: string): boolean {
  const result = db.prepare('DELETE FROM todos WHERE id = ?').run(id);
  return result.changes > 0;
}

export function toggleTodo(
  db: Database.Database,
  id: string
): Todo | undefined {
  const row = db
    .prepare(
      "UPDATE todos SET completed = NOT completed, updated_at = datetime('now') WHERE id = ? RETURNING *"
    )
    .get(id) as TodoRow | undefined;
  return row ? rowToTodo(row) : undefined;
}
