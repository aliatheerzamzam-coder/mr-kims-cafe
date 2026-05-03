/**
 * Bundle 26 — Ingredient image upload
 * - POST /api/ingredients/:id/image accepts jpg/png/webp
 * - rejects oversized files (>5MB) and unsupported MIME
 * - image_path set, served from /uploads
 */

const { test, expect, request } = require('@playwright/test');
const { adminLogin, apiRequest } = require('./helpers/api');

const BASE_URL = 'http://localhost:3000';

// 1×1 PNG, 67 bytes
const TINY_PNG = Buffer.from(
  '89504E470D0A1A0A0000000D49484452000000010000000108060000001F15C489' +
  '0000000A49444154789C636000000000020001E221BC330000000049454E44AE426082',
  'hex'
);

test.describe('Bundle 26: Ingredient image upload', () => {
  let adminToken;
  let ingId;

  test.beforeAll(async () => {
    adminToken = await adminLogin();
    const r = await apiRequest('POST', '/api/ingredients', {
      name_ko: `B26-img-${Date.now()}`,
      name_ar: 'صورة',
      unit: '개',
      current_qty: 1,
      min_qty: 1,
    }, { 'x-auth-token': adminToken });
    expect(r.status).toBe(200);
    ingId = r.data.id;
  });

  test.afterAll(async () => {
    if (ingId) {
      await apiRequest('DELETE', `/api/ingredients/${ingId}`, null, { 'x-auth-token': adminToken });
    }
  });

  test('Accepts a small PNG and stores image_path', async ({ playwright }) => {
    const ctx = await playwright.request.newContext({ baseURL: BASE_URL });
    const r = await ctx.post(`/api/ingredients/${ingId}/image`, {
      headers: { 'x-auth-token': adminToken },
      multipart: {
        image: { name: 'tiny.png', mimeType: 'image/png', buffer: TINY_PNG },
      },
    });
    expect(r.status()).toBe(200);
    const body = await r.json();
    expect(body.success).toBe(true);
    expect(body.image_path).toMatch(/^\/uploads\/ingredient-\d+-\d+-[a-f0-9]{8}\.png$/);

    // Served back over /uploads
    const get = await ctx.get(body.image_path);
    expect(get.status()).toBe(200);

    // Stored on the ingredient row
    const list = await apiRequest('GET', '/api/ingredients', null, { 'x-auth-token': adminToken });
    const row = list.data.find(i => i.id === ingId);
    expect(row.image_path).toBe(body.image_path);
    await ctx.dispose();
  });

  test('Rejects unsupported MIME type', async ({ playwright }) => {
    const ctx = await playwright.request.newContext({ baseURL: BASE_URL });
    const r = await ctx.post(`/api/ingredients/${ingId}/image`, {
      headers: { 'x-auth-token': adminToken },
      multipart: {
        image: { name: 'evil.txt', mimeType: 'text/plain', buffer: Buffer.from('not an image') },
      },
    });
    expect(r.status()).toBe(415);
    await ctx.dispose();
  });

  test('Rejects file >5MB', async ({ playwright }) => {
    const ctx = await playwright.request.newContext({ baseURL: BASE_URL });
    const big = Buffer.alloc(5 * 1024 * 1024 + 1024, 0xff);
    const r = await ctx.post(`/api/ingredients/${ingId}/image`, {
      headers: { 'x-auth-token': adminToken },
      multipart: {
        image: { name: 'huge.png', mimeType: 'image/png', buffer: big },
      },
    });
    expect(r.status()).toBe(413);
    await ctx.dispose();
  });

  test('Returns 404 for unknown ingredient id', async ({ playwright }) => {
    const ctx = await playwright.request.newContext({ baseURL: BASE_URL });
    const r = await ctx.post('/api/ingredients/999999999/image', {
      headers: { 'x-auth-token': adminToken },
      multipart: {
        image: { name: 'tiny.png', mimeType: 'image/png', buffer: TINY_PNG },
      },
    });
    expect(r.status()).toBe(404);
    await ctx.dispose();
  });
});
