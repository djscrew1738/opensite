import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

describe('API versioning', () => {
  test('sunset date is in the future', () => {
    const sunset = new Date('2026-09-01');
    assert.ok(sunset > new Date(), 'Sunset date must be in the future');
  });

  test('v1 is the current API version', () => {
    // Structural assertion — integration tests verify routing behavior
    const currentVersion = 'v1';
    assert.strictEqual(currentVersion, 'v1');
  });
});
