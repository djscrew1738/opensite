import { BaseAdapter } from './base.js';
import { PERMIT_TYPES } from './fortworth.js';

const ACCELA_BASE = 'https://aca-prod.accela.com/CFW';

/**
 * Fort Worth Accela Citizen Access adapter
 * Scrapes the real-time permit portal using Playwright (browser automation).
 *
 * This complements the Socrata API adapter by providing permits that
 * haven't yet been published to the open data portal.
 *
 * Portal: aca-prod.accela.com/CFW (ASP.NET WebForms)
 */
export class FortWorthAccelaAdapter extends BaseAdapter {
  constructor(source, logger) {
    super(source, logger);
    this.targetTypes = [
      'Residential New Building Permit',
      'Commercial New Building Permit',
      'Residential Addition Permit',
      'Commercial Addition Building Permit',
    ];
  }

  async fetchRawPermits(daysBack = 7) {
    let chromium;
    try {
      const pw = await import('playwright');
      chromium = pw.chromium;
    } catch (err) {
      this.logger.error('[fort_worth_accela] Playwright not available: ' + err.message);
      return [];
    }

    const browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const allResults = [];

    try {
      const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
        viewport: { width: 1400, height: 900 },
      });
      const page = await context.newPage();

      const endDate = new Date();
      const startDate = new Date(Date.now() - daysBack * 86400000);
      const startStr = this.formatDateMMDDYYYY(startDate);
      const endStr = this.formatDateMMDDYYYY(endDate);

      for (const permitType of this.targetTypes) {
        try {
          this.logger.info(`[fort_worth_accela] Searching: ${permitType} (${startStr} - ${endStr})`);
          const results = await this.searchAndParse(page, permitType, startStr, endStr);
          allResults.push(...results);
          await this.delay(3000);
        } catch (err) {
          this.logger.error(`[fort_worth_accela] Search failed for ${permitType}: ${err.message}`);
        }
      }

