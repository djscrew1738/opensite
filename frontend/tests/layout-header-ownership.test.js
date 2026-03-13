import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const FRONTEND_ROOT = path.resolve(TEST_DIR, '..');

const PAGE_HEADER_BAR = path.resolve(FRONTEND_ROOT, 'src/components/layout/PageHeaderBar.jsx');
const JOBS_PAGE = path.resolve(FRONTEND_ROOT, 'src/pages/Jobs.jsx');
const DOCUMENTS_PAGE = path.resolve(FRONTEND_ROOT, 'src/pages/Documents.jsx');
const SETTINGS_PAGE = path.resolve(FRONTEND_ROOT, 'src/pages/Settings.jsx');
const EMPTY_STATE = path.resolve(FRONTEND_ROOT, 'src/components/ui/EmptyState.jsx');
const JOB_PULSE_HOME = path.resolve(FRONTEND_ROOT, 'src/components/dashboard/JobPulseHome.jsx');

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

test('audited shell routes remain registered in shared page metadata', () => {
  const source = read(PAGE_HEADER_BAR);

  assert.match(source, /'\/jobs':\s*\{[\s\S]*title:\s*'Jobs'/);
  assert.match(source, /'\/documents':\s*\{[\s\S]*title:\s*'Documents'/);
  assert.match(source, /'\/settings':\s*\{[\s\S]*title:\s*'Settings'/);
});

test('Jobs, Documents, and Settings do not duplicate route-title h1 blocks in the page body', () => {
  assert.doesNotMatch(read(JOBS_PAGE), /<h1[^>]*>\s*Jobs\s*<\/h1>/);
  assert.doesNotMatch(read(DOCUMENTS_PAGE), /<h1[^>]*>\s*Documents\s*<\/h1>/);
  assert.doesNotMatch(read(SETTINGS_PAGE), /<h1[^>]*>\s*Settings\s*<\/h1>/);
});

test('shared empty states expose an explicit primary action path and dashboard first use consumes it', () => {
  const emptyStateSource = read(EMPTY_STATE);
  const dashboardSource = read(JOB_PULSE_HOME);

  assert.match(emptyStateSource, /aria-label="Empty state actions"/);
  assert.match(emptyStateSource, /data-empty-state-primary-action/);
  assert.match(dashboardSource, /<EmptyState/);
  assert.match(dashboardSource, /label:\s*'Open jobs workspace'/);
});

test('JobPulseHome keeps the existing dashboard structure outside the zero-job empty state', () => {
  const source = read(JOB_PULSE_HOME);

  assert.match(source, /DFW Weather/);
  assert.match(source, /Today&apos;s Focus/);
  assert.match(source, /Job Board/);
  assert.doesNotMatch(source, /Field Environment Monitor/);
  assert.doesNotMatch(source, /Production Board/);
  assert.doesNotMatch(source, /OpenSite Command Platform/);
});
