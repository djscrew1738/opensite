const fetch = require('node-fetch');
const config = require('../config');

const SYSTEM_PROMPT = `You are an AI assistant that creates structured summaries from transcripts.

Analyze the transcript and extract:
- Key topics discussed
- Decisions made
- Action items (with priority: low/normal/high)
- Questions raised

Respond ONLY with valid JSON in this format:
{
  "title": "Brief session title",
  "topics": ["topic 1", "topic 2"],
  "key_decisions": ["decision 1", "decision 2"],
  "action_items": [
    {"description": "what to do", "priority": "normal"}
  ],
  "questions": ["question 1"],
  "summary": "2-3 sentence overall summary"
}`;

/**
 * Generate structured summary from transcript
 */
async function summarize(transcript) {
  console.log('[Summarizer] Generating summary...');

  const response = await fetch(`${config.ollama.url}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: config.ollama.model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Transcript:\n\n${transcript}` },
      ],
      stream: false,
      options: {
        temperature: 0.3,
        num_predict: 2048,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Summarization failed: ${response.status}`);
  }

  const result = await response.json();
  const content = result.message?.content || '';

  try {
    const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.error('[Summarizer] JSON parse error, returning raw');
    return { raw_response: content, parse_error: true };
  }
}

/**
 * Format summary as readable text
 */
function formatSummary(json, session = {}) {
  if (json.parse_error) {
    return json.raw_response || 'Summary unavailable';
  }

  const lines = [];
  
  lines.push('📋 SESSION SUMMARY');
  lines.push('━'.repeat(40));
  lines.push(`Title: ${json.title || 'Untitled'}`);
  if (session.recorded_at) {
    lines.push(`Date: ${new Date(session.recorded_at).toLocaleDateString()}`);
  }
  lines.push('');

  if (json.topics?.length) {
    lines.push('TOPICS');
    json.topics.forEach(t => lines.push(`• ${t}`));
    lines.push('');
  }

  if (json.key_decisions?.length) {
    lines.push('KEY DECISIONS');
    json.key_decisions.forEach(d => lines.push(`• ${d}`));
    lines.push('');
  }

  if (json.action_items?.length) {
    lines.push('ACTION ITEMS');
    json.action_items.forEach(item => {
      const icon = item.priority === 'high' ? '🔴' : item.priority === 'low' ? '🟢' : '🟡';
      lines.push(`${icon} ${item.description}`);
    });
    lines.push('');
  }

  if (json.summary) {
    lines.push('SUMMARY');
    lines.push(json.summary);
  }

  return lines.join('\n');
}

module.exports = { summarize, formatSummary };
