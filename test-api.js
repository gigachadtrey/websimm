#!/usr/bin/env node

/**
 * WebSim API Testing Script
 * 
 * This script tests the WebSim API endpoints to validate our implementation.
 */

const http = require('http');
const https = require('https');

const WEBSIM_API_BASE = 'https://api.websim.com';
const USER_AGENT = 'websim-mcp-test/1.0.0';

function makeRequest(url) {
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https') ? https : http;
        
        const req = client.get(url, {
            headers: {
                'User-Agent': USER_AGENT,
                'Accept': 'application/json'
            }
        }, (res) => {
            console.log(`Status: ${res.statusCode} ${res.statusMessage}`);
            console.log(`Headers:`, res.headers);
            
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                console.log(`Response data length: ${data.length} bytes`);
                try {
                    const parsed = JSON.parse(data);
                    console.log(`✅ Valid JSON response received`);
                    resolve(parsed);
                } catch (e) {
                    console.log(`❌ Invalid JSON response`);
                    console.log(`Raw response: ${data.substring(0, 200)}...`);
                    reject(new Error('Invalid JSON response'));
                }
            });
        });
        
        req.on('error', (error) => {
            console.log(`❌ Request error: ${error.message}`);
            reject(error);
        });
        
        req.setTimeout(10000, () => {
            console.log('❌ Request timeout');
            req.destroy();
        });
    });
}

async function testAPIEndpoints() {
    console.log('🧪 Testing WebSim API endpoints...\n');
    
    // Test trending projects endpoint
    console.log('1. Testing trending projects endpoint...');
    try {
        const trendingUrl = `${WEBSIM_API_BASE}/api/v1/feed/trending?limit=5`;
        const trendingData = await makeRequest(trendingUrl);
        console.log(`✅ Trending projects endpoint works`);
        console.log(`Found ${trendingData.items?.length || 0} items\n`);
    } catch (error) {
        console.log(`❌ Trending projects endpoint failed: ${error.message}\n`);
    }
    
    // Test user search endpoint
    console.log('2. Testing user search endpoint...');
    try {
        const searchUrl = `${WEBSIM_API_BASE}/api/v1/user-search?q=test`;
        const searchData = await makeRequest(searchUrl);
        console.log(`✅ User search endpoint works`);
        console.log(`Found ${searchData.users?.length || 0} users\n`);
    } catch (error) {
        console.log(`❌ User search endpoint failed: ${error.message}\n`);
    }
    
    // Test search assets endpoint
    console.log('3. Testing search assets endpoint...');
    try {
        const assetsUrl = `${WEBSIM_API_BASE}/api/v1/search/assets?query=test&limit=5`;
        const assetsData = await makeRequest(assetsUrl);
        console.log(`✅ Search assets endpoint works`);
        console.log(`Found ${assetsData.assets?.length || 0} assets\n`);
    } catch (error) {
        console.log(`❌ Search assets endpoint failed: ${error.message}\n`);
    }
    
    // Test related keywords endpoint
    console.log('4. Testing related keywords endpoint...');
    try {
        const keywordsUrl = `${WEBSIM_API_BASE}/api/v1/search/related?query=web`;
        const keywordsData = await makeRequest(keywordsUrl);
        console.log(`✅ Related keywords endpoint works`);
        console.log(`Found ${keywordsData.keywords?.length || 0} keywords\n`);
    } catch (error) {
        console.log(`❌ Related keywords endpoint failed: ${error.message}\n`);
    }
    
    console.log('🎯 API Testing completed!');
}

if (require.main === module) {
    testAPIEndpoints().catch(console.error);
}

module.exports = { makeRequest };