import Database from 'better-sqlite3'
import type { Todo } from '../shared/types.js'

export function createDatabase(path: string = 'todos.db'): Database.Database {
  const db = new Database(path)
  db.pragma('journal_mode = WAL')
  db.exec(`
    CREATE TABLE IF NOT EXISTS todos (
      id         TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
      title      TEXT NOT NULL,
      completed  INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)
  return db
}

export function createTodoRepo(db: Database.Database) {
  const listStmt = db.prepare<[], Todo>('SELECT * FROM todos ORDER BY created_at DESC, rowid DESC')
  const getStmt = db.prepare<[string], Todo>('SELECT * FROM todos WHERE id = ?')
  const insertStmt = db.prepare<[string], Todo>(
    `INSERT INTO todos (title) VALUES (?) RETURNING *`
  )
  const updateStmt = db.prepare<[string, number, string], Todo>(
    `UPDATE todos SET title = ?, completed = ?, updated_at = datetime('now') WHERE id = ? RETURNING *`
  )
  const deleteStmt = db.prepare<[string], Todo>(
    'DELETE FROM todos WHERE id = ? RETURNING *'
  )

  return {
    list(): Todo[] {
      return listStmt.all()
    },

    get(id: string): Todo | undefined {
      return getStmt.get(id)
    },

    create(title: string): Todo {
      return insertStmt.get(title)!
    },

    update(id: string, title: string, completed: boolean): Todo | undefined {
      return updateStmt.get(title, completed ? 1 : 0, id)
    },

    delete(id: string): Todo | undefined {
      return deleteStmt.get(id)
    },
  }
}

export type TodoRepo = ReturnType<typeof createTodoRepo>
