/**
 * 테스트 9: 재고 이력 수정/삭제 테스트
 * - 이력 삭제 시 재고 수량 자동 롤백 검증
 * - 이력 수정(PUT) 시 재고 수량 재계산 검증
 * - 인증 없이 수정/삭제 거부
 * - 존재하지 않는 이력 ID 처리
 */

const { test, expect } = require('@playwright/test');
const { apiRequest, adminLogin, getIngredientQty } = require('./helpers/api');

test.describe('재고 이력 삭제 → 재고 롤백', () => {
  let adminToken;
  let ingredientId;
  let historyId;
  const initialQty = 500;

  test.beforeAll(async () => {
    adminToken = await adminLogin();

    const { data } = await apiRequest('POST', '/api/ingredients', {
      name_ko: `QA이력삭제테스트_${Date.now()}`,
      unit: 'g',
      current_qty: initialQty,
      min_qty: 10,
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

  test('입고(+) 후 이력 ID 기록', async () => {
    const { status, data } = await apiRequest('POST', '/api/inventory/adjust', {
      ingredient_id: ingredientId,
      change_type: 'in',
      quantity: 100,
      reason: 'QA이력삭제테스트 입고',
    }, { 'x-auth-token': adminToken });

    expect(status).toBe(200);
    // 이력에서 방금 추가된 항목 ID 찾기
    const { data: history } = await apiRequest('GET', '/api/inventory/history', null, { 'x-auth-token': adminToken });
    const found = history.find(h =>
      h.ingredient_id === ingredientId && h.change_type === 'in' && h.quantity === 100
    );
    expect(found).toBeTruthy();
    historyId = found.id;

    const qty = await getIngredientQty(ingredientId, adminToken);
    expect(qty).toBe(initialQty + 100);
  });

  test('인증 없이 이력 삭제 → 401', async () => {
    const { status } = await apiRequest('DELETE', `/api/inventory/history/${historyId}`);
    expect(status).toBe(401);
  });

  test('이력 삭제 시 재고 롤백 (in → 감소)', async () => {
    const beforeQty = await getIngredientQty(ingredientId, adminToken);

    const { status, data } = await apiRequest(
      'DELETE', `/api/inventory/history/${historyId}`, null,
      { 'x-auth-token': adminToken }
    );

    expect(status).toBe(200);
    expect(data.success).toBe(true);

    const afterQty = await getIngredientQty(ingredientId, adminToken);
    expect(afterQty).toBe(beforeQty - 100); // 입고 100 롤백 → 감소
  });

  test('존재하지 않는 이력 삭제 → 404', async () => {
    const { status } = await apiRequest('DELETE', '/api/inventory/history/99999999', null, {
      'x-auth-token': adminToken,
    });
    expect(status).toBe(404);
  });

  test('출고(-) 이력 삭제 시 재고 복구 (out → 증가)', async () => {
    // 출고 기록 추가
    await apiRequest('POST', '/api/inventory/adjust', {
      ingredient_id: ingredientId,
      change_type: 'out',
      quantity: 50,
      reason: 'QA 출고 롤백 테스트',
    }, { 'x-auth-token': adminToken });

    const beforeQty = await getIngredientQty(ingredientId, adminToken);

    // 출고 이력 찾기
    const { data: history } = await apiRequest('GET', '/api/inventory/history', null, { 'x-auth-token': adminToken });
    const outHistory = history.find(h =>
      h.ingredient_id === ingredientId && h.change_type === 'out' && h.quantity === 50
    );
    expect(outHistory).toBeTruthy();

    // 이력 삭제
    await apiRequest('DELETE', `/api/inventory/history/${outHistory.id}`, null, {
      'x-auth-token': adminToken,
    });

    const afterQty = await getIngredientQty(ingredientId, adminToken);
    expect(afterQty).toBe(beforeQty + 50); // 출고 50 롤백 → 증가
  });
});

test.describe('재고 이력 수정 (PUT)', () => {
  let adminToken;
  let ingredientId;
  const initialQty = 300;

  test.beforeAll(async () => {
    adminToken = await adminLogin();

    const { data } = await apiRequest('POST', '/api/ingredients', {
      name_ko: `QA이력수정테스트_${Date.now()}`,
      unit: 'ml',
      current_qty: initialQty,
      min_qty: 20,
      cost_per_unit: 2,
    }, { 'x-auth-token': adminToken });
    ingredientId = data.id;
  });

  test.afterAll(async () => {
    if (ingredientId) {
      await apiRequest('DELETE', `/api/ingredients/${ingredientId}`, null, { 'x-auth-token': adminToken });
    }
    await apiRequest('POST', '/api/auth/logout', null, { 'x-auth-token': adminToken });
  });

  test('입고 이력 수정 → 수량 변경 시 재고 재계산', async () => {
    // 입고 100 기록
    await apiRequest('POST', '/api/inventory/adjust', {
      ingredient_id: ingredientId,
      change_type: 'in',
      quantity: 100,
      reason: 'QA 수정 테스트 초기 입고',
    }, { 'x-auth-token': adminToken });

    const qtyAfterIn = await getIngredientQty(ingredientId, adminToken);
    expect(qtyAfterIn).toBe(initialQty + 100);

    // 이력 조회
    const { data: history } = await apiRequest('GET', '/api/inventory/history', null, { 'x-auth-token': adminToken });
    const record = history.find(h =>
      h.ingredient_id === ingredientId && h.change_type === 'in' && h.quantity === 100
    );
    expect(record).toBeTruthy();

    // 이력 수정: 100 → 200 입고로 변경
    const { status, data } = await apiRequest('PUT', `/api/inventory/history/${record.id}`, {
      change_type: 'in',
      quantity: 200,
      reason: 'QA 수정 후 입고량 변경',
    }, { 'x-auth-token': adminToken });

    expect(status).toBe(200);
    expect(data.success).toBe(true);

    // 재고: (initialQty + 100) - 100 + 200 = initialQty + 200
    const qtyAfterEdit = await getIngredientQty(ingredientId, adminToken);
    expect(qtyAfterEdit).toBe(initialQty + 200);
  });

  test('인증 없이 이력 수정 → 401', async () => {
    const { data: history } = await apiRequest('GET', '/api/inventory/history', null, { 'x-auth-token': adminToken });
    const record = history.find(h => h.ingredient_id === ingredientId);
    if (!record) return;

    const { status } = await apiRequest('PUT', `/api/inventory/history/${record.id}`, {
      change_type: 'in',
      quantity: 50,
    });
    expect(status).toBe(401);
  });

  test('유효하지 않은 데이터로 수정 → 400', async () => {
    const { data: history } = await apiRequest('GET', '/api/inventory/history', null, { 'x-auth-token': adminToken });
    const record = history.find(h => h.ingredient_id === ingredientId);
    if (!record) return;

    const { status } = await apiRequest('PUT', `/api/inventory/history/${record.id}`, {
      change_type: 'invalid_type',
      quantity: -10,
    }, { 'x-auth-token': adminToken });
    expect(status).toBe(400);
  });

  test('존재하지 않는 이력 수정 → 404', async () => {
    const { status } = await apiRequest('PUT', '/api/inventory/history/99999999', {
      change_type: 'in',
      quantity: 10,
      reason: '없는 기록 수정 시도',
    }, { 'x-auth-token': adminToken });
    expect(status).toBe(404);
  });
});
