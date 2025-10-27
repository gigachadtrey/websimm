#!/usr/bin/env node

/**
 * WebSim MCP Server Test Suite
 * Tests all MCP tools to ensure they work correctly with the WebSim API
 */

import { spawn } from 'child_process';
import { readFileSync } from 'fs';

// Test configuration
const SERVER_PATH = './server.js';
const TIMEOUT = 30000;

// Utility function to run MCP tool
async function runTool(toolName, arguments_) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    // Start the MCP server
    const serverProcess = spawn('node', [SERVER_PATH], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    serverProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    serverProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    // Handle server startup
    serverProcess.on('spawn', () => {
      console.log(`[TEST] Server started for ${toolName}`);
      
      // Send MCP request
      const request = {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: {
          name: toolName,
          arguments: arguments_
        }
      };

      serverProcess.stdin.write(JSON.stringify(request) + '\n');
    });

    // Handle response
    let responseReceived = false;
    
    const timeout = setTimeout(() => {
      if (!responseReceived) {
        serverProcess.kill();
        reject(new Error(`Tool ${toolName} timed out after ${TIMEOUT}ms`));
      }
    }, TIMEOUT);

    serverProcess.stdout.on('data', (data) => {
      const lines = data.toString().split('\n');
      
      for (const line of lines) {
        if (line.trim() && responseReceived === false) {
          try {
            const response = JSON.parse(line);
            if (response.result || response.error) {
              responseReceived = true;
              clearTimeout(timeout);
              serverProcess.kill();
              
              const duration = Date.now() - startTime;
              
              if (response.error) {
                resolve({
                  success: false,
                  tool: toolName,
                  arguments: arguments_,
                  error: response.error,
                  duration,
                  raw: { stdout, stderr }
                });
              } else {
                resolve({
                  success: true,
                  tool: toolName,
                  arguments: arguments_,
                  result: response.result,
                  duration,
                  raw: { stdout, stderr }
                });
              }
            }
          } catch (e) {
            // Not a JSON response, continue
          }
        }
      }
    });

    serverProcess.on('close', (code) => {
      clearTimeout(timeout);
      if (!responseReceived) {
        reject(new Error(`Server closed unexpectedly with code ${code}`));
      }
    });

    serverProcess.on('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });
  });
}

// Test cases covering all major tool categories
const testCases = [
  // Health Check (first, to verify API connectivity)
  {
    name: 'health_check',
    args: {},
    description: 'Verify API connectivity'
  },
  
  // Project Management
  {
    name: 'list_all_projects',
    args: { limit: 5, offset: 0 },
    description: 'List public projects'
  },
  {
    name: 'get_trending_feed',
    args: { limit: 5 },
    description: 'Get trending projects'
  },
  {
    name: 'get_posts_feed',
    args: { limit: 5 },
    description: 'Get latest posts'
  },
  
  // Search tests (these should work even if no specific data exists)
  {
    name: 'search_users',
    args: { query: 'test', limit: 5 },
    description: 'Search for users'
  },
  {
    name: 'search_assets',
    args: { query: 'game', limit: 5 },
    description: 'Search for assets'
  },
  {
    name: 'get_related_keywords',
    args: { query: 'game', limit: 5 },
    description: 'Get related keywords'
  },
  {
    name: 'get_top_searches',
    args: { limit: 5 },
    description: 'Get top searches'
  },
  
  // Feed and discovery
  {
    name: 'search_feed',
    args: { sort: 'trending', search: 'game', limit: 5 },
    description: 'Search feed with trending sort'
  },
  {
    name: 'get_trending_rooms',
    args: { limit: 5 },
    description: 'Get trending rooms'
  },
  
  // Asset search variations
  {
    name: 'search_relevant_assets',
    args: { query: 'sprite', limit: 5 },
    description: 'Search relevant assets'
  },
  
  // Bulk search
  {
    name: 'bulk_asset_search',
    args: { 
      assets: [
        { query: 'ui', limit: 3 },
        { query: 'character', limit: 3 }
      ]
    },
    description: 'Bulk asset search'
  }
];

// Run all tests
async function runTests() {
  console.log('🧪 Starting WebSim MCP Server Test Suite');
  console.log('==========================================\n');

  const results = [];
  let passed = 0;
  let failed = 0;
  let errors = 0;

  for (const testCase of testCases) {
    try {
      console.log(`🔍 Testing: ${testCase.description}`);
      console.log(`   Tool: ${testCase.name}`);
      console.log(`   Args: ${JSON.stringify(testCase.args)}`);
      
      const result = await runTool(testCase.name, testCase.args);
      results.push(result);
      
      if (result.success) {
        console.log(`   ✅ PASSED (${result.duration}ms)`);
        passed++;
        
        // Check if we got meaningful data
        const content = result.result?.content?.[0];
        if (content && content.text) {
          try {
            const data = JSON.parse(content.text);
            if (data.success && data.data) {
              console.log(`   📊 Received ${Array.isArray(data.data.items) ? data.data.items.length : 'some'} items`);
            }
          } catch (e) {
            console.log(`   📄 Received response data`);
          }
        }
      } else {
        console.log(`   ❌ FAILED: ${result.error?.message || 'Unknown error'}`);
        failed++;
      }
      
    } catch (error) {
      console.log(`   🚫 ERROR: ${error.message}`);
      results.push({
        success: false,
        tool: testCase.name,
        arguments: testCase.args,
        error: { message: error.message },
        duration: 0
      });
      errors++;
    }
    
    console.log(''); // Empty line for readability
  }

  // Print summary
  console.log('📊 Test Results Summary');
  console.log('========================');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`🚫 Errors: ${errors}`);
  console.log(`📊 Total:  ${testCases.length}`);
  console.log(`\n🎯 Success Rate: ${((passed / testCases.length) * 100).toFixed(1)}%`);

  // Show detailed results for failed tests
  if (failed > 0 || errors > 0) {
    console.log('\n🔍 Detailed Results:');
    console.log('====================');
    
    results.forEach((result, index) => {
      if (!result.success) {
        console.log(`\n${index + 1}. ${result.tool}:`);
        console.log(`   Args: ${JSON.stringify(result.arguments)}`);
        console.log(`   Error: ${result.error?.message || 'Unknown error'}`);
        if (result.raw?.stderr) {
          console.log(`   Stderr: ${result.raw.stderr.substring(0, 200)}...`);
        }
      }
    });
  }

  // Save results to file
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: testCases.length,
      passed,
      failed,
      errors,
      successRate: (passed / testCases.length) * 100
    },
    results
  };

  try {
    const fs = await import('fs');
    fs.writeFileSync('./test-results.json', JSON.stringify(report, null, 2));
    console.log(`\n💾 Test results saved to test-results.json`);
  } catch (e) {
    console.log(`\n⚠️ Could not save test results: ${e.message}`);
  }

  // Exit with appropriate code
  if (failed === 0 && errors === 0) {
    console.log('\n🎉 All tests passed!');
    process.exit(0);
  } else {
    console.log('\n💥 Some tests failed or encountered errors');
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(error => {
    console.error('💥 Test suite failed:', error);
    process.exit(1);
  });
}

export { runTests, runTool };