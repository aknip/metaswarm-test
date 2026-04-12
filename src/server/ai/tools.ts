import type { Tool } from '@anthropic-ai/sdk/resources/messages.js';
import { createTodo, getAllTodos, updateTodo, deleteTodo } from '../db.js';
import { validateTitle } from '../validation.js';
import { broadcast } from '../sse.js';

export const toolDefinitions: Tool[] = [
  {
    name: 'list_todos',
    description:
      'List all todo items. Returns an array of todos with id, title, completed status, and timestamps.',
    input_schema: {
      type: 'object' as const,
      properties: {},
      required: [],
    },
  },
  {
    name: 'create_todo',
    description:
      'Create a new todo item. Requires a title string. Returns the created todo.',
    input_schema: {
      type: 'object' as const,
      properties: {
        title: {
          type: 'string',
          description: 'The title of the todo item',
        },
      },
      required: ['title'],
    },
  },
  {
    name: 'update_todo',
    description:
      'Update an existing todo item. Requires the todo ID. Can update title and/or completed status.',
    input_schema: {
      type: 'object' as const,
      properties: {
        id: {
          type: 'string',
          description: 'The UUID of the todo to update',
        },
        title: {
          type: 'string',
          description: 'New title for the todo (optional)',
        },
        completed: {
          type: 'boolean',
          description: 'New completed status (optional)',
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'delete_todo',
    description: 'Delete a todo item by its ID. Returns success status.',
    input_schema: {
      type: 'object' as const,
      properties: {
        id: {
          type: 'string',
          description: 'The UUID of the todo to delete',
        },
      },
      required: ['id'],
    },
  },
];

interface ToolInput {
  title?: string;
  id?: string;
  completed?: boolean;
}

export function executeTool(
  name: string,
  input: ToolInput
): { success: boolean; result?: unknown; error?: string } {
  switch (name) {
    case 'list_todos': {
      const todos = getAllTodos();
      return { success: true, result: todos };
    }

    case 'create_todo': {
      const titleResult = validateTitle(input.title);
      if (!titleResult.valid) {
        return { success: false, error: titleResult.error.message };
      }
      const todo = createTodo({ title: titleResult.value });
      broadcast({ event: 'todo:created', data: todo });
      return { success: true, result: todo };
    }

    case 'update_todo': {
      if (!input.id) {
        return { success: false, error: 'Todo ID is required' };
      }
      if (input.title !== undefined) {
        const titleResult = validateTitle(input.title);
        if (!titleResult.valid) {
          return { success: false, error: titleResult.error.message };
        }
      }
      const updated = updateTodo(input.id, {
        title: input.title,
        completed: input.completed,
      });
      if (!updated) {
        return { success: false, error: 'Todo not found' };
      }
      broadcast({ event: 'todo:updated', data: updated });
      return { success: true, result: updated };
    }

    case 'delete_todo': {
      if (!input.id) {
        return { success: false, error: 'Todo ID is required' };
      }
      const deleted = deleteTodo(input.id);
      if (!deleted) {
        return { success: false, error: 'Todo not found' };
      }
      broadcast({ event: 'todo:deleted', data: { id: input.id } });
      return { success: true, result: { deleted: true } };
    }

    default:
      return { success: false, error: `Unknown tool: ${name}` };
  }
}
