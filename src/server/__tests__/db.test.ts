import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createDatabase, getAllTodos } from '../db.js';
import Database from 'better-sqlite3';
import { unlinkSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { randomUUID } from 'crypto';

describe('Database Layer (UC-S10)', () => {
  let db: Database.Database;

  beforeEach(() => {
    db = new Database(':memory:');
    createDatabase(db);
  });

  describe('createDatabase (UC-S10, Main Flow step 2)', () => {
    it('creates the todos table', () => {
      const tables = db
        .prepare(
          "SELECT name FROM sqlite_master WHERE type='table' AND name='todos'"
        )
        .all();
      expect(tables).toHaveLength(1);
    });

    it('enables WAL mode', () => {
      const dbPath = join(tmpdir(), `test-${randomUUID()}.db`);
      const fileDb = new Database(dbPath);
      createDatabase(fileDb);
      const result = fileDb.pragma('journal_mode') as {
        journal_mode: string;
      }[];
      expect(result[0]?.journal_mode).toBe('wal');
      fileDb.close();
      try {
        unlinkSync(dbPath);
        unlinkSync(dbPath + '-wal');
        unlinkSync(dbPath + '-shm');
      } catch (_e) {
        // cleanup best-effort
      }
    });
  });

  describe('getAllTodos (UC-S10, used by UC-S02)', () => {
    it('returns empty array when no todos exist (UC-S02, Alt 5a)', () => {
      const todos = getAllTodos(db);
      expect(todos).toEqual([]);
    });
  });

  afterEach(() => {
    db.close();
  });
});
