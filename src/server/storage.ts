import fs from 'fs';
import path from 'path';
import { Task, DayPlan, ActivityItem, Priority } from '../types/index.js';

interface DatabaseSchema {
  tasks: Task[];
  plans: DayPlan[];
  activities: ActivityItem[];
  metadata: {
    version: number;
    lastUpdated: string;
    aiProvider: 'local' | 'bedrock';
  };
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'daymark_db.json');

const INITIAL_DEMO_TASKS: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    title: 'Finish project prototype',
    durationMinutes: 90,
    priority: 'high',
    deadline: new Date(Date.now() + 1000 * 60 * 60 * 6).toISOString(), // today in 6 hours
    completed: false,
  },
  {
    title: 'Review lecture notes',
    durationMinutes: 60,
    priority: 'medium',
    deadline: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(), // tomorrow
    completed: false,
  },
  {
    title: 'Prepare hackathon demo',
    durationMinutes: 45,
    priority: 'high',
    deadline: new Date(Date.now() + 1000 * 60 * 60 * 18).toISOString(), // tonight/tomorrow
    completed: false,
  },
  {
    title: 'Reply to project team',
    durationMinutes: 20,
    priority: 'low',
    deadline: undefined,
    completed: false,
  },
  {
    title: 'Practice calculus problems',
    durationMinutes: 50,
    priority: 'high',
    deadline: new Date(Date.now() + 1000 * 60 * 60 * 36).toISOString(), // 2 days
    completed: false,
  },
];

class StorageEngine {
  private db: DatabaseSchema;

  constructor() {
    this.ensureDataDir();
    this.db = this.loadFromDisk();
  }

  private ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private loadFromDisk(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.error('Error reading DB file, reinitializing:', err);
    }

    const initial: DatabaseSchema = {
      tasks: [],
      plans: [],
      activities: [],
      metadata: {
        version: 1,
        lastUpdated: new Date().toISOString(),
        aiProvider: 'local',
      },
    };

