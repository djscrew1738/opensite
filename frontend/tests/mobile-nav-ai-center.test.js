import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const FRONTEND_ROOT = path.resolve(TEST_DIR, '..');
const MOBILE_NAV_PATH = path.resolve(FRONTEND_ROOT, 'src/components/layout/MobileNav.jsx');

function source() {
  return fs.readFileSync(MOBILE_NAV_PATH, 'utf8');
}

test('mobile nav keeps AI assistant centered', () => {
  const s = source();
  assert.match(s, /grid-cols-\[1fr_1fr_auto_1fr_1fr\]/);
  assert.match(s, /col-start-3/);
  assert.match(s, /Open AI assistant/);
});

test('mobile nav removes Alerts and Menu entries', () => {
  const s = source();
  assert.doesNotMatch(s, /\bAlerts\b/);
  assert.doesNotMatch(s, /\bMenu\b/);
  assert.doesNotMatch(s, /onNotificationsOpen/);
});
