/**
 * Fixture utilities for demo/testing
 */

export const DEMO_FIXTURES = [
  {
    id: 'fixture-1',
    type: 'toilet',
    x: 0.25,
    y: 0.3,
    confidence: 92,
    status: 'verified',
    dimensions: '12" x 15"',
    detectedAt: new Date().toISOString(),
    aiModel: 'claude-haiku-20240307',
  },
  {
    id: 'fixture-2',
    type: 'sink',
    x: 0.45,
    y: 0.35,
    confidence: 87,
    status: 'pending',
    dimensions: '22" x 18"',
    detectedAt: new Date().toISOString(),
    aiModel: 'claude-haiku-20240307',
  },
  {
    id: 'fixture-3',
    type: 'shower',
    x: 0.65,
    y: 0.25,
    confidence: 78,
    status: 'pending',
    dimensions: '36" x 48"',
    detectedAt: new Date().toISOString(),
    aiModel: 'claude-haiku-20240307',
  },
  {
    id: 'fixture-4',
    type: 'bathtub',
    x: 0.75,
    y: 0.55,
    confidence: 85,
    status: 'verified',
    dimensions: '60" x 32"',
    detectedAt: new Date().toISOString(),
    aiModel: 'claude-haiku-20240307',
  },
  {
    id: 'fixture-5',
    type: 'sink',
    x: 0.35,
    y: 0.65,
    confidence: 65,
    status: 'rejected',
    dimensions: '18" x 16"',
    detectedAt: new Date().toISOString(),
    aiModel: 'claude-haiku-20240307',
    notes: 'False positive - cabinet detected',
  },
  {
    id: 'fixture-6',
    type: 'drain',
    x: 0.55,
    y: 0.75,
    confidence: 88,
    status: 'pending',
    dimensions: '4" diameter',
    detectedAt: new Date().toISOString(),
    aiModel: 'claude-haiku-20240307',
  },
  {
    id: 'fixture-7',
    type: 'water_heater',
    x: 0.15,
    y: 0.8,
    confidence: 94,
    status: 'verified',
    dimensions: '24" x 24" x 60"',
    detectedAt: new Date().toISOString(),
    aiModel: 'claude-haiku-20240307',
  },
  {
    id: 'fixture-8',
    type: 'hose_bib',
    x: 0.85,
    y: 0.85,
    confidence: 72,
    status: 'pending',
    detectedAt: new Date().toISOString(),
    aiModel: 'claude-haiku-20240307',
  },
];

/**
 * Generate random fixtures for testing
 */
export function generateRandomFixtures(count = 10) {
  const types = ['toilet', 'sink', 'shower', 'bathtub', 'drain', 'water_heater', 'hose_bib'];
  const fixtures = [];
  
  for (let i = 0; i < count; i++) {
    const type = types[Math.floor(Math.random() * types.length)];
    fixtures.push({
      id: `fixture-random-${i}`,
      type,
      x: 0.1 + Math.random() * 0.8,
      y: 0.1 + Math.random() * 0.8,
      confidence: Math.round(50 + Math.random() * 45),
      status: Math.random() > 0.6 ? 'verified' : Math.random() > 0.3 ? 'pending' : 'rejected',
      detectedAt: new Date().toISOString(),
      aiModel: 'claude-haiku-20240307',
    });
  }
  
  return fixtures;
}

/**
 * Generate fixtures from analysis results
 */
export function fixturesFromAnalysis(analysisResult) {
  if (!analysisResult?.fixtures) return [];
  
  const fixtures = [];
  let fixtureIndex = 0;
  
  Object.entries(analysisResult.fixtures).forEach(([type, count]) => {
    const numFixtures = Math.min(count, 20); // Cap at 20 per type
    for (let i = 0; i < numFixtures; i++) {
      // Generate positions in a grid-like pattern
      const col = i % 5;
      const row = Math.floor(i / 5);
      const typeIndex = Object.keys(analysisResult.fixtures).indexOf(type);
      
      fixtures.push({
        id: `fixture-${type}-${i}`,
        type: type.toLowerCase().replace(/\s+/g, '_'),
        x: 0.15 + col * 0.15 + Math.random() * 0.05,
        y: 0.15 + row * 0.12 + typeIndex * 0.1 + Math.random() * 0.05,
        confidence: Math.round(60 + Math.random() * 35),
        status: 'pending',
        detectedAt: new Date().toISOString(),
        aiModel: analysisResult.model || 'unknown',
      });
    }
  });
  
  return fixtures;
}
