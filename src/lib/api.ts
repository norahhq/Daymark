import { Task, DayPlan, ActivityItem, ChatMessage, McpStatus, Priority } from '../types/index.js';

const API_BASE = '/api/v1';

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error('Health check failed');
  return res.json();
}

export async function fetchTasks(filter: 'all' | 'pending' | 'completed' = 'all', sort: string = 'default'): Promise<Task[]> {
  const res = await fetch(`${API_BASE}/tasks?filter=${filter}&sort=${sort}`);
  if (!res.ok) throw new Error('Failed to fetch tasks');
  const data = await res.json();
  return data.tasks || [];
}

export async function createTask(input: {
  title: string;
  durationMinutes: number;
  priority?: Priority;
  deadline?: string;
}): Promise<Task> {
  const res = await fetch(`${API_BASE}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to create task');
  }
  const data = await res.json();
  return data.task;
}

export async function updateTask(id: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>): Promise<Task> {
  const res = await fetch(`${API_BASE}/tasks/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to update task');
  }
  const data = await res.json();
  return data.task;
}

export async function completeTask(id: string): Promise<Task> {
  const res = await fetch(`${API_BASE}/tasks/${id}/complete`, {
    method: 'POST',
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to complete task');
  }
  const data = await res.json();
  return data.task;
}

export async function deleteTask(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/tasks/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to delete task');
  }
}

export async function generatePlan(options: {
  availableMinutes?: number;
  startTime?: string;
  includeBreaks?: boolean;
}): Promise<DayPlan> {
  const res = await fetch(`${API_BASE}/plans/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(options),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to generate plan');
  }
  const data = await res.json();
  return data.plan;
}

export async function fetchLatestPlan(): Promise<DayPlan | null> {
  const res = await fetch(`${API_BASE}/plans/latest`);
  if (!res.ok) return null;
  const data = await res.json();
  return data.plan;
}

export async function sendChatMessage(message: string, mode?: 'local' | 'bedrock'): Promise<any> {
  const res = await fetch(`${API_BASE}/assistant/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, mode }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Chat processing failed');
  }
  return res.json();
}

export async function fetchActivity(limit = 30): Promise<ActivityItem[]> {
  const res = await fetch(`${API_BASE}/activity?limit=${limit}`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.activities || [];
}

export async function loadDemoData(): Promise<Task[]> {
  const res = await fetch(`${API_BASE}/demo/load`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to load demo data');
  const data = await res.json();
  return data.tasks || [];
}

export async function resetDemoData(): Promise<void> {
  const res = await fetch(`${API_BASE}/demo/reset`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to reset demo data');
}

export async function fetchMcpStatus(): Promise<McpStatus> {
  const res = await fetch(`${API_BASE}/mcp/status`);
  if (!res.ok) throw new Error('Failed to fetch MCP status');
  return res.json();
}

export async function executeMcpToolCall(name: string, args: Record<string, any>): Promise<any> {
  const res = await fetch(`${API_BASE}/mcp/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, args }),
  });
  return res.json();
}

export async function updateAiMode(provider: 'local' | 'bedrock'): Promise<void> {
  await fetch(`${API_BASE}/mode`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider }),
  });
}
