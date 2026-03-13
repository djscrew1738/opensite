import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const FRONTEND_ROOT = path.resolve(TEST_DIR, '..');
const MOBILE_TABBAR = path.resolve(FRONTEND_ROOT, 'src/components/tabs/MobileTabBar.jsx');
const LAYOUT = path.resolve(FRONTEND_ROOT, 'src/components/layout/Layout.jsx');
const DOCS_PAGE = path.resolve(FRONTEND_ROOT, 'src/pages/Documents.jsx');
const JOBS_PAGE = path.resolve(FRONTEND_ROOT, 'src/pages/Jobs.jsx');
const HISTORY_PAGE = path.resolve(FRONTEND_ROOT, 'src/pages/History.jsx');
const LEADS_PAGE = path.resolve(FRONTEND_ROOT, 'src/pages/LeadFinder.jsx');
const INDEX_CSS = path.resolve(FRONTEND_ROOT, 'src/index.css');

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

test('MobileTabBar supports centered AI action with global fallback event', () => {
  const source = read(MOBILE_TABBAR);
  assert.match(source, /showCenterAction\s*=\s*false/);
  assert.match(source, /window\.dispatchEvent\(new CustomEvent\('app-open-ai'\)\)/);
  assert.match(source, /CenterActionButton/);
});

test('route-level mobile tab bars enable centered AI action across key pages', () => {
  assert.match(read(DOCS_PAGE), /showCenterAction/);
  assert.match(read(JOBS_PAGE), /showCenterAction/);
  assert.match(read(HISTORY_PAGE), /showCenterAction/);
  assert.match(read(LEADS_PAGE), /showCenterAction/);
});

test('Layout listens for global AI open event from route-level tab bars', () => {
  const source = read(LAYOUT);
  assert.match(source, /window\.addEventListener\('app-open-ai', handleOpenAI\)/);
});

test('mobile CSS disables smooth-scroll jank in scroll containers and mobile viewport', () => {
  const source = read(INDEX_CSS);
  assert.match(source, /scroll-behavior:\s*auto;/);
  assert.match(source, /@media\s*\(max-width:\s*767px\)/);
  assert.match(source, /pageEnterMobile/);
});
