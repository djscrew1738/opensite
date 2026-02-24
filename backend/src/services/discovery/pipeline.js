// Discovery Pipeline Orchestrator
// Chains Stage 1 (Maps) -> Stage 2 (Enrich) -> Stage 3 (Score + Outreach)
// Uses existing jobQueue for background processing

import { jobQueue } from '../jobQueuePersistent.js';
import { db } from '../database.js';
import { scrapeGoogleMaps } from './mapsScraper.js';
import { enrichLeads } from './webEnricher.js';
import { scoreAndGenerateOutreach } from './discoveryScorer.js';
import logger from '../logger.js';

/**
 * Start a discovery pipeline run
 * @param {string} keyword - Business type to search
 * @param {string} city - City to search in
 * @param {object} options - Optional: { lat, lng, radius, zone, zones }
 * @returns {object} { runId, jobId }
 */
export async function startDiscoveryPipeline(keyword, city, options = {}) {
  const { zones, ...singleOptions } = options;

  // Multi-zone: iterate zones and aggregate into one run
  if (zones && zones.length > 0) {
    const zoneNames = zones.map(z => z.name).join(', ');
    const run = db.createDiscoveryRun({
      keyword,
      city: zoneNames,
      lat: null,
      lng: null,
      radius: null,
      zone: `multi: ${zoneNames}`,
    });

    const jobId = await jobQueue.addJob('discovery_pipeline', {
      runId: run.id, keyword, city: zoneNames, zones
    }, async (data, reportProgress) => {
      return executeMultiZonePipeline(data.runId, data.keyword, data.zones, reportProgress);
    });

    db.updateDiscoveryRun(run.id, { jobId, status: 'running' });
    logger.info('Multi-zone pipeline queued', { runId: run.id, jobId, keyword, zones: zoneNames });
    return { runId: run.id, jobId };
  }

  // Single zone or city-based run
  const run = db.createDiscoveryRun({
    keyword,
    city,
    lat: singleOptions.lat || null,
    lng: singleOptions.lng || null,
    radius: singleOptions.radius || null,
    zone: singleOptions.zone || null,
  });

  const jobId = await jobQueue.addJob('discovery_pipeline', {
    runId: run.id, keyword, city, options: singleOptions
  }, async (data, reportProgress) => {
    return executePipeline(data.runId, data.keyword, data.city, reportProgress, data.options);
  });

  db.updateDiscoveryRun(run.id, { jobId, status: 'running' });
  logger.info('Pipeline queued', { runId: run.id, jobId, keyword, city });
  return { runId: run.id, jobId };
}

/**
 * Execute multi-zone pipeline: scrape each zone, aggregate all results into one run
 */
async function executeMultiZonePipeline(runId, keyword, zones, reportProgress) {
  try {
    db.updateDiscoveryRun(runId, { stage: 'scraping', progress: 0 });

    let allBusinesses = [];
    const seenDomains = new Set();

    for (let i = 0; i < zones.length; i++) {
      const zone = zones[i];
      const zoneProgress = Math.round((i / zones.length) * 33);
      db.updateDiscoveryRun(runId, { progress: zoneProgress });
      reportProgress(zoneProgress);

      logger.info(`Scraping zone ${i + 1}/${zones.length}: ${zone.name}`);

      const businesses = await scrapeGoogleMaps(keyword, zone.name, () => {}, {
        lat: zone.lat,
        lng: zone.lng,
        radius: zone.radius || 15000,
      });

      // Deduplicate across zones by domain hash
      for (const biz of businesses) {
        if (biz.domainHash && seenDomains.has(biz.domainHash)) continue;
        if (biz.domainHash) seenDomains.add(biz.domainHash);
        allBusinesses.push(biz);
      }
    }

    // Save raw leads
    let newCount = 0;
    for (const biz of allBusinesses) {
      if (biz.domainHash) {
        const existing = db.getDiscoveryLeadByDomainHash(biz.domainHash);
        if (existing) continue;
      }
      db.createDiscoveryLead({
        runId,
        businessName: biz.businessName,
        address: biz.address,
        website: biz.website,
        phone: biz.phone,
        rating: biz.rating,
        reviewCount: biz.reviewCount,
        category: biz.category,
        placeId: biz.placeId,
        domainHash: biz.domainHash,
      });
      newCount++;
    }

    db.updateDiscoveryRun(runId, { totalFound: newCount, progress: 33 });
    logger.info(`Multi-zone Stage 1 complete: ${newCount} new leads from ${zones.length} zones`);

    // Continue with shared stages 2 & 3
    return await executeEnrichAndScore(runId, newCount, reportProgress);
  } catch (error) {
    logger.error('Multi-zone pipeline failed', { runId, error: error.message });
    db.updateDiscoveryRun(runId, { status: 'failed', error: error.message });
    throw error;
  }
}

