import { aiProvider } from './ai-provider.js';
import logger from './logger.js';

const MAX_SUMMARY_CHARS = 12000;
const MAX_CHAT_CHARS = 10000;

/**
 * Extract contextually relevant passages from text based on query
 * Uses TF-IDF-like keyword scoring to find most relevant sentences
 * 
 * @param {string} text - Full document text
 * @param {string} query - User question or query
 * @param {number} maxChars - Maximum characters to return
 * @returns {string} Relevant context excerpt
 */
function extractRelevantPassages(text, query, maxChars = MAX_CHAT_CHARS) {
  if (!text || text.length <= maxChars) {
    return text;
  }

  // Split into sentences (basic sentence boundary detection)
  const sentences = text
    .replace(/([.!?])\s+/g, "$1|\n")
    .split('|\n')
    .map(s => s.trim())
    .filter(s => s.length > 10); // Filter out very short fragments

  if (sentences.length === 0) {
    return text.slice(0, maxChars);
  }

  // Extract query keywords (remove common stop words)
  const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare', 'ought', 'used', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'under', 'and', 'but', 'or', 'yet', 'so', 'if', 'because', 'although', 'though', 'while', 'where', 'when', 'that', 'which', 'who', 'whom', 'whose', 'what', 'this', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them']);
  
  const queryWords = query
    .toLowerCase()
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopWords.has(w))
    .map(w => w.replace(/[^a-z0-9]/g, '')); // Remove punctuation

  // If no meaningful query words, fall back to first portion
  if (queryWords.length === 0) {
    return text.slice(0, maxChars);
  }

  // Score sentences by keyword overlap and density
  const scored = sentences.map(sent => {
    const sentLower = sent.toLowerCase();
    let score = 0;
    let matches = 0;

    for (const qWord of queryWords) {
      // Exact word match
      const wordRegex = new RegExp(`\\b${qWord}\\b`, 'g');
      const wordMatches = sentLower.match(wordRegex);
      if (wordMatches) {
        score += wordMatches.length * 2; // Weight exact matches higher
        matches++;
      }
      
      // Partial match (for longer words)
      if (qWord.length > 5 && sentLower.includes(qWord)) {
        score += 0.5;
      }
    }

    // Bonus for sentences with multiple keyword matches
    if (matches > 1) {
      score *= (1 + matches * 0.2);
    }

    // Length penalty - prefer medium-length sentences
    const length = sent.length;
    if (length > 200) {
      score *= 0.8; // Slightly penalize very long sentences
    } else if (length < 30) {
      score *= 0.7; // Penalize very short sentences
    }

    return { sent, score, length };
  });

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  // Build context from top-scoring sentences until maxChars
  let context = '';
  const usedSentences = [];

  // Always include top 3 highest scoring sentences first
  for (let i = 0; i < Math.min(3, scored.length); i++) {
    if (context.length + scored[i].sent.length > maxChars) break;
    context += scored[i].sent + '. ';
    usedSentences.push(scored[i].sent);
  }

  // If we have room, add some sentences that appeared near the high-scoring ones in original order
  if (context.length < maxChars * 0.7) {
    // Get sentences that weren't used but have some score
    const remaining = scored
      .filter(s => !usedSentences.includes(s.sent) && s.score > 0)
      .slice(0, 5);
    
    for (const { sent } of remaining) {
      if (context.length + sent.length > maxChars) break;
      context += sent + '. ';
    }
  }

  // If still no good matches, fall back to first N characters
  if (context.length < 100) {
    context = text.slice(0, maxChars);
  }

  return context.trim();
}

/**
 * Generate a summary of the document
 * @param {string} text - Document text
 * @param {string} model - Optional model name
 * @returns {Promise<string>} Summary
 */
export async function summarize(text, model = null) {
  const truncated = text.slice(0, MAX_SUMMARY_CHARS);
  const system = 'You are a professional document analyst. Provide clear, structured summaries with key points, findings, and conclusions.';
  const prompt = `Summarize the following document:\n\n${truncated}`;

  const result = await aiProvider.generate(prompt, { system, model });
  if (!result.success) throw new Error(result.error || 'Summarization failed');
  return result.response;
}

/**
 * Extract named entities from document
 * @param {string} text - Document text
 * @param {string} model - Optional model name
 * @returns {Promise<object>} Extracted entities
 */
export async function extractEntities(text, model = null) {
  const truncated = text.slice(0, MAX_SUMMARY_CHARS);
  const system = `You are a data extraction specialist. Extract structured entities from documents. Return valid JSON with these categories: people, organizations, locations, dates, monetary_values, contact_info, key_terms, action_items. Each category should be an array. For people, use objects with name, role, and context fields.`;
  const prompt = `Extract all entities from this document and return as JSON:\n\n${truncated}`;

  const result = await aiProvider.generate(prompt, { system, model });
  if (!result.success) throw new Error(result.error || 'Entity extraction failed');

  // Try parsing JSON from response
  try {
    const jsonMatch = result.response.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
  } catch (e) {
    logger.warn('[docvault-ai] Failed to parse entities JSON, returning raw');
  }
  return { raw_extraction: result.response };
}

/**
 * Chat with document using contextually relevant passages
 * @param {string} text - Full document text
 * @param {string} question - User question
 * @param {Array} history - Chat history
 * @param {string} model - Optional model name
 * @returns {Promise<string>} AI response
 */
export async function chat(text, question, history = [], model = null) {
  // Extract relevant passages based on the question (not just first 10KB)
  const relevantContext = extractRelevantPassages(text, question, MAX_CHAT_CHARS);
  
  const recentHistory = history.slice(-6); // last 3 exchanges

  let historyText = '';
  if (recentHistory.length > 0) {
    historyText = '\n\nPrevious conversation:\n' +
      recentHistory.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n');
  }

  const system = 'You are a helpful document Q&A assistant. Answer questions based on the document content provided. Be concise and accurate. If the answer is not in the document, say so clearly.';
  const prompt = `Document content (most relevant sections):\n${relevantContext}${historyText}\n\nUser question: ${question}`;

  // Log context selection for debugging
  logger.debug('[docvault-ai] Chat context selection', {
    questionLength: question.length,
    fullTextLength: text.length,
    contextLength: relevantContext.length,
    contextRatio: (relevantContext.length / text.length * 100).toFixed(1) + '%'
  });

  const result = await aiProvider.generate(prompt, { system, model });
  if (!result.success) throw new Error(result.error || 'Chat failed');
  return result.response;
}
