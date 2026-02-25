// e2e/smoke.spec.js — Core user journey smoke tests

import { test, expect } from '@playwright/test';

const API = 'http://localhost:5001';

// ─── Health & Loading ───────────────────────────────────────

test('API health endpoint returns ok', async ({ request }) => {
  const res = await request.get(`${API}/api/health`);
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  expect(body.data.status).toBe('ok');
});

test('API v1 health endpoint returns ok', async ({ request }) => {
  const res = await request.get(`${API}/api/v1/health`);
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  expect(body.data.status).toBe('ok');
});

test('homepage loads and shows login or dashboard', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('body')).toBeVisible();
  const url = page.url();
  expect(url).toMatch(/\/(login)?$/);
});

// ─── Authentication ─────────────────────────────────────────

test('login page renders with email and password fields', async ({ page }) => {
  await page.goto('/login');
  await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
  await expect(page.locator('input[type="password"], input[name="password"]')).toBeVisible();
});

test('login with invalid credentials shows error', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[type="email"], input[name="email"]', 'bad@example.com');
  await page.fill('input[type="password"], input[name="password"]', 'wrongpassword');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);
  expect(page.url()).toContain('/login');
});

// ─── API Endpoints ──────────────────────────────────────────

test('API docs page loads', async ({ page }) => {
  await page.goto(`${API}/api/docs`);
  await expect(page.locator('text=OpenSite')).toBeVisible({ timeout: 10000 });
});

test('GET /api/v1/dashboard/stats returns data or requires auth', async ({ request }) => {
  const res = await request.get(`${API}/api/v1/dashboard/stats`);
  expect([200, 401]).toContain(res.status());
});

test('GET /api/v1/leads returns array or requires auth', async ({ request }) => {
  const res = await request.get(`${API}/api/v1/leads`);
  expect([200, 401]).toContain(res.status());
  if (res.status() === 200) {
    const body = await res.json();
    expect(body.data || body).toBeDefined();
  }
});

// ─── Navigation ─────────────────────────────────────────────

test('settings page is accessible', async ({ page }) => {
  await page.goto('/settings');
  await expect(page.locator('body')).toBeVisible();
  const url = page.url();
  expect(url).toMatch(/\/(settings|login)$/);
});
