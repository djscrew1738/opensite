import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const FRONTEND_ROOT = path.resolve(TEST_DIR, '..');
const JOBS_PAGE = path.resolve(FRONTEND_ROOT, 'src/pages/Jobs.jsx');
const OVERVIEW_DASHBOARD = path.resolve(FRONTEND_ROOT, 'src/components/jobs/OverviewDashboard.jsx');
const TAB_SYSTEM = path.resolve(FRONTEND_ROOT, 'src/components/tabs/TabSystem.jsx');

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

test('Jobs keeps only the core workflows in the primary tab set', () => {
  const source = read(JOBS_PAGE);

  assert.match(source, /const JOB_PRIMARY_TABS = \[/);
  assert.match(source, /id: 'projects', label: 'Projects'/);
  assert.match(source, /id: 'blueprints', label: 'Blueprints'/);
  assert.match(source, /id: 'estimating', label: 'Estimating'/);
  assert.match(source, /id: 'leads', label: 'Leads'/);
  assert.match(source, /tabs=\{JOB_PRIMARY_TABS\}/);
  assert.doesNotMatch(source, /<Tab id="plumbing"/);
  assert.doesNotMatch(source, /<Tab id="analysis-jobs"/);
});

test('Jobs demotes lower-frequency tools behind a secondary utilities entry', () => {
  const source = read(JOBS_PAGE);

  assert.match(source, /const JOB_UTILITY_TOOLS = \[/);
  assert.match(source, /title: 'More tools'/);
  assert.match(source, /label: '4D View'/);
  assert.match(source, /label: 'Analysis Jobs'/);
  assert.match(source, /const LEGACY_JOB_TAB_REDIRECTS = \{/);
  assert.match(source, /'plumbing': 'projects'/);
  assert.match(source, /'analysis-jobs': 'projects'/);
});

test('Desktop Jobs tabs stay synced with page state and utility-driven navigation', () => {
  const jobsSource = read(JOBS_PAGE);
  const tabSystemSource = read(TAB_SYSTEM);

  assert.match(jobsSource, /<TabSystem[\s\S]*activeTab=\{activeTab\}/);
  assert.match(jobsSource, /<TabSystem[\s\S]*onTabChange=\{setActiveTab\}/);
  assert.match(tabSystemSource, /activeTab: controlledActiveTab/);
  assert.match(tabSystemSource, /activeTab=\{controlledActiveTab \?\? activeTab\}/);
});

test('Projects first-use state makes create, upload, and manage the next steps explicit', () => {
  const source = read(OVERVIEW_DASHBOARD);

  assert.match(source, /import \{ AccessibleCard, EmptyState \} from '\.\.\/ui';/);
  assert.match(source, /title="Create your first job"/);
  assert.match(source, /label: 'Create job'/);
  assert.match(source, /label: 'Upload blueprint'/);
  assert.match(source, /Manage jobs, attach plans, and move straight into estimating\./);
  assert.match(source, /utilityPanelTitle = 'More tools'/);
  assert.match(source, /title=\{utilityPanelTitle\}/);
  assert.match(source, /\{utilityPanelTitle\}/);
});

test('Inline project file previews refresh after uploads complete', () => {
  const source = read(OVERVIEW_DASHBOARD);

  assert.match(source, /const queryClient = useQueryClient\(\);/);
  assert.match(source, /await queryClient.invalidateQueries\(\{ queryKey: \['job-files', jobId\] \}\);/);
});

test('Blueprint analysis exits cleanly when upload returns no analyzable file', () => {
  const source = read(JOBS_PAGE);

  assert.match(source, /if \(!uploadResult\?\.files\?\.\[0\]\) \{/);
  assert.match(source, /setAnalysisState\(ANALYSIS_STAGES\.ERROR\);/);
  assert.match(source, /setUploadProgress\(\{ stage: 'Upload', percent: 0 \}\);/);
  assert.match(source, /showToast\('Upload completed without a file to analyze', 'error'\);/);
});
