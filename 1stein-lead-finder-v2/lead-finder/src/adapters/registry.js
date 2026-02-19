const FortWorthAdapter = require('./fortworth');
const TarrantCountyAdapter = require('./tarrant');
const ArlingtonAdapter = require('./arlington');
const logger = require('../utils/logger');

/**
 * Adapter Registry
 *
 * Maps data source names (from data_sources.name) to their adapter classes.
 * Adding a new city is: 1) write the adapter, 2) register it here, 3) add a row to data_sources.
 */
const ADAPTERS = {
  fort_worth: FortWorthAdapter,
  tarrant_county: TarrantCountyAdapter,
  arlington: ArlingtonAdapter,
};

/**
 * Create an adapter instance for a given data source
 */
function createAdapter(source) {
  const AdapterClass = ADAPTERS[source.name];

  if (!AdapterClass) {
    logger.warn(`No adapter registered for source: ${source.name}`);
    return null;
  }

  return new AdapterClass(source);
}

/**
 * Get list of all registered adapter names
 */
function getRegisteredAdapters() {
  return Object.keys(ADAPTERS);
}

module.exports = { createAdapter, getRegisteredAdapters };
