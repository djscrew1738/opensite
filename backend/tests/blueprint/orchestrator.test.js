/**
 * Blueprint Orchestrator Tests
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { BlueprintOrchestrator, JOB_STATUS } from '../../src/services/blueprint-orchestrator.js';

describe('BlueprintOrchestrator', () => {
  let orchestrator;

  beforeEach(() => {
    orchestrator = new BlueprintOrchestrator();
  });

  describe('Job Submission', () => {
    it('should create a job with unique ID', async () => {
      const jobId = await orchestrator.submitAnalysis({
        filePath: '/test/blueprint.pdf',
        services: ['dimensions', 'ai']
      });

      expect(jobId).toBeDefined();
      expect(typeof jobId).toBe('string');
      expect(jobId).toContain('blueprint-');
    });

    it('should initialize job with correct status', async () => {
      const jobId = await orchestrator.submitAnalysis({
        filePath: '/test/blueprint.pdf',
        services: ['dimensions']
      });

      const job = orchestrator.getJob(jobId);
      expect(job.status).toBe(JOB_STATUS.PENDING);
      expect(job.progress).toBe(0);
      expect(job.services).toContain('dimensions');
    });
  });

  describe('Result Combination', () => {
    it('should combine fixture counts from multiple sources', () => {
      const results = {
        text: {
          extractedInfo: { toilets: 2, sinks: 3 }
        },
        dimensions: {
          fixtures: { toilets: 3, sinks: 2 }
        },
        vision: {
          fixtures: { toilets: 3, sinks: 3, showers: 2 }
        },
        ai: null
      };

      const combined = orchestrator.combineResults(results);

      expect(combined.fixtures.toilets).toBe(3); // max
      expect(combined.fixtures.sinks).toBe(3); // max
      expect(combined.fixtures.showers).toBe(2);
    });

    it('should calculate confidence based on sources', () => {
      const results = {
        text: {},
        dimensions: {},
        vision: {},
        ai: {}
      };

      const combined = orchestrator.combineResults(results);

      expect(combined.confidence).toBeGreaterThan(0);
      expect(combined.sources).toHaveLength(3);
    });
  });

  describe('Job Updates', () => {
    it('should update job progress', async () => {
      const jobId = await orchestrator.submitAnalysis({
        filePath: '/test/blueprint.pdf'
      });

      orchestrator.updateJob(jobId, { progress: 50 });

      const job = orchestrator.getJob(jobId);
      expect(job.progress).toBe(50);
    });

    it('should notify subscribers on update', async () => {
      const callback = jest.fn();
      const jobId = await orchestrator.submitAnalysis({
        filePath: '/test/blueprint.pdf'
      });

      orchestrator.subscribe(jobId, callback);
      orchestrator.updateJob(jobId, { progress: 25 });

      expect(callback).toHaveBeenCalled();
    });
  });
});
