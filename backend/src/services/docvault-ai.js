import { aiProvider } from './ai-provider.js';
import logger from './logger.js';

const MAX_SUMMARY_CHARS = 12000;
const MAX_CHAT_CHARS = 10000;

export async function summarize(text) {
  const truncated = text.slice(0, MAX_SUMMARY_CHARS);
  const system = 'You are a professional document analyst. Provide clear, structured summaries with key points, findings, and conclusions.';
  const prompt = `Summarize the following document:\n\n${truncated}`;

  const result = await aiProvider.generate(prompt, { system });
  if (!result.success) throw new Error(result.error || 'Summarization failed');
  return result.response;
}

export async function extractEntities(text) {
  const truncated = text.slice(0, MAX_SUMMARY_CHARS);
  const system = `You are a data extraction specialist. Extract structured entities from documents. Return valid JSON with these categories: people, organizations, locations, dates, monetary_values, contact_info, key_terms, action_items. Each category should be an array. For people, use objects with name, role, and context fields.`;
  const prompt = `Extract all entities from this document and return as JSON:\n\n${truncated}`;

  const result = await aiProvider.generate(prompt, { system });
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

export async function chat(text, question, history = []) {
  const truncated = text.slice(0, MAX_CHAT_CHARS);
  const recentHistory = history.slice(-6); // last 3 exchanges

  let historyText = '';
  if (recentHistory.length > 0) {
    historyText = '\n\nPrevious conversation:\n' +
      recentHistory.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n');
  }

  const system = 'You are a helpful document Q&A assistant. Answer questions based on the document content provided. Be concise and accurate.';
  const prompt = `Document content:\n${truncated}${historyText}\n\nUser question: ${question}`;

  const result = await aiProvider.generate(prompt, { system });
  if (!result.success) throw new Error(result.error || 'Chat failed');
  return result.response;
}
