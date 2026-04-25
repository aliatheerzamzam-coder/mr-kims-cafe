/**
 * 테스트 2: 주문 흐름 테스트
 * - 주문 생성 (pickup, dine)
 * - 주문 후 캐셔에 즉시 반영 여부
 * - 주문 상태 변경 (new → making → done)
 * - 주문 취소
 * - 잘못된 데이터 주문 실패
 */

const { test, expect } = require('@playwright/test');
const { apiRequest, adminLogin, cashierLogin, registerCustomer, customerLogin, createOrder, updateOrderStatus, getOrders } = require('./helpers/api');

const SAMPLE_ITEMS = [
  { key: 'americano', name: '아메리카노', nameAr: 'أمريكانو', price: 3000, qty: 2 }
];
const SAMPLE_TOTAL = 6000;

test.describe('주문 생성', () => {
  test('비회원 픽업 주문 생성 성공', async () => {
    const { status, data } = await createOrder({
      type: 'pickup',
      items: SAMPLE_ITEMS,
      total: SAMPLE_TOTAL,
      customerName: 'QA테스트',
      customerPhone: '07700000001',
      arrivalTime: '14:00',
    });
    expect(status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.order.id).toBeTruthy();
    expect(data.order.status).toBe('new');
    expect(data.order.type).toBe('pickup');
    expect(data.order.items).toHaveLength(1);
    expect(data.order.total).toBe(SAMPLE_TOTAL);
  });

  test('로그인 고객 주문 생성', async () => {
    const phone = `077${Date.now().toString().slice(-7)}`;
    const email = `order_${Date.now()}@test.com`;
    const { data: regData } = await registerCustomer(phone, 'Pass1234!', '주문테스터', email);
    const customerToken = regData.token;

    const { status, data } = await createOrder({
      type: 'pickup',
      items: SAMPLE_ITEMS,
      total: SAMPLE_TOTAL,
      arrivalTime: '15:30',
      customerToken,
    });
    expect(status).toBe(200);
    expect(data.order.status).toBe('new');
  });

  test('arrivalTime 없는 픽업 주문 실패', async () => {
    const { status } = await apiRequest('POST', '/api/orders', {
      type: 'pickup',
      items: SAMPLE_ITEMS,
      total: SAMPLE_TOTAL,
      customerName: '실패테스터',
      customerPhone: '07700000002',
      // arrivalTime 누락
    });
    expect(status).toBe(400);
  });

  test('빈 items로 주문 실패', async () => {
    const { status } = await apiRequest('POST', '/api/orders', {
      type: 'pickup',
      items: [],
      total: 0,
      customerName: '실패테스터',
      customerPhone: '07700000003',
      arrivalTime: '14:00',
    });
    expect(status).toBe(400);
  });

  test('dine-in 주문은 QR 토큰 없으면 거부', async () => {
    const { status, data } = await apiRequest('POST', '/api/orders', {
      type: 'dine',
      items: SAMPLE_ITEMS,
      total: SAMPLE_TOTAL,
      customerName: '매장손님',
      customerPhone: '07700000004',
    });
    expect(status).toBe(403);
    expect(data.error).toBe('QR_REQUIRED');
  });
});

