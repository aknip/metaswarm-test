import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { createDatabase, createTodo } from '../db.js';
import { executeTool, TOOL_DEFINITIONS } from '../ai/tools.js';
import { SSEManager } from '../sse.js';

describe('AI Tool Execution (UC-S09)', () => {
  let db: Database.Database;
  let sseManager: SSEManager;

  beforeEach(() => {
    db = new Database(':memory:');
    createDatabase(db);
    sseManager = new SSEManager();
  });

  it('has 5 tool definitions', () => {
    expect(TOOL_DEFINITIONS).toHaveLength(5);
    const names = TOOL_DEFINITIONS.map((t) => t.function.name);
    expect(names).toContain('list_todos');
    expect(names).toContain('create_todo');
    expect(names).toContain('update_todo');
    expect(names).toContain('delete_todo');
    expect(names).toContain('toggle_todo');
  });

  describe('list_todos (UC-S09, for UC-U09)', () => {
    it('returns empty array when no todos', async () => {
      const result = await executeTool(db, sseManager, 'list_todos', '{}');
      expect(JSON.parse(result)).toEqual([]);
    });

    it('returns all todos', async () => {
      createTodo(db, 'Test 1');
      createTodo(db, 'Test 2');
      const result = await executeTool(db, sseManager, 'list_todos', '{}');
      const todos = JSON.parse(result);
      expect(todos).toHaveLength(2);
    });
  });

  describe('create_todo (UC-S09, for UC-U07)', () => {
    it('creates a todo and broadcasts SSE', async () => {
      const broadcasts: string[] = [];
      const mockSse = {
        broadcast: (_type: string, _data: unknown) => {
          broadcasts.push(_type);
        },
      } as unknown as SSEManager;

      const result = await executeTool(
        db,
        mockSse,
        'create_todo',
        JSON.stringify({ title: 'AI todo' })
      );
      const todo = JSON.parse(result);
      expect(todo.title).toBe('AI todo');
      expect(broadcasts).toContain('todo:created');
    });
  });

  describe('toggle_todo (UC-S09, for UC-U08)', () => {
    it('toggles a todo', async () => {
      const todo = createTodo(db, 'Test');
      const result = await executeTool(
        db,
        sseManager,
        'toggle_todo',
        JSON.stringify({ id: todo.id })
      );
      const toggled = JSON.parse(result);
      expect(toggled.completed).toBe(true);
    });

    it('returns error for non-existent todo', async () => {
      const result = await executeTool(
        db,
        sseManager,
        'toggle_todo',
        JSON.stringify({
          id: '00000000-0000-4000-8000-000000000000',
        })
      );
      expect(result).toContain('not found');
    });
  });

  describe('delete_todo (UC-S09, for UC-U08)', () => {
    it('deletes a todo', async () => {
      const todo = createTodo(db, 'Test');
      const result = await executeTool(
        db,
        sseManager,
        'delete_todo',
        JSON.stringify({ id: todo.id })
      );
      expect(result).toContain('deleted');
    });

    it('returns error for non-existent todo', async () => {
      const result = await executeTool(
        db,
        sseManager,
        'delete_todo',
        JSON.stringify({
          id: '00000000-0000-4000-8000-000000000000',
        })
      );
      expect(result).toContain('not found');
    });
  });

  describe('update_todo (UC-S09, for UC-U08)', () => {
    it('updates a todo title', async () => {
      const todo = createTodo(db, 'Old');
      const result = await executeTool(
        db,
        sseManager,
        'update_todo',
        JSON.stringify({ id: todo.id, title: 'New' })
      );
      expect(JSON.parse(result).title).toBe('New');
    });

    it('updates a todo completed status', async () => {
      const todo = createTodo(db, 'Test');
      const result = await executeTool(
        db,
        sseManager,
        'update_todo',
        JSON.stringify({ id: todo.id, completed: true })
      );
      expect(JSON.parse(result).completed).toBe(true);
    });

    it('returns error for non-existent todo', async () => {
      const result = await executeTool(
        db,
        sseManager,
        'update_todo',
        JSON.stringify({
          id: '00000000-0000-4000-8000-000000000000',
          title: 'New',
        })
      );
      expect(result).toContain('not found');
    });
  });

  describe('unknown tool (UC-S09, Alt 5a)', () => {
    it('returns error for unknown tool', async () => {
      const result = await executeTool(db, sseManager, 'unknown_tool', '{}');
      expect(result).toContain('Unknown tool');
    });
  });

  describe('malformed arguments (UC-S09, Alt 5b)', () => {
    it('throws on invalid JSON arguments', async () => {
      await expect(
        executeTool(db, sseManager, 'create_todo', 'not json')
      ).rejects.toThrow();
    });
  });
});
