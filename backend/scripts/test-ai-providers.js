#!/usr/bin/env node
/**
 * AI Provider Test Script
 * Tests all AI providers: Ollama, Groq, Anthropic, OpenClaw
 */

import { aiProvider } from '../src/services/ai-provider.js';

const TEST_PROMPT = 'Say "Hello from CTL Plumbing AI test" in exactly 5 words or less.';

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function testProvider(name) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testing: ${name.toUpperCase()}`);
  console.log('='.repeat(60));

  const service = aiProvider.getProvider(name);
  if (!service) {
    console.log(`❌ Provider "${name}" not found`);
    return false;
  }

  // Health check
  console.log('\n📊 Health Check...');
  try {
    const health = await service.healthCheck();
    if (health.connected) {
      console.log(`  ✅ Connected`);
      console.log(`  📦 Model: ${health.model || 'N/A'}`);
      console.log(`  🔢 Available: ${health.available || health.totalModels || 'N/A'}`);
    } else {
      console.log(`  ❌ Not connected: ${health.error || 'Unknown error'}`);
      return false;
    }
  } catch (err) {
    console.log(`  ❌ Health check failed: ${err.message}`);
    return false;
  }

  // List models
  console.log('\n📋 Available Models...');
  try {
    const models = await service.listAvailableModels();
    if (Array.isArray(models)) {
      console.log(`  Found ${models.length} models`);
      models.slice(0, 3).forEach(m => {
        console.log(`    - ${m.name || m.id}${m.contextWindow ? ` (${m.contextWindow} ctx)` : ''}`);
      });
    } else {
      console.log(`  Models: ${JSON.stringify(models).slice(0, 100)}...`);
    }
  } catch (err) {
    console.log(`  ⚠️ Could not list models: ${err.message}`);
  }

  // Test generation
  console.log('\n📝 Testing Generation...');
  console.log(`  Prompt: "${TEST_PROMPT}"`);
  
  try {
    const start = Date.now();
    const result = await service.generate(TEST_PROMPT, {
      temperature: 0.5,
      maxTokens: 50,
    });
    const duration = Date.now() - start;

    if (result.success) {
      console.log(`  ✅ Success (${duration}ms)`);
      console.log(`  💬 Response: "${result.response?.trim()}"`);
      console.log(`  🏷️  Model: ${result.model || 'default'}`);
      
      if (result.usage) {
        console.log(`  📊 Tokens: ${result.usage.total_tokens || 'N/A'}`);
      }
    } else {
      console.log(`  ❌ Failed: ${result.error}`);
      return false;
    }
  } catch (err) {
    console.log(`  ❌ Error: ${err.message}`);
    return false;
  }

  // Test streaming
  console.log('\n🌊 Testing Stream...');
  try {
    const start = Date.now();
    let streamText = '';
    
    for await (const chunk of service.generateStream(TEST_PROMPT, {
      temperature: 0.5,
      maxTokens: 50,
    })) {
      if (typeof chunk === 'string') {
        streamText += chunk;
      } else if (chunk.chunk) {
        streamText += chunk.chunk;
      }
    }
    
    const duration = Date.now() - start;
    console.log(`  ✅ Stream complete (${duration}ms)`);
    console.log(`  💬 Response: "${streamText?.trim()}"`);
  } catch (err) {
    console.log(`  ❌ Stream error: ${err.message}`);
  }

  // Test metrics
  console.log('\n📈 Metrics...');
  try {
    const metrics = service.getMetrics();
    console.log(`  Requests: ${metrics.requests || metrics.totalRequests || 0}`);
    console.log(`  Errors: ${metrics.errors || metrics.failCount || 0}`);
    console.log(`  Avg Latency: ${metrics.avgLatency || metrics.avgResponseMs || 0}ms`);
    console.log(`  Circuit Breaker: ${metrics.circuitBreaker || 'N/A'}`);
  } catch (err) {
    console.log(`  ⚠️ No metrics available`);
  }

  return true;
}

async function testUnifiedProvider() {
  console.log(`\n${'='.repeat(60)}`);
  console.log('Testing UNIFIED AI PROVIDER');
  console.log('='.repeat(60));

  // Test fallback chain
  console.log('\n🔗 Fallback Chain:');
  console.log(`  ${aiProvider.fallbackOrder.join(' → ')}`);

  // Test generate with fallback
  console.log('\n📝 Testing Unified Generate with Fallback...');
  try {
    const result = await aiProvider.generate(TEST_PROMPT, {
      temperature: 0.5,
    });
    
    if (result.success) {
      console.log(`  ✅ Success via ${result.provider}${result.isFallback ? ' (fallback)' : ''}`);
      console.log(`  💬 Response: "${result.response?.trim()}"`);
    } else {
      console.log(`  ❌ Failed: ${result.error}`);
    }
  } catch (err) {
    console.log(`  ❌ Error: ${err.message}`);
  }

  // Test health check all
  console.log('\n📊 Health Check All Providers:');
  const health = await aiProvider.healthCheckAll();
  for (const [name, status] of Object.entries(health)) {
    const icon = status.connected ? '✅' : '❌';
    console.log(`  ${icon} ${name}: ${status.connected ? 'healthy' : status.error || 'unhealthy'}`);
  }

  // Test provider info
  console.log('\n📋 Provider Status:');
  const providers = aiProvider.getAvailableProviders();
  providers.forEach(p => {
    const icon = p.active ? '▶️' : '  ';
    const healthIcon = p.health?.status === 'healthy' ? '🟢' : '⚪';
    console.log(`  ${icon} ${healthIcon} ${p.label}`);
    console.log(`      Model: ${p.defaultModel}`);
    console.log(`      API Key: ${p.hasApiKey ? '✅' : '❌'}`);
  });
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║        CTL Plumbing - AI Provider Test Suite              ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  // Load settings
  console.log('\n🔧 Loading settings...');
  aiProvider.loadFromSettings();
  console.log(`   Active provider: ${aiProvider.activeProviderName}`);

  // Test each provider
  const providers = ['groq', 'anthropic', 'ollama', 'openclaw'];
  const results = {};

  for (const name of providers) {
    results[name] = await testProvider(name);
    await sleep(1000); // Rate limiting between providers
  }

  // Test unified provider
  await testUnifiedProvider();

  // Summary
  console.log(`\n${'='.repeat(60)}`);
  console.log('SUMMARY');
  console.log('='.repeat(60));
  
  for (const [name, success] of Object.entries(results)) {
    console.log(`  ${success ? '✅' : '❌'} ${name.toUpperCase()}`);
  }

  const passed = Object.values(results).filter(Boolean).length;
  const total = providers.length;
  
  console.log(`\n  ${passed}/${total} providers working`);
  
  if (passed === 0) {
    console.log('\n  ⚠️  No providers available. Check your configuration.');
    process.exit(1);
  } else if (passed < total) {
    console.log('\n  ⚠️  Some providers failed. Fallback will be used.');
  } else {
    console.log('\n  🎉 All providers operational!');
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
