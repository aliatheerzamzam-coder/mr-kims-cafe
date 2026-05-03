/**
 * Test 28: Purchase Orders + Stock Counts + Profitability Dashboard
 *
 * Covers:
 *  - PO full workflow: draft → pending → approved → partial receive → fully received
 *  - Stock count: open → submit (variance) → reconcile (apply to stock)
 *  - Profitability: summary, ABC, simulator, ingredient-impact, effective-margin
 *  - Negative paths: invalid state transitions, over-receive, validation errors
 */

const { test, expect } = require('@playwright/test');
const { apiRequest, adminLogin } = require('./helpers/api');

let adminToken;
let testIngredientId;
let createdPoId;
let createdCountId;

const auth = () => ({ 'x-auth-token': adminToken });

test.describe.configure({ mode: 'serial' });

test.beforeAll(async () => {
  adminToken = await adminLogin();
  // Create a dedicated test ingredient
  const { status, data } = await apiRequest('POST', '/api/ingredients', {
    name_ko: 'POTEST_INGREDIENT',
    name_ar: 'مكون اختبار طلب الشراء',
    unit: 'g',
    current_qty: 100,
    min_qty: 50,
    cost_per_unit: 10,
  }, auth());
  expect(status).toBe(200);
  testIngredientId = data.id;
});

test.afterAll(async () => {
  if (createdPoId) {
    await apiRequest('POST', `/api/po/${createdPoId}/cancel`, null, auth()).catch(() => {});
    await apiRequest('DELETE', `/api/po/${createdPoId}`, null, auth()).catch(() => {});
  }
  if (createdCountId) {
    await apiRequest('POST', `/api/stock-counts/${createdCountId}/cancel`, null, auth()).catch(() => {});
    await apiRequest('DELETE', `/api/stock-counts/${createdCountId}`, null, auth()).catch(() => {});
  }
  if (testIngredientId) {
    await apiRequest('DELETE', `/api/ingredients/${testIngredientId}`, null, auth()).catch(() => {});
  }
  await apiRequest('POST', '/api/auth/logout', null, auth()).catch(() => {});
});

