#!/usr/bin/env node

/**
 * Hex Color Scanner
 * Scans the codebase for hardcoded hex colors and reports findings
 * 
 * Usage: node scripts/scan-hex-colors.js
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const ROOT_DIR = join(__dirname, '..', 'src');
const EXTENSIONS = ['.jsx', '.js', '.tsx', '.ts'];

// Colors to ignore (legitimate functional colors)
const IGNORED_COLORS = [
  // User-selectable drawing/pin colors (functional)
  '#FF6B6B', '#FF9F43', '#Feca57', '#1DD1A1', '#54A0FF', '#5F27CD', '#FF9FF3', '#8395A7', '#2C3E50',
  '#EF4444', '#F97316', '#EAB308', '#22C55E', '#3B82F6', '#8B5CF6', '#607D8B',
  // CSS rgba values that might be detected
  '#000000', '#FFFFFF', '#ffffff',
];

// Patterns to check
const HEX_COLOR_PATTERN = /#[0-9A-Fa-f]{3,8}\b/g;
const RGBA_PATTERN = /rgba?\s*\(\s*\d+/g;

// Files to skip (legitimate exceptions)
const SKIP_FILES = [
  // Canvas rendering files (use 2D API)
  'AnnotationOverlay.jsx', // SVG/DOM manipulation with functional colors
];

/**
 * Recursively find all files in directory
 */
function findFiles(dir, files = []) {
  const items = readdirSync(dir);
  
  for (const item of items) {
    const fullPath = join(dir, item);
    const stat = statSync(fullPath);
    
    if (stat.isDirectory()) {
      findFiles(fullPath, files);
    } else if (EXTENSIONS.includes(extname(item))) {
      files.push(fullPath);
    }
  }
  
  return files;
}

/**
 * Check if a file should be skipped
 */
function shouldSkipFile(filePath) {
  const fileName = filePath.split('/').pop();
  return SKIP_FILES.some(skip => fileName.includes(skip));
}

/**
 * Extract hex colors from content
 */
function extractHexColors(content) {
  const matches = content.match(HEX_COLOR_PATTERN) || [];
  return matches.filter(color => {
    const normalized = color.toUpperCase();
    return !IGNORED_COLORS.includes(normalized) && 
           !IGNORED_COLORS.includes(normalized.slice(0, 4)) && // Handle 3-char hex
           !normalized.startsWith('#00') && // Field mode exception
           color.length >= 4; // Skip things like #0, #1
  });
}

/**
 * Extract rgba values from content
 */
function extractRgba(content) {
  const matches = content.match(RGBA_PATTERN) || [];
  return matches;
}

/**
 * Scan a single file
 */
function scanFile(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const hexColors = extractHexColors(content);
  const rgbaValues = extractRgba(content);
  
  // Check if file imports tokens
  const hasTokenImport = content.includes('from') && 
    (content.includes('tokens') || content.includes('styles'));
  
  return {
    path: filePath.replace(ROOT_DIR, 'src'),
    hexColors,
    rgbaValues,
    hasTokenImport,
    lineCount: content.split('\n').length,
  };
}

/**
 * Main scan function
 */
function main() {
  console.log('🔍 Scanning for hardcoded colors...\n');
  
  const files = findFiles(ROOT_DIR);
  const results = [];
  
  for (const file of files) {
    if (shouldSkipFile(file)) continue;
    
    const result = scanFile(file);
    if (result.hexColors.length > 0 || result.rgbaValues.length > 0) {
      results.push(result);
    }
  }
  
  // Summary
  console.log(`📊 Scanned ${files.length} files`);
  console.log(`⚠️  Found ${results.length} files with potential issues\n`);
  
  // Group by directory
  const byDirectory = results.reduce((acc, result) => {
    const dir = result.path.split('/').slice(0, -1).join('/') || 'root';
    if (!acc[dir]) acc[dir] = [];
    acc[dir].push(result);
    return acc;
  }, {});
  
  // Print results
  for (const [dir, files] of Object.entries(byDirectory)) {
    console.log(`\n📁 ${dir}/`);
    console.log('─'.repeat(60));
    
    for (const file of files) {
      const hexStr = file.hexColors.length > 0 
        ? `Hex: ${file.hexColors.slice(0, 3).join(', ')}${file.hexColors.length > 3 ? '...' : ''}`
        : '';
      const rgbaStr = file.rgbaValues.length > 0 
        ? `RGBA: ${file.rgbaValues.length} instances`
        : '';
      
      console.log(`  ${file.path.split('/').pop()}`);
      if (hexStr) console.log(`    ${hexStr}`);
      if (rgbaStr) console.log(`    ${rgbaStr}`);
      if (file.hasTokenImport) console.log(`    ✅ Has token import`);
    }
  }
  
  // Statistics
  const totalHexColors = results.reduce((sum, r) => sum + r.hexColors.length, 0);
  const totalRgba = results.reduce((sum, r) => sum + r.rgbaValues.length, 0);
  const withTokenImport = results.filter(r => r.hasTokenImport).length;
  
  console.log('\n' + '═'.repeat(60));
  console.log('📈 Summary:');
  console.log(`   Total hex colors found: ${totalHexColors}`);
  console.log(`   Total rgba() instances: ${totalRgba}`);
  console.log(`   Files with token import: ${withTokenImport}/${results.length}`);
  console.log('\n💡 Tip: Files with token imports may still have functional colors');
  console.log('   (user-selectable colors) that are intentionally hardcoded.');
}

main();
