# Daymark REST API Documentation (`/api/v1`)

All endpoints accept and return JSON payloads.

---

### Health
`GET /api/v1/health`
Returns system status, active task count, and AI mode.

---

### Tasks

#### `GET /api/v1/tasks`
Query parameters:
- `filter`: `all` | `pending` | `completed`
- `sort`: `default` | `priority` | `duration` | `deadline`

#### `POST /api/v1/tasks`
Body:
```json
{
  "title": "Revise calculus problems",
  "durationMinutes": 45,
  "priority": "high",
  "deadline": "2026-10-24T18:00:00Z"
}
```

#### `GET /api/v1/tasks/:id`
Retrieves a single task by ID.

#### `PATCH /api/v1/tasks/:id`
Partially updates fields: `title`, `durationMinutes`, `priority`, `deadline`.

#### `POST /api/v1/tasks/:id/complete`
Marks the specified task as completed.

#### `DELETE /api/v1/tasks/:id`
Permanently deletes the specified task.

---

### Daily Plans

#### `POST /api/v1/plans/generate`
Body:
```json
{
  "availableMinutes": 180,
  "startTime": "09:00",
  "includeBreaks": true
}
```

#### `GET /api/v1/plans/latest`
Returns the most recently generated schedule.

---

### Conversational Assistant

#### `POST /api/v1/assistant/chat`
Body:
```json
{
  "message": "I have three hours tomorrow. Plan my tasks.",
  "mode": "local"
}
```

---

### MCP & Demo Operations

#### `GET /api/v1/mcp/status`
Returns MCP server transport information and exposed tool schemas.

#### `POST /api/v1/demo/load`
Seeds the 5 standard hackathon student tasks.

#### `POST /api/v1/demo/reset`
Wipes all tasks and schedules to empty pristine state.
