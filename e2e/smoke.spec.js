// e2e/smoke.spec.js

import { test, expect } from '@playwright/test';

test('homepage has correct title', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await expect(page).toHaveTitle(/OpenSite/);
});

test('analysis jobs dashboard loads', async ({ page }) => {
  await page.goto('http://localhost:3000/jobs?tab=analysis-jobs');
  await expect(page.locator('h2:has-text("Analysis Jobs")')).toBeVisible();
});

test('API docs page loads', async ({ page }) => {
  await page.goto('http://localhost:5001/api/docs');
  await expect(page.locator('h2:has-text("OpenSite API")')).toBeVisible();
});
