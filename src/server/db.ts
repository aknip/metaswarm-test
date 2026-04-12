import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import type {
  Todo,
  CreateTodoInput,
  UpdateTodoInput,
} from '../shared/types.js';

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized. Call initDb() first.');
  }
  return db;
}

export function initDb(dbPath: string = 'todos.db'): Database.Database {
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS todos (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `);

  return db;
}

export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}

function rowToTodo(row: Record<string, unknown>): Todo {
  return {
    id: row.id as string,
    title: row.title as string,
    completed: (row.completed as number) === 1,
    createdAt: row.createdAt as string,
    updatedAt: row.updatedAt as string,
  };
}

export function createTodo(input: CreateTodoInput): Todo {
  const database = getDb();
  const id = uuidv4();
  const now = new Date().toISOString();

  const stmt = database.prepare(
    'INSERT INTO todos (id, title, completed, createdAt, updatedAt) VALUES (?, ?, 0, ?, ?)'
  );
  stmt.run(id, input.title.trim(), now, now);

  return {
    id,
    title: input.title.trim(),
    completed: false,
    createdAt: now,
    updatedAt: now,
  };
}

export function getAllTodos(): Todo[] {
  const database = getDb();
  const rows = database
    .prepare('SELECT * FROM todos ORDER BY createdAt ASC')
    .all() as Record<string, unknown>[];
  return rows.map(rowToTodo);
}

export function getTodoById(id: string): Todo | undefined {
  const database = getDb();
  const row = database.prepare('SELECT * FROM todos WHERE id = ?').get(id) as
    | Record<string, unknown>
    | undefined;
  return row ? rowToTodo(row) : undefined;
}

export function updateTodo(
  id: string,
  input: UpdateTodoInput
): Todo | undefined {
  const database = getDb();
  const existing = getTodoById(id);
  if (!existing) {
    return undefined;
  }

  const now = new Date().toISOString();
  const title = input.title !== undefined ? input.title.trim() : existing.title;
  const completed =
    input.completed !== undefined ? input.completed : existing.completed;

  const stmt = database.prepare(
    'UPDATE todos SET title = ?, completed = ?, updatedAt = ? WHERE id = ?'
  );
  stmt.run(title, completed ? 1 : 0, now, id);

  return {
    id,
    title,
    completed,
    createdAt: existing.createdAt,
    updatedAt: now,
  };
}

export function deleteTodo(id: string): boolean {
  const database = getDb();
  const result = database.prepare('DELETE FROM todos WHERE id = ?').run(id);
  return result.changes > 0;
}
