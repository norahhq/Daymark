# Daymark

> **Tagline:** *Make the next step obvious.*  
> **Amazon Developer Hackathon Submission**  
> **Primary Track:** Alexa+  
> **Mini-Challenges:** AWS Builder & Open Source

[![License: MIT](https://img.shields.io/badge/License-MIT-lime.svg)](LICENSE)
[![MCP Protocol](https://img.shields.io/badge/MCP-Streamable%20HTTP-blue.svg)](docs/MCP.md)
[![Tests](https://img.shields.io/badge/Tests-20%20Passed-brightgreen.svg)](scripts/test-runner.ts)

---

## 1. What is Daymark?

Students and early-career professionals face continuous task thrashing, looming exams, and competing deadlines. Existing productivity systems demand constant manual organization, while general-purpose AI chat assistants offer isolated suggestions disconnected from real, persistent task databases.

**Daymark is an AI-powered personal productivity assistant** that bridges natural language and deterministic execution:
1. **Understands natural requests:** e.g., *"I have three hours tomorrow. Plan my tasks."* or *"Add revise calculus for 45 minutes."*
2. **Executes real mutations:** Persists tasks in SQLite with zero hallucinated data or code execution risks.
3. **Generates realistic schedules:** Enforces strict time budgets, inserts 10-minute cognitive rest buffers, and flags overflow items that do not fit.
4. **Exposes genuine MCP tools:** Includes a Streamable HTTP Model Context Protocol (MCP) server so external autonomous agents can interface directly with Daymark.
5. **Simulates Alexa+:** Designed from the ground up to showcase an agentic voice-and-screen productivity flow for the Alexa+ era.

> **Honesty & Compliance Notice:** This project uses the verified **simulated Alexa+ experience route** coupled with a **real Streamable HTTP MCP server** to demonstrate the integration path. It does not falsely claim an unreleased official Alexa+ production deployment.

---

## 2. Quick Start (No Docker Required)

Daymark is designed for immediate local execution on macOS or Linux without Docker or paid infrastructure.

### Prerequisites
- Node.js 18+ (tested on v22)
- Python 3.10+ (for optional Python CLI / MCP smoke tests)

### 1. Install & Run
```bash
# Clone the repository
git clone https://github.com/your-username/daymark.git
cd daymark

# Launch development server (starts on http://localhost:3000)
./scripts/run-dev.sh
```

Or run via npm:
```bash
npm install
npm run dev
```

### 2. Open the Dashboard
Visit **[http://localhost:3000](http://localhost:3000)** in your browser.

- **Overview:** Executive dark dashboard with real metrics and schedule timeline.
- **My Tasks:** Filter and sort tasks with persistent SQLite updates.
- **Daily Plan:** Configurable time budget, non-overlapping blocks, and overflow detection.
- **Alexa+ Assistant:** Conversational natural-language interface with real tool dispatches.
- **MCP Inspector:** Live JSON-RPC 2.0 tool runner and protocol validator.

---

## 3. Running Acceptance Tests

Run the automated test suite covering CRUD persistence, scheduler math, natural language intents, and MCP tools:

```bash
npm run test
```

**Verified Test Results:**
```
--- DAYMARK ACCEPTANCE TEST SUITE ---
[Suite 1: Task Management & Validations]
  ✓ Create valid task
  ✓ Reject invalid duration (< 5 mins)
  ✓ Reject invalid duration (> 480 mins)
  ✓ Reject empty title
[Suite 2: Task Mutations & Error Handling]
  ✓ Setup test task
  ✓ Update task attributes
  ✓ Complete task
  ✓ Delete task
  ✓ Throw error on unknown task ID
[Suite 3: Deterministic Scheduling Engine]
  ✓ Schedule strictly within fixed budget without exceeding available time
  ✓ Detect overflow tasks that do not fit
  ✓ Ensure no overlapping blocks & proper chronological sequence
[Suite 4: Natural Language AI Engine]
  ✓ Parse "Add revise calculus for 45 minutes"
  ✓ Parse "I have three hours tomorrow. Plan my tasks."
  ✓ Bedrock mode fallback disclosure when unconfigured
[Suite 5: Model Context Protocol (MCP) Server]
  ✓ Exposes all 8 required MCP tools
  ✓ MCP execute create_task tool
  ✓ MCP execute list_tasks tool
  ✓ MCP execute generate_plan tool
  ✓ MCP reject invalid arguments gracefully

TEST RESULTS: 20 Passed, 0 Failed
```

---

## 4. Real MCP Server (Alexa+ Track)

Daymark implements a self-hosted Model Context Protocol (MCP) server adhering to the current **Streamable HTTP (JSON-RPC 2.0)** standard.

- **Endpoint:** `http://localhost:3000/mcp`
- **Supported Methods:** `initialize`, `notifications/initialized`, `tools/list`, `tools/call`, `ping`

### Exposed Tools:
| Tool Name | Parameters | Description |
|---|---|---|
| `create_task` | `title`, `duration_minutes`, `priority`, `deadline` | Creates task in persistent storage |
| `list_tasks` | `filter` (`all`, `pending`, `completed`) | Retrieves active task records |
| `update_task` | `task_id`, updates | Modifies attributes of an existing task |
| `complete_task`| `task_id` | Marks task as completed |
| `delete_task` | `task_id` | Permanently deletes a task |
| `generate_plan`| `available_minutes`, `start_time` | Deterministic scheduling within budget |
| `get_activity` | `limit` | Returns audit log and tool invocations |
| `reset_demo` | none | Resets workspace to clean state |

### Run MCP Smoke Test
```bash
python3 scripts/smoke-test-mcp.py
```

---

## 5. Amazon Bedrock (AWS Builder Mini-Challenge)

Daymark supports a dual-mode AI engine:
1. **Mode A — Local Demo Mode (Default):** Zero network calls, zero API keys, 100% deterministic intent parsing and planning.
2. **Mode B — Amazon Bedrock Mode:** Integrates with Amazon Bedrock via AWS credentials and configurable model ID (e.g. `anthropic.claude-3-haiku-20240307-v1:0` or `amazon.titan-text-express-v1`).

### Configuring Bedrock
In `.env`:
```env
AI_PROVIDER=bedrock
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
BEDROCK_MODEL_ID=anthropic.claude-3-haiku-20240307-v1:0
```

### Graceful Fallback Guarantee
If AWS credentials are unset or the Bedrock call is unreachable, Daymark automatically falls back to Local Mode and explicitly discloses the fallback in the response:
```
(AWS Bedrock credentials not configured or unreachable; smoothly executed via deterministic Local Engine).
```

---

## 6. Open Source Contribution

This project is licensed under the permissive **[MIT License](LICENSE)**.

### Open Source Contribution during Hackathon Window
As part of our commitment to the open-source developer ecosystem:
- **Modular MCP Planning Engine:** The deterministic scheduling logic in `src/server/scheduler.ts` and `backend/app/services/scheduler.py` is architected as an independently importable, zero-dependency utility that any MCP server or AI agent framework can adopt.
- **Specification-Compliant Streamable HTTP MCP Implementation:** Provides an open reference implementation for developers building web-hosted MCP servers compliant with the November 2024 specification.

---

## 7. 3-Minute Demo Video Flow

Refer to **[`docs/DEMO_SCRIPT.md`](docs/DEMO_SCRIPT.md)** for the complete timestamped presentation guide:
- `0:00–0:20`: Problem & Dashboard Introduction
- `0:20–0:50`: Natural-Language Task Creation (`Add revise calculus for 45 minutes`)
- `0:50–1:25`: Deterministic Planning (`I have 3 hours tomorrow. Plan my tasks.`)
- `1:25–1:55`: Real State Mutation & Audit Trail
- `1:55–2:25`: Live MCP JSON-RPC 2.0 Server Demonstration
- `2:25–2:45`: AWS Bedrock Integration & Transparent Fallback
- `2:45–3:00`: Architecture & Open-Source Closing

---

## 8. Acceptance Criteria Checklist

- [x] 1. The dashboard runs locally without Docker (`./scripts/run-dev.sh`).
- [x] 2. Tasks persist in local SQLite store across restarts.
- [x] 3. Natural-language requests perform actual supported actions.
- [x] 4. Scheduling uses real task data and respects time constraints.
- [x] 5. The activity feed reflects real application operations.
- [x] 6. A genuine Streamable HTTP MCP server exposes 8 working tools.
- [x] 7. MCP tools and the web application use the same data store.
- [x] 8. Optional Bedrock integration is implemented and fails gracefully.
- [x] 9. Automated tests are included and report 20/20 passing.
- [x] 10. The README enables another developer to reproduce the demo.
- [x] 11. The project has an MIT license and no committed secrets.
- [x] 12. The demo can be recorded in under three minutes.
