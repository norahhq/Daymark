#!/bin/bash
set -e

echo "=========================================="
echo " Starting Daymark Full-Stack Environment "
echo "=========================================="

# Check node
if ! command -v node &> /dev/null; then
    echo "Node.js is required. Please install Node 18+."
    exit 1
fi

# Install dependencies if node_modules is missing
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

echo "Starting Daymark on http://localhost:3000..."
echo "- Web Dashboard: http://localhost:3000"
echo "- REST API: http://localhost:3000/api/v1"
echo "- MCP Streamable HTTP Endpoint: http://localhost:3000/mcp"

npm run dev
