import type Database from 'better-sqlite3';
import {
  getAllTodos,
  createTodo,
  updateTodo,
  deleteTodo,
  toggleTodo,
} from '../db.js';
import type { SSEManager } from '../sse.js';

export const TOOL_DEFINITIONS = [
  {
    type: 'function' as const,
    function: {
      name: 'list_todos',
      description: 'Get all todo items',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'create_todo',
      description: 'Create a new todo item',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'The todo title' },
        },
        required: ['title'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'update_todo',
      description: 'Update an existing todo item',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'The todo ID' },
          title: { type: 'string', description: 'New title' },
          completed: {
            type: 'boolean',
            description: 'Completion status',
          },
        },
        required: ['id'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'delete_todo',
      description: 'Delete a todo item',
      parameters: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'The todo ID to delete',
          },
        },
        required: ['id'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'toggle_todo',
      description: 'Toggle a todo item completion status',
      parameters: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'The todo ID to toggle',
          },
        },
        required: ['id'],
      },
    },
  },
];

export async function executeTool(
  db: Database.Database,
  sseManager: SSEManager,
  name: string,
  args: string
): Promise<string> {
  const parsed = JSON.parse(args);

  switch (name) {
    case 'list_todos': {
      const todos = getAllTodos(db);
      return JSON.stringify(todos);
    }
    case 'create_todo': {
      const todo = createTodo(db, parsed.title);
      sseManager.broadcast('todo:created', todo);
      return JSON.stringify(todo);
    }
    case 'update_todo': {
      const fields: { title?: string; completed?: boolean } = {};
      if (parsed.title !== undefined) fields.title = parsed.title;
      if (parsed.completed !== undefined) fields.completed = parsed.completed;
      const todo = updateTodo(db, parsed.id, fields);
      if (!todo) return JSON.stringify({ error: 'Todo not found' });
      sseManager.broadcast('todo:updated', todo);
      return JSON.stringify(todo);
    }
    case 'delete_todo': {
      const deleted = deleteTodo(db, parsed.id);
      if (!deleted) return JSON.stringify({ error: 'Todo not found' });
      sseManager.broadcast('todo:deleted', { id: parsed.id });
      return JSON.stringify({
        success: true,
        message: 'Todo deleted',
      });
    }
    case 'toggle_todo': {
      const todo = toggleTodo(db, parsed.id);
      if (!todo) return JSON.stringify({ error: 'Todo not found' });
      sseManager.broadcast('todo:updated', todo);
      return JSON.stringify(todo);
    }
    default:
      return JSON.stringify({ error: `Unknown tool: ${name}` });
  }
}
