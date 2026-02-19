#!/usr/bin/env node
require('dotenv').config();
const { scoreAllUnscored } = require('../scoring/ollama');
const logger = require('../utils/logger');

(async () => {
  try {
    const stats = await scoreAllUnscored();
    logger.info(`Scoring job complete: ${stats.totalScored} scored, ${stats.totalHot} hot`);
    process.exit(0);
  } catch (err) {
    logger.error(`Scoring job failed: ${err.message}`);
    process.exit(1);
  }
})();
