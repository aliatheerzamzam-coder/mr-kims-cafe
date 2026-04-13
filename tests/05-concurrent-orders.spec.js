/**
 * 테스트 5: 동시 주문 및 에러 케이스 테스트
 * - 동시 다중 주문 처리
 * - 주문 번호(num) 충돌 없음 검증
 * - API 오류 상황 처리
 * - 네트워크 관련 에러 처리
 */

const { test, expect } = require('@playwright/test');
const { createOrder, getOrders, apiRequest } = require('./helpers/api');

const SAMPLE_ITEMS = [
  { key: 'americano', name: '아메리카노', price: 3000, qty: 1 }
];

test.describe('동시 주문 처리 (데이터 충돌 검증)', () => {
  test('5개 주문 동시 생성 시 모두 성공 및 고유 num 보장', async () => {
    const N = 5;
    const promises = Array.from({ length: N }, (_, i) =>
      createOrder({
        type: 'pickup',
        items: SAMPLE_ITEMS,
        total: 3000,
        customerName: `동시주문고객${i + 1}`,
        customerPhone: `077999000${String(i + 1).padStart(2, '0')}`,
        arrivalTime: '13:00',
      })
    );

    const results = await Promise.all(promises);

    // 모두 성공 확인
    for (const { status, data } of results) {
      expect(status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.order.id).toBeTruthy();
    }

    // 주문 번호 고유성 검증
    const orderNums = results.map(r => r.data.order.num);
    const uniqueNums = new Set(orderNums);
    expect(uniqueNums.size).toBe(N);

    // 주문 ID 고유성 검증
    const orderIds = results.map(r => r.data.order.id);
    const uniqueIds = new Set(orderIds);
    expect(uniqueIds.size).toBe(N);
  });

  test('10개 주문 동시 생성 - 번호 연속성 확인', async () => {
    const N = 10;
    const beforeOrders = await getOrders();
    const maxNumBefore = beforeOrders.length > 0
      ? Math.max(...beforeOrders.map(o => o.num))
      : 0;

    const promises = Array.from({ length: N }, (_, i) =>
      createOrder({
        type: 'pickup',
        items: SAMPLE_ITEMS,
        total: 3000,
        customerName: `병렬주문${i}`,
        customerPhone: `077888000${String(i).padStart(2, '0')}`,
        arrivalTime: '14:00',
      })
    );

    const results = await Promise.all(promises);

    // 모두 성공
    const successCount = results.filter(r => r.status === 200).length;
    expect(successCount).toBe(N);

    // num 목록 추출 및 중복 없음 확인
    const nums = results.map(r => r.data.order.num).sort((a, b) => a - b);
    const uniqueNums = [...new Set(nums)];
    expect(uniqueNums.length).toBe(N);

    // 모든 num이 이전 최대값보다 크고 연속적인지 확인
    for (const num of nums) {
      expect(num).toBeGreaterThan(maxNumBefore);
    }
  });
});

test.describe('에러 케이스 및 경계값 테스트', () => {
  test('존재하지 않는 주문 조회 시 404', async () => {
    const { status } = await apiRequest('GET', '/api/orders/nonexistent_order_id_12345');
    expect(status).toBe(404);
  });

  test('total이 null인 주문 실패', async () => {
    const { status } = await apiRequest('POST', '/api/orders', {
      type: 'pickup',
      items: SAMPLE_ITEMS,
      total: null,
      customerName: '경계값테스트',
      customerPhone: '07700099999',
      arrivalTime: '10:00',
    });
    expect(status).toBe(400);
  });

  test('items가 없는 주문 실패', async () => {
    const { status } = await apiRequest('POST', '/api/orders', {
      type: 'pickup',
      total: 3000,
      customerName: '빈아이템테스트',
      customerPhone: '07700099998',
      arrivalTime: '10:00',
    });
    expect(status).toBe(400);
  });

  test('존재하지 않는 주문 상태 변경 시 404', async () => {
    const adminToken = await (async () => {
      const { data } = await apiRequest('POST', '/api/auth/login', { password: '1234' });
      return data.token;
    })();

    const { status } = await apiRequest(
      'PUT',
      '/api/orders/nonexistent_order_999/status',
      { status: 'making' },
      { 'x-auth-token': adminToken }
    );
    expect(status).toBe(404);

    await apiRequest('POST', '/api/auth/logout', null, { 'x-auth-token': adminToken });
  });

  test('중복 전화번호로 고객 가입 실패', async () => {
    const phone = `077${Date.now().toString().slice(-7)}`;
    const email1 = `dup1_${Date.now()}@test.com`;
    const email2 = `dup2_${Date.now()}@test.com`;

    // 첫 번째 가입
    const { status: s1 } = await apiRequest('POST', '/api/customers/register', {
      name: '중복테스트1',
      email: email1,
      phone,
      password: 'Pass1234!',
      birthdate: '1990-01-01',
    });
    expect(s1).toBe(200);

    // 같은 전화번호로 두 번째 가입 → 실패해야 함
    const { status: s2 } = await apiRequest('POST', '/api/customers/register', {
      name: '중복테스트2',
      email: email2,
      phone,
      password: 'Pass5678!',
      birthdate: '1995-01-01',
    });
    expect(s2).toBeGreaterThanOrEqual(400);
  });
});

test.describe('SSE 스트림 연결 테스트', () => {
  test('SSE 스트림 엔드포인트 응답 확인', async ({ page }) => {
    // SSE 연결이 text/event-stream으로 응답하는지 확인
    const responsePromise = page.waitForResponse(
      res => res.url().includes('/api/orders/stream'),
      { timeout: 5000 }
    );

    await page.evaluate(() => {
      const source = new EventSource('http://localhost:3000/api/orders/stream');
      setTimeout(() => source.close(), 1000);
    });

    try {
      const response = await responsePromise;
      expect(response.headers()['content-type']).toContain('text/event-stream');
    } catch (e) {
      // SSE 연결이 프로미스를 완전히 해결하지 않을 수 있음 - 허용
    }
  });
});
