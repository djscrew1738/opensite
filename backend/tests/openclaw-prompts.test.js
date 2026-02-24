import test from 'node:test';
import assert from 'node:assert/strict';
import { openclawService } from '../src/services/openclaw.js';

test('openclaw getChatPrompt returns a string without throwing', () => {
  const result = openclawService.getChatPrompt('Hello', []);
  assert.equal(typeof result, 'string');
  assert.ok(result.length > 0);
});

test('openclaw getLeadScoringPrompt returns a string without throwing', () => {
  const result = openclawService.getLeadScoringPrompt({ name: 'Test Lead' });
  assert.equal(typeof result, 'string');
  assert.ok(result.length > 0);
});
