// Web Enricher - Stage 2 of Discovery Pipeline
// Scrapes business websites using fetch + cheerio and uses Ollama to extract structured data

import * as cheerio from 'cheerio';
import { aiProvider } from '../ai-provider.js';
import { verifyEmails, filterBestEmails } from './emailVerifier.js';

const logger = {
  info: (msg, data) => console.log(`[web-enricher] ${msg}`, data || ''),
  warn: (msg, data) => console.warn(`[web-enricher] ${msg}`, data || ''),
  error: (msg, data) => console.error(`[web-enricher] ${msg}`, data || ''),
};

// Regex patterns
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_REGEX = /(?:\+1\s?)?(?:\(?\d{3}\)?[\s.-]?)?\d{3}[\s.-]?\d{4}/g;

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
};

/**
 * Scrape a website and extract text content using fetch + cheerio
 */
async function scrapeWebsite(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(url, {
      headers: HEADERS,
      redirect: 'follow',
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
      throw new Error('Not an HTML page');
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Remove non-content elements
    $('script, style, nav, footer, iframe, noscript, svg, header').remove();

    const text = $('body').text()
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 8000);

    const title = $('title').text().trim();

    return { text, title };

  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Extract emails from text content
 */
function extractEmails(text) {
  // Add spaces around common delimiters before extracting to avoid concatenated matches
  const cleaned = text.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/\b(www\.)/g, ' $1');
  const matches = cleaned.match(EMAIL_REGEX) || [];
  const unique = [...new Set(matches.map(e => e.toLowerCase()))];
  return unique.filter(e =>
    !e.endsWith('.png') && !e.endsWith('.jpg') && !e.endsWith('.gif') &&
    !e.includes('example.com') && !e.includes('sentry.io') &&
    !e.includes('wixpress.com') && !e.includes('googleapis.com') &&
    !e.includes('w3.org') && !e.includes('schema.org') &&
    // Filter out emails that look like concatenated text (contain www or http)
    !e.includes('www.') && !e.includes('http') &&
    // Basic validation: must have reasonable local part and domain
    /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/.test(e) &&
    e.length < 60
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
    const result = await aiProvider.generate(prompt, {
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
 * @param {object} options - Enrichment options
 * @returns {Array} Enriched leads
 */
export async function enrichLeads(leads, onProgress = () => {}, options = {}) {
  const { verifyEmails: shouldVerifyEmails = true, minEmailScore = 60 } = options;
  const leadsWithWebsites = leads.filter(l => l.website);
  logger.info(`Enriching ${leadsWithWebsites.length} of ${leads.length} leads (have websites)`);

  if (leadsWithWebsites.length === 0) {
    onProgress(100);
    return leads;
  }

  for (let i = 0; i < leadsWithWebsites.length; i++) {
    const lead = leadsWithWebsites[i];

    try {
      // Scrape the website with fetch + cheerio
      const { text } = await scrapeWebsite(lead.website);

      // Extract emails and phones from raw content
      const extractedEmails = extractEmails(text);
      lead.extractedPhones = extractPhones(text);

      // Verify emails if enabled
      if (shouldVerifyEmails && extractedEmails.length > 0) {
        const verifications = await verifyEmails(extractedEmails, { checkMx: true });
        const bestEmails = filterBestEmails(verifications, minEmailScore);

        lead.emails = bestEmails.map(v => v.email);
        lead.verifiedEmails = verifications.map(v => ({
          email: v.email,
          score: v.score,
          isValid: v.isValid,
          isDeliverable: v.isDeliverable,
          isDisposable: v.isDisposable,
          isRoleBased: v.isRoleBased,
          reason: v.reason,
        }));
        lead.bestEmail = bestEmails[0]?.email || null;
        lead.bestEmailScore = bestEmails[0]?.score || 0;
        lead.emailVerificationStatus = bestEmails.length > 0 ? 'verified' : 'failed';
      } else {
        lead.emails = extractedEmails;
        lead.emailVerificationStatus = 'not_verified';
      }

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
      logger.info(`Enriched: ${lead.businessName} (${lead.emails.length} verified emails, ${lead.extractedPhones.length} phones)`);

    } catch (error) {
      lead.enrichmentStatus = 'failed';
      lead.emails = lead.emails || [];
      lead.extractedPhones = lead.extractedPhones || [];
      lead.servicesOffered = lead.servicesOffered || [];
      lead.emailVerificationStatus = 'failed';
      logger.warn(`Failed to enrich ${lead.businessName}: ${error.message}`);
    }

    onProgress(Math.round(((i + 1) / leadsWithWebsites.length) * 100));
  }

  return leads;
}
