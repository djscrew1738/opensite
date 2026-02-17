#!/usr/bin/env node
// setup-fortworth.js
// =============================================================
// FORT WORTH PERMIT SCRAPER — SETUP & TEST SCRIPT
// =============================================================
// Run this FIRST to:
//   1. Discover actual Socrata dataset fields
//   2. Test the SODA API connection
//   3. Pull a sample batch of permits
//   4. Show you what the data looks like before full integration
//
// Usage:
//   node setup-fortworth.js              # Full setup flow
//   node setup-fortworth.js --discover   # Just show dataset fields
//   node setup-fortworth.js --sample     # Pull 10 sample permits
//   node setup-fortworth.js --count      # Count permits by type
// =============================================================

const axios = require("axios");

const SOCRATA_BASE = "https://data.fortworthtexas.gov/resource";
const DATASET = "quz7-xnsy";
const API_URL = `${SOCRATA_BASE}/${DATASET}.json`;

async function discover() {
  console.log("\n🔍 DISCOVERING SOCRATA DATASET FIELDS...\n");
  console.log(`Dataset: ${API_URL}\n`);

  try {
    // Fetch metadata
    const metaUrl = `https://data.fortworthtexas.gov/api/views/${DATASET}.json`;
    try {
      const { data: meta } = await axios.get(metaUrl, { timeout: 10000 });
      console.log(`📋 Dataset Name: ${meta.name}`);
      console.log(`📝 Description: ${meta.description || "N/A"}`);
      console.log(`📅 Last Updated: ${meta.rowsUpdatedAt ? new Date(meta.rowsUpdatedAt * 1000).toLocaleDateString() : "Unknown"}`);
      console.log(`📊 Row Count: ${meta.rowCount || "Unknown"}\n`);

      if (meta.columns) {
        console.log("=== ALL COLUMNS ===");
        meta.columns.forEach(col => {
          console.log(`  ${col.fieldName.padEnd(30)} ${(col.dataTypeName || "").padEnd(12)} ${col.name}`);
        });
        console.log(`\nTotal columns: ${meta.columns.length}\n`);
      }
    } catch {
      console.log("⚠️  Could not fetch metadata endpoint — trying data directly...\n");
    }

    // Fetch sample records
    const { data: samples } = await axios.get(API_URL, {
      params: { $limit: 3, $order: ":id DESC" },
      timeout: 10000,
    });

    if (samples.length === 0) {
      console.log("⚠️  Dataset returned 0 records. It may be empty, private, or the ID may be wrong.");
      console.log("    Try browsing: https://data.fortworthtexas.gov/browse?q=permit");
      return;
    }

    console.log("=== FIELD NAMES & SAMPLE VALUES ===");
    const fields = Object.keys(samples[0]);
    fields.forEach(f => {
      const val = JSON.stringify(samples[0][f]);
      console.log(`  ${f.padEnd(30)} ${val.substring(0, 70)}`);
    });

    console.log(`\n📊 Fields found: ${fields.length}`);
    console.log("\n=== FULL SAMPLE RECORD ===");
    console.log(JSON.stringify(samples[0], null, 2));

    // Save field map for reference
    console.log("\n✅ Copy the field names above and update the mapSocrataRecord() function");
    console.log("   in scrapers/permits-fortworth.js to match the actual column names.\n");

    return fields;
  } catch (err) {
    console.error(`❌ API Error: ${err.message}`);
    if (err.response) {
      console.error(`   Status: ${err.response.status}`);
      console.error(`   Body: ${JSON.stringify(err.response.data).substring(0, 300)}`);
    }
    console.log("\n💡 The dataset ID might be wrong. Try searching:");
    console.log("   https://data.fortworthtexas.gov/browse?q=development+permits");
  }
}

async function countByType() {
  console.log("\n📊 COUNTING PERMITS BY TYPE...\n");

  try {
    // SoQL group by query
    const { data } = await axios.get(API_URL, {
      params: {
        $select: "permit_type, count(*) as cnt",
        $group: "permit_type",
        $order: "cnt DESC",
        $limit: 50,
      },
      timeout: 15000,
    });

    console.log("Permit Type".padEnd(50) + "Count");
    console.log("─".repeat(60));
    data.forEach(row => {
      const type = (row.permit_type || "Unknown").padEnd(50);
      console.log(`${type} ${row.cnt}`);
    });
    console.log(`\nTotal types: ${data.length}`);
  } catch (err) {
    console.error(`❌ Count query failed: ${err.message}`);
    if (err.response?.data) {
      console.error(JSON.stringify(err.response.data).substring(0, 300));
    }
  }
}

async function pullSample() {
  console.log("\n🏗️  PULLING SAMPLE NEW CONSTRUCTION PERMITS...\n");

  // Try different field name patterns
  const queries = [
    { label: "By permit_type", where: "permit_type LIKE '%New%Building%'" },
    { label: "By type", where: "type LIKE '%New%'" },
    { label: "By description", where: "description LIKE '%new%construction%'" },
    { label: "Recent 10", where: "1=1" },
  ];

  for (const q of queries) {
    try {
      console.log(`  Trying: ${q.label} (${q.where})`);
      const { data } = await axios.get(API_URL, {
        params: {
          $where: q.where,
          $order: ":id DESC",
          $limit: 10,
        },
        timeout: 10000,
      });

      if (data.length > 0) {
        console.log(`  ✅ Got ${data.length} records!\n`);
        data.forEach((r, i) => {
          console.log(`--- Permit ${i + 1} ---`);
          Object.entries(r).forEach(([k, v]) => {
            if (v && String(v).length > 0) {
              console.log(`  ${k}: ${String(v).substring(0, 100)}`);
            }
          });
          console.log();
        });
        return;
      } else {
        console.log(`  → 0 results\n`);
      }
    } catch (err) {
      console.log(`  → Error: ${err.response?.data?.message || err.message}\n`);
    }
  }

  console.log("⚠️  Could not find permits with common field patterns.");
  console.log("    Run with --discover first to see actual field names.");
}

// =============================================================
// MAIN
// =============================================================
async function main() {
  const args = process.argv.slice(2);

  console.log("╔══════════════════════════════════════════════╗");
  console.log("║  🛰️  Lead Radar — Fort Worth Permit Setup    ║");
  console.log("╚══════════════════════════════════════════════╝");

  if (args.includes("--discover") || args.length === 0) {
    await discover();
  }

  if (args.includes("--count") || args.length === 0) {
    await countByType();
  }

  if (args.includes("--sample") || args.length === 0) {
    await pullSample();
  }

  console.log("\n=== NEXT STEPS ===");
  console.log("1. Review the field names above");
  console.log("2. Update mapSocrataRecord() in scrapers/permits-fortworth.js");
  console.log("   to use the actual field names from your dataset");
  console.log("3. Run: node scrapers/permits-fortworth.js --soda-only --days=30");
  console.log("   to pull a month of permits through the API");
  console.log("4. Run: node scrapers/permits-fortworth.js --accela-only");
  console.log("   to test the Accela portal scraper (needs Puppeteer/Chrome)");
  console.log();
}

main().catch(err => {
  console.error("Fatal:", err);
  process.exit(1);
});
