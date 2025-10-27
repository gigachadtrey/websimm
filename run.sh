#!/bin/sh
# STDIO mode startup script - suitable for local tool integration
set -e
# Change to script directory
cd "$(dirname "$0")"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Dependencies not found. Installing..." >&2
    npm install --prefix .
fi

# Start STDIO mode MCP server
node server.js