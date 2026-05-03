/**
 * 테스트 20: 주문 상태 변경 동시성 + 스탬프 멱등성
 * Fix #3 (atomic transitionedToDone) + Fix #4 (uniq_stamp_earn_order index) 검증
 *
 * - 같은 주문에 대해 N개의 PUT done 동시 호출 → 주문은 단 1번만 'done'으로 전이
 * - 등록 고객의 주문이라면 stamp_history 적립도 정확히 1건만 발생
 */

const { test, expect } = require('@playwright/test');
const { apiRequest, adminLogin, registerCustomer, customerLogin, createOrder, updateOrderStatus } = require('./helpers/api');

const SAMPLE_ITEMS = [
  { key: 'americano', name: '아메리카노', nameAr: 'أمريكانو', price: 3000, qty: 1 }
];

test.describe('주문 done 전이 + 스탬프 적립 멱등성', () => {
  let adminToken;

  test.beforeAll(async () => {
    adminToken = await adminLogin();
  });

  test('동일 주문에 대한 동시 done 전이는 1회만 성공', async () => {
    const { data: orderData } = await createOrder({
      type: 'pickup',
      items: SAMPLE_ITEMS,
      total: 3000,
      customerName: 'RaceTester',
      customerPhone: '07700000201',
      arrivalTime: '14:00',
    });
    const orderId = orderData.order.id;

    // 10개 PUT done 동시 호출
    const promises = [];
    for (let i = 0; i < 10; i++) {
      promises.push(updateOrderStatus(orderId, 'done', { adminToken }));
    }
    const results = await Promise.all(promises);

    // 모두 200 OK 응답 (동시 호출이지만 멱등 보장)
    for (const r of results) {
      expect(r.status).toBe(200);
      expect(r.data.order.status).toBe('done');
    }

    // 최종 상태 확인
    const { status, data: finalOrder } = await apiRequest('GET', `/api/orders/${orderId}`, null, { 'x-auth-token': adminToken });
    expect(status).toBe(200);
    expect(finalOrder.status).toBe('done');
  });

  test('등록 고객 주문 동시 done → stamp 적립은 정확히 1회', async () => {
    const phone = `0779${Date.now().toString().slice(-7)}`;
    const { data: regData } = await registerCustomer(phone, 'Pass1234!', 'StampRaceTester');
    const customerToken = regData.token;

    // 적립 전 스탬프 수 조회
    const beforeRes = await apiRequest('GET', '/api/customers/stamps', null, { 'x-customer-token': customerToken });
    const beforeAvailable = (beforeRes.data && beforeRes.data.available) || 0;
    const beforeEarned = (beforeRes.data && beforeRes.data.total_earned) || 0;

    // 등록 고객으로 주문 생성
    const { data: orderData } = await createOrder({
      type: 'pickup',
      items: SAMPLE_ITEMS,
      total: 3000,
      arrivalTime: '15:00',
      customerToken,
    });
    const orderId = orderData.order.id;

    // 8개 동시 PUT done
    const promises = [];
    for (let i = 0; i < 8; i++) {
      promises.push(updateOrderStatus(orderId, 'done', { adminToken }));
    }
    await Promise.all(promises);

    // 적립 후 스탬프 수 조회 (재시도 — broadcastSSE 후 DB 커밋 시점 보장)
    let afterAvailable = beforeAvailable;
    let afterEarned = beforeEarned;
    for (let i = 0; i < 5; i++) {
      const r = await apiRequest('GET', '/api/customers/stamps', null, { 'x-customer-token': customerToken });
      afterAvailable = (r.data && r.data.available) || 0;
      afterEarned = (r.data && r.data.total_earned) || 0;
      if (afterEarned > beforeEarned) break;
      await new Promise(res => setTimeout(res, 100));
    }

    // 정확히 +1 적립 (동시 8회 호출에도 멱등 보장)
    expect(afterEarned - beforeEarned).toBe(1);
    expect(afterAvailable - beforeAvailable).toBe(1);
  });

  test('이미 done인 주문에 다시 done 호출해도 추가 스탬프 없음', async () => {
    const phone = `0778${Date.now().toString().slice(-7)}`;
    const { data: regData } = await registerCustomer(phone, 'Pass1234!', 'IdempotentTester');
    const customerToken = regData.token;

    const { data: orderData } = await createOrder({
      type: 'pickup',
      items: SAMPLE_ITEMS,
      total: 3000,
      arrivalTime: '16:00',
      customerToken,
    });
    const orderId = orderData.order.id;

    // 첫 번째 done — 스탬프 1개 적립되어야 함
    await updateOrderStatus(orderId, 'done', { adminToken });

    let firstAvailable = 0;
    for (let i = 0; i < 5; i++) {
      const r = await apiRequest('GET', '/api/customers/stamps', null, { 'x-customer-token': customerToken });
      firstAvailable = (r.data && r.data.available) || 0;
      if (firstAvailable >= 1) break;
      await new Promise(res => setTimeout(res, 100));
    }
    expect(firstAvailable).toBeGreaterThanOrEqual(1);

    // 두 번째, 세 번째 done — 추가 적립 없어야 함
    await updateOrderStatus(orderId, 'done', { adminToken });
    await updateOrderStatus(orderId, 'done', { adminToken });
    await new Promise(res => setTimeout(res, 200));

    const r2 = await apiRequest('GET', '/api/customers/stamps', null, { 'x-customer-token': customerToken });
    const finalAvailable = (r2.data && r2.data.available) || 0;
    expect(finalAvailable).toBe(firstAvailable);
  });
});
