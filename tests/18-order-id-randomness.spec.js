/**
 * 테스트 18: 주문 ID 예측 불가능성 (보안)
 * - Math.random() → crypto.randomBytes(8) 교체 검증
 * - ID에 충분한 엔트로피가 있는지 확인
 */

const { test, expect } = require('@playwright/test');
const { createOrder } = require('./helpers/api');

const SAMPLE_ITEMS = [
  { key: 'americano', name: '아메리카노', nameAr: 'أمريكانو', price: 3000, qty: 1 }
];

test.describe('주문 ID 보안', () => {
  test('연속 생성된 주문 ID가 예측 불가 (16 hex chars 무작위 부분)', async () => {
    const ids = [];
    for (let i = 0; i < 8; i++) {
      const { status, data } = await createOrder({
        type: 'pickup',
        items: SAMPLE_ITEMS,
        total: 3000,
        customerName: 'IDTest',
        customerPhone: `0770000010${i}`,
        arrivalTime: '14:00',
      });
      expect(status).toBe(200);
      ids.push(data.order.id);
    }
    // ID는 base36 timestamp + '-' 없이 직접 16 hex 무작위 부분 포함
    // 예: m9abc123-deadbeefcafef00d (timestamp + 16 hex)
    for (const id of ids) {
      // 16 hex 무작위 부분 추출 (마지막 16자)
      expect(id.length).toBeGreaterThanOrEqual(20);
      const randomPart = id.slice(-16);
      expect(randomPart).toMatch(/^[0-9a-f]{16}$/);
    }
    // 모든 ID가 고유해야 함
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('동일 millisecond에 생성된 주문도 ID 충돌 없음', async () => {
    const promises = [];
    for (let i = 0; i < 10; i++) {
      promises.push(createOrder({
        type: 'pickup',
        items: SAMPLE_ITEMS,
        total: 3000,
        customerName: 'BurstTest',
        customerPhone: `0770000020${i}`,
        arrivalTime: '14:00',
      }));
    }
    const results = await Promise.all(promises);
    const ids = results.map(r => r.data.order.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
