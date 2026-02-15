// Business Scraper - Stage 1 of Discovery Pipeline
// Uses DuckDuckGo HTML search + cheerio parsing (no browser needed)
// Falls back to Serper.dev API if SERPER_API_KEY is set

import crypto from 'crypto';
import * as cheerio from 'cheerio';

const logger = {
  info: (msg, data) => console.log(`[maps-scraper] ${msg}`, data || ''),
  warn: (msg, data) => console.warn(`[maps-scraper] ${msg}`, data || ''),
  error: (msg, data) => console.error(`[maps-scraper] ${msg}`, data || ''),
};

/**
 * Generate a domain hash for deduplication
 */
function domainHash(url) {
  if (!url) return null;
  try {
    const domain = new URL(url).hostname.replace(/^www\./, '').toLowerCase();
    return crypto.createHash('sha256').update(domain).digest('hex').slice(0, 16);
  } catch {
    return null;
  }
}

// Aggregator/directory domains to filter out (not actual businesses)
const AGGREGATOR_DOMAINS = new Set([
  'yelp.com', 'angi.com', 'angieslist.com', 'homeadvisor.com', 'thumbtack.com',
  'bbb.org', 'expertise.com', 'homeguide.com', 'threebestrated.com', 'bark.com',
  'houzz.com', 'porch.com', 'nextdoor.com', 'manta.com', 'mapquest.com',
  'yellowpages.com', 'superpages.com', 'whitepages.com', 'chamberofcommerce.com',
  'facebook.com', 'instagram.com', 'twitter.com', 'linkedin.com', 'tiktok.com',
  'youtube.com', 'reddit.com', 'wikipedia.org', 'google.com', 'bing.com',
  'duckduckgo.com', 'indeed.com', 'glassdoor.com', 'ziprecruiter.com',
]);

const PHONE_REGEX = /\(?(\d{3})\)?[\s.-]?(\d{3})[\s.-]?(\d{4})/g;

const USER_AGENTS = [
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64; rv:122.0) Gecko/20100101 Firefox/122.0',
];

function randomUA() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

/**
 * Check if a URL belongs to an aggregator/directory site
 */
function isAggregator(url) {
  if (!url) return true;
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, '').toLowerCase();
    return AGGREGATOR_DOMAINS.has(hostname) ||
      AGGREGATOR_DOMAINS.has(hostname.replace(/^[^.]+\./, ''));
  } catch {
    return true;
  }
}

/**
 * Extract a clean business name from a search result title
 */
