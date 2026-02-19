const axios = require('axios');
const config = require('../config');
const db = require('../db');
const logger = require('../utils/logger');

/**
 * AI Lead Scoring Engine using local Ollama
 *
 * Analyzes each unscored permit and assigns:
 *   - lead_score (1-100)
 *   - lead_tier (hot/warm/cold)
 *   - structured classification (JSON)
 *
 * Scoring factors:
 *   1. Permit type relevance (new construction >> addition >> plumbing-only)
 *   2. Project cost (higher = more valuable)
 *   3. Unit count (multi-unit = more fixtures = more revenue)
 *   4. Description analysis (what kind of work, scope)
 *   5. Builder relationship status (existing client vs unknown)
 *   6. Geographic proximity to service area
 */

const SCORING_PROMPT = `You are a lead scoring assistant for a plumbing contractor that specializes in new construction.
Analyze the following building permit and score it as a plumbing lead.

SCORING CRITERIA:
- New residential construction (especially duplex, townhome, multi-family) = highest value
- New commercial construction = high value
- Large additions/remodels with plumbing work = medium value
- Small alterations, mechanical-only, re-roofing = low/no value
- Higher estimated cost = higher value
- Multi-unit buildings (duplex, fourplex, apartments) = multiplied value
- Projects that clearly need plumbing rough-in and finish = highest relevance

PERMIT DATA:
Permit Type: {permit_type}
Category: {permit_category}
Description: {description}
Work Type: {work_type}
Occupancy: {occupancy_type}
Estimated Cost: ${estimated_cost}
Square Footage: {square_footage}
Units: {units}
Address: {address}
Contractor: {contractor_name}

Respond ONLY with a JSON object (no markdown, no explanation):
{
  "score": <number 1-100>,
  "tier": "<hot|warm|cold>",
  "reasoning": "<brief 1-sentence explanation>",
  "plumbing_relevance": "<high|medium|low|none>",
  "project_type": "<new_residential|new_commercial|addition|remodel|plumbing_only|not_relevant>",
  "estimated_fixtures": <number or null>,
  "priority_action": "<call_now|add_to_list|monitor|skip>"
}`;

/**
 * Score a single permit using Ollama
 */
async function scorePermit(permit) {
  const prompt = SCORING_PROMPT
    .replace('{permit_type}', permit.permit_type || 'Unknown')
    .replace('{permit_category}', permit.permit_category || 'Unknown')
    .replace('{description}', permit.description || 'No description')
    .replace('{work_type}', permit.work_type || 'Unknown')
    .replace('{occupancy_type}', permit.occupancy_type || 'Unknown')
    .replace('{estimated_cost}', permit.estimated_cost ? permit.estimated_cost.toLocaleString() : 'Not specified')
    .replace('{square_footage}', permit.square_footage || 'Not specified')
    .replace('{units}', permit.units || 'Not specified')
    .replace('{address}', permit.address || 'Not specified')
    .replace('{contractor_name}', permit.contractor_name || 'Not specified');

  try {
    const response = await axios.post(
      `${config.ollama.baseUrl}/api/generate`,
      {
        model: config.ollama.model,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.1,      // Low temp for consistent scoring
          num_predict: 500,
        },
      },
      { timeout: 60000 }
    );

    const text = response.data.response.trim();

    // Parse JSON response - handle potential markdown wrapping
    const jsonStr = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const classification = JSON.parse(jsonStr);

    // Validate and clamp score
    let score = parseInt(classification.score) || 0;
    score = Math.max(1, Math.min(100, score));

    // Apply modifiers
    score = applyModifiers(score, permit);

    // Determine tier from final score
    let tier;
    if (score >= config.scoring.hotThreshold) tier = 'hot';
    else if (score >= config.scoring.warmThreshold) tier = 'warm';
    else tier = 'cold';

    classification.score = score;
    classification.tier = tier;

    return classification;

  } catch (err) {
    logger.error(`Ollama scoring failed for permit ${permit.id}: ${err.message}`);

    // Fallback: rule-based scoring if AI is unavailable
    return fallbackScore(permit);
  }
}

