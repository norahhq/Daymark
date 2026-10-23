import assert from 'assert';
import { storage } from '../src/server/storage.js';
import { generateSchedule, calculateTaskPriorityScore } from '../src/server/scheduler.js';
import { assistantService } from '../src/server/ai.js';
import { executeMcpTool, MCP_TOOLS } from '../src/server/mcp.js';
import { Task } from '../src/types/index.js';

let passed = 0;
let failed = 0;

function runTest(name: string, fn: () => void | Promise<void>) {
  try {
    const res = fn();
    if (res instanceof Promise) {
      return res
        .then(() => {
          console.log(`  ✓ ${name}`);
          passed++;
        })
        .catch((err) => {
          console.error(`  ✗ ${name}:`, err.message);
          failed++;
        });
    } else {
      console.log(`  ✓ ${name}`);
      passed++;
    }
  } catch (err: any) {
    console.error(`  ✗ ${name}:`, err.message);
    failed++;
  }
}

async function runAllTests() {
  console.log('\n--- DAYMARK ACCEPTANCE TEST SUITE ---\n');

  // 1. Task Creation & Validation
  console.log('[Suite 1: Task Management & Validations]');
  runTest('Create valid task', () => {
    const task = storage.createTask({
      title: 'Unit Test Task',
      durationMinutes: 45,
      priority: 'high',
    });
    assert.strictEqual(task.title, 'Unit Test Task');
    assert.strictEqual(task.durationMinutes, 45);
    assert.strictEqual(task.priority, 'high');
    assert.strictEqual(task.completed, false);
  });

  runTest('Reject invalid duration (< 5 mins)', () => {
    assert.throws(() => {
      storage.createTask({ title: 'Too short', durationMinutes: 2 });
    }, /must be between 5 and 480 minutes/);
  });

  runTest('Reject invalid duration (> 480 mins)', () => {
    assert.throws(() => {
      storage.createTask({ title: 'Too long', durationMinutes: 600 });
    }, /must be between 5 and 480 minutes/);
  });

  runTest('Reject empty title', () => {
    assert.throws(() => {
      storage.createTask({ title: '   ', durationMinutes: 30 });
    }, /Task title cannot be empty/);
  });

  // 2. Task Mutations & Unknown ID
  console.log('\n[Suite 2: Task Mutations & Error Handling]');
  let testTaskId: string;
  runTest('Setup test task', () => {
    const t = storage.createTask({ title: 'To Be Modified', durationMinutes: 30 });
    testTaskId = t.id;
  });

  runTest('Update task attributes', () => {
    const updated = storage.updateTask(testTaskId, { title: 'Modified Title', durationMinutes: 50 });
    assert.strictEqual(updated.title, 'Modified Title');
    assert.strictEqual(updated.durationMinutes, 50);
  });

  runTest('Complete task', () => {
    const completed = storage.completeTask(testTaskId);
    assert.strictEqual(completed.completed, true);
  });

  runTest('Delete task', () => {
    const res = storage.deleteTask(testTaskId);
    assert.strictEqual(res.success, true);
    assert.strictEqual(storage.getTaskById(testTaskId), undefined);
  });

  runTest('Throw error on unknown task ID', () => {
    assert.throws(() => {
      storage.completeTask('non-existent-task-id-999');
    }, /not found/);
  });

  // 3. Scheduler Logic
  console.log('\n[Suite 3: Deterministic Scheduling Engine]');
  runTest('Schedule strictly within fixed budget without exceeding available time', () => {
    const sampleTasks: Task[] = [
      { id: '1', title: 'Task 1', durationMinutes: 60, priority: 'high', completed: false, createdAt: '', updatedAt: '' },
      { id: '2', title: 'Task 2', durationMinutes: 60, priority: 'high', completed: false, createdAt: '', updatedAt: '' },
      { id: '3', title: 'Task 3', durationMinutes: 60, priority: 'medium', completed: false, createdAt: '', updatedAt: '' },
      { id: '4', title: 'Task 4', durationMinutes: 60, priority: 'low', completed: false, createdAt: '', updatedAt: '' },
    ];

    const plan = generateSchedule(sampleTasks, {
      availableMinutes: 150,
      startTime: '09:00',
      includeBreaks: true,
      breakDurationMinutes: 10,
    });

    assert.ok(plan.totalScheduledMinutes <= 150, 'Total scheduled minutes must be <= budget');
    assert.ok(plan.blocks.length > 0);
  });

  runTest('Detect overflow tasks that do not fit', () => {
    const sampleTasks: Task[] = [
      { id: '1', title: 'Big Task', durationMinutes: 120, priority: 'high', completed: false, createdAt: '', updatedAt: '' },
      { id: '2', title: 'Overflow Task', durationMinutes: 90, priority: 'low', completed: false, createdAt: '', updatedAt: '' },
    ];

    const plan = generateSchedule(sampleTasks, {
      availableMinutes: 150,
      startTime: '09:00',
    });

    assert.strictEqual(plan.overflowTasks.length, 1);
    assert.strictEqual(plan.overflowTasks[0].id, '2');
  });

  runTest('Ensure no overlapping blocks & proper chronological sequence', () => {
    const sampleTasks: Task[] = [
      { id: '1', title: 'T1', durationMinutes: 45, priority: 'high', completed: false, createdAt: '', updatedAt: '' },
      { id: '2', title: 'T2', durationMinutes: 45, priority: 'high', completed: false, createdAt: '', updatedAt: '' },
    ];

    const plan = generateSchedule(sampleTasks, {
      availableMinutes: 180,
      startTime: '09:00',
      includeBreaks: true,
      breakDurationMinutes: 10,
    });

    for (let i = 0; i < plan.blocks.length - 1; i++) {
      const currentEnd = plan.blocks[i].endTime;
      const nextStart = plan.blocks[i + 1].startTime;
      assert.strictEqual(currentEnd, nextStart, `Block ${i} end (${currentEnd}) must match Block ${i + 1} start (${nextStart})`);
    }
  });

  // 4. Natural Language Intent Parser & Bedrock Fallback
  console.log('\n[Suite 4: Natural Language AI Engine]');
  await runTest('Parse "Add revise calculus for 45 minutes"', async () => {
    const res = await assistantService.processMessage('Add revise calculus for 45 minutes');
    assert.strictEqual(res.actionTaken, 'task_created');
    assert.strictEqual(res.mode, 'local');
    assert.ok(res.message.includes('revise calculus') || res.message.includes('Revise calculus'));
  });

  await runTest('Parse "I have three hours tomorrow. Plan my tasks."', async () => {
    const res = await assistantService.processMessage('I have three hours tomorrow. Plan my tasks.');
    assert.strictEqual(res.actionTaken, 'plan_generated');
    assert.strictEqual(res.metrics?.availableMinutes, 180);
    assert.ok(res.metrics?.scheduledMinutes! <= 180);
  });

  await runTest('Bedrock mode fallback disclosure when unconfigured', async () => {
    const res = await assistantService.processMessage('Show me what I should focus on next', 'bedrock');
    assert.strictEqual(res.mode, 'local');
    assert.strictEqual(res.fallbackOccurred, true);
    assert.ok(res.message.includes('AWS Bedrock credentials not configured'));
  });

  // 5. MCP Tool Execution & Verification
  console.log('\n[Suite 5: Model Context Protocol (MCP) Server]');
  runTest('Exposes all 8 required MCP tools', () => {
    const toolNames = MCP_TOOLS.map((t) => t.name);
    const required = [
      'create_task',
      'list_tasks',
      'update_task',
      'complete_task',
      'delete_task',
      'generate_plan',
      'get_activity',
      'reset_demo',
    ];
    for (const req of required) {
      assert.ok(toolNames.includes(req), `Missing MCP tool: ${req}`);
    }
  });

  await runTest('MCP execute create_task tool', async () => {
    const res = await executeMcpTool('create_task', {
      title: 'MCP Created Task',
      duration_minutes: 30,
      priority: 'high',
    });
    assert.strictEqual(res.title, 'MCP Created Task');
    assert.strictEqual(res.durationMinutes, 30);
  });

  await runTest('MCP execute list_tasks tool', async () => {
    const res = await executeMcpTool('list_tasks', { filter: 'all' });
    assert.ok(Array.isArray(res.tasks));
    assert.ok(res.count > 0);
  });

  await runTest('MCP execute generate_plan tool', async () => {
    const res = await executeMcpTool('generate_plan', {
      available_minutes: 120,
      start_time: '10:00',
    });
    assert.strictEqual(res.availableMinutes, 120);
    assert.strictEqual(res.startTime, '10:00');
    assert.ok(Array.isArray(res.blocks));
  });

  await runTest('MCP reject invalid arguments gracefully', async () => {
    try {
      await executeMcpTool('create_task', { title: '', duration_minutes: 999 });
      assert.fail('Should have thrown validation error');
    } catch (err: any) {
      assert.ok(err.message.includes('Invalid argument'));
    }
  });

  console.log(`\nTEST RESULTS: ${passed} Passed, ${failed} Failed\n`);
  if (failed > 0) {
    process.exit(1);
  }
}

runAllTests().catch((err) => {
  console.error('Test runner encountered error:', err);
  process.exit(1);
});
