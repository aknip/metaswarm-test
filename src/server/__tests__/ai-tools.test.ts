import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { initDb, closeDb, getAllTodos, createTodo } from '../db.js';
import { executeTool, toolDefinitions } from '../ai/tools.js';
import { clearClients } from '../sse.js';

// Mock broadcast to track calls
vi.mock('../sse.js', async (importOriginal) => {
  const original = await importOriginal<typeof import('../sse.js')>();
  return {
    ...original,
    broadcast: vi.fn(),
  };
});

import { broadcast } from '../sse.js';

describe('AI Tools', () => {
  beforeEach(() => {
    initDb(':memory:');
    vi.clearAllMocks();
  });

  afterEach(() => {
    closeDb();
    clearClients();
  });

  describe('toolDefinitions', () => {
    it('defines 4 tools', () => {
      expect(toolDefinitions).toHaveLength(4);
    });

    it('has correct tool names', () => {
      const names = toolDefinitions.map((t) => t.name);
      expect(names).toEqual([
        'list_todos',
        'create_todo',
        'update_todo',
        'delete_todo',
      ]);
    });
  });

  // UC-07, SUC-06: list_todos
  describe('list_todos tool', () => {
    it('returns all todos', () => {
      createTodo({ title: 'First' });
      createTodo({ title: 'Second' });

      const result = executeTool('list_todos', {});
      expect(result.success).toBe(true);
      expect(result.result).toHaveLength(2);
    });

    // UC-07/5a: empty list
    it('returns empty array when no todos', () => {
      const result = executeTool('list_todos', {});
      expect(result.success).toBe(true);
      expect(result.result).toEqual([]);
    });
  });

  // UC-08, SUC-06: create_todo
  describe('create_todo tool', () => {
    it('creates a todo and broadcasts', () => {
      const result = executeTool('create_todo', { title: 'AI created' });

      expect(result.success).toBe(true);
      expect((result.result as { title: string }).title).toBe('AI created');
      expect(broadcast).toHaveBeenCalledWith(
        expect.objectContaining({ event: 'todo:created' })
      );
    });

    // UC-08/5b, SUC-06/5b: validation failure
    it('returns error for empty title', () => {
      const result = executeTool('create_todo', { title: '' });
      expect(result.success).toBe(false);
      expect(result.error).toContain('empty');
    });

    it('returns error for missing title', () => {
      const result = executeTool('create_todo', {});
      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });
  });

  // UC-08, SUC-06: update_todo
  describe('update_todo tool', () => {
    it('updates a todo and broadcasts', () => {
      const todo = createTodo({ title: 'Original' });
      vi.clearAllMocks();

      const result = executeTool('update_todo', {
        id: todo.id,
        title: 'AI updated',
      });

      expect(result.success).toBe(true);
      expect((result.result as { title: string }).title).toBe('AI updated');
      expect(broadcast).toHaveBeenCalledWith(
        expect.objectContaining({ event: 'todo:updated' })
      );
    });

    it('toggles completed status', () => {
      const todo = createTodo({ title: 'Toggle' });

      const result = executeTool('update_todo', {
        id: todo.id,
        completed: true,
      });

      expect(result.success).toBe(true);
      expect((result.result as { completed: boolean }).completed).toBe(true);
    });

    // UC-08/5a, SUC-06/5c: not found
    it('returns error for non-existent todo', () => {
      const result = executeTool('update_todo', {
        id: '00000000-0000-0000-0000-000000000000',
        title: 'Nope',
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('returns error for missing id', () => {
      const result = executeTool('update_todo', { title: 'No ID' });
      expect(result.success).toBe(false);
      expect(result.error).toContain('required');
    });

    // UC-08/5b: validation failure on title
    it('returns error for invalid title', () => {
      const todo = createTodo({ title: 'Valid' });
      const result = executeTool('update_todo', {
        id: todo.id,
        title: '',
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain('empty');
    });
  });

  // UC-08, SUC-06: delete_todo
  describe('delete_todo tool', () => {
    it('deletes a todo and broadcasts', () => {
      const todo = createTodo({ title: 'Delete me' });
      vi.clearAllMocks();

      const result = executeTool('delete_todo', { id: todo.id });

      expect(result.success).toBe(true);
      expect(broadcast).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'todo:deleted',
          data: { id: todo.id },
        })
      );

      // Verify actually deleted
      expect(getAllTodos()).toHaveLength(0);
    });

    // UC-08/5a, SUC-06/5c: not found
    it('returns error for non-existent todo', () => {
      const result = executeTool('delete_todo', {
        id: '00000000-0000-0000-0000-000000000000',
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('returns error for missing id', () => {
      const result = executeTool('delete_todo', {});
      expect(result.success).toBe(false);
      expect(result.error).toContain('required');
    });
  });

  // SUC-06/5a: unknown tool
  describe('unknown tool', () => {
    it('returns error for unknown tool name', () => {
      const result = executeTool('nonexistent_tool', {});
      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown tool');
    });
  });
});
