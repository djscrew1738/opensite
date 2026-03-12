/**
 * AI Structured Output Engine
 * Ensures AI responses match a specific Zod schema with auto-repair/self-correction.
 */

import { aiProvider } from '../ai-provider.js';
import { z } from 'zod';
import logger from '../logger.js';

export class StructuredOutputEngine {
  /**
   * Generates a structured response from the AI based on a Zod schema.
   * 
   * @param {string} prompt - The user prompt
   * @param {z.ZodSchema} schema - The Zod schema to validate against
   * @param {Object} options - Provider and model options
   * @returns {Promise<Object>} The validated JSON object
   */
  static async generate(prompt, schema, options = {}) {
    const maxRetries = options.maxRetries || 2;
    const model = options.model || aiProvider.getRecommendedModel('analysis');
    
    // 1. Generate Schema Instructions
    const schemaDescription = this._getSchemaDescription(schema);
    const systemPrompt = `You are a specialized JSON extraction engine. 
You MUST return ONLY a valid JSON object matching the following schema:
${schemaDescription}

IMPORTANT:
- No conversational text before or after the JSON.
- Ensure all numbers are numbers, not strings.
- Follow the schema strictly.`;

    let currentPrompt = prompt;
    let attempts = 0;
    let lastError = null;

    while (attempts <= maxRetries) {
      try {
        attempts++;
        logger.debug(`[StructuredOutput] Attempt ${attempts} using ${model}`);

        const result = await aiProvider.generate(currentPrompt, {
          ...options,
          system: systemPrompt,
          model,
          temperature: 0, // Deterministic for structured output
        });

        if (!result.success) {
          throw new Error(result.error || 'AI generation failed');
        }

        // 2. Parse and Validate
        const json = this._extractJSON(result.text);
        const validated = schema.parse(json);

        return {
          success: true,
          data: validated,
          provider: result.provider,
          attempts,
          model: result.model
        };

      } catch (err) {
        lastError = err;
        logger.warn(`[StructuredOutput] Attempt ${attempts} failed:`, err.message);

        if (attempts <= maxRetries) {
          // 3. Self-Correction / Auto-Repair
          currentPrompt = `Your previous response failed validation. 
Error: ${err.message}
Please correct the JSON and ensure it strictly follows the schema.
Original Input: ${prompt}`;
        }
      }
    }

    return {
      success: false,
      error: `Failed to generate valid structured output after ${attempts} attempts: ${lastError.message}`,
      attempts
    };
  }

  /**
   * Extracts JSON from a potentially messy AI response
   */
  static _extractJSON(text) {
    try {
      // Find the first { and the last }
      const start = text.indexOf('{');
      const end = text.lastIndexOf('}');
      
      if (start === -1 || end === -1) {
        throw new Error('No JSON object found in response');
      }
      
      const jsonStr = text.substring(start, end + 1);
      return JSON.parse(jsonStr);
    } catch (err) {
      throw new Error(`Failed to parse AI response as JSON: ${err.message}`);
    }
  }

  /**
   * Generates a human/AI-readable description of the Zod schema
   */
  static _getSchemaDescription(schema) {
    // This is a simplified version. For a production system, 
    // we'd use something like zod-to-json-schema
    if (schema instanceof z.ZodObject) {
      const shape = schema.shape;
      const fields = Object.entries(shape).map(([key, value]) => {
        let type = 'string';
        if (value instanceof z.ZodNumber) type = 'number';
        if (value instanceof z.ZodBoolean) type = 'boolean';
        if (value instanceof z.ZodArray) type = 'array';
        if (value instanceof z.ZodObject) type = 'object';
        
        const description = value._def.description ? ` (${value._def.description})` : '';
        return `  "${key}": ${type}${description}`;
      });
      return `{\n${fields.join(',\n')}\n}`;
    }
    return 'Object matching expected structure';
  }
}

export default StructuredOutputEngine;
