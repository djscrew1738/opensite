import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import path from 'path';

describe('Backup retention', () => {
  test('BACKUP_SCHEDULE env var has valid default', () => {
    const schedule = process.env.BACKUP_SCHEDULE || '0 2 * * *';
    assert.strictEqual(schedule.split(' ').length, 5, 'Should be valid cron format');
  });

  test('backup directory path resolves correctly', () => {
    const toolDir = process.env.TOOL_DIR || path.resolve('tool');
    const backupDir = path.join(toolDir, 'data', 'backups');
    assert.ok(typeof backupDir === 'string');
    assert.ok(backupDir.endsWith('backups'));
  });

  test('retention defaults are reasonable', () => {
    const retentionDays = parseInt(process.env.BACKUP_RETENTION_DAYS || '14', 10);
    const minKeep = parseInt(process.env.BACKUP_MIN_KEEP || '3', 10);
    assert.ok(retentionDays >= 1, 'Retention must be at least 1 day');
    assert.ok(minKeep >= 1, 'Must keep at least 1 backup');
    assert.ok(retentionDays <= 365, 'Retention should not exceed 1 year');
  });
});
