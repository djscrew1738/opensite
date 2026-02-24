import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const pkgPath = path.resolve(process.cwd(), 'backend/package.json');

test('backend package.json includes a test script', () => {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  assert.ok(pkg.scripts && typeof pkg.scripts.test === 'string');
  assert.ok(pkg.scripts.test.length > 0);
});
