import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const FRONTEND_ROOT = path.resolve(TEST_DIR, '..');
const LAYOUT = path.resolve(FRONTEND_ROOT, 'src/components/layout/Layout.jsx');
const MOBILE_NAV = path.resolve(FRONTEND_ROOT, 'src/components/layout/MobileNav.jsx');
const UPLOAD_FAB = path.resolve(FRONTEND_ROOT, 'src/components/upload/UploadFAB.jsx');
const QUICK_ADD_FAB = path.resolve(FRONTEND_ROOT, 'src/components/shared/QuickAddFAB.jsx');

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

test('Layout defines one explicit rule-set for hiding mobile shell actions', () => {
  const source = read(LAYOUT);
  assert.match(source, /const shouldHideGlobalMobileActions = isMobile && \(/);
  assert.match(source, /hasRouteLevelMobileTabs/);
  assert.match(source, /showAI/);
  assert.match(source, /showNotifications/);
  assert.match(source, /showCommandPalette/);
  assert.match(source, /showMobileSidebar/);
  assert.match(source, /const mobileActionVisibility = \{/);
  assert.match(source, /hideFloatingActions:\s*shouldHideGlobalMobileActions/);
  assert.match(source, /hideNavigation:\s*isKeyboardOpen\s*\|\|\s*shouldHideGlobalMobileActions/);
});

test('Layout passes one shell-owned visibility source to mobile nav and floating actions', () => {
  const source = read(LAYOUT);
  assert.match(source, /<QuickAddFAB[\s\S]*hidden=\{mobileActionVisibility\.hideFloatingActions\}/);
  assert.match(
    source,
    /<UploadFAB hidden=\{(?:isMobile\s*\|\|\s*mobileActionVisibility\.hideFloatingActions|mobileActionVisibility\.hideFloatingActions\s*\|\|\s*isMobile)\} \/>/
  );
  assert.match(source, /<MobileNav[\s\S]*hidden=\{mobileActionVisibility\.hideNavigation\}/);
});

test('QuickAddFAB and UploadFAB honor shell-provided hidden state', () => {
  assert.match(read(QUICK_ADD_FAB), /hidden = false/);
  assert.match(read(QUICK_ADD_FAB), /if \(hidden\) return null;/);
  assert.match(read(UPLOAD_FAB), /hidden = false/);
  assert.match(read(UPLOAD_FAB), /if \(hidden\) return null;/);
});

test('MobileNav remains shell-controlled through its hidden prop', () => {
  const source = read(MOBILE_NAV);
  assert.match(source, /hidden = false/);
  assert.match(source, /if \(hidden\) return null;/);
});
