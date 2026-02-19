#!/usr/bin/env node
/**
 * Test script: Fetch permits from Fort Worth and display results
 * No database required — useful for verifying API connectivity and data shape.
 *
 * Usage: node src/test-adapters.js [days_back]
 */

require('dotenv').config();
const FortWorthAdapter = require('./adapters/fortworth');

const mockSource = {
  id: 1,
  name: 'fort_worth',
  api_base_url: 'https://data.fortworthtexas.gov/resource',
  dataset_id: '9c4v-ngai',
  adapter_type: 'socrata',
  field_mapping: {},
};

(async () => {
  const daysBack = parseInt(process.argv[2]) || 7;

  console.log(`\n🔍 Testing Fort Worth adapter (${daysBack} days back)...\n`);

  const adapter = new FortWorthAdapter(mockSource);

  try {
    const permits = await adapter.run(daysBack);

    console.log(`✅ Fetched and normalized ${permits.length} permits\n`);

    if (permits.length === 0) {
      console.log('No permits found. Try increasing days_back.');
      return;
    }

    // Show category breakdown
    const categories = {};
    permits.forEach(p => {
      categories[p.permit_category] = (categories[p.permit_category] || 0) + 1;
    });
    console.log('📊 Categories:');
    Object.entries(categories).sort((a, b) => b[1] - a[1]).forEach(([cat, count]) => {
      console.log(`   ${cat}: ${count}`);
    });

    // Show new construction specifically
    const newConstruction = permits.filter(p => p.permit_category === 'new_construction');
    console.log(`\n🏗️  New Construction: ${newConstruction.length} permits\n`);

    // Show top 10 by estimated cost
    const withCost = permits
      .filter(p => p.estimated_cost)
      .sort((a, b) => b.estimated_cost - a.estimated_cost)
      .slice(0, 10);

    if (withCost.length > 0) {
      console.log('💰 Top 10 by estimated cost:');
      console.log('─'.repeat(100));
      console.log(
        'Cost'.padEnd(15) +
        'Type'.padEnd(30) +
        'Address'.padEnd(35) +
        'Contractor'
      );
      console.log('─'.repeat(100));

      withCost.forEach(p => {
        console.log(
          `$${Number(p.estimated_cost).toLocaleString()}`.padEnd(15) +
          (p.permit_type || '').substring(0, 28).padEnd(30) +
          (p.address || '').substring(0, 33).padEnd(35) +
          (p.contractor_name || 'N/A').substring(0, 30)
        );
      });
    }

    // Show sample raw data for first permit
    console.log('\n📝 Sample normalized record:');
    console.log(JSON.stringify(permits[0], null, 2));

  } catch (err) {
    console.error(`❌ Error: ${err.message}`);
    if (err.response) {
      console.error(`   Status: ${err.response.status}`);
      console.error(`   Data: ${JSON.stringify(err.response.data).substring(0, 200)}`);
    }
  }
})();
