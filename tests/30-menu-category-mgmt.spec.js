/**
 * 테스트 30: 메뉴 카테고리 관리 (CRUD + 일괄 이동)
 * - POST /api/admin/menu/categories   : 생성
 * - PUT  /api/admin/menu/categories/:id : 수정
 * - DELETE /api/admin/menu/categories/:id : 사용 안 함 → 200
 * - DELETE 사용 중 → 409 + item_list 반환
 * - POST /api/admin/menu/categories/:id/move-items : 일괄 이동
 * - 이동 후 삭제 → 200
 * - Recipe POST에 menu_item_id 동봉 → menu_items_v2와 정렬
 */

const { test, expect } = require('@playwright/test');
const { apiRequest, adminLogin } = require('./helpers/api');

test.describe('메뉴 카테고리 관리 API', () => {
  let adminToken;
  const stamp = Date.now();
  const codeA = `qa_cat_a_${stamp}`;
  const codeB = `qa_cat_b_${stamp}`;
  let idA, idB, menuItemId;
  const ingredientIds = [];

  test.beforeAll(async () => {
    adminToken = await adminLogin();
  });

  test.afterAll(async () => {
    const h = { 'x-auth-token': adminToken };
    if (menuItemId) {
      await apiRequest('DELETE', `/api/recipes/by-id/${menuItemId}`, null, h);
      await apiRequest('DELETE', `/api/admin/menu/items/${menuItemId}`, null, h);
    }
    if (idA) await apiRequest('DELETE', `/api/admin/menu/categories/${idA}`, null, h);
    if (idB) await apiRequest('DELETE', `/api/admin/menu/categories/${idB}`, null, h);
    for (const iid of ingredientIds) {
      await apiRequest('DELETE', `/api/ingredients/${iid}`, null, h);
    }
    await apiRequest('POST', '/api/auth/logout', null, h);
  });

  test('카테고리 생성 (POST)', async () => {
    const h = { 'x-auth-token': adminToken };
    const r = await apiRequest('POST', '/api/admin/menu/categories', {
      code: codeA, name_en: 'QA Cat A', name_ar: 'فئة أ', icon: '🧪', sort_order: 900,
    }, h);
    expect(r.status).toBe(200);
    expect(r.data.success).toBe(true);
    expect(r.data.id).toBeGreaterThan(0);
    idA = r.data.id;

    const r2 = await apiRequest('POST', '/api/admin/menu/categories', {
      code: codeB, name_en: 'QA Cat B', name_ar: 'فئة ب', icon: '🧫', sort_order: 901,
    }, h);
    expect(r2.status).toBe(200);
    idB = r2.data.id;
  });

  test('잘못된 code → 400', async () => {
    const h = { 'x-auth-token': adminToken };
    const r = await apiRequest('POST', '/api/admin/menu/categories', {
      code: 'BAD CODE!', name_en: 'x', name_ar: 'س',
    }, h);
    expect(r.status).toBe(400);
    expect(r.data.error).toBe('invalid_code');
  });

  test('필수 name_ar 누락 → 400', async () => {
    const h = { 'x-auth-token': adminToken };
    const r = await apiRequest('POST', '/api/admin/menu/categories', {
      code: `qa_no_ar_${stamp}`, name_en: 'No AR',
    }, h);
    expect(r.status).toBe(400);
    expect(r.data.error).toBe('name_ar_required');
  });

  test('중복 code → 400 code_exists', async () => {
    const h = { 'x-auth-token': adminToken };
    const r = await apiRequest('POST', '/api/admin/menu/categories', {
      code: codeA, name_en: 'Dup', name_ar: 'مكرر',
    }, h);
    expect(r.status).toBe(400);
    expect(r.data.error).toBe('code_exists');
  });

  test('카테고리 수정 (PUT)', async () => {
    const h = { 'x-auth-token': adminToken };
    const r = await apiRequest('PUT', `/api/admin/menu/categories/${idA}`, {
      name_en: 'QA Cat A (renamed)', icon: '☕',
    }, h);
    expect(r.status).toBe(200);
    expect(r.data.success).toBe(true);
    const list = await apiRequest('GET', '/api/admin/menu/categories', null, h);
    const got = list.data.find(c => c.id === idA);
    expect(got.name_en).toBe('QA Cat A (renamed)');
    expect(got.icon).toBe('☕');
  });

  test('카테고리 비어있으면 DELETE → 200', async () => {
    const h = { 'x-auth-token': adminToken };
    const r = await apiRequest('POST', '/api/admin/menu/categories', {
      code: `qa_tmp_${stamp}`, name_en: 'Tmp', name_ar: 'مؤقت',
    }, h);
    expect(r.status).toBe(200);
    const tmpId = r.data.id;
    const d = await apiRequest('DELETE', `/api/admin/menu/categories/${tmpId}`, null, h);
    expect(d.status).toBe(200);
    expect(d.data.success).toBe(true);
  });

  test('카테고리에 메뉴 추가 후 DELETE → 409 + item_list', async () => {
    const h = { 'x-auth-token': adminToken };
    // create a menu item in categoryA
    const m = await apiRequest('POST', '/api/admin/menu/items', {
      code: `qa_mi_${stamp}`,
      name_en: `QA Item ${stamp}`,
      name_ar: `عنصر ${stamp}`,
      category_id: idA,
      base_price: 1000,
      kind: 'single',
      active: true,
    }, h);
    expect(m.status).toBe(200);
    menuItemId = m.data.id;

    const d = await apiRequest('DELETE', `/api/admin/menu/categories/${idA}`, null, h);
    expect(d.status).toBe(409);
    expect(d.data.error).toBe('category_in_use');
    expect(d.data.items).toBe(1);
    expect(Array.isArray(d.data.item_list)).toBe(true);
    expect(d.data.item_list[0].id).toBe(menuItemId);
  });

  test('move-items로 다른 카테고리로 이동 후 DELETE → 200', async () => {
    const h = { 'x-auth-token': adminToken };
    const mv = await apiRequest('POST', `/api/admin/menu/categories/${idA}/move-items`, {
      to_category_id: idB,
    }, h);
    expect(mv.status).toBe(200);
    expect(mv.data.success).toBe(true);
    expect(mv.data.moved).toBe(1);

    const d = await apiRequest('DELETE', `/api/admin/menu/categories/${idA}`, null, h);
    expect(d.status).toBe(200);
    idA = null;  // already deleted
  });

  test('move-items: same category → 400', async () => {
    const h = { 'x-auth-token': adminToken };
    const r = await apiRequest('POST', `/api/admin/menu/categories/${idB}/move-items`, {
      to_category_id: idB,
    }, h);
    expect(r.status).toBe(400);
    expect(r.data.error).toBe('same_category');
  });

  test('move-items: to_category_id = null (uncategorized)', async () => {
    const h = { 'x-auth-token': adminToken };
    const r = await apiRequest('POST', `/api/admin/menu/categories/${idB}/move-items`, {
      to_category_id: null,
    }, h);
    expect(r.status).toBe(200);
    expect(r.data.moved).toBe(1);
  });

  test('Recipe POST: menu_item_id 동봉 → DB에 정렬', async () => {
    const h = { 'x-auth-token': adminToken };
    const ing = await apiRequest('POST', '/api/ingredients', {
      name_ko: `qa_ing_${stamp}`, unit: 'ml',
      current_qty: 1000, min_qty: 0, cost_per_unit: 100,
    }, h);
    expect(ing.status).toBe(200);
    ingredientIds.push(ing.data.id);

    const r = await apiRequest('POST', '/api/recipes', {
      menu_item: `QA Item ${stamp}`,
      menu_item_id: menuItemId,
      menu_category: 'QA',
      items: [{ ingredient_id: ing.data.id, quantity: 100, unit: 'ml' }],
    }, h);
    expect(r.status).toBe(200);
    expect(r.data.success).toBe(true);

    const list = await apiRequest('GET', '/api/recipes', null, h);
    const row = list.data.find(x => x.ingredient_id === ing.data.id);
    expect(row).toBeTruthy();
    expect(row.quantity).toBe(100);
  });
});
