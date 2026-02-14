// Google Maps Scraper - Stage 1 of Discovery Pipeline
// Uses Playwright to scrape Google Maps search results

import { chromium } from 'playwright';
import crypto from 'crypto';

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

/**
 * Scrape Google Maps for businesses matching keyword + city
 * @param {string} keyword - Business type to search (e.g., "property management")
 * @param {string} city - City to search in (e.g., "Fort Worth TX")
 * @param {Function} onProgress - Progress callback (0-100)
 * @returns {Array} Array of business objects
 */
export async function scrapeGoogleMaps(keyword, city, onProgress = () => {}) {
  const searchQuery = `${keyword} in ${city}`;
  logger.info('Starting Maps scrape', { query: searchQuery });

  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 },
      locale: 'en-US'
    });

    const page = await context.newPage();

    // Navigate to Google Maps
    const mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(searchQuery)}`;
    await page.goto(mapsUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Wait for results to load
    await page.waitForTimeout(3000);

    // Scroll the results panel to load more businesses
    const resultsPanel = page.locator('[role="feed"]');
    const panelExists = await resultsPanel.count() > 0;

    if (panelExists) {
      let previousCount = 0;
      let scrollAttempts = 0;
      const maxScrolls = 8;

      while (scrollAttempts < maxScrolls) {
        await resultsPanel.evaluate(el => el.scrollTop = el.scrollHeight);
        await page.waitForTimeout(2000);

        const currentCount = await page.locator('[role="feed"] > div > div > a').count();
        onProgress(Math.min(30, (scrollAttempts / maxScrolls) * 30));

        if (currentCount === previousCount) break;
        previousCount = currentCount;
        scrollAttempts++;
      }

      logger.info(`Scrolled ${scrollAttempts} times, found ~${previousCount} results`);
    }

    // Extract business data from result cards
    const businesses = await page.evaluate(() => {
      const results = [];
      const cards = document.querySelectorAll('[role="feed"] > div > div > a');

      cards.forEach(card => {
        try {
          const ariaLabel = card.getAttribute('aria-label') || '';
          const href = card.getAttribute('href') || '';

          // Extract data from the card content
          const parent = card.closest('[role="feed"] > div > div');
          const allText = parent ? parent.innerText : '';
          const lines = allText.split('\n').filter(l => l.trim());

          // Parse rating and review count from text like "4.5(123)"
          let rating = null;
          let reviewCount = null;
          const ratingMatch = allText.match(/(\d+\.?\d*)\s*\((\d[\d,]*)\)/);
          if (ratingMatch) {
            rating = parseFloat(ratingMatch[1]);
            reviewCount = parseInt(ratingMatch[2].replace(/,/g, ''));
          }

          // Extract address - typically after the category line
          let address = '';
          let category = '';
          let phone = '';

          for (const line of lines) {
            // Phone pattern
            if (/^\(\d{3}\)\s?\d{3}[\s-]?\d{4}$/.test(line.trim()) || /^\d{3}[\s-]\d{3}[\s-]\d{4}$/.test(line.trim())) {
              phone = line.trim();
            }
            // Address pattern (contains street number or common street terms)
            if (/^\d+\s/.test(line.trim()) && !phone) {
              address = line.trim();
            }
            // Category is usually a short phrase
            if (line.length < 40 && !line.match(/^\d/) && !line.includes('·') && lines.indexOf(line) > 0 && !category) {
              category = line.trim();
            }
          }

          // Extract placeId from URL
          let placeId = '';
          const placeMatch = href.match(/place\/[^/]+\/([^/]+)/);
          if (placeMatch) placeId = placeMatch[1];

          if (ariaLabel) {
            results.push({
              businessName: ariaLabel,
              address,
              phone,
              rating,
              reviewCount,
              category,
              placeId,
              mapsUrl: href
            });
          }
        } catch (e) {
          // Skip cards that can't be parsed
        }
      });

      return results;
    });

    onProgress(40);

    // For each business, try to get website from the info panel
    const enrichedBusinesses = [];
    const maxDetailLookups = Math.min(businesses.length, 30);

    for (let i = 0; i < maxDetailLookups; i++) {
      const biz = businesses[i];
      try {
        // Click the business card to open its panel
        const card = page.locator(`[role="feed"] > div > div > a[aria-label="${biz.businessName}"]`).first();
        if (await card.count() > 0) {
          await card.click();
          await page.waitForTimeout(1500);

          // Extract website and additional info from the detail panel
          const details = await page.evaluate(() => {
            let website = '';
            let phone = '';
            let address = '';

            // Look for website link
            const links = document.querySelectorAll('a[data-item-id="authority"]');
            if (links.length > 0) {
              website = links[0].getAttribute('href') || '';
            }

            // Look for phone
            const phoneEl = document.querySelector('[data-item-id^="phone"] .fontBodyMedium');
            if (phoneEl) phone = phoneEl.textContent.trim();

            // Look for address
            const addressEl = document.querySelector('[data-item-id="address"] .fontBodyMedium');
            if (addressEl) address = addressEl.textContent.trim();

            return { website, phone, address };
          });

          biz.website = details.website || biz.website || '';
          if (details.phone) biz.phone = details.phone;
          if (details.address) biz.address = details.address;

          // Go back to results list
          const backBtn = page.locator('button[aria-label="Back"]').first();
          if (await backBtn.count() > 0) {
            await backBtn.click();
            await page.waitForTimeout(800);
          }
        }
      } catch (e) {
        // Skip errors for individual businesses
        logger.warn(`Failed to get details for ${biz.businessName}`);
      }

      biz.domainHash = domainHash(biz.website);
      enrichedBusinesses.push(biz);
      onProgress(40 + Math.round((i / maxDetailLookups) * 55));
    }

    // Add remaining businesses (without detail lookup)
    for (let i = maxDetailLookups; i < businesses.length; i++) {
      businesses[i].domainHash = domainHash(businesses[i].website);
      enrichedBusinesses.push(businesses[i]);
    }

    onProgress(95);
    logger.info(`Scrape complete: ${enrichedBusinesses.length} businesses found`);

    return enrichedBusinesses;

  } catch (error) {
    logger.error('Maps scrape failed', { error: error.message });
    throw error;
  } finally {
    if (browser) await browser.close();
  }
}

export { domainHash };