function cleanBusinessName(title) {
  if (!title) return null;
  // Remove common suffixes like "| Fort Worth TX", "- Home", "- Best Plumber"
  let name = title
    .replace(/<[^>]+>/g, '') // strip HTML tags
    .replace(/\s*[|–—-]\s*(home|about|contact|services|fort\s*worth|dallas|tx|texas|plumb|best|top|local|#1|reviews?|free).*/gi, '')
    .replace(/\s*·\s*.*$/, '')
    .trim();
  // If name is too long, it's probably not a business name
  if (name.length > 80) name = name.substring(0, 80);
  return name || null;
}

// ==================== DuckDuckGo HTML Search ====================

/**
 * Search DuckDuckGo HTML for businesses
 */
async function searchDuckDuckGo(keyword, city) {
  const query = `${keyword} in ${city}`;

  const response = await fetch('https://html.duckduckgo.com/html/', {
    method: 'POST',
    headers: {
      'User-Agent': randomUA(),
      'Referer': 'https://html.duckduckgo.com/',
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'text/html',
    },
    body: `q=${encodeURIComponent(query)}`,
  });

  if (!response.ok) {
    throw new Error(`DuckDuckGo returned status ${response.status}`);
  }

  const html = await response.text();
  return parseDuckDuckGoResults(html);
}

/**
 * Parse DuckDuckGo HTML results into business objects
 */
function parseDuckDuckGoResults(html) {
  const $ = cheerio.load(html);
  const businesses = [];
  const seenDomains = new Set();

  // Each organic result is: div.result.web-result
  // Ads have: div.result.result--ad (skip these)
  $('div.result.web-result').each((_, el) => {
    const $el = $(el);

    // Get the URL from result__url link (direct URL, not DDG redirect)
    const urlEl = $el.find('a.result__url');
    let url = urlEl.attr('href') || '';

    // Clean URL - remove protocol and trailing slash for display, but keep full URL
    if (url && !url.startsWith('http')) {
      url = 'https://' + url.replace(/^\/\//, '');
    }

    // Skip aggregator sites
    if (isAggregator(url)) return;

    // Deduplicate by domain
    const hash = domainHash(url);
    if (hash && seenDomains.has(hash)) return;
    if (hash) seenDomains.add(hash);

    // Get title and snippet
    const titleEl = $el.find('a.result__a');
    const snippetEl = $el.find('a.result__snippet');
    const title = titleEl.text().trim();
    const snippet = snippetEl.text().trim();

    const businessName = cleanBusinessName(title);
    if (!businessName || businessName.length < 3) return;

    // Extract phone from snippet if present
    let phone = null;
    const phoneMatch = snippet.match(PHONE_REGEX);
    if (phoneMatch) {
      const raw = phoneMatch[0].replace(/\D/g, '').slice(-10);
      if (raw.length === 10) {
        phone = `(${raw.slice(0, 3)}) ${raw.slice(3, 6)}-${raw.slice(6)}`;
      }
    }

    businesses.push({
      businessName,
      website: url || null,
      phone,
      snippet: snippet.substring(0, 300),
      domainHash: hash,
      source: 'duckduckgo',
    });
  });

  return businesses;
}

// ==================== Serper.dev API (Premium) ====================

/**
 * Search using Serper.dev Maps API (requires SERPER_API_KEY)
 */
async function searchSerperMaps(keyword, city) {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) return null;

  logger.info('Using Serper.dev Maps API');

  const response = await fetch('https://google.serper.dev/maps', {
    method: 'POST',
    headers: {
      'X-API-KEY': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      q: `${keyword} in ${city}`,
      num: 20,
    }),
  });

  if (!response.ok) {
    logger.warn(`Serper API returned ${response.status}`);
    return null;
  }

  const data = await response.json();
  if (!data.places || data.places.length === 0) return null;

  return data.places.map(place => ({
    businessName: place.title,
    address: place.address,
    website: place.website || null,
    phone: place.phoneNumber || null,
    rating: place.rating || null,
    reviewCount: place.ratingCount || null,
    category: place.category || null,
    placeId: place.placeId || null,
    domainHash: domainHash(place.website),
    source: 'serper',
  }));
}

// ==================== Main Export ====================

/**
 * Scrape for businesses matching keyword + city
 * Tries Serper.dev first (if API key set), falls back to DuckDuckGo HTML
 * @param {string} keyword - Business type to search
 * @param {string} city - City to search in
 * @param {Function} onProgress - Progress callback (0-100)
 * @returns {Array} Array of business objects
 */
export async function scrapeGoogleMaps(keyword, city, onProgress = () => {}) {
  logger.info('Starting business search', { keyword, city });
  onProgress(10);

  try {
    // Try Serper.dev first (premium, most reliable)
    const serperResults = await searchSerperMaps(keyword, city);
    if (serperResults && serperResults.length > 0) {
      onProgress(90);
      logger.info(`Serper.dev returned ${serperResults.length} businesses`);
      onProgress(100);
      return serperResults;
    }

    onProgress(20);

    // Fall back to DuckDuckGo HTML search
    logger.info('Using DuckDuckGo HTML search');
    const ddgResults = await searchDuckDuckGo(keyword, city);
    onProgress(70);

    // If first search didn't yield many results, try a variant query
    if (ddgResults.length < 5) {
      logger.info(`Only ${ddgResults.length} results, trying variant query`);
      const seenDomains = new Set(ddgResults.map(b => b.domainHash).filter(Boolean));

      // Try a more specific search
      const variant = await searchDuckDuckGo(`${keyword} ${city} contact phone`, city);
      for (const biz of variant) {
        if (biz.domainHash && !seenDomains.has(biz.domainHash)) {
          seenDomains.add(biz.domainHash);
          ddgResults.push(biz);
        }
      }
    }

    onProgress(90);
    logger.info(`DuckDuckGo returned ${ddgResults.length} businesses`);

    if (ddgResults.length === 0) {
      logger.warn('No businesses found - DuckDuckGo may have returned a CAPTCHA');
    }

    onProgress(100);
    return ddgResults;

  } catch (error) {
    logger.error('Business search failed', { error: error.message });
    throw error;
  }
}

export { domainHash };
