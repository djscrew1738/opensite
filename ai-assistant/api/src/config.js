require('dotenv').config();
const path = require('path');

const config = {
  port: process.env.PORT || 3210,
  apiKey: process.env.API_KEY || 'dev-key-change-me',
  uploadDir: process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads'),
  
  database: {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: process.env.POSTGRES_PORT || 5432,
    database: process.env.POSTGRES_DB || 'aiassistant',
    user: process.env.POSTGRES_USER || 'assistant',
    password: process.env.POSTGRES_PASSWORD || 'changeme',
  },
  
  ollama: {
    url: process.env.OLLAMA_URL || 'http://localhost:11434',
    model: process.env.OLLAMA_MODEL || 'llama3.1:8b',
    embedModel: process.env.OLLAMA_EMBED_MODEL || 'nomic-embed-text',
  },
  
  whisper: {
    url: process.env.WHISPER_URL || 'http://localhost:8100',
  },
};

module.exports = config;
