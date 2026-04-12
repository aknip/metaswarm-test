import Anthropic from '@anthropic-ai/sdk';
import type {
  MessageParam,
  ContentBlockParam,
  ToolResultBlockParam,
} from '@anthropic-ai/sdk/resources/messages.js';
import { toolDefinitions, executeTool } from './tools.js';
import type { ChatMessage } from '../../shared/types.js';

const MAX_TOOL_ROUNDS = 5;
const MODEL = process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514';
const SYSTEM_PROMPT = `You are a helpful AI assistant that manages a todo list. You can:
- List all todos
- Create new todos
- Update existing todos (change title or mark as complete/incomplete)
- Delete todos

Use the provided tools to read and modify the todo list. Always confirm actions you take.
Be concise and helpful in your responses.`;

let anthropicClient: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    anthropicClient = new Anthropic();
  }
  return anthropicClient;
}

export function setAnthropicClient(client: Anthropic | null): void {
  anthropicClient = client;
}

function toApiMessages(history: ChatMessage[]): MessageParam[] {
  return history.map((msg) => ({
    role: msg.role,
    content: msg.content,
  }));
}

export async function processChat(
  message: string,
  history: ChatMessage[]
): Promise<string> {
  const client = getAnthropicClient();

  const messages: MessageParam[] = [
    ...toApiMessages(history),
    { role: 'user', content: message },
  ];

  let rounds = 0;

  while (rounds < MAX_TOOL_ROUNDS) {
    rounds++;

    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      tools: toolDefinitions,
      messages,
    });

    // Separate tool_use blocks from text blocks
    const toolUseBlocks = response.content.filter(
      (block) => block.type === 'tool_use'
    );

    if (toolUseBlocks.length === 0) {
      // No tool calls — extract and concatenate text
      const textParts: string[] = [];
      for (const block of response.content) {
        if (block.type === 'text') {
          textParts.push(block.text);
        }
      }
      return textParts.join('');
    }

    // Build assistant message content preserving both text and tool_use blocks
    const assistantContent: ContentBlockParam[] = [];
    for (const block of response.content) {
      if (block.type === 'tool_use') {
        assistantContent.push({
          type: 'tool_use' as const,
          id: block.id,
          name: block.name,
          input: block.input,
        });
      } else if (block.type === 'text') {
        assistantContent.push({
          type: 'text' as const,
          text: block.text,
        });
      }
    }

    messages.push({ role: 'assistant', content: assistantContent });

    // Execute each tool call and build results
    const toolResults: ToolResultBlockParam[] = toolUseBlocks.map((block) => {
      const toolBlock = block as {
        type: 'tool_use';
        id: string;
        name: string;
        input: Record<string, unknown>;
      };
      const result = executeTool(toolBlock.name, toolBlock.input);
      return {
        type: 'tool_result' as const,
        tool_use_id: toolBlock.id,
        content: JSON.stringify(result),
      };
    });

    messages.push({ role: 'user', content: toolResults });
  }

  return 'I reached the maximum number of actions I can take. Please try a simpler request.';
}
