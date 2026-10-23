import json
from typing import Dict, Any, List
from fastapi import APIRouter, Request, HTTPException
from ..services.task_service import TaskService, TaskCreate
from ..services.scheduler import generate_python_schedule

router = APIRouter()
task_service = TaskService()

MCP_TOOL_SCHEMAS = [
    {
        "name": "create_task",
        "description": "Create a new task in Daymark with title, duration, priority, and optional deadline.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "title": {"type": "string", "description": "Title of the task"},
                "duration_minutes": {"type": "number", "description": "Duration in minutes (5-480)"},
                "priority": {"type": "string", "enum": ["high", "medium", "low"]},
                "deadline": {"type": "string", "description": "Optional deadline timestamp"},
            },
            "required": ["title", "duration_minutes"],
        },
    },
    {
        "name": "list_tasks",
        "description": "List persisted tasks filtered by completion status.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "filter": {"type": "string", "enum": ["all", "pending", "completed"]},
            },
        },
    },
    {
        "name": "complete_task",
        "description": "Mark a task as complete.",
        "inputSchema": {
            "type": "object",
            "properties": {"task_id": {"type": "string"}},
            "required": ["task_id"],
        },
    },
    {
        "name": "delete_task",
        "description": "Delete a task by ID.",
        "inputSchema": {
            "type": "object",
            "properties": {"task_id": {"type": "string"}},
            "required": ["task_id"],
        },
    },
    {
        "name": "generate_plan",
        "description": "Generate a schedule within available time.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "available_minutes": {"type": "number"},
                "start_time": {"type": "string"},
            },
            "required": ["available_minutes"],
        },
    },
    {
        "name": "get_activity",
        "description": "Retrieve recent activities.",
        "inputSchema": {"type": "object", "properties": {"limit": {"type": "number"}}},
    },
    {
        "name": "reset_demo",
        "description": "Reset demo to clean state.",
        "inputSchema": {"type": "object", "properties": {}},
    },
]

def execute_python_mcp_tool(name: str, args: Dict[str, Any]) -> Any:
    if name == "create_task":
        title = args.get("title")
        duration = args.get("duration_minutes") or args.get("duration")
        if not title or not duration:
            raise ValueError("title and duration_minutes are required")
        return task_service.create_task(
            TaskCreate(
                title=title,
                duration_minutes=int(duration),
                priority=args.get("priority", "medium"),
                deadline=args.get("deadline"),
            )
        ).model_dump()
    elif name == "list_tasks":
        f = args.get("filter", "all")
        tasks = task_service.get_tasks(status=f)
        return {"count": len(tasks), "tasks": [t.model_dump() for t in tasks]}
    elif name == "complete_task":
        tid = args.get("task_id")
        if not tid:
            raise ValueError("task_id required")
        return task_service.complete_task(tid).model_dump()
    elif name == "delete_task":
        tid = args.get("task_id")
        if not tid:
            raise ValueError("task_id required")
        return {"success": task_service.delete_task(tid)}
    elif name == "generate_plan":
        minutes = int(args.get("available_minutes", 180))
        start = args.get("start_time", "09:00")
        tasks = task_service.get_tasks()
        plan = generate_python_schedule(tasks, available_minutes=minutes, start_time=start)
        return plan.model_dump()
    elif name == "get_activity":
        limit = int(args.get("limit", 20))
        return task_service.get_activities(limit=limit)
    elif name == "reset_demo":
        task_service.reset_demo()
        return {"success": True, "message": "Demo reset complete"}
    else:
        raise ValueError(f"Unknown tool: {name}")

@router.post("/mcp")
async def mcp_streamable_http(request: Request):
    """
    Streamable HTTP JSON-RPC 2.0 endpoint for MCP protocol.
    """
    body = await request.json()
    req_id = body.get("id", 1)
    method = body.get("method")
    params = body.get("params", {})

    if method == "initialize":
        return {
            "jsonrpc": "2.0",
            "id": req_id,
            "result": {
                "protocolVersion": "2024-11-05",
                "capabilities": {"tools": {}},
                "serverInfo": {"name": "daymark-python-mcp", "version": "1.0.0"},
            },
        }
    elif method == "notifications/initialized":
        return {"status": "ok"}
    elif method == "tools/list":
        return {"jsonrpc": "2.0", "id": req_id, "result": {"tools": MCP_TOOL_SCHEMAS}}
    elif method == "tools/call":
        tool_name = params.get("name")
        tool_args = params.get("arguments", {})
        try:
            res = execute_python_mcp_tool(tool_name, tool_args)
            return {
                "jsonrpc": "2.0",
                "id": req_id,
                "result": {
                    "content": [{"type": "text", "text": json.dumps(res, indent=2)}],
                    "isError": False,
                },
            }
        except Exception as e:
            return {
                "jsonrpc": "2.0",
                "id": req_id,
                "result": {
                    "content": [{"type": "text", "text": f"Error: {str(e)}"}],
                    "isError": True,
                },
            }
    else:
        return {
            "jsonrpc": "2.0",
            "id": req_id,
            "error": {"code": -32601, "message": f"Method '{method}' not found"},
        }
