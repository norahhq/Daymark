# Daymark Hackathon Demo Script (2:55 Total Runtime)

> Follow this step-by-step recording guide for a crisp, hackathon-winning 3-minute presentation.

---

### [0:00 – 0:20] Problem & Product Introduction
- **Visual:** Open Daymark dashboard at `http://localhost:3000`. Show the dark executive workspace, summary metrics, and task backlog.
- **Spoken:** *"Hi everyone, this is Daymark. Students and early-career pros have too many competing tasks and deadlines. Productivity apps make you organize everything manually, while general AI assistants offer disconnected suggestions. Daymark turns natural language into persistent task records, realistic schedules, and MCP-ready workflows."*

---

### [0:20 – 0:50] Natural-Language Task Creation
- **Visual:** Click on the "Alexa+ Assistant" tab. Type or click the suggested chip:  
  `Add revise calculus for 45 minutes.`
- **Visual:** The assistant responds with: *"Added 'Revise calculus' as a 45-minute task. It is saved and ready to schedule."* Switch to "My Tasks" or "Overview" to show it instantly persisted.
- **Spoken:** *"Notice how this wasn't a mock response. The assistant called our `create_task` service, saved it in SQLite, and rendered it in the dashboard with zero delay."*

---

### [0:50 – 1:25] Deterministic Daily Planning
- **Visual:** In the assistant, type:  
  `I have three hours tomorrow. Plan my tasks.`
- **Visual:** Assistant calculates the schedule and returns: *"I scheduled four tasks using 165 of your 180 available minutes. I left time for breaks and flagged one task that did not fit."*
- **Visual:** Switch to "Daily Plan". Point out:
  - Exact start/end times (`09:00 - 10:30`, etc.)
  - 10-minute rest buffers inserted automatically
  - Schedule utilization bar (92%)
  - The overflow panel highlighting the task that exceeded the 3-hour budget
- **Spoken:** *"Our scheduler is deterministic and transparent. It prioritizes upcoming deadlines, prevents overlaps, and refuses to hallucinate unrealistic hours."*

---

### [1:25 – 1:55] Real State Execution & Audit Feed
- **Visual:** In the schedule or task list, click "Complete" on *"Finish project prototype"*.
- **Visual:** Show the utilization bar adjust, the completed count increment, and click "Activity Feed" to show the real event recorded in the audit trail.
- **Spoken:** *"Every action is verified and logged. The UI, assistant, and storage are in continuous sync."*

---

### [1:55 – 2:25] Live Model Context Protocol (MCP) Server
- **Visual:** Navigate to the "MCP Inspector" tab.
- **Visual:** Show the active Streamable HTTP endpoint (`:3000/mcp`), the 8 registered tools, and click "Invoke Tool" on `generate_plan`.
- **Visual:** Point to the returned JSON-RPC 2.0 response with content blocks.
- **Spoken:** *"For the Alexa+ track, we didn't just simulate voice—we built a full Streamable HTTP MCP server adhering to the 2024-11-05 protocol. Autonomous agents can call Daymark directly over standard JSON-RPC."*

---

### [2:25 – 2:45] AWS Builder & Transparent AI Modes
- **Visual:** Toggle from "Local Mode" to "AWS Bedrock" in the header.
- **Visual:** Send a query. Point out the transparent disclosure: *"AWS Bedrock credentials not configured; smoothly executed via deterministic Local Engine."*
- **Spoken:** *"For the AWS Builder challenge, we implemented Amazon Bedrock support via boto3. When AWS credentials are present, Bedrock powers complex intent parsing; when offline, our local engine provides zero-latency deterministic fallback."*

---

### [2:45 – 3:00] Closing & Open Source
- **Visual:** Show the MIT LICENSE and clean project structure in GitHub/VSCode.
- **Spoken:** *"Daymark is 100% open-source under the MIT license, requires no Docker, and runs on any Mac or Linux machine with one command. Daymark: Make the next step obvious. Thank you!"*