      await context.close();
    } finally {
      await browser.close();
    }

    this.logger.info(`[fort_worth_accela] Total raw records scraped: ${allResults.length}`);
    return allResults;
  }

  async searchAndParse(page, permitType, startDate, endDate) {
    const searchUrl = `${ACCELA_BASE}/Cap/CapHome.aspx?module=Development&TabName=Home`;

    await page.goto(searchUrl, { waitUntil: 'networkidle', timeout: 30000 });
    await this.delay(2000);

    // Select permit type from dropdown
    const typeSelectId = '#ctl00_PlaceHolderMain_generalSearchForm_ddlGSPermitType';
    const altSelectors = [
      'select[name*="PermitType"]',
      'select[name*="ddlGSPermitType"]',
      '#ctl00_PlaceHolderMain_ddlGSPermitType',
    ];

    let typeSelected = false;
    try {
      await page.waitForSelector(typeSelectId, { timeout: 10000 });
      await page.selectOption(typeSelectId, permitType);
      typeSelected = true;
    } catch {
      for (const sel of altSelectors) {
        try {
          await page.waitForSelector(sel, { timeout: 3000 });
          await page.selectOption(sel, permitType);
          typeSelected = true;
          break;
        } catch { /* try next */ }
      }
    }

    if (!typeSelected) {
      this.logger.warn(`[fort_worth_accela] Could not find permit type dropdown — skipping ${permitType}`);
      return [];
    }

    this.logger.debug(`[fort_worth_accela] Selected permit type: ${permitType}`);
    await this.delay(1000);

    // Set date range
    const startDateId = '#ctl00_PlaceHolderMain_generalSearchForm_txtGSStartDate';
    const endDateId = '#ctl00_PlaceHolderMain_generalSearchForm_txtGSEndDate';

    try {
      const startEl = await page.$(startDateId) || await page.$('input[name*="StartDate"]');
      if (startEl) {
        await startEl.click({ clickCount: 3 });
        await startEl.type(startDate, { delay: 30 });
      }

      const endEl = await page.$(endDateId) || await page.$('input[name*="EndDate"]');
      if (endEl) {
        await endEl.click({ clickCount: 3 });
        await endEl.type(endDate, { delay: 30 });
      }
    } catch (err) {
      this.logger.warn(`[fort_worth_accela] Date fields issue: ${err.message}`);
    }

    await this.delay(500);

    // Click search
    const searchBtnId = '#ctl00_PlaceHolderMain_btnNewSearch';
    try {
      const searchBtn = await page.$(searchBtnId) ||
        await page.$('a[id*="btnNewSearch"]') ||
        await page.$('input[value="Search"]');
      if (searchBtn) {
        await searchBtn.click();
        await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});
        await this.delay(3000);
      }
    } catch (err) {
      this.logger.warn(`[fort_worth_accela] Search button issue: ${err.message}`);
    }

    // Parse results (with pagination)
    return this.parseResults(page, permitType);
  }

  async parseResults(page, permitType, allResults = []) {
    const rows = await page.evaluate(() => {
      const results = [];

      const tables = document.querySelectorAll(
        'table.ACA_Grid_Caption, table[id*="GridView"], table.GridViewStyle, ' +
        '#ctl00_PlaceHolderMain_dgvPermitList_gdvPermitList, ' +
        '[id*="gdvPermitList"] table'
      );

      for (const table of tables) {
        const trs = table.querySelectorAll('tr');
        for (const tr of trs) {
          const cells = [...tr.querySelectorAll('td')].map(td => {
            const link = td.querySelector('a');
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

      // Div-based results (newer Accela versions)
      if (results.length === 0) {
        document.querySelectorAll('[class*="ACA_Record"], [class*="result-row"]').forEach(el => {
          const text = el.textContent.trim();
          const link = el.querySelector('a')?.href;
          if (text.length > 20) {
            results.push([{ text, href: link }]);
          }
        });
      }

      return results;
    });

    if (rows.length === 0) {
      const noResults = await page.evaluate(() => {
        const body = document.body.innerText.toLowerCase();
        return body.includes('no record found') || body.includes('no matching') || body.includes('0 result');
      });
      if (noResults) {
        this.logger.info(`[fort_worth_accela] No results for ${permitType}`);
      } else {
        this.logger.warn(`[fort_worth_accela] Could not parse results for ${permitType}`);
      }
      return allResults;
    }

    this.logger.info(`[fort_worth_accela] Found ${rows.length} rows for ${permitType}`);

    for (const row of rows) {
      const allText = row.map(c => c.text).join(' | ');
      const detailUrl = row.find(c => c.href && c.href.includes('CapDetail'))?.href || null;

      // Extract permit number
      const permitMatch = allText.match(/(\d{2}DEV[-\s]\d{5,}|BLD[-\s]\d{5,}|DEV\d+-\d+)/i) ||
                          allText.match(/(\d{4,}-[A-Z]*\d{3,})/);
      const permitNumber = permitMatch ? permitMatch[1] : null;

      // Extract address
      const addrMatch = allText.match(/(\d{1,6}\s+[NESW]?\s*[A-Za-z]+\s+(?:St|Ave|Blvd|Dr|Ln|Ct|Pl|Way|Rd|Cir|Pkwy|Trl|Loop|Run)\b[^|]*)/i);
      const address = addrMatch ? addrMatch[1].trim() : null;

      // Extract valuation
      const valMatch = allText.match(/\$\s*([\d,]+(?:\.\d{2})?)/);
      const valuation = valMatch ? parseFloat(valMatch[1].replace(/,/g, '')) : null;

      // Extract date
      const dateMatch = allText.match(/(\d{1,2}\/\d{1,2}\/\d{2,4})/);
      const dateStr = dateMatch ? dateMatch[1] : null;

      allResults.push({
        _source: 'accela',
        permit_number: permitNumber,
        permit_type: permitType,
        address: address,
        valuation: valuation,
        date_issued: dateStr,
        detail_url: detailUrl,
        raw_row: allText.substring(0, 1000),
      });
    }

    // Check for next page
    const hasNextPage = await page.evaluate(() => {
      const nextBtn = document.querySelector(
        'a[id*="btnNext"], a[title*="Next"], [class*="aca_pagination"] a:last-child'
      );
      return nextBtn && !nextBtn.classList.contains('ACA_Disable');
    });

    if (hasNextPage) {
      this.logger.info('[fort_worth_accela] More pages available, clicking Next...');
      try {
        await page.click('a[id*="btnNext"], a[title*="Next"]');
        await this.delay(3000);
        return this.parseResults(page, permitType, allResults);
      } catch (err) {
        this.logger.warn(`[fort_worth_accela] Pagination failed: ${err.message}`);
      }
    }

    return allResults;
  }

  normalizeRecord(raw) {
    const permitType = raw.permit_type || '';
    const typeConfig = PERMIT_TYPES[permitType];

    return {
      sourcePermitId: raw.permit_number || `accela_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      permitNumber: raw.permit_number,
      issuedDate: this.parseDate(raw.date_issued),
      appliedDate: null,
      expiryDate: null,
      permitType: permitType,
      description: `Accela portal: ${raw.raw_row?.substring(0, 200) || permitType}`,
      address: raw.address,
      city: 'Fort Worth',
      zipCode: null,
      county: 'Tarrant',
      contractorName: null,
      contractorLicense: null,
      applicantName: null,
      ownerName: null,
      estimatedCost: raw.valuation,
      squareFootage: null,
      stories: null,
      units: null,
      workType: null,
      occupancyType: typeConfig ? (typeConfig.jobType === 'new_construction' ? 'residential' : null) : null,
      latitude: null,
      longitude: null,
      aiClassification: {
        source: 'accela_portal',
        permitPriority: typeConfig?.priority || 10,
        jobType: typeConfig?.jobType || 'unknown',
        typeLabel: typeConfig?.label || permitType,
        detailUrl: raw.detail_url,
      },
    };
  }

  formatDateMMDDYYYY(date) {
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const y = date.getFullYear();
    return `${m}/${d}/${y}`;
  }

  async delay(ms) {
    return new Promise(r => setTimeout(r, ms));
  }
}
