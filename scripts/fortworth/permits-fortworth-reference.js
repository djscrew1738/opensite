// scrapers/permits-fortworth.js
// =============================================================
// FORT WORTH PERMIT SCRAPER
// =============================================================
// Two data sources:
//   1. Socrata SODA API (data.fortworthtexas.gov) — bulk, easy, monthly lag
//   2. Accela Citizen Access (aca-prod.accela.com/CFW) — real-time, Puppeteer
//
// Run: node scrapers/permits-fortworth.js
// Flags:
//   --soda-only      Only run Socrata API scrape
//   --accela-only    Only run Accela portal scrape
//   --days=N         Look back N days (default: 1)
//   --type=TYPE      Filter by permit type (see PERMIT_TYPES below)
// =============================================================

require("dotenv").config();
const axios = require("axios");
const puppeteer = require("puppeteer");
const db = require("../lib/db");
const logger = require("../lib/logger");
const BaseScraper = require("./base");

// Permit types we care about (from Accela dropdown)
const PERMIT_TYPES = {
  // ---- HIGH PRIORITY (new construction) ----
  "Residential New Building Permit":       { priority: 1, jobType: "new_construction", label: "Res New Build" },
  "Commercial New Building Permit":        { priority: 1, jobType: "new_construction", label: "Com New Build" },
  "Commercial New Accessory Structure":    { priority: 2, jobType: "new_construction", label: "Com New Acc" },
  "Residential Accessory New Permit":      { priority: 2, jobType: "new_construction", label: "Res New Acc" },

  // ---- MEDIUM PRIORITY (additions / remodels) ----
  "Residential Addition Permit":           { priority: 3, jobType: "remodel", label: "Res Addition" },
  "Commercial Addition Building Permit":   { priority: 3, jobType: "remodel", label: "Com Addition" },
  "Commercial Addition Accessory Structure": { priority: 4, jobType: "remodel", label: "Com Add Acc" },
  "Residential Accessory Addition Permit": { priority: 4, jobType: "remodel", label: "Res Add Acc" },
  "Residential Remodel Construction Permit": { priority: 5, jobType: "remodel", label: "Res Remodel" },
  "Commercial Remodel Building Permit":    { priority: 5, jobType: "remodel", label: "Com Remodel" },
  "Commercial Remodel Accessory Structure": { priority: 6, jobType: "remodel", label: "Com Rem Acc" },
  "Residential Accessory Remodel Permit":  { priority: 6, jobType: "remodel", label: "Res Rem Acc" },

  // ---- PLUMBING SPECIFIC ----
  "Plumbing Standalone Permit":            { priority: 7, jobType: "service_repair", label: "Plumbing" },
  "Plumbing Umbrella Permit":              { priority: 7, jobType: "service_repair", label: "Plumb Umbrella" },
  "Plumbing Backflow Standalone Permit":   { priority: 8, jobType: "service_repair", label: "Backflow" },
  "Plumbing Temporary Gas":               { priority: 8, jobType: "service_repair", label: "Temp Gas" },
};

// Socrata dataset ID for Fort Worth development permits
const SOCRATA_DATASET = "quz7-xnsy";
const SOCRATA_BASE = "https://data.fortworthtexas.gov/resource";
const ACCELA_BASE = "https://aca-prod.accela.com/CFW";


class FortWorthPermitScraper extends BaseScraper {
  constructor() {
    super("permits-fortworth");
    this.daysBack = parseInt(process.argv.find(a => a.startsWith("--days="))?.split("=")[1] || "1");
  }

  async scrape() {
    const sodaOnly = process.argv.includes("--soda-only");
    const accelaOnly = process.argv.includes("--accela-only");

    if (!accelaOnly) {
      logger.info("=== Fort Worth: Socrata SODA API ===");
      await this.scrapeSocrata();
    }

    if (!sodaOnly) {
      logger.info("=== Fort Worth: Accela Citizen Access ===");
      await this.scrapeAccela();
    }
  }

