const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const config = require('./config');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// API Key auth
app.use('/api', (req, res, next) => {
  const key = req.headers['x-api-key'] || req.query.api_key;
  if (key !== config.apiKey) {
    return res.status(401).json({ error: 'Invalid API key' });
  }
  next();
});

// Ensure upload directory exists
if (!fs.existsSync(config.uploadDir)) {
  fs.mkdirSync(config.uploadDir, { recursive: true });
}

// Routes
app.use('/api/upload', require('./routes/upload'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/sessions', require('./routes/sessions'));
app.use('/api/projects', require('./routes/projects'));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    name: 'AI Assistant API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Status endpoint
app.get('/status', async (req, res) => {
  const db = require('./db');
  try {
    const { rows: [counts] } = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM sessions) as total_sessions,
        (SELECT COUNT(*) FROM sessions WHERE status = 'complete') as completed_sessions,
        (SELECT COUNT(*) FROM projects) as total_projects,
        (SELECT COUNT(*) FROM chunks) as total_chunks,
        (SELECT COUNT(*) FROM action_items WHERE completed = FALSE) as open_actions
    `);
    res.json({ status: 'ok', ...counts });
  } catch (err) {
    res.json({ status: 'db_error', error: err.message });
  }
});

// Start server
app.listen(config.port, '0.0.0.0', () => {
  console.log(`
  ╔══════════════════════════════════════════╗
  ║   🤖 AI Assistant API v1.0              ║
  ║   Running on port ${config.port}                  ║
  ╚══════════════════════════════════════════╝
  `);
});
