/**
 * Metadata Tagging Service
 * 
 * LLM-based automatic metadata extraction and tagging.
 * Generates rich metadata for documents to improve searchability and organization.
 * 
 * Capabilities:
 * - Auto-extract tags and categories
 * - Generate summaries
 * - Extract entities (people, places, organizations)
 * - Identify document type and language
 * - Detect key topics and themes
 * - Extract dates and temporal information
 */

import { aiProvider } from './ai-provider.js';
import logger from './logger.js';

class MetadataTaggingService {
  constructor() {
    // Predefined tag categories for plumbing/construction domain
    this.domainCategories = {
      documentTypes: [
        'blueprint', 'specification', 'contract', 'invoice', 
        'permit', 'inspection_report', 'estimate', 'work_order',
        'safety_document', 'material_list', 'change_order', 'warranty'
      ],
      trades: [
        'plumbing', 'electrical', 'hvac', 'framing', 'concrete',
        'roofing', 'flooring', 'painting', 'landscaping', 'masonry'
      ],
      projectPhases: [
        'planning', 'design', 'permitting', 'pre_construction',
        'rough_in', 'final', 'inspection', 'completion', 'warranty'
      ],
      materials: [
        'pvc', 'copper', 'pex', 'cast_iron', 'galvanized',
        'fixtures', 'valves', 'fittings', 'water_heater', 'pump'
      ],
      priorities: ['urgent', 'high', 'medium', 'low', 'backlog'],
      status: ['draft', 'pending', 'approved', 'rejected', 'completed', 'archived']
    };
  }

  /**
   * Generate comprehensive metadata for content
   * @param {string} content - Text content to analyze
   * @param {Object} options - { existingMetadata, generateSummary, extractEntities }
   * @returns {Promise<MetadataResult>}
   */
  async generateMetadata(content, options = {}) {
    const startTime = Date.now();
    const {
      existingMetadata = {},
      generateSummary = true,
      extractEntities = true,
      maxContentLength = 8000
    } = options;

    // Truncate content if too long
    const truncatedContent = content.slice(0, maxContentLength);

    try {
      // Build prompt for LLM
      const prompt = this._buildMetadataPrompt(truncatedContent, existingMetadata);

      // Call LLM
      const response = await aiProvider.active.chat([
        {
          role: 'system',
          content: `You are a metadata extraction assistant. Analyze the provided content and extract structured metadata in JSON format.

Available categories:
- documentTypes: ${this.domainCategories.documentTypes.join(', ')}
- trades: ${this.domainCategories.trades.join(', ')}
- projectPhases: ${this.domainCategories.projectPhases.join(', ')}
- materials: ${this.domainCategories.materials.join(', ')}
- priorities: ${this.domainCategories.priorities.join(', ')}
- status: ${this.domainCategories.status.join(', ')}

Respond ONLY with valid JSON in this exact format:
{
  "title": "document title",
  "summary": "brief summary (2-3 sentences)",
  "tags": ["tag1", "tag2"],
  "categories": ["category1"],
  "documentType": "type from documentTypes list",
  "trades": ["relevant trades"],
  "phase": "project phase if applicable",
  "materials": ["mentioned materials"],
  "priority": "priority level",
  "status": "document status",
  "entities": {
    "people": ["names mentioned"],
    "organizations": ["companies, agencies"],
    "locations": ["addresses, cities"],
    "dates": ["important dates"]
  },
  "language": "en",
  "confidence": 0.95
}`
        },
        {
          role: 'user',
          content: prompt
        }
      ], {
        temperature: 0.1, // Low temperature for consistent output
        max_tokens: 1000
      });

      // Parse response
      const rawMetadata = this._parseJSONResponse(response.content || response);

      // Validate and clean metadata
      const metadata = this._validateAndCleanMetadata(rawMetadata);

      // Enhance with computed fields
      const enhancedMetadata = {
        ...metadata,
        ...this._computeMetadata(content, existingMetadata),
        generatedAt: new Date().toISOString(),
        generationDuration: Date.now() - startTime
      };

      logger.info(`[MetadataTagging] Generated metadata in ${Date.now() - startTime}ms`);

      return enhancedMetadata;
    } catch (error) {
      logger.error('[MetadataTagging] Generation failed:', error.message);
      
      // Return basic metadata on failure
      return this._generateFallbackMetadata(content, existingMetadata);
    }
  }

