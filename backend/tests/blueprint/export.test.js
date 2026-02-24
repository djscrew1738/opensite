/**
 * Blueprint Export Tests
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import { BlueprintExportService } from '../../src/services/blueprint-export.js';

describe('BlueprintExportService', () => {
  let exportService;
  const testExportDir = './test-exports';

  beforeAll(() => {
    exportService = new BlueprintExportService();
    exportService.exportDir = testExportDir;
  });

  afterAll(() => {
    // Cleanup test exports
    if (fs.existsSync(testExportDir)) {
      fs.rmSync(testExportDir, { recursive: true });
    }
  });

  const mockAnalysisData = {
    jobId: 'test-job-123',
    fileName: 'test-blueprint.pdf',
    combined: {
      fixtures: { toilets: 2, sinks: 3 },
      pipeRuns: { combined: { estimatedFeet: 150 } },
      materials: [
        { item: '3/4" Copper', category: 'Supply', qty: 100, unit: 'LF', cost: 3.85 },
        { item: 'Toilet', category: 'Fixture', qty: 2, unit: 'EA', cost: 450 }
      ],
      totals: { material: 5000, labor: 3000, total: 8000 },
      confidence: 90,
      sources: ['dimensions', 'vision', 'ai']
    }
  };

  describe('JSON Export', () => {
    it('should export to JSON format', async () => {
      const { filepath, filename } = await exportService.exportToJSON(mockAnalysisData);

      expect(fs.existsSync(filepath)).toBe(true);
      expect(filename).toContain('.json');

      const content = JSON.parse(fs.readFileSync(filepath, 'utf8'));
      expect(content.metadata.jobId).toBe('test-job-123');
      expect(content.fixtures.toilets).toBe(2);
    });
  });

  describe('CSV Export', () => {
    it('should export to CSV format', async () => {
      const { filepath, filename } = await exportService.exportToCSV(mockAnalysisData);

      expect(fs.existsSync(filepath)).toBe(true);
      expect(filename).toContain('.csv');

      const content = fs.readFileSync(filepath, 'utf8');
      expect(content).toContain('Item,Category');
      expect(content).toContain('3/4" Copper');
    });
  });

  describe('Format Selection', () => {
    it('should handle all supported formats', async () => {
      const formats = ['json', 'csv'];
      
      for (const format of formats) {
        const { filename } = await exportService.export(mockAnalysisData, format);
        expect(filename).toContain(`.${format}`);
      }
    });

    it('should throw error for unsupported format', async () => {
      await expect(
        exportService.export(mockAnalysisData, 'unsupported')
      ).rejects.toThrow('Unsupported export format');
    });
  });
});
