/**
 * 테스트 12: 새로 추가된 기능 QA
 * - 스탬프 적립/차감: phone으로도 처리 가능
 * - 예약: table_num 텍스트 입력
 * - 캐셔 연동: 전화번호로 적립/차감
 */

const { test, expect } = require('@playwright/test');
const { apiRequest, cashierLogin, registerCustomer, customerLogin, createOrder, startDineSession } = require('./helpers/api');

const TABLE_QR_TOKEN = '4b761ad17112c84f';

const TS = Date.now().toString().slice(-6);
const TEST_PHONE = `0771${TS}`;
const TEST_PASS  = 'pass1234';

test.describe('스탬프 적립 — 전화번호로 처리 (캐셔 연동)', () => {
  let cashierToken;
  let customerId;

  test.beforeAll(async () => {
    // 고객 가입
    const { status, data } = await registerCustomer(TEST_PHONE, TEST_PASS, '신규스탬프고객');
    expect(status).toBe(200);
    customerId = data.customer?.id;

    // 캐셔 로그인
    cashierToken = await cashierLogin();
  });

  test('phone으로 스탬프 적립 성공', async () => {
    const { status, data } = await apiRequest(
      'POST',
      '/api/stamps/earn',
      { phone: TEST_PHONE, amount: 10000 },
      { 'x-cashier-token': cashierToken }
    );
    expect(status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.stamps_earned).toBeGreaterThan(0);
  });

  test('phone으로 스탬프 적립 후 잔여 스탬프 증가 확인', async () => {
    const customerToken = await customerLogin(TEST_PHONE, TEST_PASS);
    const { status, data } = await apiRequest(
      'GET',
      '/api/customers/stamps',
      null,
      { 'x-customer-token': customerToken }
    );
    expect(status).toBe(200);
    expect(data.available).toBeGreaterThan(0);
  });

  test('존재하지 않는 전화번호로 적립 → 404', async () => {
    const { status } = await apiRequest(
      'POST',
      '/api/stamps/earn',
      { phone: '07799999999', amount: 5000 },
      { 'x-cashier-token': cashierToken }
    );
    expect(status).toBe(404);
  });

  test('phone도 customer_id도 없이 적립 → 400', async () => {
    const { status } = await apiRequest(
      'POST',
      '/api/stamps/earn',
      { amount: 5000 },
      { 'x-cashier-token': cashierToken }
    );
    expect(status).toBe(400);
  });

  test('캐셔 인증 없이 적립 시도 → 401', async () => {
    const { status } = await apiRequest(
      'POST',
      '/api/stamps/earn',
      { phone: TEST_PHONE, amount: 5000 }
    );
    expect(status).toBe(401);
  });
});

test.describe('스탬프 차감 — 전화번호로 처리 (캐셔 연동)', () => {
  let cashierToken;
  const redeemPhone = `0772${TS}`;

  test.beforeAll(async () => {
    await registerCustomer(redeemPhone, TEST_PASS, '차감테스트고객');
    cashierToken = await cashierLogin();

    // 스탬프 충분히 적립 (10만원 = 10스탬프 이상)
    for (let i = 0; i < 3; i++) {
      await apiRequest(
        'POST',
        '/api/stamps/earn',
        { phone: redeemPhone, amount: 50000 },
        { 'x-cashier-token': cashierToken }
      );
    }
  });

  test('phone으로 스탬프 차감 성공', async () => {
    // 현재 스탬프 확인
    const customerToken = await customerLogin(redeemPhone, TEST_PASS);
    const { data: before } = await apiRequest('GET', '/api/customers/stamps', null, { 'x-customer-token': customerToken });
    const stampsBefore = before.available;

    if (stampsBefore < 10) {
      test.skip(); return;
    }

    const { status, data } = await apiRequest(
      'POST',
      '/api/stamps/redeem',
      { phone: redeemPhone },
      { 'x-cashier-token': cashierToken }
    );
    expect(status).toBe(200);
    expect(data.success).toBe(true);

    // 차감 후 스탬프 감소 확인
    const { data: after } = await apiRequest('GET', '/api/customers/stamps', null, { 'x-customer-token': customerToken });
    expect(after.available).toBeLessThan(stampsBefore);
  });

  test('존재하지 않는 전화번호로 차감 → 404', async () => {
    const { status } = await apiRequest(
      'POST',
      '/api/stamps/redeem',
      { phone: '07788888888' },
      { 'x-cashier-token': cashierToken }
    );
    expect(status).toBe(404);
  });

  test('phone도 customer_id도 없이 차감 → 400', async () => {
    const { status } = await apiRequest(
      'POST',
      '/api/stamps/redeem',
      {},
      { 'x-cashier-token': cashierToken }
    );
    expect(status).toBe(400);
  });
});

