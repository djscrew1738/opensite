#!/usr/bin/env node
require('dotenv').config();
const { runBuilderRollup } = require('../builders/intelligence');
const logger = require('../utils/logger');

(async () => {
  try {
    const stats = await runBuilderRollup();
    logger.info('Builder rollup complete', stats);
    process.exit(0);
  } catch (err) {
    logger.error(`Builder rollup failed: ${err.message}`);
    process.exit(1);
  }
})();
