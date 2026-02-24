const db = require('../db');
const { transcribe, stripCommands } = require('./transcription');
const { summarize, formatSummary } = require('./summarizer');
const { embedSession, embedSummary } = require('./embeddings');

/**
 * Process a recording session end-to-end
 */
async function processSession(sessionId) {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`[Pipeline] Processing session ${sessionId}`);
  console.log(`${'='.repeat(50)}\n`);

  try {
    // Get session
    const { rows: [session] } = await db.query(
      'SELECT * FROM sessions WHERE id = $1', [sessionId]
    );
    if (!session) throw new Error('Session not found');

    // Step 1: Transcribe
    await updateStatus(sessionId, 'transcribing');
    const { text: rawTranscript, duration } = await transcribe(session.audio_path);
    const transcript = stripCommands(rawTranscript);
    
    await db.query(
      'UPDATE sessions SET transcript = $1, duration_secs = $2 WHERE id = $3',
      [transcript, Math.round(duration), sessionId]
    );

    // Step 2: Summarize
    await updateStatus(sessionId, 'summarizing');
    const summaryJson = await summarize(transcript);
    const summaryText = formatSummary(summaryJson, session);

    // Step 3: Save summary
    await db.query(
      `UPDATE sessions SET 
        summary = $1, summary_json = $2, 
        title = COALESCE($3, title),
        processed_at = NOW()
       WHERE id = $4`,
      [summaryText, JSON.stringify(summaryJson), summaryJson.title, sessionId]
    );

    // Step 4: Save action items
    if (summaryJson.action_items?.length) {
      for (const item of summaryJson.action_items) {
        await db.query(
          `INSERT INTO action_items (session_id, project_id, description, priority)
           VALUES ($1, $2, $3, $4)`,
          [sessionId, session.project_id, item.description, item.priority || 'normal']
        );
      }
    }

    // Step 5: Embed for RAG
    await embedSession(sessionId, session.project_id, transcript);
    await embedSummary(sessionId, session.project_id, summaryText);

    // Done
    await updateStatus(sessionId, 'complete');
    console.log(`\n[Pipeline] ✅ Session ${sessionId} complete!\n`);

    return { sessionId, summary: summaryJson };

  } catch (err) {
    console.error(`[Pipeline] ❌ Error:`, err);
    await db.query(
      `UPDATE sessions SET status = 'error', error_message = $1 WHERE id = $2`,
      [err.message, sessionId]
    );
    throw err;
  }
}

async function updateStatus(sessionId, status) {
  await db.query('UPDATE sessions SET status = $1 WHERE id = $2', [status, sessionId]);
  console.log(`[Pipeline] Status → ${status}`);
}

module.exports = { processSession };
