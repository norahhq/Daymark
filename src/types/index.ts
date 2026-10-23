export type Priority = 'high' | 'medium' | 'low';

export interface Task {
  id: string;
  title: string;
  durationMinutes: number;
  priority: Priority;
  deadline?: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleBlock {
  id: string;
  taskId?: string;
  title: string;
  type: 'task' | 'break';
  startTime: string; // e.g. "09:00"
  endTime: string;   // e.g. "09:45"
  durationMinutes: number;
  priority?: Priority;
  overflow?: boolean;
}

export interface DayPlan {
  id: string;
  availableMinutes: number;
  startTime: string;
  totalScheduledMinutes: number;
  remainingMinutes: number;
  utilizationPercent: number;
  blocks: ScheduleBlock[];
  overflowTasks: Task[];
  createdAt: string;
}

export type ActivityActionType =
  | 'task_created'
  | 'task_updated'
  | 'task_completed'
  | 'task_deleted'
  | 'plan_generated'
  | 'assistant_tool_invoked'
  | 'mcp_tool_invoked'
  | 'demo_loaded'
  | 'demo_reset';

export interface ActivityItem {
  id: string;
  actionType: ActivityActionType;
  description: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  actionTaken?: string;
  toolInvoked?: string;
  mode?: 'local' | 'bedrock';
  metrics?: {
    scheduledMinutes?: number;
    availableMinutes?: number;
    taskCount?: number;
    unscheduledCount?: number;
  };
}

export interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface McpStatus {
  status: 'running' | 'degraded' | 'offline';
  endpoint: string;
  protocol: string;
  toolsCount: number;
  tools: McpToolDefinition[];
  lastHealthCheck: string;
}
