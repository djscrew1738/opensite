import { FortWorthAdapter } from './fortworth.js';
// Template adapters for future implementation
// import { TarrantCountyAdapter } from './tarrant.js';
// import { ArlingtonAdapter } from './arlington.js';

/**
 * Adapter Registry
 *
 * Maps data source names (from data_sources.name) to their adapter classes.
 * Adding a new city is: 1) write the adapter, 2) register it here, 3) add a row to data_sources.
 */
const ADAPTERS = {
  fort_worth: FortWorthAdapter,
  // tarrant_county: TarrantCountyAdapter,  // TODO: Implement
  // arlington: ArlingtonAdapter,           // TODO: Implement
};

/**
 * Create an adapter instance for a given data source
 */
export function createAdapter(source, logger) {
  const AdapterClass = ADAPTERS[source.name];

  if (!AdapterClass) {
    logger.warn(`No adapter registered for source: ${source.name}`);
    return null;
  }

  return new AdapterClass(source, logger);
}

/**
 * Get list of all registered adapter names
 */
export function getRegisteredAdapters() {
  return Object.keys(ADAPTERS);
}
