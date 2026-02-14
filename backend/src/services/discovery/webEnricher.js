// Web Enricher - Stage 2 of Discovery Pipeline
// Scrapes business websites and uses Ollama to extract structured data

import { chromium } from 'playwright';
import { ollamaService } from '../ollama.js';

const logger = {
  info: (msg, data) => console.log(`[web-enricher] ${msg}`, data || ''),
  warn: (msg, data) => console.warn(`[web-enricher] ${msg}`, data || ''),
  error: (msg, data) => console.error(`[web-enricher] ${msg}`, data || ''),
};

// Regex patterns
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_REGEX = /(?:\+1\s?)?(?:\(?\d{3}\)?[\s.-]?)?\d{3}[\s.-]?\d{4}/g;

/**
 * Scrape a website and extract text content
 */
async function scrapeWebsite(url, browser) {
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 800 }
  });

  const page = await context.newPage();

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(2000);

    const data = await page.evaluate(() => {
      // Remove scripts, styles, navs
      document.querySelectorAll('script, style, nav, footer, iframe, noscript').forEach(el => el.remove());

      const body = document.body;
      const text = body ? body.innerText.substring(0, 8000) : '';
      const title = document.title || '';

      // Extract all links
      const links = Array.from(document.querySelectorAll('a[href]'))
        .map(a => ({ href: a.href, text: a.textContent.trim() }))
        .filter(l => l.href.startsWith('http'));

      return { text, title, links };
    });

    await context.close();
    return data;

  } catch (error) {
    await context.close();
    throw error;
  }
}

/**
 * Extract emails from text content
 */
function extractEmails(text) {
  const matches = text.match(EMAIL_REGEX) || [];
  // Deduplicate and lowercase
  const unique = [...new Set(matches.map(e => e.toLowerCase()))];
  // Filter obvious non-emails
  return unique.filter(e =>
    !e.endsWith('.png') && !e.endsWith('.jpg') && !e.endsWith('.gif') &&
    !e.includes('example.com') && !e.includes('sentry.io') &&
    !e.includes('wixpress.com') && !e.includes('googleapis.com')
  );
}

/**
 * Extract phone numbers from text content
 */
function extractPhones(text) {
  const matches = text.match(PHONE_REGEX) || [];
  const unique = [...new Set(matches.map(p => p.replace(/\D/g, '').slice(-10)))];
  return unique.filter(p => p.length === 10).map(p =>
    `(${p.slice(0, 3)}) ${p.slice(3, 6)}-${p.slice(6)}`
  );
}

/**
 * Use Ollama to extract structured info from website content
 */
async function aiExtractBusinessInfo(text, businessName) {
  const prompt = `You are analyzing a business website for a plumbing contractor outreach campaign.

Business Name: ${businessName}

Website Content (truncated):
${text.substring(0, 4000)}

Extract the following information and respond ONLY with valid JSON:
{
  "servicesOffered": ["list of services this business offers"],
  "aboutSummary": "1-2 sentence summary of what this company does",
  "isPropertyManager": true/false,
  "isContractor": true/false,
  "isCommercial": true/false,
  "serviceArea": "geographic area they serve if mentioned"
}

Respond with ONLY the JSON, no other text.`;

  try {
    const result = await ollamaService.generate(prompt, {
      temperature: 0.2,
      timeout: 30000
    });

    if (!result.success) return null;

    const jsonMatch = result.response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (error) {
    logger.warn(`AI extraction failed for ${businessName}: ${error.message}`);
  }

  return null;
}

/**
 * Enrich a batch of leads with website data
 * @param {Array} leads - Array of lead objects from Stage 1
 * @param {Function} onProgress - Progress callback (0-100)
 * @returns {Array} Enriched leads
 */
export async function enrichLeads(leads, onProgress = () => {}) {
  const leadsWithWebsites = leads.filter(l => l.website);
  logger.info(`Enriching ${leadsWithWebsites.length} of ${leads.length} leads (have websites)`);

  if (leadsWithWebsites.length === 0) {
    onProgress(100);
    return leads;
  }

  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    for (let i = 0; i < leadsWithWebsites.length; i++) {
      const lead = leadsWithWebsites[i];

      try {
        // Scrape the website
        const { text, title } = await scrapeWebsite(lead.website, browser);

        // Extract emails and phones from raw content
        lead.emails = extractEmails(text);
        lead.extractedPhones = extractPhones(text);

        // Use AI to extract structured info
        const aiInfo = await aiExtractBusinessInfo(text, lead.businessName);

        if (aiInfo) {
          lead.servicesOffered = aiInfo.servicesOffered || [];
          lead.aboutSummary = aiInfo.aboutSummary || '';
          lead.isPropertyManager = aiInfo.isPropertyManager || false;
          lead.isContractor = aiInfo.isContractor || false;
          lead.isCommercial = aiInfo.isCommercial || false;
          lead.serviceArea = aiInfo.serviceArea || '';
        }

        lead.enrichmentStatus = 'enriched';
        logger.info(`Enriched: ${lead.businessName} (${lead.emails.length} emails, ${lead.extractedPhones.length} phones)`);

      } catch (error) {
        lead.enrichmentStatus = 'failed';
        lead.emails = lead.emails || [];
        lead.extractedPhones = lead.extractedPhones || [];
        lead.servicesOffered = lead.servicesOffered || [];
        logger.warn(`Failed to enrich ${lead.businessName}: ${error.message}`);
      }

      onProgress(Math.round(((i + 1) / leadsWithWebsites.length) * 100));
    }

    return leads;

  } catch (error) {
    logger.error('Enrichment failed', { error: error.message });
    throw error;
  } finally {
    if (browser) await browser.close();
  }
}
