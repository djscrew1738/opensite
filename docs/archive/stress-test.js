#!/usr/bin/env node
/**
 * OpenSite Blueprint Analysis - Stress Test
 * Tests concurrent load on AECVision, Floorplan, and Orchestrator services
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import FormData from 'form-data';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONFIG = {
  // Service URLs
  AECVISION_URL: process.env.AECVISION_URL || 'http://localhost:8002',
  FLOORPLAN_URL: process.env.FLOORPLAN_URL || 'http://localhost:8003',
  BACKEND_URL: process.env.BACKEND_URL || 'http://localhost:5001',
  
  // Test parameters
  CONCURRENT_REQUESTS: parseInt(process.env.CONCURRENT_REQUESTS) || 5,
  TOTAL_REQUESTS: parseInt(process.env.TOTAL_REQUESTS) || 20,
  REQUEST_TIMEOUT: parseInt(process.env.REQUEST_TIMEOUT) || 60000,
  DELAY_BETWEEN_BATCHES: parseInt(process.env.DELAY_BETWEEN_BATCHES) || 1000,
  
  // Test file (create a dummy PDF for testing)
  TEST_FILE_SIZE: parseInt(process.env.TEST_FILE_SIZE) || 1024 * 100, // 100KB dummy file
};

// Results tracking
const results = {
  healthChecks: { passed: 0, failed: 0, times: [] },
  aecvision: { passed: 0, failed: 0, times: [] },
  floorplan: { passed: 0, failed: 0, times: [] },
  orchestrator: { passed: 0, failed: 0, times: [] },
  export: { passed: 0, failed: 0, times: [] },
  websocket: { passed: 0, failed: 0, times: [] },
  errors: [],
};

// Utility: Measure execution time
async function measureTime(fn) {
  const start = process.hrtime.bigint();
  try {
    const result = await fn();
    const end = process.hrtime.bigint();
    return { success: true, result, time: Number(end - start) / 1e6 }; // ms
  } catch (error) {
    const end = process.hrtime.bigint();
    return { success: false, error: error.message, time: Number(end - start) / 1e6 };
  }
}

// Utility: HTTP GET request
async function httpGet(url, timeout = CONFIG.REQUEST_TIMEOUT) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, { timeout }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    });
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

// Test 1: Health Checks
async function testHealthChecks() {
  console.log('\n📋 Test 1: Health Checks');
  console.log('=' .repeat(50));
  
  const services = [
    { name: 'AECVision', url: `${CONFIG.AECVISION_URL}/health` },
    { name: 'Floorplan', url: `${CONFIG.FLOORPLAN_URL}/health` },
    { name: 'Backend', url: `${CONFIG.BACKEND_URL}/api/health` },
  ];
  
  for (const service of services) {
    const { success, time } = await measureTime(async () => {
      const response = await httpGet(service.url);
      if (response.status !== 200) {
        throw new Error(`HTTP ${response.status}`);
      }
      return response;
    });
    
    if (success) {
      results.healthChecks.passed++;
      results.healthChecks.times.push(time);
      console.log(`  ✅ ${service.name}: ${time.toFixed(2)}ms`);
    } else {
      results.healthChecks.failed++;
      console.log(`  ❌ ${service.name}: ${error.message}`);
    }
  }
}

// Test 2: Load Test AECVision
async function testAECVisionLoad() {
  console.log('\n📋 Test 2: AECVision Load Test');
  console.log('=' .repeat(50));
  
  // Create dummy test file
  const testFilePath = path.join(__dirname, 'test-stress.pdf');
  fs.writeFileSync(testFilePath, Buffer.alloc(CONFIG.TEST_FILE_SIZE).fill('PDF'));
  
  const batches = Math.ceil(CONFIG.TOTAL_REQUESTS / CONFIG.CONCURRENT_REQUESTS);
  
  for (let batch = 0; batch < batches; batch++) {
    const batchPromises = [];
    const batchSize = Math.min(CONFIG.CONCURRENT_REQUESTS, CONFIG.TOTAL_REQUESTS - batch * CONFIG.CONCURRENT_REQUESTS);
    
    for (let i = 0; i < batchSize; i++) {
      const requestNum = batch * CONFIG.CONCURRENT_REQUESTS + i + 1;
      batchPromises.push(
        measureTime(async () => {
          const form = new FormData();
          form.append('file', fs.createReadStream(testFilePath));
          
          const response = await fetch(`${CONFIG.AECVISION_URL}/detect`, {
            method: 'POST',
            body: form,
            timeout: CONFIG.REQUEST_TIMEOUT,
          });
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }
          return await response.json();
        }).then(result => {
          if (result.success) {
            results.aecvision.passed++;
            results.aecvision.times.push(result.time);
            process.stdout.write(`\r  ✅ Request ${requestNum}/${CONFIG.TOTAL_REQUESTS}: ${result.time.toFixed(2)}ms`);
          } else {
            results.aecvision.failed++;
            results.errors.push({ service: 'aecvision', request: requestNum, error: result.error });
            process.stdout.write(`\r  ❌ Request ${requestNum}/${CONFIG.TOTAL_REQUESTS}: ${result.error}`);
          }
        })
      );
    }
    
    await Promise.all(batchPromises);
    
    if (batch < batches - 1) {
      await new Promise(r => setTimeout(r, CONFIG.DELAY_BETWEEN_BATCHES));
    }
  }
  
  console.log('');
  fs.unlinkSync(testFilePath);
}

// Test 3: Load Test Floorplan
async function testFloorplanLoad() {
  console.log('\n📋 Test 3: Floorplan Load Test');
  console.log('=' .repeat(50));
  
  const testFilePath = path.join(__dirname, 'test-stress.pdf');
  fs.writeFileSync(testFilePath, Buffer.alloc(CONFIG.TEST_FILE_SIZE).fill('PDF'));
  
  const batches = Math.ceil(CONFIG.TOTAL_REQUESTS / CONFIG.CONCURRENT_REQUESTS);
  
  for (let batch = 0; batch < batches; batch++) {
    const batchPromises = [];
    const batchSize = Math.min(CONFIG.CONCURRENT_REQUESTS, CONFIG.TOTAL_REQUESTS - batch * CONFIG.CONCURRENT_REQUESTS);
    
    for (let i = 0; i < batchSize; i++) {
      const requestNum = batch * CONFIG.CONCURRENT_REQUESTS + i + 1;
      batchPromises.push(
        measureTime(async () => {
          const form = new FormData();
          form.append('file', fs.createReadStream(testFilePath));
          
          const response = await fetch(`${CONFIG.FLOORPLAN_URL}/extract`, {
            method: 'POST',
            body: form,
            timeout: CONFIG.REQUEST_TIMEOUT,
          });
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }
          return await response.json();
        }).then(result => {
          if (result.success) {
            results.floorplan.passed++;
            results.floorplan.times.push(result.time);
            process.stdout.write(`\r  ✅ Request ${requestNum}/${CONFIG.TOTAL_REQUESTS}: ${result.time.toFixed(2)}ms`);
          } else {
            results.floorplan.failed++;
            results.errors.push({ service: 'floorplan', request: requestNum, error: result.error });
            process.stdout.write(`\r  ❌ Request ${requestNum}/${CONFIG.TOTAL_REQUESTS}: ${result.error}`);
          }
        })
      );
    }
    
    await Promise.all(batchPromises);
    
    if (batch < batches - 1) {
      await new Promise(r => setTimeout(r, CONFIG.DELAY_BETWEEN_BATCHES));
    }
  }
  
  console.log('');
  fs.unlinkSync(testFilePath);
}

// Test 4: Load Test Orchestrator
async function testOrchestratorLoad() {
  console.log('\n📋 Test 4: Orchestrator Load Test');
  console.log('=' .repeat(50));
  
  const testFilePath = path.join(__dirname, 'test-stress.pdf');
  fs.writeFileSync(testFilePath, Buffer.alloc(CONFIG.TEST_FILE_SIZE).fill('PDF'));
  
  const batches = Math.ceil(CONFIG.TOTAL_REQUESTS / CONFIG.CONCURRENT_REQUESTS);
  
  for (let batch = 0; batch < batches; batch++) {
    const batchPromises = [];
    const batchSize = Math.min(CONFIG.CONCURRENT_REQUESTS, CONFIG.TOTAL_REQUESTS - batch * CONFIG.CONCURRENT_REQUESTS);
    
    for (let i = 0; i < batchSize; i++) {
      const requestNum = batch * CONFIG.CONCURRENT_REQUESTS + i + 1;
      batchPromises.push(
        measureTime(async () => {
          const form = new FormData();
          form.append('file', fs.createReadStream(testFilePath));
          form.append('options', JSON.stringify({
            useCV: true,
            useFloorplan: true,
            useAI: true,
          }));
          
          const response = await fetch(`${CONFIG.BACKEND_URL}/api/blueprint/analyze`, {
            method: 'POST',
            body: form,
            timeout: CONFIG.REQUEST_TIMEOUT,
          });
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }
          return await response.json();
        }).then(result => {
          if (result.success) {
            results.orchestrator.passed++;
            results.orchestrator.times.push(result.time);
            process.stdout.write(`\r  ✅ Request ${requestNum}/${CONFIG.TOTAL_REQUESTS}: ${result.time.toFixed(2)}ms`);
          } else {
            results.orchestrator.failed++;
            results.errors.push({ service: 'orchestrator', request: requestNum, error: result.error });
            process.stdout.write(`\r  ❌ Request ${requestNum}/${CONFIG.TOTAL_REQUESTS}: ${result.error}`);
          }
        })
      );
    }
    
    await Promise.all(batchPromises);
    
    if (batch < batches - 1) {
      await new Promise(r => setTimeout(r, CONFIG.DELAY_BETWEEN_BATCHES));
    }
  }
  
  console.log('');
  fs.unlinkSync(testFilePath);
}

// Test 5: Memory Usage Test
async function testMemoryUsage() {
  console.log('\n📋 Test 5: Memory Usage');
  console.log('=' .repeat(50));
  
  const memBefore = process.memoryUsage();
  console.log(`  Initial Memory:`);
  console.log(`    RSS: ${(memBefore.rss / 1024 / 1024).toFixed(2)} MB`);
  console.log(`    Heap Used: ${(memBefore.heapUsed / 1024 / 1024).toFixed(2)} MB`);
  
  // Force garbage collection if available
  if (global.gc) {
    global.gc();
  }
  
  const memAfter = process.memoryUsage();
  console.log(`  After GC:`);
  console.log(`    RSS: ${(memAfter.rss / 1024 / 1024).toFixed(2)} MB`);
  console.log(`    Heap Used: ${(memAfter.heapUsed / 1024 / 1024).toFixed(2)} MB`);
}

// Calculate statistics
function calculateStats(times) {
  if (times.length === 0) return { min: 0, max: 0, avg: 0, median: 0, p95: 0, p99: 0 };
  
  const sorted = [...times].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const avg = sorted.reduce((a, b) => a + b, 0) / sorted.length;
  const median = sorted[Math.floor(sorted.length / 2)];
  const p95 = sorted[Math.floor(sorted.length * 0.95)];
  const p99 = sorted[Math.floor(sorted.length * 0.99)];
  
  return { min, max, avg, median, p95, p99 };
}

// Print summary
function printSummary() {
  console.log('\n' + '=' .repeat(70));
  console.log('📊 STRESS TEST SUMMARY');
  console.log('=' .repeat(70));
  
  const categories = [
    { name: 'Health Checks', data: results.healthChecks },
    { name: 'AECVision', data: results.aecvision },
    { name: 'Floorplan', data: results.floorplan },
    { name: 'Orchestrator', data: results.orchestrator },
    { name: 'Export', data: results.export },
    { name: 'WebSocket', data: results.websocket },
  ];
  
  for (const cat of categories) {
    if (cat.data.passed === 0 && cat.data.failed === 0) continue;
    
    console.log(`\n${cat.name}:`);
    console.log(`  Passed: ${cat.data.passed} | Failed: ${cat.data.failed}`);
    console.log(`  Success Rate: ${((cat.data.passed / (cat.data.passed + cat.data.failed)) * 100).toFixed(1)}%`);
    
    if (cat.data.times.length > 0) {
      const stats = calculateStats(cat.data.times);
      console.log(`  Timing (ms):`);
      console.log(`    Min: ${stats.min.toFixed(2)} | Max: ${stats.max.toFixed(2)} | Avg: ${stats.avg.toFixed(2)}`);
      console.log(`    Median: ${stats.median.toFixed(2)} | P95: ${stats.p95.toFixed(2)} | P99: ${stats.p99.toFixed(2)}`);
    }
  }
  
  if (results.errors.length > 0) {
    console.log('\n❌ Errors (first 10):');
    results.errors.slice(0, 10).forEach(err => {
      console.log(`  [${err.service}] Request ${err.request}: ${err.error}`);
    });
    if (results.errors.length > 10) {
      console.log(`  ... and ${results.errors.length - 10} more errors`);
    }
  }
  
  console.log('\n' + '=' .repeat(70));
  
  // Overall pass/fail
  const totalPassed = categories.reduce((sum, c) => sum + c.data.passed, 0);
  const totalFailed = categories.reduce((sum, c) => sum + c.data.failed, 0);
  const totalRequests = totalPassed + totalFailed;
  const successRate = totalRequests > 0 ? (totalPassed / totalRequests) * 100 : 0;
  
  if (successRate >= 95) {
    console.log('✅ STRESS TEST PASSED');
  } else if (successRate >= 80) {
    console.log('⚠️ STRESS TEST PARTIAL (some failures)');
  } else {
    console.log('❌ STRESS TEST FAILED');
  }
  console.log(`Overall Success Rate: ${successRate.toFixed(1)}% (${totalPassed}/${totalRequests})`);
  console.log('=' .repeat(70));
}

// Main
async function main() {
  console.log('🚀 OpenSite Blueprint Analysis - Stress Test');
  console.log('=' .repeat(70));
  console.log(`Configuration:`);
  console.log(`  Concurrent Requests: ${CONFIG.CONCURRENT_REQUESTS}`);
  console.log(`  Total Requests: ${CONFIG.TOTAL_REQUESTS}`);
  console.log(`  Request Timeout: ${CONFIG.REQUEST_TIMEOUT}ms`);
  console.log(`  Delay Between Batches: ${CONFIG.DELAY_BETWEEN_BATCHES}ms`);
  console.log(`  Test File Size: ${(CONFIG.TEST_FILE_SIZE / 1024).toFixed(0)}KB`);
  console.log('=' .repeat(70));
  
  const startTime = Date.now();
  
  try {
    // Run tests
    await testHealthChecks();
    await testMemoryUsage();
    
    // Note: Full load tests require services to be running
    // For quick test, we'll skip heavy load tests if health checks fail
    if (results.healthChecks.failed === 0) {
      console.log('\n⚡ Services are healthy. Running load tests...');
      await testAECVisionLoad();
      await testFloorplanLoad();
      await testOrchestratorLoad();
    } else {
      console.log('\n⚠️ Some services failed health checks. Skipping load tests.');
    }
    
    await testMemoryUsage();
    
  } catch (error) {
    console.error('\n❌ Test suite error:', error.message);
  }
  
  const duration = (Date.now() - startTime) / 1000;
  console.log(`\n⏱️ Total Test Duration: ${duration.toFixed(2)}s`);
  
  printSummary();
  
  // Exit with appropriate code
  const totalPassed = Object.values(results).reduce((sum, r) => sum + (r.passed || 0), 0);
  const totalFailed = Object.values(results).reduce((sum, r) => sum + (r.failed || 0), 0);
  const successRate = totalPassed + totalFailed > 0 ? totalPassed / (totalPassed + totalFailed) : 0;
  
  process.exit(successRate >= 0.8 ? 0 : 1);
}

main();
