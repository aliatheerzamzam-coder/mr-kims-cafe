/**
 * 테스트 6: 테이블 토큰 & 매장(Dine-in) 주문 흐름 테스트
 * - 테이블 토큰 생성/조회/삭제
 * - QR 스캔 → dine session 발급
 * - 유효한 세션으로 dine-in 주문 성공
 * - 세션 없이 dine-in 주문 실패
 * - 잘못된 QR 토큰 → 403
 */

const { test, expect } = require('@playwright/test');
const { apiRequest, adminLogin } = require('./helpers/api');

test.describe('테이블 토큰 관리 (관리자/캐셔 전용)', () => {
  let adminToken;
  const testTableNum = `qa_table_${Date.now()}`;

  test.beforeAll(async () => {
    adminToken = await adminLogin();
  });

  test.afterAll(async () => {
    // 테스트 토큰 정리
    await apiRequest('DELETE', `/api/table-tokens/${testTableNum}`, null, { 'x-auth-token': adminToken });
    await apiRequest('POST', '/api/auth/logout', null, { 'x-auth-token': adminToken });
  });

  test('인증 없이 테이블 토큰 조회 거부', async () => {
    const { status } = await apiRequest('GET', '/api/table-tokens');
    expect(status).toBe(401);
  });

  test('테이블 토큰 생성', async () => {
    const { status, data } = await apiRequest('POST', '/api/table-tokens', {
      tableNum: testTableNum,
    }, { 'x-auth-token': adminToken });

    expect(status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.token).toBeTruthy();
    expect(data.table_num).toBe(String(testTableNum));
  });

  test('테이블 토큰 목록 조회', async () => {
    const { status, data } = await apiRequest('GET', '/api/table-tokens', null, {
      'x-auth-token': adminToken,
    });

    expect(status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    const found = data.find(t => t.table_num === String(testTableNum));
    expect(found).toBeTruthy();
  });

  test('같은 테이블 번호 재생성 시 토큰 교체', async () => {
    const { data: first } = await apiRequest('POST', '/api/table-tokens', {
      tableNum: testTableNum,
    }, { 'x-auth-token': adminToken });

    const { data: second } = await apiRequest('POST', '/api/table-tokens', {
      tableNum: testTableNum,
    }, { 'x-auth-token': adminToken });

    // 토큰이 새로 발급됨
    expect(second.token).not.toBe(first.token);
  });

  test('테이블 번호 없이 생성 시 400', async () => {
    const { status } = await apiRequest('POST', '/api/table-tokens', {}, {
      'x-auth-token': adminToken,
    });
    expect(status).toBe(400);
  });

  test('테이블 토큰 삭제', async () => {
    // 별도 테이블 생성 후 삭제
    const tempTable = `qa_del_${Date.now()}`;
    await apiRequest('POST', '/api/table-tokens', { tableNum: tempTable }, { 'x-auth-token': adminToken });

    const { status } = await apiRequest('DELETE', `/api/table-tokens/${tempTable}`, null, {
      'x-auth-token': adminToken,
    });
    expect(status).toBe(200);

    // 삭제 확인
    const { data } = await apiRequest('GET', '/api/table-tokens', null, { 'x-auth-token': adminToken });
    const found = data.find(t => t.table_num === tempTable);
    expect(found).toBeUndefined();
  });
});

test.describe('Dine Session (QR 스캔 → 세션 발급)', () => {
  let adminToken;
  let qrToken;
  const tableNum = `qa_dine_${Date.now()}`;

  test.beforeAll(async () => {
    adminToken = await adminLogin();
    // 테이블 토큰 생성
    const { data } = await apiRequest('POST', '/api/table-tokens', { tableNum }, {
      'x-auth-token': adminToken,
    });
    qrToken = data.token;
  });

  test.afterAll(async () => {
    await apiRequest('DELETE', `/api/table-tokens/${tableNum}`, null, { 'x-auth-token': adminToken });
    await apiRequest('POST', '/api/auth/logout', null, { 'x-auth-token': adminToken });
  });

  test('유효한 QR 토큰으로 세션 발급', async () => {
    const { status, data } = await apiRequest('POST', '/api/dine-session', { qrToken });

    expect(status).toBe(200);
    expect(data.sessionToken).toBeTruthy();
    expect(data.tableNum).toBe(String(tableNum));
    expect(data.expiresAt).toBeGreaterThan(Date.now());
  });

  test('같은 QR 재스캔 시 동일 세션 반환 (만료 시간 고정)', async () => {
    const { data: first } = await apiRequest('POST', '/api/dine-session', { qrToken });
    const { data: second } = await apiRequest('POST', '/api/dine-session', { qrToken });

    expect(first.sessionToken).toBe(second.sessionToken);
    expect(first.expiresAt).toBe(second.expiresAt);
  });

  test('잘못된 QR 토큰 → 403', async () => {
    const { status, data } = await apiRequest('POST', '/api/dine-session', {
      qrToken: 'invalid_qr_token_xyz',
    });
    expect(status).toBe(403);
    expect(data.error).toBe('QR_INVALID');
  });

  test('qrToken 없이 요청 → 400', async () => {
    const { status } = await apiRequest('POST', '/api/dine-session', {});
    expect(status).toBe(400);
  });
});

test.describe('Dine-in 주문 흐름', () => {
  let adminToken;
  let qrToken;
  let sessionToken;
  const tableNum = `qa_order_${Date.now()}`;

  test.beforeAll(async () => {
    adminToken = await adminLogin();
    const { data: tableData } = await apiRequest('POST', '/api/table-tokens', { tableNum }, {
      'x-auth-token': adminToken,
    });
    qrToken = tableData.token;

    const { data: sessionData } = await apiRequest('POST', '/api/dine-session', { qrToken });
    sessionToken = sessionData.sessionToken;
  });

  test.afterAll(async () => {
    await apiRequest('DELETE', `/api/table-tokens/${tableNum}`, null, { 'x-auth-token': adminToken });
    await apiRequest('POST', '/api/auth/logout', null, { 'x-auth-token': adminToken });
  });

  test('유효한 dine session으로 매장 주문 성공', async () => {
    const { status, data } = await apiRequest('POST', '/api/orders', {
      type: 'dine',
      dineSessionToken: sessionToken,
      items: [{ key: 'americano', name: '아메리카노', price: 3000, qty: 2 }],
      total: 6000,
      customerName: '매장테스트고객',
      customerPhone: '07733333333',
    });

    expect(status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.order.type).toBe('dine');
    expect(data.order.status).toBe('new');
  });

  test('dineSessionToken 없이 dine 주문 → 403', async () => {
    const { status, data } = await apiRequest('POST', '/api/orders', {
      type: 'dine',
      items: [{ key: 'latte', name: '라떼', price: 4000, qty: 1 }],
      total: 4000,
    });

    expect(status).toBe(403);
    expect(data.error).toBe('QR_REQUIRED');
  });

  test('잘못된 dineSessionToken으로 dine 주문 → 403', async () => {
    const { status, data } = await apiRequest('POST', '/api/orders', {
      type: 'dine',
      dineSessionToken: 'fake_session_token_123',
      items: [{ key: 'latte', name: '라떼', price: 4000, qty: 1 }],
      total: 4000,
    });

    expect(status).toBe(403);
    expect(data.error).toBe('QR_INVALID');
  });

  test('pickup 주문은 arrivalTime 없으면 실패', async () => {
    const { status } = await apiRequest('POST', '/api/orders', {
      type: 'pickup',
      items: [{ key: 'americano', name: '아메리카노', price: 3000, qty: 1 }],
      total: 3000,
      customerName: '테스트',
      customerPhone: '07700011111',
      // arrivalTime 없음
    });
    expect(status).toBe(400);
  });
});
