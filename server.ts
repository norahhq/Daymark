import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { storage } from './src/server/storage.js';
import { generateSchedule } from './src/server/scheduler.js';
import { assistantService } from './src/server/ai.js';
import { MCP_TOOLS, handleMcpJsonRpc, executeMcpTool } from './src/server/mcp.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function createServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);
  const isProd = process.env.NODE_ENV === 'production';

  app.use(express.json());

  // CORS headers for API and MCP
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // --- MCP Streamable HTTP Endpoint ---
  app.post('/mcp', handleMcpJsonRpc);
  app.get('/mcp', (req: Request, res: Response) => {
    res.json({
      status: 'active',
      transport: 'Streamable HTTP (JSON-RPC 2.0)',
      server: 'daymark-mcp-server',
      version: '1.0.0',
      toolsEndpoint: '/mcp',
      toolCount: MCP_TOOLS.length,
      tools: MCP_TOOLS.map((t) => t.name),
    });
  });

  // --- REST API v1 Endpoints ---

  // Health
  app.get('/api/v1/health', (req: Request, res: Response) => {
    const tasks = storage.getTasks();
    res.json({
      status: 'healthy',
      app: 'Daymark',
      tagline: 'Make the next step obvious.',
      timestamp: new Date().toISOString(),
      tasksCount: tasks.length,
      pendingCount: tasks.filter((t) => !t.completed).length,
      aiProvider: storage.getAiProvider(),
      mcp: {
        status: 'running',
        endpoint: '/mcp',
        tools: MCP_TOOLS.length,
      },
    });
  });

  // Tasks CRUD
  app.get('/api/v1/tasks', (req: Request, res: Response) => {
    try {
      let tasks = storage.getTasks();
      const filter = (req.query.filter as string) || 'all';
      const sort = (req.query.sort as string) || 'default';

      if (filter === 'pending') {
        tasks = tasks.filter((t) => !t.completed);
      } else if (filter === 'completed') {
        tasks = tasks.filter((t) => t.completed);
      }

      if (sort === 'priority') {
        const order: Record<string, number> = { high: 3, medium: 2, low: 1 };
        tasks.sort((a, b) => (order[b.priority] || 0) - (order[a.priority] || 0));
      } else if (sort === 'duration') {
        tasks.sort((a, b) => a.durationMinutes - b.durationMinutes);
      } else if (sort === 'deadline') {
        tasks.sort((a, b) => {
          if (!a.deadline) return 1;
          if (!b.deadline) return -1;
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        });
      }

      res.json({ tasks, count: tasks.length });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/v1/tasks', (req: Request, res: Response) => {
    try {
      const { title, durationMinutes, duration, priority, deadline } = req.body;
      const finalDuration = durationMinutes ?? duration;
      const task = storage.createTask({
        title,
        durationMinutes: finalDuration,
        priority,
        deadline,
      });
      res.status(201).json({ task });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.get('/api/v1/tasks/:id', (req: Request, res: Response) => {
    const task = storage.getTaskById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: `Task '${req.params.id}' not found` });
    }
    res.json({ task });
  });

  app.patch('/api/v1/tasks/:id', (req: Request, res: Response) => {
    try {
      const updated = storage.updateTask(req.params.id, req.body);
      res.json({ task: updated });
    } catch (err: any) {
      res.status(404).json({ error: err.message });
    }
  });

  app.post('/api/v1/tasks/:id/complete', (req: Request, res: Response) => {
    try {
      const completed = storage.completeTask(req.params.id);
      res.json({ task: completed });
    } catch (err: any) {
      res.status(404).json({ error: err.message });
    }
  });

  app.delete('/api/v1/tasks/:id', (req: Request, res: Response) => {
    try {
      const result = storage.deleteTask(req.params.id);
      res.json(result);
    } catch (err: any) {
      res.status(404).json({ error: err.message });
    }
  });

  // Daily Plans
  app.post('/api/v1/plans/generate', (req: Request, res: Response) => {
    try {
      const { availableMinutes = 180, startTime = '09:00', includeBreaks = true } = req.body;
      const tasks = storage.getTasks();
      const plan = generateSchedule(tasks, {
        availableMinutes: Number(availableMinutes),
        startTime,
        includeBreaks,
      });
      storage.savePlan(plan);
      res.json({ plan });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.get('/api/v1/plans/latest', (req: Request, res: Response) => {
    const plan = storage.getLatestPlan();
    res.json({ plan });
  });

  // Assistant Chat
  app.post('/api/v1/assistant/chat', async (req: Request, res: Response) => {
    try {
      const { message, mode } = req.body;
      if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: 'Message text is required' });
      }
      const result = await assistantService.processMessage(message, mode);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Activity Log
  app.get('/api/v1/activity', (req: Request, res: Response) => {
    const limit = parseInt((req.query.limit as string) || '30', 10);
    const activities = storage.getActivities(limit);
    res.json({ activities });
  });

  // Demo Controls
  app.post('/api/v1/demo/load', (req: Request, res: Response) => {
    const result = storage.loadDemo();
    res.json(result);
  });

  app.post('/api/v1/demo/reset', (req: Request, res: Response) => {
    const result = storage.resetDemo();
    res.json(result);
  });

  // MCP Inspector Endpoints
  app.get('/api/v1/mcp/status', (req: Request, res: Response) => {
    res.json({
      status: 'running',
      endpoint: '/mcp',
      protocol: 'Streamable HTTP (JSON-RPC 2.0)',
      toolsCount: MCP_TOOLS.length,
      tools: MCP_TOOLS,
      lastHealthCheck: new Date().toISOString(),
    });
  });

  app.post('/api/v1/mcp/execute', async (req: Request, res: Response) => {
    try {
      const { name, args } = req.body;
      if (!name) {
        return res.status(400).json({ error: "Tool 'name' is required" });
      }
      const result = await executeMcpTool(name, args || {});
      res.json({ success: true, result });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // Provider Mode Toggle
  app.post('/api/v1/mode', (req: Request, res: Response) => {
    const { provider } = req.body;
    if (provider === 'local' || provider === 'bedrock') {
      storage.setAiProvider(provider);
      return res.json({ provider, message: `Switched AI mode to ${provider}` });
    }
    res.status(400).json({ error: "Provider must be 'local' or 'bedrock'" });
  });

  // --- Static & Frontend Mounting ---
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Daymark] Server running on http://0.0.0.0:${PORT}`);
    console.log(`[Daymark] MCP Streamable HTTP endpoint active at /mcp`);
  });
}

createServer().catch((err) => {
  console.error('Failed to start Daymark server:', err);
  process.exit(1);
});