  // =============================================================
  // SOCRATA SODA API — Bulk data, easy to query
  // =============================================================
  // Dataset: "Development Permits" (quz7-xnsy)
  // Updated monthly. Good for backfilling and catching permits
  // that are a few weeks old.
  //
  // SODA API docs: https://dev.socrata.com/foundry/data.fortworthtexas.gov/quz7-xnsy
  // =============================================================
  async scrapeSocrata() {
    const cutoffDate = new Date(Date.now() - this.daysBack * 86400000);
    const dateStr = cutoffDate.toISOString().split("T")[0];

    // Query for residential new building permits issued after cutoff
    // The SODA API supports SQL-like queries with $where
    const queries = [
      // New residential construction
      {
        label: "Residential New Builds",
        where: `permit_type='Residential New Building Permit' AND date_issued > '${dateStr}'`,
      },
      // Commercial new construction
      {
        label: "Commercial New Builds",
        where: `permit_type='Commercial New Building Permit' AND date_issued > '${dateStr}'`,
      },
      // Residential additions
      {
        label: "Residential Additions",
        where: `permit_type='Residential Addition Permit' AND date_issued > '${dateStr}'`,
      },
      // All plumbing permits (to track who's doing plumbing work)
      {
        label: "Plumbing Permits",
        where: `starts_with(permit_type, 'Plumbing') AND date_issued > '${dateStr}'`,
      },
    ];

    for (const q of queries) {
      try {
        logger.info(`Socrata query: ${q.label}`);

        const url = `${SOCRATA_BASE}/${SOCRATA_DATASET}.json`;
        const params = {
          $where: q.where,
          $order: "date_issued DESC",
          $limit: 200,
        };

        const { data } = await axios.get(url, {
          params,
          timeout: 15000,
          headers: { Accept: "application/json" },
        });

        logger.info(`  → ${data.length} records returned`);

        for (const record of data) {
          const lead = this.mapSocrataRecord(record);
          if (lead) {
            await this.processLead(lead);
          }
        }

        await this.delay(1000, 2000);
      } catch (err) {
        logger.error(`Socrata query failed (${q.label}): ${err.message}`);
        if (err.response) {
          logger.error(`  Response: ${JSON.stringify(err.response.data).substring(0, 200)}`);
        }
      }
    }

    // Also query for permits where no plumbing contractor is listed
    // These are the gold — new construction with no plumber assigned
    try {
      logger.info("Socrata query: New builds missing plumbing contractor");
      const url = `${SOCRATA_BASE}/${SOCRATA_DATASET}.json`;
      const { data } = await axios.get(url, {
        params: {
          $where: `permit_type='Residential New Building Permit' AND date_issued > '${dateStr}'`,
          $order: "date_issued DESC",
          $limit: 500,
        },
        timeout: 15000,
      });

      // Filter client-side for records missing plumbing info
      // (Socrata may not have a plumbing contractor field, so we check what's available)
      const missingPlumber = data.filter(r => {
        const allText = JSON.stringify(r).toLowerCase();
        return !allText.includes("plumb");
      });

      logger.info(`  → ${missingPlumber.length}/${data.length} new builds with no plumbing reference`);

      for (const record of missingPlumber) {
        const lead = this.mapSocrataRecord(record, { noPlumber: true });
        if (lead) {
          // Boost score for no-plumber permits
          lead.tags = [...(lead.tags || []), "no plumber assigned"];
          await this.processLead(lead);
        }
      }
    } catch (err) {
      logger.error(`Socrata no-plumber query failed: ${err.message}`);
    }
  }

