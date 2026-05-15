/**
 * 테스트 32: Reorder batch APIs
 *  - PUT /api/admin/menu/categories/reorder
 *  - PUT /api/admin/menu/modifier-groups/reorder
 *  - PUT /api/admin/menu/modifier-groups/:gid/options/reorder
 */

const { test, expect } = require('@playwright/test');
const { apiRequest, adminLogin } = require('./helpers/api');

test.describe('Reorder APIs', () => {
  let adminToken;
  const stamp = Date.now();
  const cats = [];
  const groups = [];
  const opts = [];

  test.beforeAll(async () => {
    adminToken = await adminLogin();
    const h = { 'x-auth-token': adminToken };

    // 3 menu categories
    for (let i = 0; i < 3; i++) {
      const r = await apiRequest('POST', '/api/admin/menu/categories', {
        code: `qa_ro_cat_${i}_${stamp}`, name_en: `RO Cat ${i}`, name_ar: `فئة ${i}`,
        sort_order: 500 + i,
      }, h);
      expect(r.status).toBe(200);
      cats.push(r.data.id);
    }

    // 2 modifier groups
    for (let i = 0; i < 2; i++) {
      const r = await apiRequest('POST', '/api/admin/menu/modifier-groups', {
        code: `qa_ro_grp_${i}_${stamp}`, name_en: `RO Grp ${i}`, name_ar: `مجموعة ${i}`,
        selection: 'single', required: 0, sort_order: 500 + i,
      }, h);
      expect(r.status).toBe(200);
      groups.push(r.data.id);
    }

    // 3 options inside groups[0]
    for (let i = 0; i < 3; i++) {
      const r = await apiRequest('POST', `/api/admin/menu/modifier-groups/${groups[0]}/options`, {
        code: `qa_ro_opt_${i}_${stamp}`, name_en: `RO Opt ${i}`, name_ar: `خيار ${i}`,
        price_delta_iqd: 0, is_default: 0, sort_order: 100 + i,
      }, h);
      expect(r.status).toBe(200);
      opts.push(r.data.id);
    }
  });

  test.afterAll(async () => {
    const h = { 'x-auth-token': adminToken };
    for (const id of opts) await apiRequest('DELETE', `/api/admin/menu/modifier-options/${id}`, null, h);
    for (const id of groups) await apiRequest('DELETE', `/api/admin/menu/modifier-groups/${id}`, null, h);
    for (const id of cats) await apiRequest('DELETE', `/api/admin/menu/categories/${id}`, null, h);
    await apiRequest('POST', '/api/auth/logout', null, h);
  });

  test('menu_categories reorder → sort_order 100/200/300', async () => {
    const h = { 'x-auth-token': adminToken };
    const reversed = [...cats].reverse();
    const r = await apiRequest('PUT', '/api/admin/menu/categories/reorder', { order: reversed }, h);
    expect(r.status).toBe(200);
    expect(r.data.success).toBe(true);

    const list = await apiRequest('GET', '/api/admin/menu/categories', null, h);
    const mine = list.data.filter(c => cats.includes(c.id));
    mine.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    expect(mine.map(c => c.id)).toEqual(reversed);
    // sort_order assigned in 100 steps
    expect(mine[0].sort_order).toBe(100);
    expect(mine[1].sort_order).toBe(200);
    expect(mine[2].sort_order).toBe(300);
  });

  test('menu_categories reorder: invalid id → 400', async () => {
    const h = { 'x-auth-token': adminToken };
    const r = await apiRequest('PUT', '/api/admin/menu/categories/reorder', { order: [9999999, cats[0]] }, h);
    expect(r.status).toBe(400);
    expect(r.data.error).toBe('unknown_ids');
  });

  test('modifier_groups reorder', async () => {
    const h = { 'x-auth-token': adminToken };
    const reversed = [...groups].reverse();
    const r = await apiRequest('PUT', '/api/admin/menu/modifier-groups/reorder', { order: reversed }, h);
    expect(r.status).toBe(200);

    const list = await apiRequest('GET', '/api/admin/menu/modifier-groups', null, h);
    const mine = list.data.filter(g => groups.includes(g.id));
    mine.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    expect(mine.map(g => g.id)).toEqual(reversed);
  });

  test('modifier_options reorder (within a group)', async () => {
    const h = { 'x-auth-token': adminToken };
    const reversed = [...opts].reverse();
    const r = await apiRequest('PUT', `/api/admin/menu/modifier-groups/${groups[0]}/options/reorder`, { order: reversed }, h);
    expect(r.status).toBe(200);

    const g = await apiRequest('GET', `/api/admin/menu/modifier-groups/${groups[0]}`, null, h);
    const ids = g.data.options.map(o => o.id);
    expect(ids).toEqual(reversed);
  });

  test('modifier_options reorder: foreign group id → 400', async () => {
    const h = { 'x-auth-token': adminToken };
    // try sending opts of groups[0] but route them to groups[1]
    const r = await apiRequest('PUT', `/api/admin/menu/modifier-groups/${groups[1]}/options/reorder`, { order: opts }, h);
    expect(r.status).toBe(400);
    expect(r.data.error).toBe('unknown_or_foreign_ids');
  });

  test('modifier_options reorder: bad group id → 404', async () => {
    const h = { 'x-auth-token': adminToken };
    const r = await apiRequest('PUT', `/api/admin/menu/modifier-groups/9999999/options/reorder`, { order: opts }, h);
    expect(r.status).toBe(404);
    expect(r.data.error).toBe('group_not_found');
  });
});
