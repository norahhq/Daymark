import { Request, Response } from 'express';
import { storage } from './storage.js';
import { generateSchedule } from './scheduler.js';
import { McpToolDefinition, Priority } from '../types/index.js';

export const MCP_TOOLS: McpToolDefinition[] = [
  {
    name: 'create_task',
    description: 'Create a new task with duration, priority, and optional deadline in the Daymark store.',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Clear descriptive title of the task' },
        duration_minutes: { type: 'number', description: 'Duration in minutes (5 to 480)' },
        priority: { type: 'string', enum: ['high', 'medium', 'low'], description: 'Task priority level' },
        deadline: { type: 'string', description: 'Optional ISO 8601 deadline timestamp' },
      },
      required: ['title', 'duration_minutes'],
    },
  },
  {
    name: 'list_tasks',
    description: 'Retrieve all persisted tasks with completion status, duration, priority, and deadlines.',
    inputSchema: {
      type: 'object',
      properties: {
        filter: { type: 'string', enum: ['all', 'pending', 'completed'], description: 'Filter tasks by completion status' },
      },
    },
  },
  {
    name: 'update_task',
    description: 'Update attributes of an existing task by task ID.',
    inputSchema: {
      type: 'object',
      properties: {
        task_id: { type: 'string', description: 'Unique identifier of the task' },
        title: { type: 'string', description: 'Updated title' },
        duration_minutes: { type: 'number', description: 'Updated duration in minutes' },
        priority: { type: 'string', enum: ['high', 'medium', 'low'], description: 'Updated priority' },
        deadline: { type: 'string', description: 'Updated deadline' },
      },
      required: ['task_id'],
    },
  },
  {
    name: 'complete_task',
    description: 'Mark a task as completed in the Daymark database.',
    inputSchema: {
      type: 'object',
      properties: {
        task_id: { type: 'string', description: 'Unique identifier of the task to complete' },
      },
      required: ['task_id'],
    },
  },
  {
    name: 'delete_task',
    description: 'Permanently remove a task from the Daymark database.',
    inputSchema: {
      type: 'object',
      properties: {
        task_id: { type: 'string', description: 'Unique identifier of the task to delete' },
      },
      required: ['task_id'],
    },
  },
  {
    name: 'generate_plan',
    description: 'Generate an optimized, deterministic daily schedule factoring in time budget, breaks, and priorities.',
    inputSchema: {
      type: 'object',
      properties: {
        available_minutes: { type: 'number', description: 'Total available study/work minutes' },
        start_time: { type: 'string', description: 'Starting time in HH:MM format (default: 09:00)' },
        include_breaks: { type: 'boolean', description: 'Whether to insert cognitive recovery breaks (default: true)' },
      },
      required: ['available_minutes'],
    },
  },
  {
    name: 'get_activity',
    description: 'Retrieve recent application activity log and tool invocation history.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Maximum number of activity events to return (default: 20)' },
      },
    },
  },
  {
    name: 'reset_demo',
    description: 'Reset workspace data to empty pristine state, clearing all tasks and plans.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];

export async function executeMcpTool(name: string, args: Record<string, any>): Promise<any> {
  storage.addActivity({
    actionType: 'mcp_tool_invoked',
    description: `MCP Tool invoked: ${name}`,
    metadata: { tool: name, args },
  });

  switch (name) {
    case 'create_task': {
      if (!args.title || typeof args.title !== 'string') {
        throw new Error("Invalid argument: 'title' is required and must be a string");
      }
      const duration = Number(args.duration_minutes ?? args.duration);
      if (isNaN(duration) || duration < 5 || duration > 480) {
        throw new Error("Invalid argument: 'duration_minutes' must be a number between 5 and 480");
      }
      const priority = (args.priority as Priority) || 'medium';
      return storage.createTask({
        title: args.title,
        durationMinutes: duration,
        priority,
        deadline: args.deadline,
      });
    }

    case 'list_tasks': {
      const filter = args?.filter || 'all';
      let tasks = storage.getTasks();
      if (filter === 'pending') {
        tasks = tasks.filter((t) => !t.completed);
      } else if (filter === 'completed') {
        tasks = tasks.filter((t) => t.completed);
      }
      return { count: tasks.length, tasks };
    }

    case 'update_task': {
      const taskId = args.task_id || args.id;
      if (!taskId) {
        throw new Error("Invalid argument: 'task_id' is required");
      }
      const updates: any = {};
      if (args.title !== undefined) updates.title = args.title;
      if (args.duration_minutes !== undefined) updates.durationMinutes = Number(args.duration_minutes);
      if (args.priority !== undefined) updates.priority = args.priority;
      if (args.deadline !== undefined) updates.deadline = args.deadline;
      return storage.updateTask(taskId, updates);
    }

    case 'complete_task': {
      const taskId = args.task_id || args.id;
      if (!taskId) {
        throw new Error("Invalid argument: 'task_id' is required");
      }
      return storage.completeTask(taskId);
    }

    case 'delete_task': {
      const taskId = args.task_id || args.id;
      if (!taskId) {
        throw new Error("Invalid argument: 'task_id' is required");
      }
      return storage.deleteTask(taskId);
    }

    case 'generate_plan': {
      const availableMinutes = Number(args.available_minutes ?? 180);
      const startTime = args.start_time || '09:00';
      const includeBreaks = args.include_breaks !== false;
      const tasks = storage.getTasks();
      const plan = generateSchedule(tasks, {
        availableMinutes,
        startTime,
        includeBreaks,
      });
      storage.savePlan(plan);
      return plan;
    }

    case 'get_activity': {
      const limit = Number(args?.limit || 20);
      return storage.getActivities(limit);
    }

    case 'reset_demo': {
      return storage.resetDemo();
    }

    default:
      throw new Error(`Unknown MCP tool '${name}'`);
  }
}

/**
 * Handle MCP JSON-RPC 2.0 requests over HTTP (Streamable HTTP MCP endpoint)
 */
export async function handleMcpJsonRpc(req: Request, res: Response) {
  const body = req.body;

  // Validate JSON-RPC 2.0 structure
  if (!body || typeof body !== 'object') {
    return res.status(400).json({
      jsonrpc: '2.0',
      id: null,
      error: { code: -32700, message: 'Parse error: Request body must be a JSON object' },
    });
  }

  const { id = 1, method, params } = body;

  try {
    switch (method) {
      case 'initialize': {
        return res.json({
          jsonrpc: '2.0',
          id,
          result: {
            protocolVersion: '2024-11-05',
            capabilities: {
              tools: { listChanged: false },
            },
            serverInfo: {
              name: 'daymark-mcp-server',
              version: '1.0.0',
              description: 'Model Context Protocol (MCP) server for Daymark productivity assistant',
            },
          },
        });
      }

      case 'notifications/initialized': {
        return res.status(200).send();
      }

      case 'ping': {
        return res.json({
          jsonrpc: '2.0',
          id,
          result: {},
        });
      }

      case 'tools/list': {
        return res.json({
          jsonrpc: '2.0',
          id,
          result: {
            tools: MCP_TOOLS,
          },
        });
      }

      case 'tools/call': {
        if (!params || !params.name) {
          return res.status(400).json({
            jsonrpc: '2.0',
            id,
            error: { code: -32602, message: "Invalid params: 'name' is required" },
          });
        }

        const toolName = params.name;
        const toolArgs = params.arguments || {};
        const result = await executeMcpTool(toolName, toolArgs);

        return res.json({
          jsonrpc: '2.0',
          id,
          result: {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2),
              },
            ],
            isError: false,
          },
        });
      }

      default: {
        return res.status(404).json({
          jsonrpc: '2.0',
          id,
          error: { code: -32601, message: `Method '${method}' not found` },
        });
      }
    }
  } catch (error: any) {
    return res.json({
      jsonrpc: '2.0',
      id,
      result: {
        content: [
          {
            type: 'text',
            text: `Tool execution failed: ${error.message}`,
          },
        ],
        isError: true,
      },
    });
  }
}
