/**
 * AI Intelligence Layer — Entry Point
 * Exports all enhanced AI services and orchestrates their interaction.
 */

import { aiProvider } from '../ai-provider.js';
import { aiOptimizer } from '../ai-optimizer.js';
import { StructuredOutputEngine } from './structured-output.js';
import { ragService } from './rag-service.js';
import { embeddingService } from './embedding-service.js';
import logger from '../logger.js';

/**
 * Enhanced AI Interface
 * Adds high-level features like Smart Chat and Structured Extraction to the base provider.
 */
export const aiIntelligence = {
  /**
   * Smart Chat with Auto-RAG
   * Automatically fetches context from the database based on the message.
   */
  async smartChat(message, history = [], options = {}) {
    try {
      logger.info('[ai-intelligence] Smart chat request:', message.substring(0, 50));
      
      // 1. Context Retrieval (RAG)
      const context = await ragService.getContext(message, options.ragOptions || {});
      
      // 2. Prepare Augmented Prompt
      const systemPrompt = `You are an expert plumbing AI assistant for CTL Plumbing LLC.
Use the following DATABASE CONTEXT to answer the user's question accurately.
If the information is not in the context, use your general knowledge but mention it.

DATABASE CONTEXT:
${context || 'No specific context found in database.'}

Rules:
- Be concise and professional.
- Refer to specific materials, prices, or leads if mentioned in the context.
- Use DFW local codes and standards.`;

      // 3. Generate Response
      const result = await aiProvider.generateChat(message, history, {
        ...options,
        system: systemPrompt,
      });

      return {
        ...result,
        hasContext: !!context,
        contextSources: context ? (options.ragOptions?.sources || ['all']) : [],
      };
    } catch (err) {
      logger.error('[ai-intelligence] Smart chat failed:', err.message);
      throw err;
    }
  },

  /**
   * Smart Chat Stream with Auto-RAG
   */
  async *smartChatStream(message, history = [], options = {}) {
    try {
      // 1. Context Retrieval (RAG)
      const context = await ragService.getContext(message, options.ragOptions || {});
      
      const systemPrompt = `You are an expert plumbing AI assistant for CTL Plumbing LLC.
Use the following DATABASE CONTEXT to answer the user's question accurately.

DATABASE CONTEXT:
${context || 'No specific context found.'}

Rules:
- Be concise and professional.
- Use DFW local codes.`;

      // 2. Stream Response
      for await (const chunk of aiProvider.generateChatStream(message, history, {
        ...options,
        system: systemPrompt,
      })) {
        yield chunk;
      }
    } catch (err) {
      logger.error('[ai-intelligence] Smart chat stream failed:', err.message);
      yield { error: err.message };
    }
  },

  /**
   * Structured Extraction
   * Extracts specific data from text/blueprints using Zod schemas.
   */
  async extract(prompt, schema, options = {}) {
    return await StructuredOutputEngine.generate(prompt, schema, options);
  },

  /**
   * Base Providers & Optimizer
   */
  provider: aiProvider,
  optimizer: aiOptimizer,
  rag: ragService,
  embeddings: embeddingService,
};

export default aiIntelligence;
