/**
 * 테스트 19: GET /api/orders/:id 인증 강화
 * - 인증 없이 호출 시 최소 필드만 반환
 * - 관리자/캐셔/고객 본인은 전체 필드 반환
 * - 다른 고객 토큰으로는 접근 불가
 */

const { test, expect } = require('@playwright/test');
const { apiRequest, adminLogin, cashierLogin, registerCustomer, createOrder } = require('./helpers/api');

const SAMPLE_ITEMS = [
  { key: 'americano', name: '아메리카노', nameAr: 'أمريكانو', price: 3000, qty: 1 }
];

test.describe('GET /api/orders/:id 인증', () => {
  let orderId;
  let customerToken;

  test.beforeAll(async () => {
    const phone = `0779${Date.now().toString().slice(-7)}`;
    const { data: regData } = await registerCustomer(phone, 'Pass1234!', 'AuthTester');
    customerToken = regData.token;
    const { data } = await createOrder({
      type: 'pickup', items: SAMPLE_ITEMS, total: 3000,
      arrivalTime: '14:00', customerToken,
    });
    orderId = data.order.id;
  });

  test('인증 없이 호출 시 최소 필드만 반환 (PII 노출 차단)', async () => {
    const { status, data } = await apiRequest('GET', `/api/orders/${orderId}`);
    expect(status).toBe(200);
    // 최소 필드만
    expect(data.id).toBe(orderId);
    expect(data.status).toBeDefined();
    expect(data.type).toBeDefined();
    // 민감 필드 없어야 함
    expect(data.customer_phone).toBeUndefined();
    expect(data.customer_name).toBeUndefined();
    expect(data.items).toBeUndefined();
    expect(data.total).toBeUndefined();
    expect(data.cashier_name).toBeUndefined();
  });

  test('관리자 토큰으로 호출 시 전체 필드 반환', async () => {
    const adminToken = await adminLogin();
    const { status, data } = await apiRequest('GET', `/api/orders/${orderId}`, null, { 'x-auth-token': adminToken });
    expect(status).toBe(200);
    expect(data.id).toBe(orderId);
    expect(data.items).toBeDefined();
    expect(data.total).toBe(3000);
  });

  test('캐셔 토큰으로 호출 시 전체 필드 반환', async () => {
    const cashierToken = await cashierLogin();
    const { status, data } = await apiRequest('GET', `/api/orders/${orderId}`, null, { 'x-cashier-token': cashierToken });
    expect(status).toBe(200);
    expect(data.items).toBeDefined();
  });

  test('주문한 고객 본인 토큰으로 호출 시 전체 필드 반환', async () => {
    const { status, data } = await apiRequest('GET', `/api/orders/${orderId}`, null, { 'x-customer-token': customerToken });
    expect(status).toBe(200);
    expect(data.items).toBeDefined();
    expect(data.total).toBe(3000);
  });

  test('다른 고객의 토큰으로 호출 시 최소 필드만 반환', async () => {
    const otherPhone = `0778${Date.now().toString().slice(-7)}`;
    const { data: otherReg } = await registerCustomer(otherPhone, 'Pass1234!', 'OtherCustomer');
    const { status, data } = await apiRequest('GET', `/api/orders/${orderId}`, null, { 'x-customer-token': otherReg.token });
    expect(status).toBe(200);
    expect(data.items).toBeUndefined();
    expect(data.total).toBeUndefined();
    expect(data.customer_phone).toBeUndefined();
  });

  test('잘못된(만료된) 관리자 토큰은 인증 거부 (최소 필드만)', async () => {
    const { status, data } = await apiRequest('GET', `/api/orders/${orderId}`, null, { 'x-auth-token': 'bogus_invalid_token' });
    expect(status).toBe(200);
    expect(data.items).toBeUndefined();
  });
});
