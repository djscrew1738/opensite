import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const serverPath = path.resolve(process.cwd(), 'backend/src/server.js');

function readServer() {
  return fs.readFileSync(serverPath, 'utf8');
}

test('Sentry init and handlers are gated by SENTRY_DSN', () => {
  const source = readServer();
  assert.ok(source.includes('const sentryEnabled'));
  assert.ok(source.includes('if (sentryEnabled)'));
});
