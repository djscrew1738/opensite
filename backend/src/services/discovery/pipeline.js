// Discovery Pipeline Orchestrator
// Chains Stage 1 (Maps) -> Stage 2 (Enrich) -> Stage 3 (Score + Outreach)
// Uses existing jobQueue for background processing

import { jobQueue } from '../jobQueue.js';
import { db } from '../database.js';
import { scrapeGoogleMaps } from './mapsScraper.js';
import { enrichLeads } from './webEnricher.js';
import { scoreAndGenerateOutreach } from './discoveryScorer.js';

const logger = {
  info: (msg, data) => console.log(`[discovery-pipeline] ${msg}`, data || ''),
  error: (msg, data) => console.error(`[discovery-pipeline] ${msg}`, data || ''),
};

/**
 * Start a discovery pipeline run
 * @param {string} keyword - Business type to search
 * @param {string} city - City to search in
 * @returns {object} { runId, jobId }
 */
export async function startDiscoveryPipeline(keyword, city) {
  // Create run record
  const run = db.createDiscoveryRun({ keyword, city });

  // Queue the pipeline as a background job
  const jobId = await jobQueue.addJob('discovery_pipeline', { runId: run.id, keyword, city }, async (data, reportProgress) => {
    return executePipeline(data.runId, data.keyword, data.city, reportProgress);
  });

  // Update run with jobId
  db.updateDiscoveryRun(run.id, { jobId, status: 'running' });

  logger.info('Pipeline queued', { runId: run.id, jobId, keyword, city });
  return { runId: run.id, jobId };
}

/**
 * Execute the full 3-stage pipeline
 */
async function executePipeline(runId, keyword, city, reportProgress) {
  try {
    // ==================== STAGE 1: Google Maps Scraping ====================
    db.updateDiscoveryRun(runId, { stage: 'scraping', progress: 0 });

    const businesses = await scrapeGoogleMaps(keyword, city, (p) => {
      const overallProgress = Math.round(p * 0.33); // Stage 1 = 0-33%
      db.updateDiscoveryRun(runId, { progress: overallProgress });
      reportProgress(overallProgress);
    });

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

    // ==================== STAGE 2: Web Enrichment ====================
    db.updateDiscoveryRun(runId, { stage: 'enriching', progress: 34 });

    const leads = db.getDiscoveryLeadsByRun(runId);

    await enrichLeads(leads, (p) => {
      const overallProgress = 33 + Math.round(p * 0.34); // Stage 2 = 33-67%
      db.updateDiscoveryRun(runId, { progress: overallProgress });
      reportProgress(overallProgress);
    });

    // Update each lead in the database with enrichment data
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

    db.updateDiscoveryRun(runId, {
      enriched: enrichedCount,
      progress: 67
    });

    logger.info(`Stage 2 complete: ${enrichedCount} leads enriched`);

    // ==================== STAGE 3: AI Scoring + Outreach ====================
    db.updateDiscoveryRun(runId, { stage: 'scoring', progress: 68 });

    // Re-fetch leads with enrichment data
    const enrichedLeads = db.getDiscoveryLeadsByRun(runId);

    await scoreAndGenerateOutreach(enrichedLeads, (p) => {
      const overallProgress = 67 + Math.round(p * 0.33); // Stage 3 = 67-100%
      db.updateDiscoveryRun(runId, { progress: overallProgress });
      reportProgress(overallProgress);
    });

    // Update each lead with scoring and outreach data
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

    // Finalize the run
    db.updateDiscoveryRun(runId, {
      scored: scoredCount,
      stage: 'complete',
      status: 'completed',
      progress: 100
    });

    const hot = enrichedLeads.filter(l => l.icpTier === 'hot').length;
    const warm = enrichedLeads.filter(l => l.icpTier === 'warm').length;

    logger.info(`Pipeline complete: ${scoredCount} scored, ${hot} hot, ${warm} warm`);

    return {
      totalFound: newCount,
      enriched: enrichedCount,
      scored: scoredCount,
      hot,
      warm
    };

  } catch (error) {
    logger.error('Pipeline failed', { runId, error: error.message });
    db.updateDiscoveryRun(runId, {
      status: 'failed',
      error: error.message
    });
    throw error;
  }
}
