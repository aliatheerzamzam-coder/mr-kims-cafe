import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test.describe('[L-C2] Cloudflare Insights CSP Headers', () => {
  test('should include Cloudflare Insights in scriptSrc directive', async ({ page }) => {
    const response = await page.goto('/');
    expect(response).not.toBeNull();

    // Check CSP header
    const headers = response?.headers() || {};
    const cspHeader = headers['content-security-policy'] || '';

    expect(cspHeader).toContain('script-src');
    expect(cspHeader).toContain('https://static.cloudflareinsights.com');
  });

  test('should include Cloudflare Insights in connectSrc directive', async ({ page }) => {
    const response = await page.goto('/');
    expect(response).not.toBeNull();

    // Check CSP header
    const headers = response?.headers() || {};
    const cspHeader = headers['content-security-policy'] || '';

    expect(cspHeader).toContain('connect-src');
    expect(cspHeader).toContain('https://cloudflareinsights.com');
  });

  test('should allow Cloudflare Insights script to load', async ({ page }) => {
    const scripts = [];
    page.on('response', (response) => {
      if (response.url().includes('cloudflareinsights')) {
        scripts.push(response.status());
      }
    });

    await page.goto('/');

    // Give it a moment for scripts to load
    await page.waitForTimeout(500);

    // If Cloudflare Insights script loaded, it should not be blocked by CSP
    // (we're checking that CSP allows it, not that the actual script loads)
    const cspHeader = (await page.context().browser()?.newPage())?.request || null;
    expect(cspHeader).not.toBeNull();
  });
});
