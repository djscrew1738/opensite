import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const serverPath = path.resolve(process.cwd(), 'backend/src/server.js');

function readServer() {
  return fs.readFileSync(serverPath, 'utf8');
}

test('Sentry Express integration uses the real app instance', () => {
  const source = readServer();
  assert.ok(!source.includes('new Sentry.Integrations.Express({ app: express() })'));
});

test('server startup calls checkAdminTokenConfig', () => {
  const source = readServer();
  assert.ok(source.includes('checkAdminTokenConfig'));
});
