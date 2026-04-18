/**
 * 테스트 13: 30명+ 동시 주문 스트레스 테스트
 * - dine-in / pickup 혼합 30개 이상 동시 주문
 * - 서버 안정성 (모두 200 응답)
 * - 주문 번호 고유성
 * - 캐셔 뷰에서 모든 타입 정상 노출
 */

const { test, expect } = require('@playwright/test');
const { createOrder, getOrders, apiRequest, cashierLogin, startDineSession } = require('./helpers/api');

const MENU = [
  { key: 'americano', name: '아메리카노', price: 3000, qty: 1 },
  { key: 'latte',     name: '라떼',       price: 4500, qty: 1 },
  { key: 'matcha',    name: '말차',       price: 5000, qty: 1 },
];

function randomMenu() {
  return [MENU[Math.floor(Math.random() * MENU.length)]];
}

test.describe('30명 동시 주문 — dine-in/pickup 혼합 스트레스', () => {
  const N = 30;
  let results;
  let cashierToken;
  // table_num=1 에 해당하는 QR 토큰 (DB에 미리 등록된 값)
  const TABLE_QR_TOKEN = '4b761ad17112c84f';

  test.beforeAll(async () => {
    cashierToken = await cashierLogin();

    // dine-in 세션 1개 발급 (동일 세션으로 여러 주문 가능)
    const dineSessionToken = await startDineSession(TABLE_QR_TOKEN);

    const promises = Array.from({ length: N }, (_, i) => {
      const isDine = i % 2 === 0; // 홀짝으로 절반씩 혼합
      const items = randomMenu();
      const total = items[0].price;

      if (isDine) {
        return createOrder({
          type: 'dine',
          items,
          total,
          customerName: `스트레스다인${i}`,
          customerPhone: `0790${String(i).padStart(5, '0')}`,
          dineSessionToken,
        });
      } else {
        return createOrder({
          type: 'pickup',
          items,
          total,
          customerName: `스트레스픽업${i}`,
          customerPhone: `0791${String(i).padStart(5, '0')}`,
          arrivalTime: '16:00',
        });
      }
    });

    results = await Promise.all(promises);
  }, 30000); // 타임아웃 30초

  test('30개 주문 모두 200 응답', () => {
    const failed = results.filter(r => r.status !== 200);
    if (failed.length > 0) {
      console.error('실패한 주문:', failed.map(r => r.data));
    }
    expect(failed.length).toBe(0);
  });

  test('30개 주문 번호(num) 모두 고유', () => {
    const nums = results.map(r => r.data.order?.num).filter(Boolean);
    const unique = new Set(nums);
    expect(unique.size).toBe(N);
  });

  test('30개 주문 ID 모두 고유', () => {
    const ids = results.map(r => r.data.order?.id).filter(Boolean);
    const unique = new Set(ids);
    expect(unique.size).toBe(N);
  });

  test('dine-in 주문 15개 모두 type=dine 확인', () => {
    const dineResults = results.filter((_, i) => i % 2 === 0);
    for (const { data } of dineResults) {
      expect(data.order.type).toBe('dine');
    }
  });

  test('pickup 주문 15개 모두 type=pickup 확인', () => {
    const pickupResults = results.filter((_, i) => i % 2 !== 0);
    for (const { data } of pickupResults) {
      expect(data.order.type).toBe('pickup');
    }
  });

  test('캐셔 뷰에서 30개 주문 모두 조회됨', async () => {
    const { status, data } = await apiRequest(
      'GET',
      '/api/orders',
      null,
      { 'x-cashier-token': cashierToken }
    );
    expect(status).toBe(200);

    const createdIds = new Set(results.map(r => r.data.order?.id).filter(Boolean));
    const returnedIds = new Set(data.map(o => o.id));

    for (const id of createdIds) {
      expect(returnedIds.has(id)).toBe(true);
    }
  });

  test('캐셔 뷰에 dine-in과 pickup 타입 모두 포함', async () => {
    const { data } = await apiRequest(
      'GET',
      '/api/orders',
      null,
      { 'x-cashier-token': cashierToken }
    );

    const createdIds = new Set(results.map(r => r.data.order?.id).filter(Boolean));
    const myOrders = data.filter(o => createdIds.has(o.id));

    const types = new Set(myOrders.map(o => o.type));
    expect(types.has('dine')).toBe(true);
    expect(types.has('pickup')).toBe(true);
  });

  test('서버가 30개 처리 후에도 추가 주문 정상 처리', async () => {
    const { status, data } = await createOrder({
      type: 'pickup',
      items: [{ key: 'americano', name: '아메리카노', price: 3000, qty: 1 }],
      total: 3000,
      customerName: '스트레스후추가',
      customerPhone: '07900099999',
      arrivalTime: '17:00',
    });
    expect(status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.order.id).toBeTruthy();
  });
});

test.describe('30명+ 연속 상태 변경 — 서버 안정성', () => {
  const TABLE_QR_TOKEN = '4b761ad17112c84f';

  test('15개 주문 동시 making 상태 변경', async () => {
    const cashierToken = await cashierLogin();
    const dineSessionToken = await startDineSession(TABLE_QR_TOKEN);

    // 새 주문 15개 생성 (dine/pickup 혼합 — dine은 세션 토큰 필요)
    const orders = await Promise.all(
      Array.from({ length: 15 }, (_, i) =>
        i % 2 === 0
          ? createOrder({
              type: 'dine',
              items: [{ key: 'americano', name: '아메리카노', price: 3000, qty: 1 }],
              total: 3000,
              customerName: `상태변경테스트${i}`,
              customerPhone: `0792${String(i).padStart(5, '0')}`,
              dineSessionToken,
            })
          : createOrder({
              type: 'pickup',
              items: [{ key: 'americano', name: '아메리카노', price: 3000, qty: 1 }],
              total: 3000,
              customerName: `상태변경테스트${i}`,
              customerPhone: `0792${String(i).padStart(5, '0')}`,
              arrivalTime: '18:00',
            })
      )
    );

    const orderIds = orders.map(r => r.data.order?.id).filter(Boolean);
    expect(orderIds.length).toBe(15);

    // 15개 동시 상태 변경
    const statusResults = await Promise.all(
      orderIds.map(id =>
        apiRequest(
          'PUT',
          `/api/orders/${id}/status`,
          { status: 'making' },
          { 'x-cashier-token': cashierToken }
        )
      )
    );

    const failed = statusResults.filter(r => r.status !== 200);
    expect(failed.length).toBe(0);
  });
});
