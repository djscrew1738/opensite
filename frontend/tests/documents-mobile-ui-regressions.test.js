import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const FRONTEND_ROOT = path.resolve(TEST_DIR, '..');
const DOCS_PAGE = path.resolve(FRONTEND_ROOT, 'src/pages/Documents.jsx');
const DOCS_LIBRARY = path.resolve(FRONTEND_ROOT, 'src/components/documents/DocumentsLibrary.jsx');
const TEXT_INTELLIGENCE = path.resolve(FRONTEND_ROOT, 'src/components/documents/tabs/TextIntelligence.jsx');
const UPLOAD_MODAL = path.resolve(FRONTEND_ROOT, 'src/components/upload/UploadModal.jsx');
const SWIPE_HOOK = path.resolve(FRONTEND_ROOT, 'src/hooks/useSwipe.js');

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

test('Documents mobile container avoids hardcoded pb-16 and supports safe-area bottom padding', () => {
  const source = read(DOCS_PAGE);
  assert.doesNotMatch(source, /\bisMobile\s*\?\s*'pb-16'\s*:\s*''/);
  assert.match(source, /safe-area-inset-bottom/);
});

test('Documents page does not stack an extra page-transition-wrapper at root', () => {
  const source = read(DOCS_PAGE);
  assert.doesNotMatch(source, /h-full\s+flex\s+flex-col\s+page-transition-wrapper/);
});

test('Documents library list does not use fixed viewport calc height', () => {
  const source = read(DOCS_LIBRARY);
  assert.doesNotMatch(source, /h-\[calc\(100vh-260px\)\]/);
});

test('Documents library uses touch momentum scrolling and dynamic virtualization threshold', () => {
  const source = read(DOCS_LIBRARY);
  assert.match(source, /\[-webkit-overflow-scrolling:touch\]/);
  assert.match(source, /virtualizeThreshold\s*=\s*isMobile\s*\?\s*120\s*:\s*80/);
});

test('Text Intelligence has a dedicated mobile branch instead of fixed desktop split only', () => {
  const source = read(TEXT_INTELLIGENCE);
  assert.match(source, /if\s*\(isMobile\)/);
});

test('Upload modal keeps AnimatePresence-based exit animation and no early null return', () => {
  const source = read(UPLOAD_MODAL);
  assert.match(source, /<AnimatePresence/);
  assert.doesNotMatch(source, /if\s*\(!isOpen\)\s*return\s+null/);
});

test('Swipe hook does not force preventDefault unless explicitly enabled', () => {
  const source = read(SWIPE_HOOK);
  assert.match(source, /preventScrollOnSwipe\s*=\s*false/);
  assert.match(source, /if\s*\(!preventScrollOnSwipe\s*\|\|\s*!touchStart\.current\)\s*return/);
});