    this.saveToDisk(initial);
    // Seed default demo tasks on first run
    this.seedDemoDataInternal(initial);
    return initial;
  }

  private saveToDisk(data: DatabaseSchema) {
    this.ensureDataDir();
    const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  }

  private persist() {
    this.db.metadata.lastUpdated = new Date().toISOString();
    this.saveToDisk(this.db);
  }

  private seedDemoDataInternal(targetDb: DatabaseSchema): Task[] {
    const now = new Date().toISOString();
    const seededTasks: Task[] = INITIAL_DEMO_TASKS.map((t, index) => ({
      id: `task-seed-${index + 1}`,
      title: t.title,
      durationMinutes: t.durationMinutes,
      priority: t.priority as Priority,
      deadline: t.deadline,
      completed: false,
      createdAt: now,
      updatedAt: now,
    }));

    targetDb.tasks = seededTasks;
    targetDb.activities.unshift({
      id: `act-${Date.now()}-seed`,
      actionType: 'demo_loaded',
      description: 'Loaded 5 sample tasks for student prep & hackathon sprint',
      timestamp: now,
    });

    this.saveToDisk(targetDb);
    return seededTasks;
  }

  // --- Tasks API ---
  public getTasks(): Task[] {
    return [...this.db.tasks];
  }

  public getTaskById(id: string): Task | undefined {
    return this.db.tasks.find((t) => t.id === id);
  }

  public findTaskByFuzzyTitle(query: string): Task | undefined {
    const q = query.toLowerCase().trim();
    // 1. exact match
    const exact = this.db.tasks.find((t) => t.title.toLowerCase() === q);
    if (exact) return exact;

    // 2. title includes query or query includes title
    const partial = this.db.tasks.find(
      (t) => t.title.toLowerCase().includes(q) || q.includes(t.title.toLowerCase())
    );
    if (partial) return partial;

    // 3. word token overlap
    const tokens = q.split(/\s+/).filter((w) => w.length > 2);
    return this.db.tasks.find((t) => {
      const titleLower = t.title.toLowerCase();
      return tokens.some((token) => titleLower.includes(token));
    });
  }

  public createTask(input: {
    title: string;
    durationMinutes: number;
    priority?: Priority;
    deadline?: string;
  }): Task {
    if (!input.title || input.title.trim().length === 0) {
      throw new Error('Task title cannot be empty');
    }
    const duration = Number(input.durationMinutes);
    if (isNaN(duration) || duration < 5 || duration > 480) {
      throw new Error('Task duration must be between 5 and 480 minutes');
    }

    const now = new Date().toISOString();
    const task: Task = {
      id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: input.title.trim(),
      durationMinutes: duration,
      priority: input.priority || 'medium',
      deadline: input.deadline,
      completed: false,
      createdAt: now,
      updatedAt: now,
    };

    this.db.tasks.unshift(task);
    this.addActivity({
      actionType: 'task_created',
      description: `Created task "${task.title}" (${task.durationMinutes}m, ${task.priority} priority)`,
      metadata: { taskId: task.id },
    });
    this.persist();
    return task;
  }

  public updateTask(id: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>): Task {
    const taskIndex = this.db.tasks.findIndex((t) => t.id === id);
    if (taskIndex === -1) {
      throw new Error(`Task with id '${id}' not found`);
    }

    const current = this.db.tasks[taskIndex];
    if (updates.durationMinutes !== undefined) {
      const d = Number(updates.durationMinutes);
      if (isNaN(d) || d < 5 || d > 480) {
        throw new Error('Task duration must be between 5 and 480 minutes');
      }
    }

    const updated: Task = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.db.tasks[taskIndex] = updated;
    this.addActivity({
      actionType: 'task_updated',
      description: `Updated task "${updated.title}"`,
      metadata: { taskId: updated.id, updates },
    });
    this.persist();
    return updated;
  }

  public completeTask(id: string): Task {
    const task = this.getTaskById(id);
    if (!task) {
      throw new Error(`Task with id '${id}' not found`);
    }
    return this.updateTask(id, { completed: true });
  }

  public deleteTask(id: string): { success: boolean; deletedTask: Task } {
    const taskIndex = this.db.tasks.findIndex((t) => t.id === id);
    if (taskIndex === -1) {
      throw new Error(`Task with id '${id}' not found`);
    }

    const [deletedTask] = this.db.tasks.splice(taskIndex, 1);
    this.addActivity({
      actionType: 'task_deleted',
      description: `Deleted task "${deletedTask.title}"`,
      metadata: { taskId: id },
    });
    this.persist();
    return { success: true, deletedTask };
  }

  // --- Plans API ---
  public savePlan(plan: DayPlan): DayPlan {
    this.db.plans.unshift(plan);
    // keep last 20 plans
    if (this.db.plans.length > 20) {
      this.db.plans = this.db.plans.slice(0, 20);
    }
    this.addActivity({
      actionType: 'plan_generated',
      description: `Generated schedule: ${plan.blocks.filter((b) => b.type === 'task').length} tasks (${plan.totalScheduledMinutes}m / ${plan.availableMinutes}m budget, ${plan.utilizationPercent}% utilization)`,
      metadata: { planId: plan.id, utilizationPercent: plan.utilizationPercent },
    });
    this.persist();
    return plan;
  }

  public getLatestPlan(): DayPlan | null {
    return this.db.plans[0] || null;
  }

  // --- Activity API ---
  public getActivities(limit = 30): ActivityItem[] {
    return this.db.activities.slice(0, limit);
  }

  public addActivity(item: Omit<ActivityItem, 'id' | 'timestamp'> & { timestamp?: string }): ActivityItem {
    const activity: ActivityItem = {
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      actionType: item.actionType,
      description: item.description,
      timestamp: item.timestamp || new Date().toISOString(),
      metadata: item.metadata,
    };
    this.db.activities.unshift(activity);
    if (this.db.activities.length > 100) {
      this.db.activities = this.db.activities.slice(0, 100);
    }
    this.persist();
    return activity;
  }

  // --- Demo Reset / Load ---
  public loadDemo(): { tasks: Task[]; message: string } {
    const seeded = this.seedDemoDataInternal(this.db);
    return {
      tasks: seeded,
      message: 'Demo dataset loaded successfully (5 realistic student & hackathon tasks).',
    };
  }

  public resetDemo(): { success: boolean; message: string } {
    this.db.tasks = [];
    this.db.plans = [];
    this.db.activities = [
      {
        id: `act-${Date.now()}-reset`,
        actionType: 'demo_reset',
        description: 'Reset demo workspace to pristine empty state',
        timestamp: new Date().toISOString(),
      },
    ];
    this.persist();
    return {
      success: true,
      message: 'Workspace reset to clean state. All tasks and plans cleared.',
    };
  }

  // --- AI Provider Mode ---
  public getAiProvider(): 'local' | 'bedrock' {
    return this.db.metadata.aiProvider || 'local';
  }

  public setAiProvider(provider: 'local' | 'bedrock') {
    this.db.metadata.aiProvider = provider;
    this.persist();
  }
}

export const storage = new StorageEngine();
