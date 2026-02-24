// e2e/smoke.spec.js

import { test, expect } from '@playwright/test';

test('homepage has correct title', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await expect(page).toHaveTitle(/OpenSite/);
});
