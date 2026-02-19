require('dotenv').config();

module.exports = {
  db: {
    connectionString: process.env.DATABASE_URL,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'opensite',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
  },

  socrata: {
    appToken: process.env.SOCRATA_APP_TOKEN || null,
  },

  ollama: {
    baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    model: process.env.OLLAMA_MODEL || 'llama3.1:8b',
  },

  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    fromNumber: process.env.TWILIO_FROM_NUMBER,
  },

  email: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },

  notify: {
    phone: process.env.NOTIFY_PHONE_NUMBER,
    email: process.env.NOTIFY_EMAIL,
  },

  schedule: {
    ingest: process.env.INGEST_CRON || '0 6 * * *',
    scoring: process.env.SCORING_CRON || '0 7 * * *',
    digest: process.env.DIGEST_CRON || '0 8 * * *',
    rollup: process.env.ROLLUP_CRON || '0 2 * * 0',
  },

  scoring: {
    hotThreshold: parseInt(process.env.HOT_SCORE_THRESHOLD || '80'),
    warmThreshold: parseInt(process.env.WARM_SCORE_THRESHOLD || '50'),
    minProjectCost: parseInt(process.env.MIN_PROJECT_COST || '50000'),
  },

  serviceArea: {
    centerLat: parseFloat(process.env.SERVICE_CENTER_LAT || '32.7555'),
    centerLng: parseFloat(process.env.SERVICE_CENTER_LNG || '-97.3308'),
    radiusMiles: parseFloat(process.env.SERVICE_RADIUS_MILES || '25'),
  },

  api: {
    port: parseInt(process.env.API_PORT || '3100'),
  },

  logLevel: process.env.LOG_LEVEL || 'info',
};
