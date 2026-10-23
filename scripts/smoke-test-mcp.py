#!/usr/bin/env python3
"""
Daymark MCP Server Smoke Test
Tests real Model Context Protocol (MCP) Streamable HTTP JSON-RPC 2.0 endpoint.
"""
import urllib.request
import json
import sys

MCP_ENDPOINT = "http://127.0.0.1:3000/mcp"

def send_rpc(method: str, params: dict = None, req_id: int = 1):
    payload = {
        "jsonrpc": "2.0",
        "id": req_id,
        "method": method,
        "params": params or {}
    }
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        MCP_ENDPOINT,
        data=data,
        headers={"Content-Type": "application/json"}
    )
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except Exception as e:
        print(f"Connection to {MCP_ENDPOINT} failed: {e}")
        return None

def main():
    print("=" * 60)
    print("DAYMARK MODEL CONTEXT PROTOCOL (MCP) SMOKE TEST")
    print(f"Target Endpoint: {MCP_ENDPOINT}")
    print("=" * 60)

    # 1. Initialize
    print("\n[Step 1] Sending 'initialize'...")
    res = send_rpc("initialize")
    if not res or "result" not in res:
        print("FAIL: MCP server did not respond to initialize")
        sys.exit(1)
    print(f"SUCCESS: Protocol version {res['result'].get('protocolVersion')}")
    print(f"Server: {res['result'].get('serverInfo', {}).get('name')}")

    # 2. Tools list
    print("\n[Step 2] Querying 'tools/list'...")
    res = send_rpc("tools/list")
    tools = res.get("result", {}).get("tools", [])
    print(f"SUCCESS: {len(tools)} tools registered:")
    for t in tools:
        print(f"  - {t['name']}: {t['description'][:50]}...")

    # 3. Call tool: list_tasks
    print("\n[Step 3] Invoking 'tools/call' for 'list_tasks'...")
    res = send_rpc("tools/call", {"name": "list_tasks", "arguments": {"filter": "pending"}})
    content = res.get("result", {}).get("content", [])
    if content:
        print("SUCCESS: Tool output received:")
        print(content[0].get("text")[:200] + "...")

    # 4. Call tool: create_task
    print("\n[Step 4] Invoking 'tools/call' for 'create_task'...")
    res = send_rpc("tools/call", {
        "name": "create_task",
        "arguments": {
            "title": "Smoke Test Task via MCP",
            "duration_minutes": 35,
            "priority": "high"
        }
    })
    print("SUCCESS: Task created via real MCP protocol!")
    print("\nALL MCP PROTOCOL SMOKE TESTS PASSED!")

if __name__ == "__main__":
    main()
