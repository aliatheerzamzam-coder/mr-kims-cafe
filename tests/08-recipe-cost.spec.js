/**
 * 테스트 8: 레시피 삭제 & 원가 계산 테스트
 * - 레시피 등록 후 원가(cost) 계산 정확도 검증
 * - 레시피 없는 메뉴 원가 → total_cost: 0
 * - 레시피 삭제 후 더 이상 조회 안 됨
 * - 레시피 삭제 후 원가 → 0
 * - 인증 없이 삭제 거부
 */

const { test, expect } = require('@playwright/test');
const { apiRequest, adminLogin } = require('./helpers/api');

test.describe('원가 계산 API', () => {
  let adminToken;
  let ingredientId1;
  let ingredientId2;
  const menuName = `qa_cost_menu_${Date.now()}`;

  test.beforeAll(async () => {
    adminToken = await adminLogin();

    // 재료 1: 원두 200원/g
    const { data: ing1 } = await apiRequest('POST', '/api/ingredients', {
      name_ko: `QA원두_${Date.now()}`,
      unit: 'g',
      current_qty: 1000,
      min_qty: 100,
      cost_per_unit: 200,
    }, { 'x-auth-token': adminToken });
    ingredientId1 = ing1.id;

    // 재료 2: 우유 50원/ml
    const { data: ing2 } = await apiRequest('POST', '/api/ingredients', {
      name_ko: `QA우유_${Date.now()}`,
      unit: 'ml',
      current_qty: 2000,
      min_qty: 200,
      cost_per_unit: 50,
    }, { 'x-auth-token': adminToken });
    ingredientId2 = ing2.id;

    // 레시피 등록: 원두 20g + 우유 150ml
    await apiRequest('POST', '/api/recipes', {
      menu_item: menuName,
      items: [
        { ingredient_id: ingredientId1, quantity: 20 },
        { ingredient_id: ingredientId2, quantity: 150 },
      ],
    }, { 'x-auth-token': adminToken });
  });

  test.afterAll(async () => {
    // 레시피 정리 (이미 삭제됐을 수 있음)
    await apiRequest('DELETE', `/api/recipes/menu/${menuName}`, null, { 'x-auth-token': adminToken });
    // 재료 정리
    if (ingredientId1) await apiRequest('DELETE', `/api/ingredients/${ingredientId1}`, null, { 'x-auth-token': adminToken });
    if (ingredientId2) await apiRequest('DELETE', `/api/ingredients/${ingredientId2}`, null, { 'x-auth-token': adminToken });
    await apiRequest('POST', '/api/auth/logout', null, { 'x-auth-token': adminToken });
  });

  test('레시피 등록된 메뉴 원가 계산', async () => {
    const { status, data } = await apiRequest('GET', `/api/cost/${menuName}`);

    expect(status).toBe(200);
    expect(data.menu_item).toBe(menuName);
    expect(Array.isArray(data.items)).toBe(true);
    expect(data.items.length).toBe(2);

    // 원두 20g × 200원 + 우유 150ml × 50원 = 4000 + 7500 = 11500
    expect(data.total_cost).toBe(11500);
  });

  test('원가 항목별 세부 내역 확인', async () => {
    const { data } = await apiRequest('GET', `/api/cost/${menuName}`);
    const costs = data.items.map(i => i.quantity * i.cost_per_unit);
    const sum = costs.reduce((a, b) => a + b, 0);
    expect(Math.round(sum)).toBe(data.total_cost);
  });

  test('레시피 없는 메뉴 원가 → total_cost: 0, items: []', async () => {
    const { status, data } = await apiRequest('GET', '/api/cost/nonexistent_menu_xyz_999');

    expect(status).toBe(200);
    expect(data.total_cost).toBe(0);
    expect(data.items).toHaveLength(0);
  });
});

test.describe('레시피 삭제', () => {
  let adminToken;
  let ingredientId;
  const menuName = `qa_del_recipe_${Date.now()}`;

  test.beforeAll(async () => {
    adminToken = await adminLogin();

    const { data: ing } = await apiRequest('POST', '/api/ingredients', {
      name_ko: `QA삭제레시피재료_${Date.now()}`,
      unit: 'g',
      current_qty: 500,
      min_qty: 10,
      cost_per_unit: 100,
    }, { 'x-auth-token': adminToken });
    ingredientId = ing.id;

    await apiRequest('POST', '/api/recipes', {
      menu_item: menuName,
      items: [{ ingredient_id: ingredientId, quantity: 15 }],
    }, { 'x-auth-token': adminToken });
  });

  test.afterAll(async () => {
    if (ingredientId) await apiRequest('DELETE', `/api/ingredients/${ingredientId}`, null, { 'x-auth-token': adminToken });
    await apiRequest('POST', '/api/auth/logout', null, { 'x-auth-token': adminToken });
  });

  test('레시피 삭제 전 조회 가능', async () => {
    const { data } = await apiRequest('GET', '/api/recipes');
    const found = data.find(r => r.menu_item === menuName);
    expect(found).toBeTruthy();
  });

  test('인증 없이 레시피 삭제 → 401', async () => {
    const { status } = await apiRequest('DELETE', `/api/recipes/menu/${menuName}`);
    expect(status).toBe(401);
  });

  test('레시피 삭제 성공', async () => {
    const { status, data } = await apiRequest(
      'DELETE', `/api/recipes/menu/${menuName}`, null,
      { 'x-auth-token': adminToken }
    );
    expect(status).toBe(200);
    expect(data.success).toBe(true);
  });

  test('삭제 후 레시피 목록에 없음', async () => {
    const { data } = await apiRequest('GET', '/api/recipes');
    const found = data.find(r => r.menu_item === menuName);
    expect(found).toBeUndefined();
  });

  test('삭제 후 원가 계산 → total_cost: 0', async () => {
    const { data } = await apiRequest('GET', `/api/cost/${menuName}`);
    expect(data.total_cost).toBe(0);
    expect(data.items).toHaveLength(0);
  });

  test('재료 삭제 시 레시피도 연쇄 삭제 (CASCADE)', async () => {
    // 새 레시피 등록
    const tempMenu = `qa_cascade_${Date.now()}`;
    await apiRequest('POST', '/api/recipes', {
      menu_item: tempMenu,
      items: [{ ingredient_id: ingredientId, quantity: 5 }],
    }, { 'x-auth-token': adminToken });

    // 재료 삭제 → CASCADE로 레시피도 삭제
    await apiRequest('DELETE', `/api/ingredients/${ingredientId}`, null, { 'x-auth-token': adminToken });
    ingredientId = null; // afterAll에서 이중 삭제 방지

    const { data } = await apiRequest('GET', '/api/recipes');
    const found = data.find(r => r.menu_item === tempMenu);
    expect(found).toBeUndefined();
  });
});
