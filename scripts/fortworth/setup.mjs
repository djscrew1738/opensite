#!/usr/bin/env node
// setup.mjs — Fort Worth Permit Dataset Discovery & Testing
// ES module version for 1stein project
//
// Usage:
//   node scripts/fortworth/setup.mjs              # Full setup flow
//   node scripts/fortworth/setup.mjs --discover   # Show dataset fields
//   node scripts/fortworth/setup.mjs --sample     # Pull 10 sample permits
//   node scripts/fortworth/setup.mjs --count      # Count permits by type

import https from 'https';

const SOCRATA_BASE = 'https://data.fortworthtexas.gov/resource';

const DATASETS = {
  primary: { id: '9c4v-ngai', name: 'Issued Building Permits' },
  dev:     { id: 'quz7-xnsy', name: 'Development Permits' },
};

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'Accept': 'application/json' } }, (res) => {
      // Follow redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchJSON(res.headers.location).then(resolve, reject);
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (!data.trim()) {
          return resolve([]);
        }
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error(`JSON parse error (${res.statusCode}): ${e.message}\nBody: ${data.substring(0, 200)}`)); }
      });
    }).on('error', reject);
  });
}

async function discover(datasetKey) {
  const ds = DATASETS[datasetKey];
  const apiUrl = `${SOCRATA_BASE}/${ds.id}.json`;

  console.log(`\n--- ${ds.name} (${ds.id}) ---`);
  console.log(`URL: ${apiUrl}\n`);

  // Fetch metadata
  const metaUrl = `https://data.fortworthtexas.gov/api/views/${ds.id}.json`;
  try {
    const meta = await fetchJSON(metaUrl);
    console.log(`  Name: ${meta.name}`);
    console.log(`  Description: ${meta.description || 'N/A'}`);
    console.log(`  Last Updated: ${meta.rowsUpdatedAt ? new Date(meta.rowsUpdatedAt * 1000).toLocaleDateString() : 'Unknown'}`);
    console.log(`  Row Count: ${meta.rowCount || 'Unknown'}\n`);

    if (meta.columns) {
      console.log('  === COLUMNS ===');
      meta.columns.forEach(col => {
        console.log(`    ${col.fieldName.padEnd(30)} ${(col.dataTypeName || '').padEnd(12)} ${col.name}`);
      });
      console.log(`  Total columns: ${meta.columns.length}\n`);
    }
  } catch {
    console.log('  Could not fetch metadata — trying data directly...\n');
  }

  // Fetch sample records
  const samples = await fetchJSON(`${apiUrl}?$limit=3&$order=:id%20DESC`);

  if (samples.length === 0) {
    console.log('  Dataset returned 0 records.\n');
    return;
  }

  console.log('  === FIELD NAMES & SAMPLE VALUES ===');
  const fields = Object.keys(samples[0]);
  fields.forEach(f => {
    const val = JSON.stringify(samples[0][f]);
    console.log(`    ${f.padEnd(30)} ${val.substring(0, 70)}`);
  });
  console.log(`\n  Fields found: ${fields.length}`);
  console.log('\n  === FULL SAMPLE RECORD ===');
  console.log(JSON.stringify(samples[0], null, 2));
}

async function countByType(datasetKey) {
  const ds = DATASETS[datasetKey];
  const apiUrl = `${SOCRATA_BASE}/${ds.id}.json`;

  console.log(`\n--- Permit Types: ${ds.name} (${ds.id}) ---\n`);

  const url = `${apiUrl}?$select=permit_type,count(*)%20as%20cnt&$group=permit_type&$order=cnt%20DESC&$limit=50`;
  const data = await fetchJSON(url);

  console.log('Permit Type'.padEnd(50) + 'Count');
  console.log('-'.repeat(60));
  data.forEach(row => {
    const type = (row.permit_type || 'Unknown').padEnd(50);
    console.log(`${type} ${row.cnt}`);
  });
  console.log(`\nTotal types: ${data.length}`);
}

async function pullSample(datasetKey) {
  const ds = DATASETS[datasetKey];
  const apiUrl = `${SOCRATA_BASE}/${ds.id}.json`;

  console.log(`\n--- Sample Records: ${ds.name} (${ds.id}) ---\n`);

  const data = await fetchJSON(`${apiUrl}?$limit=10&$order=:id%20DESC`);

  if (data.length === 0) {
    console.log('No records returned.\n');
    return;
  }

  console.log(`Got ${data.length} records:\n`);
  data.forEach((r, i) => {
    console.log(`--- Record ${i + 1} ---`);
    Object.entries(r).forEach(([k, v]) => {
      if (v && String(v).length > 0) {
        console.log(`  ${k}: ${String(v).substring(0, 100)}`);
      }
    });
    console.log();
  });
}

async function main() {
  const args = process.argv.slice(2);

  console.log('========================================');
  console.log('  1stein — Fort Worth Permit Setup');
  console.log('========================================');

  for (const [key, ds] of Object.entries(DATASETS)) {
    console.log(`\n[${key}] ${ds.name} — ${ds.id}`);
  }

  for (const datasetKey of Object.keys(DATASETS)) {
    try {
      if (args.includes('--discover') || args.length === 0) {
        await discover(datasetKey);
      }

      if (args.includes('--count') || args.length === 0) {
        await countByType(datasetKey);
      }

      if (args.includes('--sample')) {
        await pullSample(datasetKey);
      }
    } catch (err) {
      console.error(`\nError with ${datasetKey}: ${err.message}`);
      console.log('  (This may be a network/API issue — the dataset config is still valid)\n');
    }
  }

  console.log('\n=== NEXT STEPS ===');
  console.log('1. Both datasets are configured in the Fort Worth adapter');
  console.log('2. Run: cd backend && npm run permits:ingest');
  console.log('   to pull permits through the ingestion pipeline');
  console.log('3. The Accela adapter requires Playwright for browser automation');
  console.log();
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
