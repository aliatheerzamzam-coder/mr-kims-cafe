/**
 * 테스트 22: 베스트셀러 TOP5 출처 검증
 * Fix #7 (top5는 orders 테이블에서 집계 + 환불 차감) 검증
 *
 * - top5 수량은 orders 테이블의 items 합산 결과
 * - 환불된 수량은 차감되어야 함
 * - daily_sales(즉석 처리) 테이블만으로는 보이지 않던 실제 주문이 반영됨
 */

const { test, expect } = require('@playwright/test');
const { apiRequest, adminLogin, createOrder } = require('./helpers/api');

test.describe('베스트셀러 TOP5 — orders 테이블 기반 집계', () => {
  let adminToken;

  test.beforeAll(async () => {
    adminToken = await adminLogin();
  });

  async function getDayTop5() {
    const { status, data } = await apiRequest('GET', '/api/sales/summary?period=day', null, { 'x-auth-token': adminToken });
    expect(status).toBe(200);
    expect(Array.isArray(data.top5)).toBe(true);
    const map = new Map();
    for (const row of data.top5) map.set(row.menu_item, row.total_qty);
    return map;
  }

  function qtyOf(map, name) {
    return map.get(name) || 0;
  }

  test('주문 생성 시 top5에 수량 누적, 환불 시 차감', async () => {
    const americano = '아메리카노';
    const latte = '라떼';

    // 0) 베이스라인 캡쳐 (다른 테스트의 잔여 영향 제외)
    const before = await getDayTop5();
    const baseAm = qtyOf(before, americano);
    const baseLa = qtyOf(before, latte);

    // 1) 신규 주문: 아메리카노 5잔
    const o1 = await createOrder({
      type: 'pickup',
      items: [{ key: 'americano', name: americano, nameAr: 'أمريكانو', price: 3000, qty: 5 }],
      total: 15000,
      customerName: 'BestsellerA',
      customerPhone: '07700000401',
      arrivalTime: '14:00',
    });
    expect(o1.status).toBe(200);
    const order1Id = o1.data.order.id;

    // 2) 신규 주문: 라떼 3잔
    const o2 = await createOrder({
      type: 'pickup',
      items: [{ key: 'latte', name: latte, nameAr: 'لاتيه', price: 4000, qty: 3 }],
      total: 12000,
      customerName: 'BestsellerB',
      customerPhone: '07700000402',
      arrivalTime: '15:00',
    });
    expect(o2.status).toBe(200);

    // 3) 추가 주문 (혼합): 아메리카노 2잔 + 라떼 1잔
    const o3 = await createOrder({
      type: 'pickup',
      items: [
        { key: 'americano', name: americano, nameAr: 'أمريكانو', price: 3000, qty: 2 },
        { key: 'latte', name: latte, nameAr: 'لاتيه', price: 4000, qty: 1 },
      ],
      total: 10000,
      customerName: 'BestsellerC',
      customerPhone: '07700000403',
      arrivalTime: '16:00',
    });
    expect(o3.status).toBe(200);

    // 4) 누적 수량 확인 (아메리카노 +7, 라떼 +4)
    const afterCreate = await getDayTop5();
    expect(qtyOf(afterCreate, americano) - baseAm).toBe(7);
    expect(qtyOf(afterCreate, latte) - baseLa).toBe(4);

    // 5) 첫 주문에서 아메리카노 2잔 부분 환불 → top5 차감 확인
    const r1 = await apiRequest('POST', `/api/orders/${order1Id}/refund`,
      { lines: [{ name: americano, qty: 2 }], total: 6000, full: false },
      { 'x-auth-token': adminToken }
    );
    expect(r1.status).toBe(200);

    const afterRefund = await getDayTop5();
    // 아메리카노: +7 했다가 -2 → +5 누적
    expect(qtyOf(afterRefund, americano) - baseAm).toBe(5);
    // 라떼는 그대로 +4
    expect(qtyOf(afterRefund, latte) - baseLa).toBe(4);
  });

  test('전액 환불(full=true)도 top5에서 차감된다', async () => {
    const item = '아메리카노';
    const before = await getDayTop5();
    const baseQty = before.get(item) || 0;

    const o = await createOrder({
      type: 'pickup',
      items: [{ key: 'americano', name: item, nameAr: 'أمريكانو', price: 3000, qty: 4 }],
      total: 12000,
      customerName: 'BestsellerD',
      customerPhone: '07700000404',
      arrivalTime: '17:00',
    });
    expect(o.status).toBe(200);
    const orderId = o.data.order.id;

    const afterCreate = await getDayTop5();
    expect((afterCreate.get(item) || 0) - baseQty).toBe(4);

    // 전액 환불
    const r = await apiRequest('POST', `/api/orders/${orderId}/refund`,
      { lines: [{ name: item, qty: 4 }], total: 12000, full: true },
      { 'x-auth-token': adminToken }
    );
    expect(r.status).toBe(200);

    const afterRefund = await getDayTop5();
    // 4잔 모두 환불 → 다시 baseQty와 동일
    expect((afterRefund.get(item) || 0) - baseQty).toBe(0);
  });

  test('인증 없이 sales/summary 호출 거부', async () => {
    const { status } = await apiRequest('GET', '/api/sales/summary?period=day');
    expect([401, 403]).toContain(status);
  });
});
