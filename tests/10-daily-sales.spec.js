/**
 * 테스트 10: 일일 판매 조회 & 날짜 필터 테스트
 * - GET /api/daily-sales (전체 조회)
 * - GET /api/daily-sales?date=... (날짜 필터)
 * - 없는 날짜 → 빈 배열
 * - 같은 날 동일 메뉴 중복 등록 허용 (unique 제약 없음)
 * - 날짜 없이 POST → 400
 */

const { test, expect } = require('@playwright/test');
const { apiRequest, adminLogin, recordDailySales } = require('./helpers/api');

test.describe('일일 판매 조회', () => {
  let adminToken;
  let ingredientId;
  const testDate = '2099-01-01'; // 미래 날짜 (다른 데이터와 충돌 없음)
  const menuName = `qa_daily_${Date.now()}`;
  const menuName2 = `qa_daily2_${Date.now()}`;

  test.beforeAll(async () => {
    adminToken = await adminLogin();

    // 레시피 없는 메뉴로 테스트 (경고만 나고 판매 기록은 됨)
    // 재고 영향 최소화를 위해 레시피 없는 메뉴 사용
  });

  test.afterAll(async () => {
    if (ingredientId) {
      await apiRequest('DELETE', `/api/ingredients/${ingredientId}`, null, { 'x-auth-token': adminToken });
    }
    await apiRequest('POST', '/api/auth/logout', null, { 'x-auth-token': adminToken });
  });

  test('전체 일일 판매 목록 조회', async () => {
    const { status, data } = await apiRequest('GET', '/api/daily-sales', null, { 'x-auth-token': adminToken });
    expect(status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
  });

  test('존재하지 않는 날짜 조회 → 빈 배열', async () => {
    const { status, data } = await apiRequest('GET', '/api/daily-sales?date=1999-01-01', null, { 'x-auth-token': adminToken });
    expect(status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(0);
  });

  test('날짜 필터로 해당 날짜 판매만 반환', async () => {
    // 판매 등록
    await recordDailySales(testDate, [
      { menu_item: menuName, quantity: 5 },
    ], adminToken);

    // 날짜 필터 조회
    const { status, data } = await apiRequest(`GET`, `/api/daily-sales?date=${testDate}`, null, { 'x-auth-token': adminToken });
    expect(status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    const found = data.find(s => s.menu_item === menuName);
    expect(found).toBeTruthy();
    expect(found.quantity).toBe(5);
    expect(found.sale_date).toBe(testDate);
  });

  test('날짜 필터 결과에 다른 날짜 데이터 미포함', async () => {
    const { data } = await apiRequest('GET', `/api/daily-sales?date=${testDate}`, null, { 'x-auth-token': adminToken });
    for (const sale of data) {
      expect(sale.sale_date).toBe(testDate);
    }
  });

  test('같은 날 동일 메뉴 중복 등록 허용 (unique 제약 없음)', async () => {
    // 같은 날 같은 메뉴 두 번 등록
    await recordDailySales(testDate, [{ menu_item: menuName, quantity: 3 }], adminToken);
    await recordDailySales(testDate, [{ menu_item: menuName, quantity: 7 }], adminToken);

    const { data } = await apiRequest('GET', `/api/daily-sales?date=${testDate}`, null, { 'x-auth-token': adminToken });
    const entries = data.filter(s => s.menu_item === menuName && s.sale_date === testDate);
    expect(entries.length).toBeGreaterThanOrEqual(3); // 원래 1개 + 추가 2개
  });

  test('여러 메뉴 한 번에 판매 등록', async () => {
    const multiDate = '2099-02-01';
    const { status, data } = await recordDailySales(multiDate, [
      { menu_item: menuName, quantity: 2 },
      { menu_item: menuName2, quantity: 4 },
    ], adminToken);

    expect(status).toBe(200);
    expect(data.success).toBe(true);

    const { data: sales } = await apiRequest('GET', `/api/daily-sales?date=${multiDate}`, null, { 'x-auth-token': adminToken });
    expect(sales.length).toBeGreaterThanOrEqual(2);
  });
});

test.describe('일일 판매 등록 유효성 검사', () => {
  let adminToken;

  test.beforeAll(async () => {
    adminToken = await adminLogin();
  });

  test.afterAll(async () => {
    await apiRequest('POST', '/api/auth/logout', null, { 'x-auth-token': adminToken });
  });

  test('날짜 없이 판매 등록 → 400', async () => {
    const { status } = await apiRequest('POST', '/api/daily-sales', {
      sales: [{ menu_item: 'americano', quantity: 1 }],
    }, { 'x-auth-token': adminToken });
    expect(status).toBe(400);
  });

  test('판매 목록 없이 등록 → 400', async () => {
    const { status } = await apiRequest('POST', '/api/daily-sales', {
      sale_date: '2099-03-01',
    }, { 'x-auth-token': adminToken });
    expect(status).toBe(400);
  });

  test('인증 없이 판매 등록 → 401', async () => {
    const { status } = await apiRequest('POST', '/api/daily-sales', {
      sale_date: '2099-03-01',
      sales: [{ menu_item: 'americano', quantity: 1 }],
    });
    expect(status).toBe(401);
  });

  test('수량 0인 항목은 건너뜀 (정상 처리)', async () => {
    const { status, data } = await apiRequest('POST', '/api/daily-sales', {
      sale_date: '2099-04-01',
      sales: [
        { menu_item: 'americano', quantity: 0 },
        { menu_item: 'latte', quantity: 0 },
      ],
    }, { 'x-auth-token': adminToken });

    // 서버는 quantity <= 0이면 continue → 성공으로 처리
    expect(status).toBe(200);
    expect(data.success).toBe(true);
  });
});
