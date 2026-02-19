#!/usr/bin/env node
require('dotenv').config();
const { sendDailyDigest } = require('../notifications/email');
const logger = require('../utils/logger');

(async () => {
  try {
    await sendDailyDigest();
    logger.info('Daily digest sent');
    process.exit(0);
  } catch (err) {
    logger.error(`Daily digest failed: ${err.message}`);
    process.exit(1);
  }
})();