  // Map a Socrata record to our lead format
  mapSocrataRecord(record, flags = {}) {
    // Socrata field names (these may vary — adjust based on actual dataset columns)
    // Common Socrata fields for CFW permits:
    //   permit_number, permit_type, date_issued, date_applied, status,
    //   address, street_number, street_name, street_type,
    //   contractor, owner_name, valuation, description, project_name

    const permitType = record.permit_type || record.type || "";
    const typeConfig = PERMIT_TYPES[permitType];

    // Skip types we don't care about
    if (!typeConfig && !permitType.toLowerCase().includes("plumb")) return null;

    const address = record.address ||
      [record.street_number, record.street_direction, record.street_name, record.street_type]
        .filter(Boolean).join(" ").trim();

    const rawText = [
      `Fort Worth Building Permit: ${record.permit_number || ""}`,
      `Type: ${permitType}`,
      record.description || record.project_name || "",
      address ? `Address: ${address}` : "",
      record.contractor ? `Contractor: ${record.contractor}` : "",
      record.owner_name ? `Owner: ${record.owner_name}` : "",
      record.valuation ? `Valuation: ${Number(record.valuation).toLocaleString()}` : "",
      record.status ? `Status: ${record.status}` : "",
      record.date_issued ? `Issued: ${record.date_issued}` : "",
      flags.noPlumber ? "\n⚠️ No plumbing contractor listed on permit." : "",
    ].filter(Boolean).join("\n");

    return {
      source: "permits",
      raw_text: rawText,
      contact_name: record.contractor || record.owner_name || null,
      contact_role: record.contractor ? "General Contractor" : "Property Owner",
      location_text: address || "Fort Worth, TX",
      city: "Fort Worth",
      permit_number: record.permit_number || null,
      permit_value: parseFloat(record.valuation || 0) || null,
      permit_data: {
        permit_type: permitType,
        type_label: typeConfig?.label || permitType,
        description: record.description || null,
        project_name: record.project_name || null,
        status: record.status || null,
        date_issued: record.date_issued || null,
        date_applied: record.date_applied || null,
        contractor: record.contractor || null,
        owner: record.owner_name || null,
        valuation: record.valuation || null,
        address: address,
        source_api: "socrata",
      },
      source_url: `${ACCELA_BASE}/Cap/CapHome.aspx?module=Development`,
      source_post_id: record.permit_number || null,
      posted_at: record.date_issued ? new Date(record.date_issued) : new Date(),
      job_type: typeConfig?.jobType || "unknown",
      tags: [
        "permit", "fort worth",
        typeConfig?.jobType === "new_construction" ? "new construction" : null,
        typeConfig?.jobType === "remodel" ? "remodel" : null,
        flags.noPlumber ? "no plumber assigned" : null,
      ].filter(Boolean),
    };
  }

  // =============================================================
  // ACCELA CITIZEN ACCESS — Real-time portal scraping
  // =============================================================
  // This uses Puppeteer to interact with the ASP.NET WebForms
  // portal at aca-prod.accela.com/CFW
  //
  // It searches for permits by type and date range, then extracts
  // details from each result row and optionally clicks into
  // individual permit detail pages for full contractor/sub info.
  // =============================================================
  async scrapeAccela() {
    const browser = await puppeteer.launch({
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-blink-features=AutomationControlled",
      ],
      defaultViewport: { width: 1400, height: 900 },
    });

    try {
      const page = await browser.newPage();
      await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36"
      );

      // Navigate to the Development search page
      const searchUrl = `${ACCELA_BASE}/Cap/CapHome.aspx?module=Development&TabName=Home`;
      logger.info(`Navigating to Accela: ${searchUrl}`);
      await page.goto(searchUrl, { waitUntil: "networkidle2", timeout: 30000 });
      await this.delay(2000, 3000);

      // Search for each permit type we care about
      const targetTypes = [
        "Residential New Building Permit",
        "Commercial New Building Permit",
        "Residential Addition Permit",
        "Commercial Addition Building Permit",
      ];

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date(Date.now() - this.daysBack * 86400000);
      const startStr = this.formatDate(startDate);
      const endStr = this.formatDate(endDate);

