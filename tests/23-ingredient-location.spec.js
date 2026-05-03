/**
 * Bundle: Ingredient storage locations
 * - GET /api/ingredients exposes `locations` array
 * - POST /api/ingredients/:id/locations validates `^[1-9][A-E][1-9]$`
 * - Multiple locations sum into ingredients.current_qty
 * - PATCH/DELETE on /api/ingredient-locations/:id recalculates current_qty
 * - inventory/adjust honors `location_code`; missing → UNSET fallback
 */

const { test, expect } = require('@playwright/test');
const {
  apiRequest,
  adminLogin,
  cashierLogin,
  getIngredients,
  getIngredientQty,
} = require('./helpers/api');

const sumLocs = (locs) => (locs || []).reduce((s, l) => s + Number(l.qty || 0), 0);

test.describe('Bundle: Ingredient Locations', () => {
  let adminToken;
  let cashierToken;
  let testIngredientId;
  const adminHdr = () => ({ 'x-auth-token': adminToken });

  test.beforeAll(async () => {
    adminToken = await adminLogin();
    cashierToken = await cashierLogin();

    // Create a dedicated ingredient so the test does not perturb shared seeds.
    const create = await apiRequest(
      'POST',
      '/api/ingredients',
      {
        name_ko: `LOC_TEST_${Date.now()}`,
        name_ar: 'اختبار الموقع',
        unit: '병',
        current_qty: 0,
        min_qty: 1,
        cost_per_unit: 0,
        category: '기타',
      },
      { 'x-auth-token': adminToken }
    );
    expect([200, 201]).toContain(create.status);
    testIngredientId = create.data.id;
    expect(testIngredientId).toBeTruthy();
  });

  test.afterAll(async () => {
    if (testIngredientId) {
      await apiRequest('DELETE', `/api/ingredients/${testIngredientId}`, null, { 'x-auth-token': adminToken });
    }
  });

  test('GET /api/ingredients includes `locations` array per row', async () => {
    const list = await getIngredients(adminToken);
    expect(Array.isArray(list)).toBeTruthy();
    expect(list.length).toBeGreaterThan(0);
    for (const ing of list) {
      expect(ing).toHaveProperty('locations');
      expect(Array.isArray(ing.locations)).toBeTruthy();
      for (const l of ing.locations) {
        expect(l).toHaveProperty('id');
        expect(l).toHaveProperty('location_code');
        expect(l).toHaveProperty('qty');
      }
    }
  });

  test('POST /api/ingredients/:id/locations rejects invalid code (9F9)', async () => {
    const r = await apiRequest(
      'POST',
      `/api/ingredients/${testIngredientId}/locations`,
      { location_code: '9F9', qty: 1 },
      adminHdr()
    );
    expect(r.status).toBe(400);
  });

  test('POST /api/ingredients/:id/locations rejects negative qty', async () => {
    const r = await apiRequest(
      'POST',
      `/api/ingredients/${testIngredientId}/locations`,
      { location_code: '2A2', qty: -1 },
      adminHdr()
    );
    expect(r.status).toBe(400);
  });

  test('Adding two locations → current_qty equals sum of qtys', async () => {
    const r1 = await apiRequest(
      'POST',
      `/api/ingredients/${testIngredientId}/locations`,
      { location_code: '2A2', qty: 3 },
      adminHdr()
    );
    expect(r1.status).toBe(200);
    expect(r1.data.location.location_code).toBe('2A2');
    expect(Number(r1.data.location.qty)).toBe(3);

    const r2 = await apiRequest(
      'POST',
      `/api/ingredients/${testIngredientId}/locations`,
      { location_code: '5B1', qty: 5 },
      adminHdr()
    );
    expect(r2.status).toBe(200);

    const list = await getIngredients(adminToken);
    const ing = list.find((i) => i.id === testIngredientId);
    expect(ing).toBeTruthy();
    const codes = ing.locations.map((l) => l.location_code).sort();
    expect(codes).toEqual(['2A2', '5B1']);
    expect(sumLocs(ing.locations)).toBe(8);
    expect(Number(ing.current_qty)).toBe(8);
  });

  test('POST same code twice → upsert (overwrite qty)', async () => {
    const r = await apiRequest(
      'POST',
      `/api/ingredients/${testIngredientId}/locations`,
      { location_code: '2A2', qty: 10 },
      adminHdr()
    );
    expect(r.status).toBe(200);
    expect(Number(r.data.location.qty)).toBe(10);
    // 10 + 5 = 15
    expect(Number(r.data.current_qty)).toBe(15);
  });

  test('PATCH /api/ingredient-locations/:id updates qty + recalculates current_qty', async () => {
    const list = await getIngredients(adminToken);
    const ing = list.find((i) => i.id === testIngredientId);
    const target = ing.locations.find((l) => l.location_code === '5B1');
    expect(target).toBeTruthy();

    const r = await apiRequest(
      'PATCH',
      `/api/ingredient-locations/${target.id}`,
      { qty: 2 },
      adminHdr()
    );
    expect(r.status).toBe(200);
    expect(Number(r.data.current_qty)).toBe(12); // 10 + 2

    const after = await getIngredientQty(testIngredientId, adminToken);
    expect(Number(after)).toBe(12);
  });

  test('PATCH rejects invalid code', async () => {
    const list = await getIngredients(adminToken);
    const ing = list.find((i) => i.id === testIngredientId);
    const target = ing.locations[0];
    const r = await apiRequest(
      'PATCH',
      `/api/ingredient-locations/${target.id}`,
      { location_code: '0A0' },
      adminHdr()
    );
    expect(r.status).toBe(400);
  });

  test('DELETE /api/ingredient-locations/:id removes row + recalculates', async () => {
    const list = await getIngredients(adminToken);
    const ing = list.find((i) => i.id === testIngredientId);
    const toDelete = ing.locations.find((l) => l.location_code === '5B1');
    expect(toDelete).toBeTruthy();

    const r = await apiRequest(
      'DELETE',
      `/api/ingredient-locations/${toDelete.id}`,
      null,
      adminHdr()
    );
    expect(r.status).toBe(200);
    expect(Number(r.data.current_qty)).toBe(10);

    const after = await getIngredients(adminToken);
    const ing2 = after.find((i) => i.id === testIngredientId);
    expect(ing2.locations.find((l) => l.location_code === '5B1')).toBeUndefined();
    expect(Number(ing2.current_qty)).toBe(10);
  });

  test('inventory/adjust with location_code deducts only that location', async () => {
    // current state: 2A2 = 10
    const r = await apiRequest(
      'POST',
      '/api/inventory/adjust',
      {
        ingredient_id: testIngredientId,
        change_type: 'out',
        quantity: 4,
        reason: 'targeted withdraw',
        location_code: '2A2',
      },
      { 'x-cashier-token': cashierToken }
    );
    expect(r.status).toBe(200);
    expect(r.data.location_code).toBe('2A2');

    const list = await getIngredients(adminToken);
    const ing = list.find((i) => i.id === testIngredientId);
    const loc = ing.locations.find((l) => l.location_code === '2A2');
    expect(Number(loc.qty)).toBe(6);
    expect(Number(ing.current_qty)).toBe(6);
  });

  test('inventory/adjust without location_code falls back to UNSET', async () => {
    // Add 7 with no location_code → should land on UNSET
    const r = await apiRequest(
      'POST',
      '/api/inventory/adjust',
      {
        ingredient_id: testIngredientId,
        change_type: 'in',
        quantity: 7,
        reason: 'unset bucket',
      },
      { 'x-cashier-token': cashierToken }
    );
    expect(r.status).toBe(200);
    expect(r.data.location_code).toBe('UNSET');

    const list = await getIngredients(adminToken);
    const ing = list.find((i) => i.id === testIngredientId);
    const unset = ing.locations.find((l) => l.location_code === 'UNSET');
    expect(unset).toBeTruthy();
    expect(Number(unset.qty)).toBe(7);
    expect(Number(ing.current_qty)).toBe(13); // 6 (2A2) + 7 (UNSET)
  });

  test('inventory/adjust rejects out beyond a location stock', async () => {
    const r = await apiRequest(
      'POST',
      '/api/inventory/adjust',
      {
        ingredient_id: testIngredientId,
        change_type: 'out',
        quantity: 999,
        location_code: '2A2',
        reason: 'overdraw',
      },
      { 'x-cashier-token': cashierToken }
    );
    expect(r.status).toBe(400);
  });

  test('inventory/adjust rejects malformed location_code', async () => {
    const r = await apiRequest(
      'POST',
      '/api/inventory/adjust',
      {
        ingredient_id: testIngredientId,
        change_type: 'in',
        quantity: 1,
        location_code: 'XYZ',
        reason: 'bad code',
      },
      { 'x-cashier-token': cashierToken }
    );
    expect(r.status).toBe(400);
  });
});