  /**
   * Build prompt for metadata extraction
   * @private
   */
  _buildMetadataPrompt(content, existingMetadata) {
    let prompt = `Analyze the following content and extract metadata:\n\n`;
    prompt += `---\n${content}\n---\n\n`;

    if (Object.keys(existingMetadata).length > 0) {
      prompt += `Existing metadata (use as context):\n${JSON.stringify(existingMetadata, null, 2)}\n\n`;
    }

    prompt += `Extract the metadata as specified in your instructions.`;

    return prompt;
  }

  /**
   * Parse JSON from LLM response
   * @private
   */
  _parseJSONResponse(response) {
    // Try to extract JSON from markdown code blocks
    const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1].trim());
    }

    // Try to parse the entire response as JSON
    try {
      return JSON.parse(response.trim());
    } catch (error) {
      // Try to find JSON object in text
      const objectMatch = response.match(/\{[\s\S]*\}/);
      if (objectMatch) {
        return JSON.parse(objectMatch[0]);
      }
      throw new Error('Could not parse JSON from response');
    }
  }

  /**
   * Validate and clean extracted metadata
   * @private
   */
  _validateAndCleanMetadata(metadata) {
    const cleaned = {
      title: this._sanitizeString(metadata.title) || 'Untitled Document',
      summary: this._sanitizeString(metadata.summary) || '',
      tags: this._sanitizeArray(metadata.tags),
      categories: this._sanitizeArray(metadata.categories),
      documentType: this._validateFromList(metadata.documentType, this.domainCategories.documentTypes),
      trades: this._validateArrayFromList(metadata.trades, this.domainCategories.trades),
      phase: this._validateFromList(metadata.phase, this.domainCategories.projectPhases),
      materials: this._validateArrayFromList(metadata.materials, this.domainCategories.materials),
      priority: this._validateFromList(metadata.priority, this.domainCategories.priorities),
      status: this._validateFromList(metadata.status, this.domainCategories.status),
      entities: {
        people: this._sanitizeArray(metadata.entities?.people),
        organizations: this._sanitizeArray(metadata.entities?.organizations),
        locations: this._sanitizeArray(metadata.entities?.locations),
        dates: this._sanitizeArray(metadata.entities?.dates)
      },
      language: metadata.language || 'en',
      confidence: Math.max(0, Math.min(1, parseFloat(metadata.confidence) || 0.5))
    };

    return cleaned;
  }

  /**
   * Compute additional metadata
   * @private
   */
  _computeMetadata(content, existingMetadata) {
    const wordCount = content.split(/\s+/).filter(w => w).length;
    const charCount = content.length;
    const readingTime = Math.ceil(wordCount / 200); // ~200 wpm

    // Detect language (simple heuristic)
    const language = this._detectLanguage(content);

    return {
      wordCount,
      charCount,
      readingTime,
      language,
      contentHash: this._computeHash(content.slice(0, 1000)),
      lastModified: existingMetadata.lastModified || new Date().toISOString()
    };
  }

  /**
   * Generate fallback metadata on failure
   * @private
   */
  _generateFallbackMetadata(content, existingMetadata) {
    return {
      title: existingMetadata.title || 'Untitled Document',
      summary: content.slice(0, 200) + (content.length > 200 ? '...' : ''),
      tags: [],
      categories: [],
      documentType: 'unknown',
      trades: [],
      phase: null,
      materials: [],
      priority: 'medium',
      status: 'draft',
      entities: { people: [], organizations: [], locations: [], dates: [] },
      language: 'en',
      confidence: 0.1,
      ...this._computeMetadata(content, existingMetadata),
      generatedAt: new Date().toISOString(),
      fallback: true
    };
  }

  /**
   * Quick tag extraction without LLM (for performance)
   * Uses keyword matching and heuristics
   * @param {string} content - Text content
   */
  async extractTagsFast(content) {
    const tags = new Set();
    const contentLower = content.toLowerCase();

    // Check domain categories
    for (const [category, values] of Object.entries(this.domainCategories)) {
      for (const value of values) {
        if (contentLower.includes(value.replace(/_/g, ' '))) {
          tags.add(value);
        }
      }
    }

    // Extract common technical terms
    const technicalTerms = [
      'permit', 'inspection', 'blueprint', 'floor plan', 'elevation',
      'rough in', 'final', 'water heater', 'sewer', 'drain', 'vent',
      'supply line', 'fixture', 'valve', 'faucet', 'toilet', 'sink',
      'bathtub', 'shower', 'gas line', 'water line', 'main line'
    ];

    for (const term of technicalTerms) {
      if (contentLower.includes(term)) {
        tags.add(term.replace(/\s+/g, '_'));
      }
    }

    return Array.from(tags);
  }

  /**
   * Batch process multiple documents
   * @param {Array<{id, content, metadata}>} documents
   * @param {Object} options
   * @param {Function} onProgress
   */
  async batchProcess(documents, options = {}, onProgress = null) {
    const results = [];
    const total = documents.length;

    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i];
      
      try {
        const metadata = await this.generateMetadata(doc.content, {
          ...options,
          existingMetadata: doc.metadata
        });

        results.push({
          id: doc.id,
          success: true,
          metadata
        });
      } catch (error) {
        results.push({
          id: doc.id,
          success: false,
          error: error.message,
          metadata: this._generateFallbackMetadata(doc.content, doc.metadata)
        });
      }

      if (onProgress) {
        onProgress(i + 1, total);
      }

      // Rate limiting
      if (i < documents.length - 1) {
        await new Promise(r => setTimeout(r, 100));
      }
    }

    return results;
  }

  // Helper methods
  _sanitizeString(str) {
    if (!str || typeof str !== 'string') return '';
    return str.trim().slice(0, 500);
  }

  _sanitizeArray(arr) {
    if (!Array.isArray(arr)) return [];
    return arr
      .filter(item => typeof item === 'string')
      .map(item => item.trim().toLowerCase().replace(/\s+/g, '_'))
      .filter(item => item.length > 0)
      .slice(0, 20); // Max 20 items
  }

  _validateFromList(value, list) {
    if (!value || typeof value !== 'string') return null;
    const normalized = value.toLowerCase().replace(/\s+/g, '_');
    return list.includes(normalized) ? normalized : null;
  }

  _validateArrayFromList(arr, list) {
    if (!Array.isArray(arr)) return [];
    return arr
      .map(item => this._validateFromList(item, list))
      .filter(Boolean);
  }

  _detectLanguage(text) {
    // Simple language detection (could use franc or similar library)
    const spanishWords = ['el', 'la', 'de', 'que', 'y', 'en', 'un', 'ser', 'se', 'no'];
    const frenchWords = ['le', 'la', 'de', 'et', 'un', 'à', 'être', 'avoir', 'ne', 'je'];
    
    const words = text.toLowerCase().split(/\s+/).slice(0, 100);
    
    const spanishCount = words.filter(w => spanishWords.includes(w)).length;
    const frenchCount = words.filter(w => frenchWords.includes(w)).length;
    
    if (spanishCount > 5) return 'es';
    if (frenchCount > 5) return 'fr';
    return 'en';
  }

  _computeHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(16);
  }
}

// Export singleton
export const metadataTaggingService = new MetadataTaggingService();
export default metadataTaggingService;