test.describe('주문 → 캐셔 연동 검증', () => {
  let adminToken;
  let createdOrderId;

  test.beforeAll(async () => {
    adminToken = await adminLogin();
  });

  test.afterAll(async () => {
    await apiRequest('POST', '/api/auth/logout', null, { 'x-auth-token': adminToken });
  });

  test('주문 생성 후 캐셔(주문 목록)에 즉시 반영', async () => {
    const beforeOrders = await getOrders({}, { adminToken });
    const beforeCount = beforeOrders.length;

    // 새 주문 생성
    const { data: orderData } = await createOrder({
      type: 'pickup',
      items: SAMPLE_ITEMS,
      total: SAMPLE_TOTAL,
      customerName: '캐셔연동테스트',
      customerPhone: '07700000010',
      arrivalTime: '16:00',
    });
    createdOrderId = orderData.order.id;

    // 즉시 주문 목록 조회 (캐셔가 GET /api/orders 로 조회하는 것과 동일)
    const afterOrders = await getOrders({}, { adminToken });
    expect(afterOrders.length).toBe(beforeCount + 1);

    const found = afterOrders.find(o => o.id === createdOrderId);
    expect(found).toBeTruthy();
    expect(found.status).toBe('new');
    expect(found.customer_name).toBe('캐셔연동테스트');
  });

  test('주문 상태 new → making → done 변경', async () => {
    const { data: orderData } = await createOrder({
      type: 'pickup',
      items: SAMPLE_ITEMS,
      total: SAMPLE_TOTAL,
      customerName: '상태변경테스트',
      customerPhone: '07700000011',
      arrivalTime: '17:00',
    });
    const orderId = orderData.order.id;

    // making으로 변경
    const { status: s1, data: d1 } = await updateOrderStatus(orderId, 'making', { adminToken });
    expect(s1).toBe(200);
    expect(d1.order.status).toBe('making');

    // done으로 변경
    const { status: s2, data: d2 } = await updateOrderStatus(orderId, 'done', { adminToken });
    expect(s2).toBe(200);
    expect(d2.order.status).toBe('done');
  });

  test('주문 취소 처리', async () => {
    const { data: orderData } = await createOrder({
      type: 'pickup',
      items: SAMPLE_ITEMS,
      total: SAMPLE_TOTAL,
      customerName: '취소테스트',
      customerPhone: '07700000012',
      arrivalTime: '18:00',
    });
    const orderId = orderData.order.id;

    const { status, data } = await updateOrderStatus(orderId, 'cancelled', { adminToken });
    expect(status).toBe(200);
    expect(data.order.status).toBe('cancelled');
  });

  test('유효하지 않은 상태값으로 변경 실패', async () => {
    const { data: orderData } = await createOrder({
      type: 'pickup',
      items: SAMPLE_ITEMS,
      total: SAMPLE_TOTAL,
      customerName: '상태오류테스트',
      customerPhone: '07700000013',
      arrivalTime: '19:00',
    });
    const orderId = orderData.order.id;

    const { status } = await updateOrderStatus(orderId, 'invalid_status', { adminToken });
    expect(status).toBe(400);
  });

  test('인증 없이 주문 상태 변경 거부', async () => {
    const { data: orderData } = await createOrder({
      type: 'pickup',
      items: SAMPLE_ITEMS,
      total: SAMPLE_TOTAL,
      customerName: '인증거부테스트',
      customerPhone: '07700000014',
      arrivalTime: '19:30',
    });
    const orderId = orderData.order.id;

    const { status } = await apiRequest('PUT', `/api/orders/${orderId}/status`, { status: 'making' });
    expect(status).toBe(401);
  });
});

test.describe('주문 데이터 정합성 검증', () => {
  test('주문 생성 후 단건 조회 데이터 일치', async () => {
    const items = [
      { key: 'latte', name: '라떼', nameAr: 'لاتيه', price: 4000, qty: 1 },
      { key: 'americano', name: '아메리카노', nameAr: 'أمريكانو', price: 3000, qty: 2 },
    ];
    const total = 11000;

    const { data: orderData } = await createOrder({
      type: 'pickup',
      items,
      total,
      customerName: '정합성테스트',
      customerPhone: '07700000020',
      arrivalTime: '10:00',
    });

    const orderId = orderData.order.id;
    const adminToken = await adminLogin();
    const { status, data: fetchedOrder } = await apiRequest('GET', `/api/orders/${orderId}`, null, { 'x-auth-token': adminToken });

    expect(status).toBe(200);
    expect(fetchedOrder.id).toBe(orderId);
    expect(fetchedOrder.total).toBe(total);
    expect(fetchedOrder.items).toHaveLength(2);
    expect(fetchedOrder.customer_name).toBe('정합성테스트');
    expect(fetchedOrder.customer_phone).toBe('07700000020');
    expect(fetchedOrder.status).toBe('new');

    // 아이템 데이터 검증
    const lattieItem = fetchedOrder.items.find(i => i.key === 'latte');
    expect(lattieItem).toBeTruthy();
    expect(lattieItem.qty).toBe(1);
    expect(lattieItem.price).toBe(4000);
  });
});
