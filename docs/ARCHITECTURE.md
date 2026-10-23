# Daymark Architecture Specification

> **Tagline:** Make the next step obvious.  
> **Tracks:** Alexa+ Primary Track · AWS Builder Mini-Challenge · Open Source Mini-Challenge

---

## 1. System Overview

Daymark bridges the gap between natural language intention and deterministic execution. It solves the student/early-career cognitive overload problem by transforming free-form queries into verified task mutations and conflict-free schedules.

```
                    ┌────────────────────────────────────────┐
                    │      Alexa+ Simulated Voice/UI         │
                    │   (User Query: "Plan my 3 hours")      │
                    └───────────────────┬────────────────────┘
                                        │
                                        ▼
             ┌───────────────────────────────────────────────────────┐
             │            Daymark Intent Orchestrator               │
             │   Mode A: Local Deterministic Engine (Zero AWS)       │
             │   Mode B: Amazon Bedrock (with disclosed fallback)   │
             └───────────────────┬───────────────────┬───────────────┘
                                 │                   │
         ┌───────────────────────┘                   └───────────────────────┐
         ▼                                                                   ▼
┌─────────────────────────────────┐                         ┌─────────────────────────────────┐
│     Deterministic Scheduler     │                         │   Streamable HTTP MCP Server    │
│  - Priority & Deadline scoring  │                         │   (JSON-RPC 2.0 over /mcp)      │
│  - 10m cognitive break buffers  │                         │   - create_task, list_tasks     │
│  - Strict budget enforcement    │                         │   - generate_plan, reset_demo   │
└────────────────┬────────────────┘                         └────────────────┬────────────────┘
                 │                                                           │
                 └───────────────────────┬───────────────────────────────────┘
                                         ▼
                    ┌────────────────────────────────────────┐
                    │     Shared SQLite Persistence Store    │
                    │  (Tasks, Schedules, Activity Events)   │
                    └────────────────────────────────────────┘
```

---

## 2. Core Subsystems

### A. Persistent State Layer (SQLite / ACID JSON)
- **Zero data loss**: All task mutations, daily plans, and audit logs persist to disk across process restarts.
- **Atomic updates**: Prevents race conditions during simultaneous MCP tool calls or web mutations.
- **Deterministic Seeding**: `loadDemo()` and `resetDemo()` guarantee reproducible state for live presentations.

### B. Transparent Deterministic Scheduler
- **Time budget constraint**: Never schedules a task beyond `availableMinutes`.
- **Cognitive break insertion**: Inserts 10-minute rest buffers between work blocks.
- **Prioritization heuristic**: High priority (100 pts) > Medium (50 pts) > Low (20 pts), boosted by deadline proximity (<12h = +45 pts).
- **Conflict detection**: Unscheduled tasks are returned in `overflowTasks` rather than dropped.

### C. Dual-Mode AI Provider
- **Mode A (Local Demo Mode)**: High-speed, offline-capable intent parser using verified regex and fuzzy match. Zero external calls, zero API keys.
- **Mode B (Amazon Bedrock Mode)**: Invokes Amazon Bedrock models (`anthropic.claude-3-haiku` / `amazon.titan`) with structured output validation. When AWS credentials or network are unavailable, it smoothly falls back to Local Mode and clearly discloses the fallback.

### D. Model Context Protocol (MCP) Server
- Implements current Streamable HTTP specification.
- Standard JSON-RPC 2.0 transport over `POST /mcp`.
- 8 fully typed tools registered in `tools/list`.
- Modifies the exact same storage used by the frontend dashboard.
