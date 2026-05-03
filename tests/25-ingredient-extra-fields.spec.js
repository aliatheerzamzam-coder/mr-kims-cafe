/**
 * Bundle 25 — Ingredient extra fields & box auto-calc
 * - origin / market_name / qty_per_box / num_boxes / market_price /
 *   received_date / supplier_id round-trip
 * - qty_per_box × num_boxes = current_qty
 * - bulk products (no boxes) keep direct current_qty
 * - GET response includes supplier_name from LEFT JOIN
 */

const { test, expect } = require('@playwright/test');
const { adminLogin, apiRequest, getIngredients } = require('./helpers/api');

test.describe('Bundle 25: Ingredient extra fields', () => {
  let adminToken;
  let supplierId;
  const stamp = Date.now();
  const created = [];

  test.beforeAll(async () => {
    adminToken = await adminLogin();
    const sup = await apiRequest('POST', '/api/suppliers', {
      name: `B25 Supplier ${stamp}`,
      phone: '07700000001',
    }, { 'x-auth-token': adminToken });
    supplierId = sup.data.id;
  });

  test.afterAll(async () => {
    for (const id of created) {
      await apiRequest('DELETE', `/api/ingredients/${id}`, null, { 'x-auth-token': adminToken });
    }
    if (supplierId) {
      await apiRequest('DELETE', `/api/suppliers/${supplierId}`, null, { 'x-auth-token': adminToken });
    }
  });

  test('Box product: qty_per_box × num_boxes drives current_qty', async () => {
    const r = await apiRequest('POST', '/api/ingredients', {
      name_ko: `B25-box-${stamp}`,
      name_ar: 'مادة-صندوقية',
      unit: '개',
      qty_per_box: 24,
      num_boxes: 10,
      origin: 'Turkey',
      market_name: 'Local Mart Brand',
      market_price: 5000,
      received_date: '2026-05-01',
      supplier_id: supplierId,
      min_qty: 5,
    }, { 'x-auth-token': adminToken });
    expect(r.status).toBe(200);
    expect(r.data.success).toBe(true);
    created.push(r.data.id);

    const list = await getIngredients(adminToken);
    const row = list.find(i => i.id === r.data.id);
    expect(row.current_qty).toBe(240);
    expect(row.origin).toBe('Turkey');
    expect(row.market_name).toBe('Local Mart Brand');
    expect(Number(row.qty_per_box)).toBe(24);
    expect(Number(row.num_boxes)).toBe(10);
    expect(Number(row.market_price)).toBe(5000);
    expect(row.received_date).toBe('2026-05-01');
    expect(row.supplier_id).toBe(supplierId);
    expect(row.supplier_name).toBe(`B25 Supplier ${stamp}`);
  });

  test('Bulk product: no box info → uses current_qty directly', async () => {
    const r = await apiRequest('POST', '/api/ingredients', {
      name_ko: `B25-bulk-${stamp}`,
      name_ar: 'مادة سائبة',
      unit: 'kg',
      current_qty: 17.5,
      min_qty: 2,
    }, { 'x-auth-token': adminToken });
    expect(r.status).toBe(200);
    created.push(r.data.id);

    const list = await getIngredients(adminToken);
    const row = list.find(i => i.id === r.data.id);
    expect(row.current_qty).toBe(17.5);
    expect(row.qty_per_box).toBeNull();
    expect(row.num_boxes).toBeNull();
  });

  test('PUT: updating box values recomputes current_qty', async () => {
    const id = created[0];
    const r = await apiRequest('PUT', `/api/ingredients/${id}`, {
      name_ko: `B25-box-${stamp}`,
      unit: '개',
      qty_per_box: 12,
      num_boxes: 20,
      min_qty: 5,
      cost_per_unit: 1000,
    }, { 'x-auth-token': adminToken });
    expect(r.status).toBe(200);

    const list = await getIngredients(adminToken);
    const row = list.find(i => i.id === id);
    expect(row.current_qty).toBe(240);
    expect(Number(row.qty_per_box)).toBe(12);
    expect(Number(row.num_boxes)).toBe(20);
  });

  test('PATCH partial update preserves untouched fields', async () => {
    const id = created[1];
    const r = await apiRequest('PATCH', `/api/ingredients/${id}`, {
      origin: 'Korea',
      market_price: 3000,
    }, { 'x-auth-token': adminToken });
    expect(r.status).toBe(200);

    const list = await getIngredients(adminToken);
    const row = list.find(i => i.id === id);
    expect(row.origin).toBe('Korea');
    expect(Number(row.market_price)).toBe(3000);
    expect(row.current_qty).toBe(17.5); // unchanged
  });
});
