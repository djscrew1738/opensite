// Lead scoring service wrapper

import { aiProvider } from './ai-provider.js';
import { db } from './database.js';
import logger from './logger.js';

class ScoringService {
  async scoreLead(leadId) {
    const lead = db.getLead(leadId);
    if (!lead) {
      throw new Error('Lead not found');
    }

    logger.info('Scoring lead', { leadId, name: lead.name });

    // Use Ollama service to score the lead
    const scoring = await aiProvider.scoreLead(lead);

    // Update lead with score and status
    const updated = db.updateLead(leadId, {
      score: scoring.score,
      status: scoring.status
    });

    logger.info('Lead scored', {
      leadId,
      score: scoring.score,
      status: scoring.status
    });

    return {
      lead: updated,
      scoring
    };
  }
}

export const scoringService = new ScoringService();
