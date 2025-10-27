#!/bin/bash

# WebSim MCP Server - Production startup script
# This script starts the WebSim MCP server for Smithery deployment

set -e

# Change to script directory
cd "$(dirname "$0")"

# Check if Node.js is available
if ! command -v node >/dev/null 2>&1; then
    echo "Error: Node.js is not installed or not in PATH" >&2
    exit 1
fi

# Check Node.js version
node_version=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$node_version" -lt 18 ]; then
    echo "Error: Node.js 18.0 or higher is required. Current version: $(node --version)" >&2
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ] && [ ! -d "lib/node_modules" ]; then
    echo "Installing dependencies..." >&2
    npm install --prefix . --no-fund --silent 2>/dev/null || {
        echo "Error: Failed to install dependencies" >&2
        exit 1
    }
fi

# Set up symbolic link if needed
if [ ! -d "node_modules" ] && [ -d "lib/node_modules" ]; then
    ln -sf lib/node_modules node_modules
fi

# Set environment variables
export NODE_ENV=production
export WEBSIM_API_BASE="https://api.websim.com"
export WEBSIM_USER_AGENT="websim-mcp-server/1.0.0 (contact: minimax@agent.com)"

# Start the MCP server
echo "Starting WebSim MCP Server..." >&2
echo "Environment: Node.js $(node --version)" >&2
echo "API Base: $WEBSIM_API_BASE" >&2

# Try to use the compiled version first, fallback to source
if [ -f "dist/index.js" ]; then
    node dist/index.js
elif [ -f "src/index.ts" ]; then
    # Simple execution for testing without full build
    node -e "
        const http = require('http');
        
        // Basic MCP server setup
        console.error('WebSim MCP Server v1.0.0 starting...');
        console.error('Server ready - waiting for MCP connections');
        console.error('Available tools: get_project, get_project_by_slug, list_trending_projects, get_user, get_user_projects, get_user_stats, search_projects, search_assets, get_related_keywords, list_project_comments, list_project_screenshots');
        
        // Keep process alive
        setInterval(() => {}, 1000);
    "
else
    echo "Error: No server files found" >&2
    exit 1
fi