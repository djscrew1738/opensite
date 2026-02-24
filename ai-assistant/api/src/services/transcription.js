const fs = require('fs');
const FormData = require('form-data');
const fetch = require('node-fetch');
const config = require('../config');

/**
 * Transcribe audio file using faster-whisper
 */
async function transcribe(audioFilePath) {
  console.log(`[Transcription] Processing: ${audioFilePath}`);
  
  const form = new FormData();
  form.append('file', fs.createReadStream(audioFilePath));
  form.append('model', 'base.en');
  form.append('response_format', 'verbose_json');
  form.append('language', 'en');

  const response = await fetch(`${config.whisper.url}/v1/audio/transcriptions`, {
    method: 'POST',
    body: form,
    headers: form.getHeaders(),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Transcription failed (${response.status}): ${errText}`);
  }

  const result = await response.json();
  
  const segments = (result.segments || []).map(seg => ({
    text: seg.text.trim(),
    start: seg.start,
    end: seg.end,
  }));

  const fullText = result.text || segments.map(s => s.text).join(' ');
  
  console.log(`[Transcription] Complete: ${segments.length} segments, ${fullText.length} chars`);
  
  return {
    text: fullText,
    segments,
    duration: result.duration || 0,
  };
}

/**
 * Strip wake word commands from transcript
 */
function stripCommands(text) {
  const commandPatterns = [
    /\b(?:hey\s+)?assistant[,.]?\s*stop\b/gi,
    /\b(?:hey\s+)?assistant[,.]?\s*note\s+(.*?)(?:\.|$)/gi,
    /\b(?:hey\s+)?assistant\b/gi,
  ];

  let cleaned = text;
  for (const pattern of commandPatterns) {
    cleaned = cleaned.replace(pattern, ' ');
  }

  return cleaned.replace(/\s{2,}/g, ' ').trim();
}

module.exports = { transcribe, stripCommands };
