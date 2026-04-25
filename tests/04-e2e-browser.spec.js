/**
 * 테스트 4: 브라우저 E2E 테스트
 * - 메인 웹사이트 로딩
 * - 캐셔 페이지 접근
 * - 창고 페이지 접근
 * - 주문 생성 후 캐셔 페이지 반영 확인
 */

const { test, expect } = require('@playwright/test');
const { adminLogin, cashierLogin, apiRequest, createOrder } = require('./helpers/api');

test.describe('메인 사이트 페이지 로딩', () => {
  test('메인 페이지 정상 로딩', async ({ page }) => {
    await page.goto('/');
    // 페이지 타이틀 또는 핵심 요소 확인
    await expect(page).toHaveURL(/localhost:3000/);
    // 페이지가 에러 없이 로드됐는지 확인
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });

  test('캐셔 페이지 정상 로딩', async ({ page }) => {
    await page.goto('/cashier.html');
    await expect(page).toHaveURL(/cashier\.html/);
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });

  test('창고 페이지 정상 로딩', async ({ page }) => {
    await page.goto('/warehouse.html');
    await expect(page).toHaveURL(/warehouse\.html/);
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });
});

test.describe('캐셔 로그인 후 주문 반영 확인 (브라우저)', () => {
  let cashierToken;
  let cashierId;
  let adminToken;
  const cashierName = `qa_browser_${Date.now()}`;

  test.beforeAll(async () => {
    adminToken = await adminLogin();
    // 테스트용 캐셔 계정 생성
    const { data } = await apiRequest('POST', '/api/cashiers',
      { name: cashierName, password: 'test1234' },
      { 'x-auth-token': adminToken }
    );
    cashierId = data.id;
    // 캐셔 로그인
    const loginRes = await apiRequest('POST', '/api/cashier/login', { name: cashierName, password: 'test1234' });
    cashierToken = loginRes.data.token;
  });

  test.afterAll(async () => {
    if (cashierId) {
      await apiRequest('DELETE', `/api/cashiers/${cashierId}`, null, { 'x-auth-token': adminToken });
    }
    await apiRequest('POST', '/api/auth/logout', null, { 'x-auth-token': adminToken });
  });

  test('캐셔 페이지에서 주문 API 조회', async ({ page }) => {
    // 주문 생성
    const { data: orderData } = await createOrder({
      type: 'pickup',
      items: [{ key: 'americano', name: '아메리카노', price: 3000, qty: 1 }],
      total: 3000,
      customerName: '브라우저테스트고객',
      customerPhone: '07711111111',
      arrivalTime: '14:00',
    });
    const orderId = orderData.order.id;

    // 캐셔 페이지 접속 + cashier-token 쿠키/스토리지 설정 대신 API 직접 검증
    const response = await page.request.get('http://localhost:3000/api/orders', {
      headers: { 'x-cashier-token': cashierToken }
    });
    const orders = await response.json();
    const found = orders.find(o => o.id === orderId);

    expect(found).toBeTruthy();
    expect(found.customer_name).toBe('브라우저테스트고객');
    expect(found.status).toBe('new');
  });

  test('캐셔가 주문 상태 변경 후 즉시 반영', async ({ page }) => {
    const { data: orderData } = await createOrder({
      type: 'pickup',
      items: [{ key: 'latte', name: '라떼', price: 4000, qty: 1 }],
      total: 4000,
      customerName: '상태반영테스트',
      customerPhone: '07711111112',
      arrivalTime: '15:00',
    });
    const orderId = orderData.order.id;

    // 캐셔 토큰으로 상태 변경
    const updateResponse = await page.request.put(`http://localhost:3000/api/orders/${orderId}/status`, {
      headers: {
        'x-cashier-token': cashierToken,
        'Content-Type': 'application/json',
      },
      data: { status: 'making' }
    });
    const updateData = await updateResponse.json();
    expect(updateData.success).toBe(true);
    expect(updateData.order.status).toBe('making');
    expect(updateData.order.cashier_name).toBe(cashierName);

    // 즉시 단건 조회로 반영 확인
    const checkResponse = await page.request.get(`http://localhost:3000/api/orders/${orderId}`);
    const checkData = await checkResponse.json();
    expect(checkData.status).toBe('making');
  });
});

test.describe('창고 페이지 재고 조회 (브라우저)', () => {
  let adminToken;

  test.beforeAll(async () => {
    adminToken = await adminLogin();
  });

  test.afterAll(async () => {
    await apiRequest('POST', '/api/auth/logout', null, { 'x-auth-token': adminToken });
  });

  test('재고 목록 API 조회', async ({ page }) => {
    const response = await page.request.get('http://localhost:3000/api/ingredients', {
      headers: { 'x-auth-token': adminToken },
    });
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
  });

  test('대시보드 API 조회', async ({ page }) => {
    const response = await page.request.get('http://localhost:3000/api/dashboard', {
      headers: { 'x-auth-token': adminToken },
    });
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.ingredients).toBeDefined();
    expect(data.low_stock).toBeDefined();
  });
});
