/**
 * 테스트 3: 창고(재고) 시스템 테스트
 * - 재료 조회/추가/수정/삭제
 * - 레시피 등록 및 조회
 * - 일일 판매 등록 시 재고 차감 검증
 * - 재고 수동 조정
 * - 취소 주문은 재고 차감 없음 검증
 */

const { test, expect } = require('@playwright/test');
const { apiRequest, adminLogin, createOrder, updateOrderStatus, getIngredients, recordDailySales, getIngredientQty } = require('./helpers/api');

test.describe('재료 관리', () => {
  let adminToken;
  let testIngredientId;

  test.beforeAll(async () => {
    adminToken = await adminLogin();
  });

  test.afterAll(async () => {
    if (testIngredientId) {
      await apiRequest('DELETE', `/api/ingredients/${testIngredientId}`, null, { 'x-auth-token': adminToken });
    }
    await apiRequest('POST', '/api/auth/logout', null, { 'x-auth-token': adminToken });
  });

  test('재료 목록 조회', async () => {
    const { status, data } = await apiRequest('GET', '/api/ingredients', null, { 'x-auth-token': adminToken });
    expect(status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
  });

  test('재료 추가', async () => {
    const { status, data } = await apiRequest('POST', '/api/ingredients', {
      name_ko: 'QA테스트재료',
      name_ar: 'مكون اختبار',
      unit: 'g',
      current_qty: 1000,
      min_qty: 100,
      cost_per_unit: 5,
    }, { 'x-auth-token': adminToken });

    expect(status).toBe(200);
    expect(data.id).toBeTruthy();
    testIngredientId = data.id;
  });

  test('재료 수정 (이름/단가/최소수량 변경)', async () => {
    if (!testIngredientId) return;
    // PUT은 name_ko, name_ar, unit, min_qty, cost_per_unit만 업데이트 (current_qty 제외)
    const { status } = await apiRequest('PUT', `/api/ingredients/${testIngredientId}`, {
      name_ko: 'QA테스트재료수정',
      name_ar: 'مكون اختبار محدّث',
      unit: 'g',
      min_qty: 50,
      cost_per_unit: 6,
    }, { 'x-auth-token': adminToken });

    expect(status).toBe(200);
    const updated = await getIngredients(adminToken);
    const found = updated.find(i => i.id === testIngredientId);
    expect(found.name_ko).toBe('QA테스트재료수정');
    expect(found.min_qty).toBe(50);
    expect(found.cost_per_unit).toBe(6);
    // current_qty는 PUT으로 변경 불가 → inventory/adjust 사용해야 함
  });

  test('인증 없이 재료 추가 거부', async () => {
    const { status } = await apiRequest('POST', '/api/ingredients', {
      name_ko: '무인증재료',
      unit: 'g',
      current_qty: 100,
    });
    expect(status).toBe(401);
  });
});

test.describe('재고 수동 조정', () => {
  let adminToken;
  let ingredientId;
  const initialQty = 500;

  test.beforeAll(async () => {
    adminToken = await adminLogin();
    // 테스트용 재료 생성
    const { data } = await apiRequest('POST', '/api/ingredients', {
      name_ko: 'QA조정테스트재료',
      unit: 'ml',
      current_qty: initialQty,
      min_qty: 50,
      cost_per_unit: 1,
    }, { 'x-auth-token': adminToken });
    ingredientId = data.id;
  });

  test.afterAll(async () => {
    if (ingredientId) {
      await apiRequest('DELETE', `/api/ingredients/${ingredientId}`, null, { 'x-auth-token': adminToken });
    }
    await apiRequest('POST', '/api/auth/logout', null, { 'x-auth-token': adminToken });
  });

  test('재고 입고(+) 조정', async () => {
    const { status, data } = await apiRequest('POST', '/api/inventory/adjust', {
      ingredient_id: ingredientId,
      change_type: 'in',
      quantity: 200,
      reason: 'QA 입고 테스트',
    }, { 'x-auth-token': adminToken });

    expect(status).toBe(200);
    const newQty = await getIngredientQty(ingredientId, adminToken);
    expect(newQty).toBe(initialQty + 200);
  });

  test('재고 출고(-) 조정', async () => {
    const before = await getIngredientQty(ingredientId, adminToken);
    const { status } = await apiRequest('POST', '/api/inventory/adjust', {
      ingredient_id: ingredientId,
      change_type: 'out',
      quantity: 100,
      reason: 'QA 출고 테스트',
    }, { 'x-auth-token': adminToken });

    expect(status).toBe(200);
    const after = await getIngredientQty(ingredientId, adminToken);
    expect(after).toBe(before - 100);
  });

  test('재고 이력 조회', async () => {
    const { status, data } = await apiRequest('GET', '/api/inventory/history', null, { 'x-auth-token': adminToken });
    expect(status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
  });
});

test.describe('주문 → 재고 차감 연동 검증 (일일 판매 방식)', () => {
  let adminToken;
  let ingredientId;
  let recipeMenuName;
  const initialQty = 1000;
  const recipeQty = 10; // 메뉴 1개당 재료 10g 사용

  test.beforeAll(async () => {
    adminToken = await adminLogin();
    recipeMenuName = `qa_menu_${Date.now()}`;

    // 1. 테스트 재료 추가
    const { data: ingData } = await apiRequest('POST', '/api/ingredients', {
      name_ko: `QA판매테스트재료_${Date.now()}`,
      unit: 'g',
      current_qty: initialQty,
      min_qty: 100,
      cost_per_unit: 2,
    }, { 'x-auth-token': adminToken });
    ingredientId = ingData.id;

    // 2. 레시피 등록 (키는 items, ingredient_id + quantity)
    await apiRequest('POST', '/api/recipes', {
      menu_item: recipeMenuName,
      items: [{ ingredient_id: ingredientId, quantity: recipeQty }],
    }, { 'x-auth-token': adminToken });
  });

  test.afterAll(async () => {
    if (ingredientId) {
      await apiRequest('DELETE', `/api/ingredients/${ingredientId}`, null, { 'x-auth-token': adminToken });
    }
    await apiRequest('POST', '/api/auth/logout', null, { 'x-auth-token': adminToken });
  });

  test('레시피 등록 후 조회 가능', async () => {
    const { status, data } = await apiRequest('GET', '/api/recipes', null, { 'x-auth-token': adminToken });
    expect(status).toBe(200);
    const recipe = data.find(r => r.menu_item === recipeMenuName);
    expect(recipe).toBeTruthy();
  });

  test('일일 판매 등록 시 재고 정확히 차감', async () => {
    const beforeQty = await getIngredientQty(ingredientId, adminToken);
    const sellQty = 3; // 3개 판매
    const expectedDeduction = recipeQty * sellQty;

    const today = new Date().toISOString().slice(0, 10);
    const { status, data } = await recordDailySales(today, [
      { menu_item: recipeMenuName, quantity: sellQty }
    ], adminToken);

    expect(status).toBe(200);
    expect(data.success).toBe(true);

    const afterQty = await getIngredientQty(ingredientId, adminToken);
    expect(afterQty).toBe(beforeQty - expectedDeduction);
  });

  test('레시피 없는 메뉴 판매 시 경고 반환 (재고 차감 없음)', async () => {
    const beforeQty = await getIngredientQty(ingredientId, adminToken);
    const today = new Date().toISOString().slice(0, 10);

    const { status, data } = await recordDailySales(today, [
      { menu_item: 'nonexistent_menu_item', quantity: 5 }
    ], adminToken);

    expect(status).toBe(200);
    expect(data.warnings?.length).toBeGreaterThan(0);

    // 재고 변동 없음 확인
    const afterQty = await getIngredientQty(ingredientId, adminToken);
    expect(afterQty).toBe(beforeQty);
  });

  test('취소된 주문 → 판매 미등록 시 재고 차감 없음', async () => {
    const beforeQty = await getIngredientQty(ingredientId, adminToken);

    // 주문 생성
    const { data: orderData } = await createOrder({
      type: 'pickup',
      items: [{ key: recipeMenuName, name: recipeMenuName, price: 5000, qty: 2 }],
      total: 10000,
      customerName: '취소재고테스트',
      customerPhone: '07700000099',
      arrivalTime: '12:00',
    });

    // 취소 처리
    await updateOrderStatus(orderData.order.id, 'cancelled', { adminToken });

    // 일일 판매 등록 없이 재고 조회 → 변동 없어야 함
    const afterQty = await getIngredientQty(ingredientId, adminToken);
    expect(afterQty).toBe(beforeQty);
  });
});

test.describe('대시보드 데이터 정합성', () => {
  let adminToken;

  test.beforeAll(async () => {
    adminToken = await adminLogin();
  });

  test.afterAll(async () => {
    await apiRequest('POST', '/api/auth/logout', null, { 'x-auth-token': adminToken });
  });

  test('대시보드 API 정상 응답', async () => {
    const { status, data } = await apiRequest('GET', '/api/dashboard', null, { 'x-auth-token': adminToken });
    expect(status).toBe(200);
    expect(Array.isArray(data.ingredients)).toBe(true);
    expect(Array.isArray(data.low_stock)).toBe(true);
    expect(Array.isArray(data.recent_history)).toBe(true);
  });

  test('low_stock은 min_qty 이하 재료만 포함', async () => {
    const { data } = await apiRequest('GET', '/api/dashboard', null, { 'x-auth-token': adminToken });
    for (const item of data.low_stock) {
      expect(item.current_qty).toBeLessThanOrEqual(item.min_qty);
    }
  });
});
