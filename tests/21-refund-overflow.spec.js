/**
 * 테스트 21: 부분 환불 누적 초과 방지
 * Fix #6 (priorQty validation in refund tx) 검증
 *
 * - 동일 주문에 대한 누적 환불 수량이 원주문 수량을 초과하면 400 거부
 * - 정상 범위 내 다회 부분 환불은 성공
 */

const { test, expect } = require('@playwright/test');
const { apiRequest, adminLogin, createOrder, updateOrderStatus } = require('./helpers/api');

test.describe('환불 누적 수량 초과 방지', () => {
  let adminToken;

  test.beforeAll(async () => {
    adminToken = await adminLogin();
  });

  test('원수량 4잔 → 2잔 환불 후 추가 3잔 환불 시도 → 400 거부', async () => {
    const items = [
      { key: 'americano', name: '아메리카노', nameAr: 'أمريكانو', price: 3000, qty: 4 }
    ];
    const { data: orderData } = await createOrder({
      type: 'pickup',
      items,
      total: 12000,
      customerName: 'RefundOverflowA',
      customerPhone: '07700000301',
      arrivalTime: '14:00',
    });
    const orderId = orderData.order.id;

    // 1차 부분 환불 — 2잔 (성공)
    const r1 = await apiRequest('POST', `/api/orders/${orderId}/refund`,
      { lines: [{ name: '아메리카노', qty: 2 }], total: 6000, full: false },
      { 'x-auth-token': adminToken }
    );
    expect(r1.status).toBe(200);
    expect(r1.data.success).toBe(true);

    // 2차 부분 환불 — 3잔 시도 (이미 2잔 환불 → 누적 5잔이 원수량 4잔 초과 → 거부)
    const r2 = await apiRequest('POST', `/api/orders/${orderId}/refund`,
      { lines: [{ name: '아메리카노', qty: 3 }], total: 9000, full: false },
      { 'x-auth-token': adminToken }
    );
    expect(r2.status).toBe(400);
    expect(r2.data.item).toBe('아메리카노');
    expect(r2.data.original).toBe(4);
    expect(r2.data.already_refunded).toBe(2);
    expect(r2.data.requested).toBe(3);
  });

  test('원수량 4잔 → 2잔 + 2잔 부분 환불은 모두 성공', async () => {
    const items = [
      { key: 'latte', name: '라떼', nameAr: 'لاتيه', price: 4000, qty: 4 }
    ];
    const { data: orderData } = await createOrder({
      type: 'pickup',
      items,
      total: 16000,
      customerName: 'RefundOverflowB',
      customerPhone: '07700000302',
      arrivalTime: '15:00',
    });
    const orderId = orderData.order.id;

    const r1 = await apiRequest('POST', `/api/orders/${orderId}/refund`,
      { lines: [{ name: '라떼', qty: 2 }], total: 8000, full: false },
      { 'x-auth-token': adminToken }
    );
    expect(r1.status).toBe(200);

    const r2 = await apiRequest('POST', `/api/orders/${orderId}/refund`,
      { lines: [{ name: '라떼', qty: 2 }], total: 8000, full: false },
      { 'x-auth-token': adminToken }
    );
    expect(r2.status).toBe(200);

    // 누적 4잔 = 원수량 → 1잔 추가 시도 → 거부
    const r3 = await apiRequest('POST', `/api/orders/${orderId}/refund`,
      { lines: [{ name: '라떼', qty: 1 }], total: 4000, full: false },
      { 'x-auth-token': adminToken }
    );
    expect(r3.status).toBe(400);
    expect(r3.data.original).toBe(4);
    expect(r3.data.already_refunded).toBe(4);
    expect(r3.data.requested).toBe(1);
  });

  test('단일 환불 한 번에 원수량 초과 시도 → 400 거부', async () => {
    const items = [
      { key: 'americano', name: '아메리카노', nameAr: 'أمريكانو', price: 3000, qty: 2 }
    ];
    const { data: orderData } = await createOrder({
      type: 'pickup',
      items,
      total: 6000,
      customerName: 'RefundOverflowC',
      customerPhone: '07700000303',
      arrivalTime: '16:00',
    });
    const orderId = orderData.order.id;

    const r = await apiRequest('POST', `/api/orders/${orderId}/refund`,
      { lines: [{ name: '아메리카노', qty: 5 }], total: 15000, full: false },
      { 'x-auth-token': adminToken }
    );
    expect(r.status).toBe(400);
    expect(r.data.original).toBe(2);
    expect(r.data.already_refunded).toBe(0);
    expect(r.data.requested).toBe(5);
  });

  test('인증 없이 환불 호출 거부', async () => {
    const items = [
      { key: 'americano', name: '아메리카노', nameAr: 'أمريكانو', price: 3000, qty: 1 }
    ];
    const { data: orderData } = await createOrder({
      type: 'pickup',
      items,
      total: 3000,
      customerName: 'RefundAuth',
      customerPhone: '07700000304',
      arrivalTime: '17:00',
    });
    const orderId = orderData.order.id;

    const { status } = await apiRequest('POST', `/api/orders/${orderId}/refund`,
      { lines: [{ name: '아메리카노', qty: 1 }], total: 3000, full: false }
    );
    expect(status).toBe(401);
  });
});
