import test from 'node:test';
import assert from 'node:assert/strict';
import { cache } from '../src/services/cache.js';

test('cache.delPattern removes matching entries from api cache', () => {
  cache.flush();
  cache.setApi('leads:1', { ok: true });
  cache.set('leads:1', { ok: true });

  cache.delPattern('leads:');

  assert.equal(cache.getApi('leads:1'), undefined);
  assert.equal(cache.get('leads:1'), undefined);
});
