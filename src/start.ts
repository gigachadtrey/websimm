#!/usr/bin/env node

/**
 * WebSim MCP Server Startup Script
 * 
 * This script handles the startup of the WebSim MCP server with proper
 * error handling, environment validation, and logging.
 */

import createServer from './index.js';
import { config } from 'dotenv';

// Load environment variables
config();

const SERVER_NAME = 'WebSim MCP Server';
const VERSION = '1.0.0';

// Validate Node.js version
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

if (majorVersion < 18) {
    console.error(`❌ ${SERVER_NAME} requires Node.js 18.0 or higher. Current version: ${nodeVersion}`);
    console.error('Please upgrade Node.js to use this server.');
    process.exit(1);
}

// Validate required environment variables
function validateEnvironment() {
    const required = [];
    const optional = [
        'WEBSIM_USER_AGENT',
        'WEBSIM_TIMEOUT',
        'WEBSIM_RATE_LIMIT_REQUESTS',
        'WEBSIM_RATE_LIMIT_WINDOW'
    ];

    const missing = required.filter(envVar => !process.env[envVar]);
    
    if (missing.length > 0) {
        console.warn(`⚠️  Missing required environment variables: ${missing.join(', ')}`);
        console.warn('Please set these variables in your environment or .env file.');
    }

    // Log configuration
    console.log(`🚀 Starting ${SERVER_NAME} v${VERSION}`);
    console.log(`📊 Node.js version: ${nodeVersion}`);
    console.log(`🌐 WebSim API base: https://api.websim.com`);
    
    if (process.env.WEBSIM_USER_AGENT) {
        console.log(`👤 User-Agent: ${process.env.WEBSIM_USER_AGENT}`);
    } else {
        console.log(`👤 User-Agent: ${SERVER_NAME}/${VERSION} (default)`);
    }

    if (process.env.WEBSIM_TIMEOUT) {
        console.log(`⏱️  Request timeout: ${process.env.WEBSIM_TIMEOUT}ms`);
    }

    console.log(`📍 Process PID: ${process.pid}`);
    console.log('─'.repeat(50));
}

// Setup error handling
function setupErrorHandling() {
    process.on('uncaughtException', (error) => {
        console.error('❌ Uncaught Exception:', error);
        console.error('Stack trace:', error.stack);
        process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
        console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
        process.exit(1);
    });

    process.on('SIGTERM', () => {
        console.log('📴 Received SIGTERM, shutting down gracefully...');
        process.exit(0);
    });

    process.on('SIGINT', () => {
        console.log('📴 Received SIGINT, shutting down gracefully...');
        process.exit(0);
    });
}

// Health check endpoint for monitoring
function setupHealthCheck() {
    const port = process.env.PORT || 8080;
    
    if (typeof port === 'string' && !isNaN(Number(port))) {
        const healthPort = Number(port);
        
        try {
            const http = require('http');
            
            const server = http.createServer((req, res) => {
                if (req.url === '/health') {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        status: 'healthy',
                        server: SERVER_NAME,
                        version: VERSION,
                        timestamp: new Date().toISOString(),
                        uptime: process.uptime()
                    }));
                } else {
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Not Found' }));
                }
            });

            server.listen(healthPort, () => {
                console.log(`🏥 Health check server running on port ${healthPort}`);
            });
        } catch (error) {
            console.warn('⚠️  Could not start health check server:', error.message);
        }
    }
}

// Main startup function
async function main() {
    try {
        // Setup error handling
        setupErrorHandling();
        
        // Validate environment
        validateEnvironment();
        
        // Setup health check
        setupHealthCheck();
        
        // Create and start the server
        console.log('🔧 Initializing MCP server...');
        const server = createServer();
        
        // Start the server
        console.log('🚀 Starting MCP server...');
        await server.start();
        
        console.log('✅ WebSim MCP Server is ready!');
        console.log('📡 Server is running and waiting for connections...');
        
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        console.error('Stack trace:', error.stack);
        process.exit(1);
    }
}

// Handle module imports
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export { main };