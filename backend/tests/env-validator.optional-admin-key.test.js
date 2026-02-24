import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const backendDir = path.resolve(process.cwd(), 'backend');
const cmd = "import('./src/utils/env-validator.js').then(m => m.validateEnvironment())";

function runWithEnv(env) {
  return spawnSync(process.execPath, ['-e', cmd], {
    cwd: backendDir,
    env: { ...process.env, ...env },
    encoding: 'utf8'
  });
}

test('env validation passes without ADMIN_API_KEY when ADMIN_TOKEN is set', () => {
  const result = runWithEnv({
    ENCRYPTION_KEY: 'test_key',
    JWT_SECRET: 'test_secret',
    ADMIN_TOKEN: 'atk_test_token',
    ADMIN_API_KEY: ''
  });

  assert.equal(result.status, 0);
});
