// Lead scoring service wrapper

import { ollamaService } from './ollama.js';
import { dataStore } from '../data/store.js';

class ScoringService {
  async scoreLead(leadId) {
    const lead = dataStore.getLead(leadId);
    if (!lead) {
      throw new Error('Lead not found');
    }

    // Use Ollama service to score the lead
    const scoring = await ollamaService.scoreLead(lead);

    // Update lead with score and status
    const updated = dataStore.updateLead(leadId, {
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