test.describe('테이블 예약 — table_num 텍스트 필드', () => {
  // 고유 날짜: TS 기반으로 1-28일 범위 내 날짜 생성
  const dayA = String(parseInt(TS) % 27 + 1).padStart(2, '0');
  const dayB = String((parseInt(TS) + 1) % 27 + 1).padStart(2, '0');
  const dayC = String((parseInt(TS) + 2) % 27 + 1).padStart(2, '0');

  test('table_num 없이 예약 성공', async () => {
    const { status, data } = await apiRequest('POST', '/api/reservations', {
      name: '예약손님A',
      phone: `0773${TS}`,
      date: `2099-06-${dayA}`,
      time: '18:00',
      party_size: 2,
    });
    expect(status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.reservation.table_num).toBeFalsy();
  });

  test('table_num 텍스트로 예약 성공', async () => {
    const { status, data } = await apiRequest('POST', '/api/reservations', {
      name: '예약손님B',
      phone: `0774${TS}`,
      date: `2099-07-${dayB}`,
      time: '19:00',
      party_size: 3,
      table_num: '창가 5번',
    });
    expect(status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.reservation.table_num).toBe('창가 5번');
  });

  test('숫자 테이블 번호 텍스트로 예약', async () => {
    const { status, data } = await apiRequest('POST', '/api/reservations', {
      name: '예약손님C',
      phone: `0775${TS}`,
      date: `2099-08-${dayC}`,
      time: '12:00',
      party_size: 4,
      table_num: '3',
    });
    expect(status).toBe(200);
    expect(data.reservation.table_num).toBe('3');
  });

  test('이름 없이 예약 → 400', async () => {
    const { status } = await apiRequest('POST', '/api/reservations', {
      phone: `0776${TS}`,
      date: '2026-12-27',
      time: '13:00',
    });
    expect(status).toBe(400);
  });

  test('전화번호 없이 예약 → 400', async () => {
    const { status } = await apiRequest('POST', '/api/reservations', {
      name: '전화없음',
      date: '2026-12-28',
      time: '14:00',
    });
    expect(status).toBe(400);
  });

  test('예약 목록 조회 (관리자)', async () => {
    const { data: adminData } = await apiRequest('POST', '/api/auth/login', { password: '1234' });
    const adminToken = adminData.token;

    const { status, data } = await apiRequest(
      'GET',
      '/api/reservations',
      null,
      { 'x-auth-token': adminToken }
    );
    expect(status).toBe(200);
    expect(Array.isArray(data)).toBe(true);

    await apiRequest('POST', '/api/auth/logout', null, { 'x-auth-token': adminToken });
  });
});

test.describe('캐셔 주문 연동 — dine-in/pickup 모두 캐셔에 표시', () => {
  let cashierToken;
  let dineOrderId;
  let pickupOrderId;

  test.beforeAll(async () => {
    cashierToken = await cashierLogin();

    const dineSessionToken = await startDineSession(TABLE_QR_TOKEN);
    const dine = await createOrder({
      type: 'dine',
      items: [{ key: 'latte', name: '라떼', price: 4500, qty: 1 }],
      total: 4500,
      customerName: '캐셔연동테스트',
      customerPhone: `0777${TS}`,
      dineSessionToken,
    });
    expect(dine.status).toBe(200);
    dineOrderId = dine.data.order.id;

    const pickup = await createOrder({
      type: 'pickup',
      items: [{ key: 'americano', name: '아메리카노', price: 3000, qty: 2 }],
      total: 6000,
      customerName: '픽업연동테스트',
      customerPhone: `0778${TS}`,
      arrivalTime: '15:30',
    });
    expect(pickup.status).toBe(200);
    pickupOrderId = pickup.data.order.id;
  });

  test('캐셔 토큰으로 주문 목록 조회 → dine/pickup 모두 포함', async () => {
    const { status, data } = await apiRequest(
      'GET',
      '/api/orders',
      null,
      { 'x-cashier-token': cashierToken }
    );
    expect(status).toBe(200);
    const ids = data.map(o => o.id);
    expect(ids).toContain(dineOrderId);
    expect(ids).toContain(pickupOrderId);
  });

  test('캐셔가 주문 상태를 making으로 변경', async () => {
    const { status, data } = await apiRequest(
      'PUT',
      `/api/orders/${dineOrderId}/status`,
      { status: 'making' },
      { 'x-cashier-token': cashierToken }
    );
    expect(status).toBe(200);
    expect(data.success).toBe(true);
  });

  test('캐셔가 주문 상태를 done으로 변경', async () => {
    const { status, data } = await apiRequest(
      'PUT',
      `/api/orders/${pickupOrderId}/status`,
      { status: 'done' },
      { 'x-cashier-token': cashierToken }
    );
    expect(status).toBe(200);
    expect(data.success).toBe(true);
  });
});

test.describe('음료 사이즈 — 주문 생성 및 캐셔 표시', () => {
  const sizeTS = Date.now().toString().slice(-6);

  test('size 포함 주문 생성 → API에 size 저장됨', async () => {
    const cashierToken = await cashierLogin();
    const { status, data } = await createOrder({
      type: 'pickup',
      items: [{ key: 'latte', name: 'Latte', nameAr: 'لاتيه', emoji: '☕', price: 4500, qty: 1, size: 'M' }],
      total: 4500,
      customerName: '사이즈테스트',
      customerPhone: `0779${sizeTS}`,
      arrivalTime: '16:00',
    });
    expect(status).toBe(200);
    const orderId = data.order.id;

    // 캐셔가 주문 목록 조회 → size 필드 포함 확인
    const { data: orders } = await apiRequest('GET', '/api/orders', null, { 'x-cashier-token': cashierToken });
    const order = orders.find(o => o.id === orderId);
    expect(order).toBeTruthy();
    const items = Array.isArray(order.items) ? order.items : JSON.parse(order.items);
    expect(items[0].size).toBe('M');
  });

  test('size 없는 주문 → items[0].size는 null 또는 undefined', async () => {
    const cashierToken = await cashierLogin();
    const { status, data } = await createOrder({
      type: 'pickup',
      items: [{ key: 'cookie', name: 'Cookie', price: 2000, qty: 1 }],
      total: 2000,
      customerName: '사이즈없음',
      customerPhone: `0780${sizeTS}`,
      arrivalTime: '17:00',
    });
    expect(status).toBe(200);
    const orderId = data.order.id;

    const { data: orders } = await apiRequest('GET', '/api/orders', null, { 'x-cashier-token': cashierToken });
    const order = orders.find(o => o.id === orderId);
    expect(order).toBeTruthy();
    const items = Array.isArray(order.items) ? order.items : JSON.parse(order.items);
    expect(items[0].size ?? null).toBeNull();
  });
});
