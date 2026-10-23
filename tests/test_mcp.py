import pytest
from backend.app.mcp.server import execute_python_mcp_tool

def test_mcp_list_and_create():
    create_res = execute_python_mcp_tool("create_task", {"title": "MCP Tool Test", "duration_minutes": 25, "priority": "high"})
    assert create_res["title"] == "MCP Tool Test"

    list_res = execute_python_mcp_tool("list_tasks", {"filter": "all"})
    assert "tasks" in list_res
    assert list_res["count"] > 0
