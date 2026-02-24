// Discovery Scorer - Stage 3 of Discovery Pipeline
// Uses Ollama for ICP scoring (0-100) and outreach email generation

import { aiProvider } from '../ai-provider.js';
import logger from '../logger.js';

/**
 * Score a single lead using Ollama AI
 */
async function scoreLead(lead) {
  const prompt = `You are scoring a lead for CTL Plumbing LLC, a commercial and multi-family plumbing contractor in the DFW Metroplex (Dallas-Fort Worth, Texas).

We are looking for potential customers who would need plumbing services:
- Property management companies (apartments, commercial buildings)
- General contractors building new construction
- Commercial building owners/managers
- Multi-family housing developers
- Facility maintenance companies

Business Information:
- Name: ${lead.businessName}
- Category: ${lead.category || 'Unknown'}
- Address: ${lead.address || 'Unknown'}
- Website: ${lead.website || 'None'}
- Services: ${(lead.servicesOffered || []).join(', ') || 'Unknown'}
- About: ${lead.aboutSummary || 'No info available'}
- Rating: ${lead.rating || 'N/A'} (${lead.reviewCount || 0} reviews)
- Is Property Manager: ${lead.isPropertyManager || 'Unknown'}
- Is Contractor: ${lead.isContractor || 'Unknown'}
- Is Commercial: ${lead.isCommercial || 'Unknown'}

Score this lead from 0-100 for how likely they are to need plumbing services.

Respond ONLY with valid JSON:
{
  "icpScore": <number 0-100>,
  "icpTier": "<hot|warm|cold>",
  "icpReasoning": "<1-2 sentences explaining score>",
  "plumbingRelevance": <0.0 to 1.0 - how relevant to plumbing industry>
}

Rules:
- Hot (75-100): Property managers, GCs, multi-family developers, commercial building owners in DFW
- Warm (40-74): Related industries, smaller operations, or outside core DFW
- Cold (0-39): Unlikely to need plumbing services

Respond with ONLY the JSON, no other text.`;

  try {
    const result = await aiProvider.generate(prompt, {
      temperature: 0.2,
      timeout: 30000
    });

    if (!result.success) return fallbackScore(lead);

    const jsonMatch = result.response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        icpScore: Math.max(0, Math.min(100, parsed.icpScore || 0)),
        icpTier: parsed.icpTier || tierFromScore(parsed.icpScore),
        icpReasoning: parsed.icpReasoning || '',
        plumbingRelevance: Math.max(0, Math.min(1, parsed.plumbingRelevance || 0))
      };
    }
  } catch (error) {
    logger.warn(`AI scoring failed for ${lead.businessName}: ${error.message}`);
  }

  return fallbackScore(lead);
}

/**
 * Generate outreach email for a lead
 */
async function generateOutreach(lead) {
  if (lead.icpTier === 'cold') {
    return { outreachSubject: null, outreachBody: null };
  }

  const prompt = `Write a brief, professional cold outreach email from CTL Plumbing LLC to this business.

CTL Plumbing LLC is a commercial and multi-family plumbing contractor in the DFW Metroplex.
We handle rough-in, top-out, and trim plumbing for apartments, commercial buildings, and new construction.

Lead:
- Business: ${lead.businessName}
- Category: ${lead.category || ''}
- Services they offer: ${(lead.servicesOffered || []).join(', ') || 'Unknown'}
- About: ${lead.aboutSummary || ''}

Write a short, personalized email (3-4 paragraphs max) that:
1. References something specific about their business
2. Explains how CTL Plumbing can help them
3. Includes a clear call to action

Respond ONLY with valid JSON:
{
  "subject": "Email subject line",
  "body": "Full email body text"
}

Respond with ONLY the JSON, no other text.`;

  try {
    const result = await aiProvider.generate(prompt, {
      temperature: 0.5,
      timeout: 30000
    });

    if (!result.success) return { outreachSubject: null, outreachBody: null };

    const jsonMatch = result.response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        outreachSubject: parsed.subject || null,
        outreachBody: parsed.body || null
      };
    }
  } catch (error) {
    logger.warn(`Outreach generation failed for ${lead.businessName}: ${error.message}`);
  }

  return { outreachSubject: null, outreachBody: null };
}

/**
 * Determine tier from score
 */
function tierFromScore(score) {
  if (score >= 75) return 'hot';
  if (score >= 40) return 'warm';
  return 'cold';
}

/**
 * Fallback rule-based scoring when AI is unavailable
 */
function fallbackScore(lead) {
  let score = 30;

  const name = (lead.businessName || '').toLowerCase();
  const category = (lead.category || '').toLowerCase();
  const services = (lead.servicesOffered || []).join(' ').toLowerCase();
  const about = (lead.aboutSummary || '').toLowerCase();
  const combined = `${name} ${category} ${services} ${about}`;

  // High-value keywords
  const hotKeywords = ['property management', 'apartment', 'multi-family', 'general contractor',
    'commercial real estate', 'building management', 'facility', 'construction'];
  const warmKeywords = ['real estate', 'developer', 'renovation', 'remodel', 'maintenance',
    'building', 'office', 'retail', 'hotel', 'restaurant'];

  for (const kw of hotKeywords) {
    if (combined.includes(kw)) score += 20;
  }
  for (const kw of warmKeywords) {
    if (combined.includes(kw)) score += 10;
  }

  // DFW area bonus
  const address = (lead.address || '').toLowerCase();
  const dfwCities = ['fort worth', 'dallas', 'arlington', 'plano', 'frisco', 'irving',
    'denton', 'mckinney', 'grand prairie', 'mesquite', 'carrollton'];
  if (dfwCities.some(c => address.includes(c))) score += 10;

  // Reviews bonus
  if (lead.reviewCount > 100) score += 5;
  if (lead.rating >= 4.0) score += 5;

  score = Math.max(0, Math.min(100, score));

  return {
    icpScore: score,
    icpTier: tierFromScore(score),
    icpReasoning: 'Rule-based scoring (AI unavailable)',
    plumbingRelevance: score / 100
  };
}

/**
 * Score and generate outreach for a batch of leads
 * @param {Array} leads - Array of enriched lead objects
 * @param {Function} onProgress - Progress callback (0-100)
 * @returns {Array} Scored leads with outreach
 */
export async function scoreAndGenerateOutreach(leads, onProgress = () => {}) {
  logger.info(`Scoring ${leads.length} leads`);

  for (let i = 0; i < leads.length; i++) {
    const lead = leads[i];

    // Score the lead
    const scoreResult = await scoreLead(lead);
    Object.assign(lead, scoreResult);

    // Generate outreach for hot/warm leads
    if (lead.icpTier === 'hot' || lead.icpTier === 'warm') {
      const outreach = await generateOutreach(lead);
      Object.assign(lead, outreach);
    }

    onProgress(Math.round(((i + 1) / leads.length) * 100));
    logger.info(`Scored: ${lead.businessName} => ${lead.icpScore} (${lead.icpTier})`);
  }

  // Sort by score descending
  leads.sort((a, b) => (b.icpScore || 0) - (a.icpScore || 0));

  const hot = leads.filter(l => l.icpTier === 'hot').length;
  const warm = leads.filter(l => l.icpTier === 'warm').length;
  const cold = leads.filter(l => l.icpTier === 'cold').length;
  logger.info(`Scoring complete: ${hot} hot, ${warm} warm, ${cold} cold`);

  return leads;
}