/**
 * Apply rule-based modifiers to the AI score
 */
function applyModifiers(score, permit) {
  // Boost for new construction
  if (permit.permit_category === 'new_construction') {
    score = Math.min(100, score + 10);
  }

  // Boost for multi-unit
  if (permit.units && permit.units >= 2) {
    score = Math.min(100, score + (permit.units * 3));
  }

  // Boost for high-value projects
  if (permit.estimated_cost && permit.estimated_cost >= 500000) {
    score = Math.min(100, score + 10);
  } else if (permit.estimated_cost && permit.estimated_cost >= 200000) {
    score = Math.min(100, score + 5);
  }

  // Penalty for very low cost projects
  if (permit.estimated_cost && permit.estimated_cost < config.scoring.minProjectCost) {
    score = Math.max(1, score - 15);
  }

  // TODO: Geographic scoring once service_areas table is populated
  // const inServiceArea = await checkServiceArea(permit.latitude, permit.longitude);
  // if (!inServiceArea) score = Math.max(1, score - 10);

  return Math.round(score);
}

/**
 * Fallback scoring when Ollama is unavailable
 */
function fallbackScore(permit) {
  let score = 30; // baseline

  // Category-based scoring
  switch (permit.permit_category) {
    case 'new_construction': score += 40; break;
    case 'addition': score += 20; break;
    case 'plumbing': score += 15; break;
    case 'mechanical': score -= 10; break;
    default: break;
  }

  // Cost-based
  if (permit.estimated_cost >= 500000) score += 15;
  else if (permit.estimated_cost >= 200000) score += 10;
  else if (permit.estimated_cost >= 100000) score += 5;
  else if (permit.estimated_cost && permit.estimated_cost < 50000) score -= 10;

  // Multi-unit boost
  if (permit.units >= 2) score += (permit.units * 5);

  // Occupancy
  if (permit.occupancy_type === 'residential') score += 5;
  if (permit.occupancy_type === 'commercial') score += 3;

  score = Math.max(1, Math.min(100, score));

  let tier;
  if (score >= config.scoring.hotThreshold) tier = 'hot';
  else if (score >= config.scoring.warmThreshold) tier = 'warm';
  else tier = 'cold';

  return {
    score,
    tier,
    reasoning: 'Rule-based fallback score (Ollama unavailable)',
    plumbing_relevance: permit.permit_category === 'new_construction' ? 'high' : 'medium',
    project_type: permit.permit_category || 'unknown',
    estimated_fixtures: null,
    priority_action: tier === 'hot' ? 'call_now' : tier === 'warm' ? 'add_to_list' : 'monitor',
  };
}

/**
 * Score all unscored permits (batch job)
 */
async function scoreAllUnscored(batchSize = 50) {
  const startTime = Date.now();
  let totalScored = 0;
  let totalHot = 0;

  logger.info('Starting permit scoring job...');

  while (true) {
    const permits = await db.getUnscoredPermits(batchSize);
    if (permits.length === 0) break;

    for (const permit of permits) {
      try {
        const classification = await scorePermit(permit);
        await db.updatePermitScore(
          permit.id,
          classification.score,
          classification.tier,
          JSON.stringify(classification)
        );

        totalScored++;
        if (classification.tier === 'hot') totalHot++;

        logger.debug(
          `Scored permit ${permit.permit_number}: ` +
          `${classification.score} (${classification.tier}) - ${classification.reasoning}`
        );

        // Small delay between Ollama calls to avoid overwhelming it
        await new Promise(r => setTimeout(r, 200));

      } catch (err) {
        logger.error(`Failed to score permit ${permit.id}: ${err.message}`);
      }
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  logger.info(`Scoring complete in ${elapsed}s: ${totalScored} scored, ${totalHot} hot leads`);

  return { totalScored, totalHot };
}

module.exports = { scorePermit, scoreAllUnscored, fallbackScore };