      for (const permitType of targetTypes) {
        try {
          logger.info(`Accela search: ${permitType} (${startStr} - ${endStr})`);
          await this.searchAccela(page, permitType, startStr, endStr);
          await this.delay(3000, 5000);
        } catch (err) {
          logger.error(`Accela search failed for ${permitType}: ${err.message}`);
        }
      }
    } finally {
      await browser.close();
    }
  }

  async searchAccela(page, permitType, startDate, endDate) {
    const searchUrl = `${ACCELA_BASE}/Cap/CapHome.aspx?module=Development&TabName=Home`;

    // Reload search page fresh for each search
    await page.goto(searchUrl, { waitUntil: "networkidle2", timeout: 30000 });
    await this.delay(2000, 3000);

    // --- SELECT PERMIT TYPE ---
    // The dropdown ID from the portal HTML
    const typeSelectId = "#ctl00_PlaceHolderMain_generalSearchForm_ddlGSPermitType";
    try {
      await page.waitForSelector(typeSelectId, { timeout: 10000 });
      await page.select(typeSelectId, permitType);
      logger.info(`  Selected permit type: ${permitType}`);
      await this.delay(1000, 2000);
    } catch (err) {
      // Try alternate selector patterns (Accela versions vary)
      logger.warn(`  Permit type dropdown not found with primary selector, trying alternatives...`);
      const altSelectors = [
        "select[name*='PermitType']",
        "select[name*='ddlGSPermitType']",
        "#ctl00_PlaceHolderMain_ddlGSPermitType",
      ];
      let found = false;
      for (const sel of altSelectors) {
        try {
          await page.waitForSelector(sel, { timeout: 3000 });
          await page.select(sel, permitType);
          found = true;
          break;
        } catch { continue; }
      }
      if (!found) {
        logger.error(`  Could not find permit type dropdown — skipping ${permitType}`);
        return;
      }
    }

    // --- SET DATE RANGE ---
    // Applied Date Start
    const startDateId = "#ctl00_PlaceHolderMain_generalSearchForm_txtGSStartDate";
    const endDateId = "#ctl00_PlaceHolderMain_generalSearchForm_txtGSEndDate";

    try {
      // Clear and type start date
      const startEl = await page.$(startDateId) || await page.$("input[name*='StartDate']");
      if (startEl) {
        await startEl.click({ clickCount: 3 }); // Select all
        await startEl.type(startDate, { delay: 30 });
      }

      // Clear and type end date
      const endEl = await page.$(endDateId) || await page.$("input[name*='EndDate']");
      if (endEl) {
        await endEl.click({ clickCount: 3 });
        await endEl.type(endDate, { delay: 30 });
      }

      await this.delay(500, 1000);
    } catch (err) {
      logger.warn(`  Date fields issue: ${err.message}`);
    }

    // --- CLICK SEARCH ---
    const searchBtnId = "#ctl00_PlaceHolderMain_btnNewSearch";
    try {
      const searchBtn = await page.$(searchBtnId) || await page.$("a[id*='btnNewSearch'], input[value='Search']");
      if (searchBtn) {
        await searchBtn.click();
        await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 20000 })
          .catch(() => {}); // Some searches don't trigger full navigation
        await this.delay(3000, 5000);
      }
    } catch (err) {
      logger.warn(`  Search button issue: ${err.message}`);
    }

    // --- PARSE RESULTS ---
    await this.parseAccelaResults(page, permitType);
  }

  async parseAccelaResults(page, permitType) {
    // Accela results are typically in a GridView table
    // The table has class "ACA_Grid_Caption" or similar
    const rows = await page.evaluate(() => {
      const results = [];

      // Try multiple table selectors (Accela varies by version)
      const tables = document.querySelectorAll(
        "table.ACA_Grid_Caption, table[id*='GridView'], table.GridViewStyle, " +
        "#ctl00_PlaceHolderMain_dgvPermitList_gdvPermitList, " +
        "[id*='gdvPermitList'] table"
      );

      for (const table of tables) {
        const trs = table.querySelectorAll("tr");
        for (const tr of trs) {
          const cells = [...tr.querySelectorAll("td")].map(td => {
            const link = td.querySelector("a");
            return {
              text: td.textContent.trim(),
              href: link ? link.href : null,
            };
          });
          if (cells.length >= 3 && cells.some(c => c.text.length > 0)) {
            results.push(cells);
          }
        }
      }

      // Also try div-based results (newer Accela versions)
      if (results.length === 0) {
        document.querySelectorAll("[class*='ACA_Record'], [class*='result-row']").forEach(el => {
          const text = el.textContent.trim();
          const link = el.querySelector("a")?.href;
          if (text.length > 20) {
            results.push([{ text, href: link }]);
          }
        });
      }

      return results;
    });

    if (rows.length === 0) {
      // Check if "no results" message is shown
      const noResults = await page.evaluate(() => {
        const body = document.body.innerText.toLowerCase();
        return body.includes("no record found") || body.includes("no matching") || body.includes("0 result");
      });
      if (noResults) {
        logger.info(`  No results for ${permitType}`);
      } else {
        logger.warn(`  Could not parse results table for ${permitType} — page structure may have changed`);
      }
      return;
    }

    logger.info(`  Found ${rows.length} result rows for ${permitType}`);

    const typeConfig = PERMIT_TYPES[permitType] || { jobType: "unknown", label: permitType };

    for (const row of rows) {
      // Accela result rows typically have:
      // [0] Date, [1] Permit Number (with link), [2] Type, [3] Address, [4] Description, [5] Status
      // But this varies — we'll extract what we can

      const allText = row.map(c => c.text).join(" | ");
      const detailUrl = row.find(c => c.href && c.href.includes("CapDetail"))?.href || null;

      // Extract permit number (usually looks like DEV-XXXX-XXXXX or similar)
      const permitMatch = allText.match(/(\d{2}DEV[-\s]\d{5,}|BLD[-\s]\d{5,}|DEV\d+-\d+)/i) ||
                          allText.match(/(\d{4,}-[A-Z]*\d{3,})/);
      const permitNumber = permitMatch ? permitMatch[1] : null;

      // Extract address (look for patterns like "1234 Something St")
      const addrMatch = allText.match(/(\d{1,6}\s+[NESW]?\s*[A-Za-z]+\s+(?:St|Ave|Blvd|Dr|Ln|Ct|Pl|Way|Rd|Cir|Pkwy|Trl|Loop|Run)\b[^|]*)/i);
      const address = addrMatch ? addrMatch[1].trim() : null;

      // Extract valuation (dollar amount)
      const valMatch = allText.match(/\$\s*([\d,]+(?:\.\d{2})?)/);
      const valuation = valMatch ? parseFloat(valMatch[1].replace(/,/g, "")) : null;

      // Extract date
      const dateMatch = allText.match(/(\d{1,2}\/\d{1,2}\/\d{2,4})/);
      const dateStr = dateMatch ? dateMatch[1] : null;

      const rawText = [
        `Fort Worth Permit: ${permitNumber || "Unknown"}`,
        `Type: ${permitType}`,
        address ? `Address: ${address}, Fort Worth, TX` : "",
        valuation ? `Valuation: ${valuation.toLocaleString()}` : "",
        `Status: Issued`,
        `Raw Data: ${allText.substring(0, 500)}`,
        detailUrl ? `\nDetail URL: ${detailUrl}` : "",
      ].filter(Boolean).join("\n");

      const lead = {
        source: "permits",
        raw_text: rawText,
        location_text: address ? `${address}, Fort Worth, TX` : "Fort Worth, TX",
        city: "Fort Worth",
        permit_number: permitNumber,
        permit_value: valuation,
        permit_data: {
          permit_type: permitType,
          type_label: typeConfig.label,
          address: address,
          valuation: valuation,
          detail_url: detailUrl,
          raw_row: allText.substring(0, 1000),
          source_portal: "accela",
        },
        source_url: detailUrl || `${ACCELA_BASE}/Cap/CapHome.aspx?module=Development`,
        source_post_id: permitNumber,
        posted_at: dateStr ? new Date(dateStr) : new Date(),
        job_type: typeConfig.jobType,
        tags: [
          "permit", "fort worth", "accela",
          typeConfig.jobType === "new_construction" ? "new construction" : null,
          typeConfig.jobType === "remodel" ? "remodel" : null,
        ].filter(Boolean),
      };

      await this.processLead(lead);
    }

    // --- PAGINATION ---
    // Check if there are more pages
    const hasNextPage = await page.evaluate(() => {
      const nextBtn = document.querySelector(
        "a[id*='btnNext'], a[title*='Next'], [class*='aca_pagination'] a:last-child"
      );
      return nextBtn && !nextBtn.classList.contains("ACA_Disable");
    });

    if (hasNextPage) {
      logger.info(`  → More pages available, clicking Next...`);
      try {
        await page.click("a[id*='btnNext'], a[title*='Next']");
        await this.delay(3000, 5000);
        await this.parseAccelaResults(page, permitType); // Recurse
      } catch (err) {
        logger.warn(`  Pagination failed: ${err.message}`);
      }
    }
  }

  // =============================================================
  // DETAIL PAGE SCRAPING (optional deep-dive per permit)
  // =============================================================
  // Call this for high-value permits to get contractor/sub info
  async scrapePermitDetail(page, detailUrl) {
    if (!detailUrl) return null;

    try {
      await page.goto(detailUrl, { waitUntil: "networkidle2", timeout: 20000 });
      await this.delay(2000, 3000);

      const detail = await page.evaluate(() => {
        const getText = (sel) => {
          const el = document.querySelector(sel);
          return el ? el.textContent.trim() : null;
        };

        // Extract from the detail page tabs
        const info = {};

        // Permit info section
        document.querySelectorAll("table[id*='tblPermitDetailInfo'] tr, .detail-row").forEach(tr => {
          const cells = [...tr.querySelectorAll("td, th")].map(td => td.textContent.trim());
          if (cells.length >= 2) {
            const key = cells[0].replace(/:$/, "").toLowerCase();
            info[key] = cells[1];
          }
        });

        // Licensed professionals section
        const professionals = [];
        document.querySelectorAll("[id*='LicensedProfessional'] tr, [id*='contractor'] tr").forEach(tr => {
          const text = tr.textContent.trim();
          if (text.length > 10 && !text.includes("License Number")) {
            professionals.push(text);
          }
        });

        // Owner info
        const owner = getText("[id*='ownerName'], [id*='OwnerName']");

        return { info, professionals, owner };
      });

      return detail;
    } catch (err) {
      logger.warn(`Detail page scrape failed: ${err.message}`);
      return null;
    }
  }

  // =============================================================
  // DISCOVER SOCRATA FIELDS (run once to map the dataset)
  // =============================================================
  // Helpful utility: fetches one record to see all available fields
  static async discoverFields() {
    try {
      const url = `${SOCRATA_BASE}/${SOCRATA_DATASET}.json?$limit=3`;
      const { data } = await axios.get(url, { timeout: 10000 });
      console.log("\n=== SOCRATA DATASET FIELDS ===");
      if (data.length > 0) {
        const fields = Object.keys(data[0]);
        fields.forEach(f => {
          console.log(`  ${f}: ${JSON.stringify(data[0][f]).substring(0, 80)}`);
        });
        console.log(`\nTotal fields: ${fields.length}`);
        console.log("\n=== SAMPLE RECORDS ===");
        data.forEach((r, i) => {
          console.log(`\n--- Record ${i + 1} ---`);
          console.log(JSON.stringify(r, null, 2));
        });
      } else {
        console.log("No records returned. Dataset may be empty or private.");
      }
    } catch (err) {
      console.error("Discovery failed:", err.message);
      if (err.response) console.error(JSON.stringify(err.response.data));
    }
  }

  // =============================================================
  // HELPERS
  // =============================================================
  formatDate(date) {
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    const y = date.getFullYear();
    return `${m}/${d}/${y}`; // MM/DD/YYYY for Accela
  }
}

module.exports = FortWorthPermitScraper;

// =============================================================
// CLI
// =============================================================
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.includes("--discover")) {
    // Run field discovery
    FortWorthPermitScraper.discoverFields().then(() => process.exit(0));
  } else {
    // Normal scrape run
    new FortWorthPermitScraper().run().then(() => process.exit(0)).catch(err => {
      console.error(err);
      process.exit(1);
    });
  }
}
