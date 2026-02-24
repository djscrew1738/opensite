// Pipe Routing Estimation Service
// Estimates pipe runs based on fixture locations and DFW plumbing codes

import { DFW_MATERIAL_PRICING } from '../config/constants.js';

// DFU values for common fixtures (DFW/UPC)
const DFU_VALUES = {
  toilet: 1.6,
  sink: 1.0,
  shower: 2.0,
  bathtub: 2.0,
  washing_machine: 2.0,
  kitchen_sink: 1.5,
  hose_bib: 2.5,
  water_heater: 0,
};

// Pipe sizing rules based on DFU load (simplified)
const PIPE_SIZING_RULES = {
  sanitary: [
    { maxDFU: 2, size: '1 1/2"' },
    { maxDFU: 20, size: '2"' },
    { maxDFU: 160, size: '3"' },
    { maxDFU: 500, size: '4"' },
  ],
  potable: [
    { maxDFU: 2, size: '1/2"' },
    { maxDFU: 8, size: '3/4"' },
    { maxDFU: 20, size: '1"' },
    { maxDFU: 50, size: '1 1/4"' },
  ],
};

class RoutingService {
  /**
   * Estimate pipe runs for a set of detected fixtures
   * @param {Array} fixtures - Array of fixture objects { type, x, y }
   * @returns {object} - { pipeRuns, materialEstimates }
   */
  estimatePipeRuns(fixtures) {
    if (!fixtures || fixtures.length < 2) {
      return { pipeRuns: [], materialEstimates: [] };
    }

    // Sort fixtures to create a logical connection path (e.g., left to right, top to bottom)
    const sortedFixtures = [...fixtures].sort((a, b) => a.y - b.y || a.x - b.x);

    const pipeRuns = [];
    const materialEstimates = [];
    let totalDFU = 0;

    // Connect fixtures sequentially
    for (let i = 0; i < sortedFixtures.length - 1; i++) {
      const startFixture = sortedFixtures[i];
      const endFixture = sortedFixtures[i + 1];

      totalDFU += DFU_VALUES[startFixture.type] || 0;
      const pipeSize = this.getPipeSize('sanitary', totalDFU);
      const length = this.estimatePipeLength(startFixture, endFixture);

      pipeRuns.push({
        start_fixture_id: startFixture.id,
        end_fixture_id: endFixture.id,
        system_type: 'sanitary',
        diameter: pipeSize,
        length_ft: length,
        material: 'PVC',
      });
      
      materialEstimates.push({
        item: `${pipeSize} PVC DWV Pipe`,
        quantity: length,
        unit: 'LF',
      });
    }

    return { pipeRuns, materialEstimates };
  }

  /**
   * Estimate length between two fixtures (Manhattan distance)
   */
  estimatePipeLength(fixtureA, fixtureB) {
    // Assuming x,y are normalized coordinates
    // A more sophisticated approach would use a scale factor
    const dx = Math.abs(fixtureA.x - fixtureB.x);
    const dy = Math.abs(fixtureA.y - fixtureB.y);
    const lengthInPixels = dx + dy;
    // Placeholder: assumes 1 pixel = 0.1 ft without a proper scale
    return Math.round(lengthInPixels * 100 * 0.1); 
  }

  /**
   * Determine pipe size based on DFU load
   */
  getPipeSize(systemType, dfu) {
    const rules = PIPE_SIZING_RULES[systemType];
    if (!rules) return 'N/A';

    for (const rule of rules) {
      if (dfu <= rule.maxDFU) {
        return rule.size;
      }
    }
    return rules[rules.length - 1].size; // Return max size if DFU exceeds all rules
  }
}

export const routingService = new RoutingService();
