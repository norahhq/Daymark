import { Task, DayPlan, ScheduleBlock, Priority } from '../types/index.js';

export interface SchedulerOptions {
  availableMinutes: number;
  startTime: string; // "HH:MM" e.g. "09:00"
  includeBreaks?: boolean;
  breakDurationMinutes?: number;
}

function timeStringToMinutes(timeStr: string): number {
  const parts = timeStr.split(':');
  const hours = parseInt(parts[0], 10) || 9;
  const minutes = parseInt(parts[1], 10) || 0;
  return hours * 60 + minutes;
}

function minutesToTimeString(totalMinutes: number): string {
  const normalized = ((totalMinutes % (24 * 60)) + (24 * 60)) % (24 * 60);
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

export function calculateTaskPriorityScore(task: Task): number {
  let score = 0;

  // Base priority score
  switch (task.priority) {
    case 'high':
      score += 100;
      break;
    case 'medium':
      score += 50;
      break;
    case 'low':
      score += 20;
      break;
  }

  // Deadline proximity boost
  if (task.deadline) {
    const deadlineTime = new Date(task.deadline).getTime();
    const now = Date.now();
    const diffHours = (deadlineTime - now) / (1000 * 60 * 60);

    if (diffHours <= 0) {
      score += 60; // Overdue or due right now
    } else if (diffHours <= 12) {
      score += 45; // Due within 12 hours
    } else if (diffHours <= 24) {
      score += 30; // Due today/tomorrow
    } else if (diffHours <= 48) {
      score += 15; // Due in 2 days
    }
  }

  return score;
}

export function generateSchedule(tasks: Task[], options: SchedulerOptions): DayPlan {
  const availableMinutes = Math.max(15, Math.min(720, Math.round(options.availableMinutes || 180)));
  const startTime = options.startTime || '09:00';
  const startMinuteOfDay = timeStringToMinutes(startTime);
  const breakDuration = options.includeBreaks !== false ? (options.breakDurationMinutes || 10) : 0;

  // 1. Only consider uncompleted tasks
  const pendingTasks = tasks.filter((t) => !t.completed);

  // 2. Sort by priority score descending, then by shorter duration first (greedy fit)
  const sortedTasks = [...pendingTasks].sort((a, b) => {
    const scoreA = calculateTaskPriorityScore(a);
    const scoreB = calculateTaskPriorityScore(b);
    if (scoreB !== scoreA) {
      return scoreB - scoreA;
    }
    return a.durationMinutes - b.durationMinutes;
  });

  const blocks: ScheduleBlock[] = [];
  const overflowTasks: Task[] = [];
  let currentOffset = 0;
  let totalTaskMinutes = 0;
  let breakCount = 0;

  for (const task of sortedTasks) {
    // If we already have scheduled tasks, evaluate if a break is needed
    const needsBreak = blocks.length > 0 && breakDuration > 0;
    const requiredWithBreak = currentOffset + (needsBreak ? breakDuration : 0) + task.durationMinutes;

    if (requiredWithBreak <= availableMinutes) {
      // Fit with break
      if (needsBreak) {
        const breakStart = startMinuteOfDay + currentOffset;
        const breakEnd = breakStart + breakDuration;
        blocks.push({
          id: `break-${blocks.length + 1}`,
          title: 'Rest & Context Switch',
          type: 'break',
          startTime: minutesToTimeString(breakStart),
          endTime: minutesToTimeString(breakEnd),
          durationMinutes: breakDuration,
        });
        currentOffset += breakDuration;
        breakCount++;
      }

      const taskStart = startMinuteOfDay + currentOffset;
      const taskEnd = taskStart + task.durationMinutes;
      blocks.push({
        id: `block-${task.id}`,
        taskId: task.id,
        title: task.title,
        type: 'task',
        startTime: minutesToTimeString(taskStart),
        endTime: minutesToTimeString(taskEnd),
        durationMinutes: task.durationMinutes,
        priority: task.priority,
        overflow: false,
      });

      currentOffset += task.durationMinutes;
      totalTaskMinutes += task.durationMinutes;
    } else {
      // Cannot fit within remaining available time
      overflowTasks.push(task);
    }
  }

  const remainingMinutes = Math.max(0, availableMinutes - currentOffset);
  const utilizationPercent = Math.min(100, Math.round((currentOffset / availableMinutes) * 100));

  const plan: DayPlan = {
    id: `plan-${Date.now()}`,
    availableMinutes,
    startTime,
    totalScheduledMinutes: currentOffset,
    remainingMinutes,
    utilizationPercent,
    blocks,
    overflowTasks,
    createdAt: new Date().toISOString(),
  };

  return plan;
}
