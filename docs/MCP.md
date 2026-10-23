# Model Context Protocol (MCP) Integration Guide

Daymark implements a self-hosted MCP server using **Streamable HTTP (JSON-RPC 2.0)** on endpoint `/mcp`.

---

## Exposed MCP Tools

1. **`create_task`**: Creates a task with title, duration (5-480 min), priority, optional deadline.
2. **`list_tasks`**: Lists persisted tasks (`filter`: all | pending | completed).
3. **`update_task`**: Modifies an existing task by `task_id`.
4. **`complete_task`**: Sets `completed: true` on target `task_id`.
5. **`delete_task`**: Removes target `task_id`.
6. **`generate_plan`**: Computes deterministic non-overlapping timeline with break buffers.
7. **`get_activity`**: Retrieves chronological audit logs.
8. **`reset_demo`**: Resets database to clean slate.

---

## Example JSON-RPC Request

```bash
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "create_task",
      "arguments": {
        "title": "Practice speech delivery",
        "duration_minutes": 30,
        "priority": "high"
      }
    }
  }'
```

## Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"id\": \"task-...\",\n  \"title\": \"Practice speech delivery\",\n  \"durationMinutes\": 30,\n  \"priority\": \"high\",\n  \"completed\": false\n}"
      }
    ],
    "isError": false
  }
}
```

## Running the Smoke Test

Execute the included protocol smoke test:

```bash
python3 scripts/smoke-test-mcp.py
```