/**
 * Execute the full 3-stage pipeline
 */
async function executePipeline(runId, keyword, city, reportProgress, options = {}) {
  try {
    // ==================== STAGE 1: Google Maps Scraping ====================
    db.updateDiscoveryRun(runId, { stage: 'scraping', progress: 0 });

    const businesses = await scrapeGoogleMaps(keyword, city, (p) => {
      const overallProgress = Math.round(p * 0.33); // Stage 1 = 0-33%
      db.updateDiscoveryRun(runId, { progress: overallProgress });
      reportProgress(overallProgress);
    }, options);

    // Save raw leads to database (deduplicate by domain hash)
    let newCount = 0;
    for (const biz of businesses) {
      // Check for existing lead with same domain
      if (biz.domainHash) {
        const existing = db.getDiscoveryLeadByDomainHash(biz.domainHash);
        if (existing) continue;
      }

      db.createDiscoveryLead({
        runId,
        businessName: biz.businessName,
        address: biz.address,
        website: biz.website,
        phone: biz.phone,
        rating: biz.rating,
        reviewCount: biz.reviewCount,
        category: biz.category,
        placeId: biz.placeId,
        domainHash: biz.domainHash
      });
      newCount++;
    }

    db.updateDiscoveryRun(runId, {
      totalFound: newCount,
      progress: 33
    });

    logger.info(`Stage 1 complete: ${newCount} new leads saved`);

    return await executeEnrichAndScore(runId, newCount, reportProgress);

  } catch (error) {
    logger.error('Pipeline failed', { runId, error: error.message });
    db.updateDiscoveryRun(runId, {
      status: 'failed',
      error: error.message
    });
    throw error;
  }
}

/**
 * Execute stages 2 & 3: Enrichment + AI Scoring (shared by single and multi-zone)
 */
async function executeEnrichAndScore(runId, newCount, reportProgress) {
  // ==================== STAGE 2: Web Enrichment ====================
  db.updateDiscoveryRun(runId, { stage: 'enriching', progress: 34 });

  const leads = db.getDiscoveryLeadsByRun(runId);

  await enrichLeads(leads, (p) => {
    const overallProgress = 33 + Math.round(p * 0.34);
    db.updateDiscoveryRun(runId, { progress: overallProgress });
    reportProgress(overallProgress);
  });

  let enrichedCount = 0;
  for (const lead of leads) {
    db.updateDiscoveryLead(lead.id, {
      emails: lead.emails || [],
      extractedPhones: lead.extractedPhones || [],
      servicesOffered: lead.servicesOffered || [],
      aboutSummary: lead.aboutSummary || null,
      enrichmentStatus: lead.enrichmentStatus || 'pending'
    });
    if (lead.enrichmentStatus === 'enriched') enrichedCount++;
  }

  db.updateDiscoveryRun(runId, { enriched: enrichedCount, progress: 67 });
  logger.info(`Stage 2 complete: ${enrichedCount} leads enriched`);

  // ==================== STAGE 3: AI Scoring + Outreach ====================
  db.updateDiscoveryRun(runId, { stage: 'scoring', progress: 68 });

  const enrichedLeads = db.getDiscoveryLeadsByRun(runId);

  await scoreAndGenerateOutreach(enrichedLeads, (p) => {
    const overallProgress = 67 + Math.round(p * 0.33);
    db.updateDiscoveryRun(runId, { progress: overallProgress });
    reportProgress(overallProgress);
  });

  let scoredCount = 0;
  for (const lead of enrichedLeads) {
    db.updateDiscoveryLead(lead.id, {
      icpScore: lead.icpScore || 0,
      icpTier: lead.icpTier || 'unscored',
      icpReasoning: lead.icpReasoning || null,
      plumbingRelevance: lead.plumbingRelevance || 0,
      outreachSubject: lead.outreachSubject || null,
      outreachBody: lead.outreachBody || null
    });
    scoredCount++;
  }

  db.updateDiscoveryRun(runId, {
    scored: scoredCount,
    stage: 'complete',
    status: 'completed',
    progress: 100
  });

  const hot = enrichedLeads.filter(l => l.icpTier === 'hot').length;
  const warm = enrichedLeads.filter(l => l.icpTier === 'warm').length;

  logger.info(`Pipeline complete: ${scoredCount} scored, ${hot} hot, ${warm} warm`);

  return { totalFound: newCount, enriched: enrichedCount, scored: scoredCount, hot, warm };
}