// ════════════════════════════════════════════════════════════════════
// PURCHASE ORDERS
// ════════════════════════════════════════════════════════════════════
test.describe('Purchase Orders', () => {
  test('PO list endpoint returns array', async () => {
    const { status, data } = await apiRequest('GET', '/api/po', null, auth());
    expect(status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
  });

  test('Create PO with valid items → status=draft', async () => {
    const { status, data } = await apiRequest('POST', '/api/po', {
      notes: 'Test PO',
      expected_date: '2026-06-15',
      items: [
        { ingredient_id: testIngredientId, ordered_qty: 50, unit_cost: 12 },
      ],
    }, auth());
    expect(status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.po.status).toBe('draft');
    expect(data.po.po_number).toMatch(/^PO-\d{8}-\d{4}$/);
    expect(data.po.total_amount).toBeCloseTo(50 * 12, 2);
    createdPoId = data.po.id;
  });

  test('Create PO without items → 400', async () => {
    const { status, data } = await apiRequest('POST', '/api/po', { items: [] }, auth());
    expect(status).toBe(400);
    expect(data.error).toBeTruthy();
  });

  test('Create PO with negative qty → 400', async () => {
    const { status } = await apiRequest('POST', '/api/po', {
      items: [{ ingredient_id: testIngredientId, ordered_qty: -1, unit_cost: 5 }],
    }, auth());
    expect(status).toBe(400);
  });

  test('Receive on draft PO → 400 (must be approved first)', async () => {
    const { status } = await apiRequest('POST', `/api/po/${createdPoId}/receive`, {
      items: [{ po_item_id: 1, qty: 10 }],
    }, auth());
    expect(status).toBe(400);
  });

  test('Approve before submit → 400', async () => {
    const { status } = await apiRequest('POST', `/api/po/${createdPoId}/approve`, null, auth());
    expect(status).toBe(400);
  });

  test('Submit PO (draft → pending_approval)', async () => {
    const { status, data } = await apiRequest('POST', `/api/po/${createdPoId}/submit`, null, auth());
    expect(status).toBe(200);
    expect(data.success).toBe(true);
    const { data: po } = await apiRequest('GET', `/api/po/${createdPoId}`, null, auth());
    expect(po.status).toBe('pending_approval');
    expect(po.submitted_at).toBeGreaterThan(0);
  });

  test('Submit twice → 400', async () => {
    const { status } = await apiRequest('POST', `/api/po/${createdPoId}/submit`, null, auth());
    expect(status).toBe(400);
  });

  test('Edit pending PO → 400 (only draft editable)', async () => {
    const { status } = await apiRequest('PUT', `/api/po/${createdPoId}`, {
      items: [{ ingredient_id: testIngredientId, ordered_qty: 99, unit_cost: 99 }],
    }, auth());
    expect(status).toBe(400);
  });

  test('Approve PO (pending → approved)', async () => {
    const { status, data } = await apiRequest('POST', `/api/po/${createdPoId}/approve`, {
      approved_by: 'test_admin',
    }, auth());
    expect(status).toBe(200);
    expect(data.success).toBe(true);
    const { data: po } = await apiRequest('GET', `/api/po/${createdPoId}`, null, auth());
    expect(po.status).toBe('approved');
    expect(po.approved_by).toBe('test_admin');
  });

  test('Partial receive (30 of 50) → status=partially_received', async () => {
    const { data: poBefore } = await apiRequest('GET', `/api/po/${createdPoId}`, null, auth());
    const poItemId = poBefore.items[0].id;
    const { data: ingBefore } = await apiRequest('GET', '/api/ingredients', null, auth());
    const beforeQty = ingBefore.find(i => i.id === testIngredientId).current_qty;

    const { status, data } = await apiRequest('POST', `/api/po/${createdPoId}/receive`, {
      received_by: 'tester',
      items: [{ po_item_id: poItemId, qty: 30, location_code: '1A1' }],
    }, auth());
    expect(status).toBe(200);
    expect(data.status).toBe('partially_received');

    const { data: ingAfter } = await apiRequest('GET', '/api/ingredients', null, auth());
    const afterQty = ingAfter.find(i => i.id === testIngredientId).current_qty;
    expect(afterQty).toBeCloseTo(beforeQty + 30, 2);
  });

  test('Over-receive (more than remaining) → 400', async () => {
    const { data: po } = await apiRequest('GET', `/api/po/${createdPoId}`, null, auth());
    const poItemId = po.items[0].id;
    const { status } = await apiRequest('POST', `/api/po/${createdPoId}/receive`, {
      items: [{ po_item_id: poItemId, qty: 9999 }],
    }, auth());
    expect(status).toBe(400);
  });

  test('Receive remaining 20 → status=received', async () => {
    const { data: po } = await apiRequest('GET', `/api/po/${createdPoId}`, null, auth());
    const poItemId = po.items[0].id;
    const { status, data } = await apiRequest('POST', `/api/po/${createdPoId}/receive`, {
      items: [{ po_item_id: poItemId, qty: 20, location_code: '1A1' }],
    }, auth());
    expect(status).toBe(200);
    expect(data.status).toBe('received');

    const { data: poFinal } = await apiRequest('GET', `/api/po/${createdPoId}`, null, auth());
    expect(poFinal.items[0].received_qty).toBeCloseTo(50, 2);
    expect(poFinal.receipts.length).toBe(2);
  });

  test('Cancel received PO → 400', async () => {
    const { status } = await apiRequest('POST', `/api/po/${createdPoId}/cancel`, null, auth());
    expect(status).toBe(400);
  });

  test('Receive on received PO → 400', async () => {
    const { data: po } = await apiRequest('GET', `/api/po/${createdPoId}`, null, auth());
    const poItemId = po.items[0].id;
    const { status } = await apiRequest('POST', `/api/po/${createdPoId}/receive`, {
      items: [{ po_item_id: poItemId, qty: 1 }],
    }, auth());
    expect(status).toBe(400);
  });

  test('Inventory history records PO receive', async () => {
    const { data: history } = await apiRequest('GET', '/api/inventory/history?limit=50', null, auth());
    const poEntries = history.filter(h => h.reason && h.reason.includes('PO ') && h.ingredient_id === testIngredientId);
    expect(poEntries.length).toBeGreaterThanOrEqual(2);
    expect(poEntries.every(h => h.change_type === 'in')).toBe(true);
  });

  test('Filter PO list by status', async () => {
    const { status, data } = await apiRequest('GET', '/api/po?status=received', null, auth());
    expect(status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data.every(p => p.status === 'received')).toBe(true);
  });

  test('Get nonexistent PO → 404', async () => {
    const { status } = await apiRequest('GET', '/api/po/9999999', null, auth());
    expect(status).toBe(404);
  });
});

// ════════════════════════════════════════════════════════════════════
// STOCK COUNTS
// ════════════════════════════════════════════════════════════════════
test.describe('Stock Counts', () => {
  test('List stock counts → array', async () => {
    const { status, data } = await apiRequest('GET', '/api/stock-counts', null, auth());
    expect(status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
  });

  test('Create count without name → 400', async () => {
    const { status } = await apiRequest('POST', '/api/stock-counts', { count_name: '' }, auth());
    expect(status).toBe(400);
  });

  test('Create count → snapshot of ingredients created', async () => {
    const { status, data } = await apiRequest('POST', '/api/stock-counts', {
      count_name: 'TEST_COUNT_28',
      notes: 'automated test',
      started_by: 'tester',
    }, auth());
    expect(status).toBe(200);
    expect(data.id).toBeTruthy();
    createdCountId = data.id;

    const { data: sc } = await apiRequest('GET', `/api/stock-counts/${createdCountId}`, null, auth());
    expect(sc.status).toBe('open');
    expect(Array.isArray(sc.items)).toBe(true);
    expect(sc.items.length).toBeGreaterThan(0);
    const ourItem = sc.items.find(i => i.ingredient_id === testIngredientId);
    expect(ourItem).toBeTruthy();
    // Snapshot expected_qty should match current ingredient qty
    const { data: ings } = await apiRequest('GET', '/api/ingredients', null, auth());
    const cur = ings.find(i => i.id === testIngredientId).current_qty;
    expect(ourItem.expected_qty).toBeCloseTo(cur, 2);
  });

  test('Reconcile open count → 400 (must submit first)', async () => {
    const { status } = await apiRequest('POST', `/api/stock-counts/${createdCountId}/reconcile`, null, auth());
    expect(status).toBe(400);
  });

  test('Update items: counted_qty (deliberate variance −10)', async () => {
    const { data: sc } = await apiRequest('GET', `/api/stock-counts/${createdCountId}`, null, auth());
    const ourItem = sc.items.find(i => i.ingredient_id === testIngredientId);
    const counted = (ourItem.expected_qty || 0) - 10;
    const { status } = await apiRequest('PUT', `/api/stock-counts/${createdCountId}/items`, {
      items: [{ ingredient_id: testIngredientId, counted_qty: counted, notes: 'shrinkage' }],
    }, auth());
    expect(status).toBe(200);
  });

  test('Submit count → variance computed', async () => {
    const { status, data } = await apiRequest('POST', `/api/stock-counts/${createdCountId}/submit`, null, auth());
    expect(status).toBe(200);
    expect(typeof data.total_variance_value).toBe('number');

    const { data: sc } = await apiRequest('GET', `/api/stock-counts/${createdCountId}`, null, auth());
    expect(sc.status).toBe('submitted');
    const ourItem = sc.items.find(i => i.ingredient_id === testIngredientId);
    expect(ourItem.variance_qty).toBeCloseTo(-10, 2);
    expect(typeof ourItem.variance_value).toBe('number');
  });

  test('Submit twice → 400', async () => {
    const { status } = await apiRequest('POST', `/api/stock-counts/${createdCountId}/submit`, null, auth());
    expect(status).toBe(400);
  });

  test('Edit submitted count → 400', async () => {
    const { status } = await apiRequest('PUT', `/api/stock-counts/${createdCountId}/items`, {
      items: [{ ingredient_id: testIngredientId, counted_qty: 999 }],
    }, auth());
    expect(status).toBe(400);
  });

  test('Reconcile → stock adjusted to counted', async () => {
    const { data: sc } = await apiRequest('GET', `/api/stock-counts/${createdCountId}`, null, auth());
    const expectedFinal = sc.items.find(i => i.ingredient_id === testIngredientId).counted_qty;

    const { status, data } = await apiRequest('POST', `/api/stock-counts/${createdCountId}/reconcile`, {
      reconciled_by: 'tester',
    }, auth());
    expect(status).toBe(200);
    expect(data.success).toBe(true);

    const { data: ings } = await apiRequest('GET', '/api/ingredients', null, auth());
    const cur = ings.find(i => i.id === testIngredientId).current_qty;
    expect(cur).toBeCloseTo(expectedFinal, 1);
  });

  test('Reconcile twice → 400', async () => {
    const { status } = await apiRequest('POST', `/api/stock-counts/${createdCountId}/reconcile`, null, auth());
    expect(status).toBe(400);
  });

  test('Inventory history records STOCK_COUNT entry', async () => {
    const { data: history } = await apiRequest('GET', '/api/inventory/history?limit=50', null, auth());
    const scEntries = history.filter(h => h.reason && h.reason.startsWith('STOCK_COUNT'));
    expect(scEntries.length).toBeGreaterThanOrEqual(1);
  });

  test('Delete reconciled count → 400', async () => {
    const { status } = await apiRequest('DELETE', `/api/stock-counts/${createdCountId}`, null, auth());
    expect(status).toBe(400);
  });
});

// ════════════════════════════════════════════════════════════════════
// PROFITABILITY DASHBOARD
// ════════════════════════════════════════════════════════════════════
test.describe('Profitability Dashboard', () => {
  test('Summary returns rows + totals', async () => {
    const { status, data } = await apiRequest('GET', '/api/profitability/summary?period=month', null, auth());
    expect(status).toBe(200);
    expect(data.rows).toBeDefined();
    expect(Array.isArray(data.rows)).toBe(true);
    expect(data.totals).toBeDefined();
    expect(typeof data.totals.revenue).toBe('number');
    expect(typeof data.totals.cost).toBe('number');
    expect(typeof data.totals.gross_profit).toBe('number');
    expect(typeof data.totals.margin_rate).toBe('number');
  });

  test('Summary supports multiple periods', async () => {
    for (const period of ['day', 'week', 'month', '3month', 'year']) {
      const { status, data } = await apiRequest('GET', `/api/profitability/summary?period=${period}`, null, auth());
      expect(status).toBe(200);
      expect(data.period).toBeDefined();
      expect(data.period.startStr).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(data.period.endStr).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  test('ABC analysis returns classes A/B/C', async () => {
    const { status, data } = await apiRequest('GET', '/api/profitability/abc?period=month', null, auth());
    expect(status).toBe(200);
    expect(Array.isArray(data.rows)).toBe(true);
    if (data.rows.length > 0) {
      for (const r of data.rows) {
        expect(['A', 'B', 'C']).toContain(r.abc_class);
        expect(typeof r.cumulative_ratio).toBe('number');
      }
    }
  });

  test('Price simulator → break-even calc', async () => {
    // Set a price first
    await apiRequest('POST', '/api/menu-prices', {
      menu_item: 'POTEST_MENU', selling_price: 5000,
    }, auth());
    const { status, data } = await apiRequest(
      'GET',
      '/api/profitability/simulate?menu_item=POTEST_MENU&new_price=6000&fixed_cost=120000',
      null, auth()
    );
    expect(status).toBe(200);
    expect(data.menu_item).toBe('POTEST_MENU');
    expect(data.new_price).toBe(6000);
    expect(data.old_price).toBe(5000);
    expect(typeof data.new_margin_rate).toBe('number');
    if (data.new_margin > 0) {
      expect(typeof data.break_even_qty).toBe('number');
    }
  });

  test('Simulator without menu_item → 400', async () => {
    const { status } = await apiRequest('GET', '/api/profitability/simulate?new_price=100', null, auth());
    expect(status).toBe(400);
  });

  test('Ingredient-impact requires menu_item', async () => {
    const { status } = await apiRequest('GET', '/api/profitability/ingredient-impact', null, auth());
    expect(status).toBe(400);
  });

  test('Ingredient-impact returns items array (even when no recipe)', async () => {
    const { status, data } = await apiRequest(
      'GET', '/api/profitability/ingredient-impact?menu_item=NONEXISTENT_MENU_X',
      null, auth()
    );
    expect(status).toBe(200);
    expect(Array.isArray(data.items)).toBe(true);
  });

  test('Effective margin: revenue >= effective_profit', async () => {
    const { status, data } = await apiRequest('GET', '/api/profitability/effective-margin?period=month', null, auth());
    expect(status).toBe(200);
    expect(typeof data.revenue).toBe('number');
    expect(typeof data.effective_profit).toBe('number');
    expect(data.gross_profit).toBeGreaterThanOrEqual(data.effective_profit - 1);
  });

  test('Cost-trend requires ingredient_id', async () => {
    const { status } = await apiRequest('GET', '/api/profitability/cost-trend', null, auth());
    expect(status).toBe(400);
  });

  test('Cost-trend with valid id returns rows', async () => {
    const { status, data } = await apiRequest(
      'GET', `/api/profitability/cost-trend?ingredient_id=${testIngredientId}&days=90`,
      null, auth()
    );
    expect(status).toBe(200);
    expect(Array.isArray(data.rows)).toBe(true);
  });

  test('Menu price history endpoint', async () => {
    const { status, data } = await apiRequest('GET', '/api/profitability/price-history/POTEST_MENU', null, auth());
    expect(status).toBe(200);
    expect(Array.isArray(data.rows)).toBe(true);
    // We set the price once, so history must contain at least one entry
    expect(data.rows.length).toBeGreaterThanOrEqual(1);
  });

  test('Menu price history records on price change', async () => {
    const before = await apiRequest('GET', '/api/profitability/price-history/POTEST_MENU', null, auth());
    const beforeCount = before.data.rows.length;
    // Change price
    await apiRequest('POST', '/api/menu-prices', {
      menu_item: 'POTEST_MENU', selling_price: 7500,
    }, auth());
    const after = await apiRequest('GET', '/api/profitability/price-history/POTEST_MENU', null, auth());
    expect(after.data.rows.length).toBe(beforeCount + 1);
    // Same price again should NOT record
    await apiRequest('POST', '/api/menu-prices', {
      menu_item: 'POTEST_MENU', selling_price: 7500,
    }, auth());
    const after2 = await apiRequest('GET', '/api/profitability/price-history/POTEST_MENU', null, auth());
    expect(after2.data.rows.length).toBe(beforeCount + 1);
  });
});

// ════════════════════════════════════════════════════════════════════
// AUTH GUARD CHECKS
// ════════════════════════════════════════════════════════════════════
test.describe('Auth Guards', () => {
  test('PO endpoints reject without admin token', async () => {
    const { status } = await apiRequest('GET', '/api/po', null, {});
    expect(status).toBe(401);
  });
  test('Stock count endpoints reject without admin token', async () => {
    const { status } = await apiRequest('GET', '/api/stock-counts', null, {});
    expect(status).toBe(401);
  });
  test('Profitability endpoints reject without admin token', async () => {
    const { status } = await apiRequest('GET', '/api/profitability/summary', null, {});
    expect(status).toBe(401);
  });
});

// ════════════════════════════════════════════════════════════════════
// UI SMOKE TEST
// ════════════════════════════════════════════════════════════════════
test.describe('Warehouse UI smoke', () => {
  test('warehouse.html renders and 3 new tabs exist', async ({ page }) => {
    await page.goto('http://localhost:3000/warehouse.html');
    // Login overlay
    await page.fill('#loginPw', '1234');
    await page.click('#loginBtn');
    await page.waitForSelector('#tab-dashboard.active', { timeout: 5000 }).catch(() => {});
    // Check sidebar has the 3 new buttons
    const labels = await page.$$eval('.side-nav button', els => els.map(e => e.textContent.trim()));
    const joined = labels.join(' | ');
    expect(joined).toMatch(/Purchase Orders/);
    expect(joined).toMatch(/Stock Count/);
    expect(joined).toMatch(/Profitability/);
  });
});
