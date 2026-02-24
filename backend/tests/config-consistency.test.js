import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const uploadPath = path.resolve(process.cwd(), 'backend/src/routes/upload.js');
const securityPath = path.resolve(process.cwd(), 'backend/src/middleware/security.js');

function read(p) {
  return fs.readFileSync(p, 'utf8');
}

test('upload file size limit is 100MB to match docs', () => {
  const source = read(uploadPath);
  assert.ok(source.includes('limits: { fileSize: 100 * 1024 * 1024 }'));
});

test('default CORS origin matches documented frontend dev port 3000', () => {
  const source = read(securityPath);
  assert.ok(source.includes("'http://localhost:3000'"));
});
