import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const FRONTEND_ROOT = path.resolve(TEST_DIR, '..');
const DOCUMENTS_PAGE = path.resolve(FRONTEND_ROOT, 'src/pages/Documents.jsx');
const SETTINGS_PAGE = path.resolve(FRONTEND_ROOT, 'src/pages/Settings.jsx');
const SETTINGS_HOME = path.resolve(FRONTEND_ROOT, 'src/components/settings/SettingsHome.jsx');

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

test('Documents exposes a compact workspace guide with a primary upload path', () => {
  const source = read(DOCUMENTS_PAGE);

  assert.match(source, /const DOCUMENTS_WORKSPACE_META = \{/);
  assert.match(source, /Upload once, then analyze anywhere/);
  assert.match(source, /const isLibraryEmpty = activeTab === 'library' && documents.length === 0;/);
  assert.match(source, /aria-label="Documents workspace status"/);
  assert.match(source, /Upload document/);
  assert.match(source, /AI Analysis/);
  assert.match(source, /Text Intelligence/);
});

test('Settings derives the top-level status from the highest-priority configuration issue', () => {
  const pageSource = read(SETTINGS_PAGE);
  const homeSource = read(SETTINGS_HOME);

  assert.match(homeSource, /export function getSettingsPriorityStatus/);
  assert.match(homeSource, /const priorityAlert = alerts\[0\]/);
  assert.match(pageSource, /const priorityStatus = getSettingsPriorityStatus\(\{ settings, activeProvider \}\);/);
  assert.match(pageSource, /data-settings-priority-status/);
  assert.match(pageSource, /priorityStatus\.actionLabel/);
  assert.doesNotMatch(pageSource, /<StatusPill connected=\{connected\} loading=\{isLoadingSettings\} \/>/);
});
