/**
 * 테스트 1: 인증 시스템 테스트
 * - 관리자 로그인/로그아웃
 * - 캐셔 로그인/로그아웃
 * - 고객 회원가입/로그인
 * - 잘못된 자격증명 테스트
 */

const { test, expect } = require('@playwright/test');
const { apiRequest, adminLogin, cashierLogin, registerCustomer, customerLogin } = require('./helpers/api');

const TEST_PHONE = `077${Date.now().toString().slice(-7)}`;

test.describe('관리자 인증', () => {
  test('올바른 비밀번호로 관리자 로그인 성공', async () => {
    const { status, data } = await apiRequest('POST', '/api/auth/login', { password: '1234' });
    expect(status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.token).toBeTruthy();
    // 로그아웃
    await apiRequest('POST', '/api/auth/logout', null, { 'x-auth-token': data.token });
  });

  test('잘못된 비밀번호로 관리자 로그인 실패', async () => {
    const { status, data } = await apiRequest('POST', '/api/auth/login', { password: 'wrong_password' });
    expect(status).toBe(401);
    expect(data.success).toBe(false);
  });

  test('인증 없이 보호된 엔드포인트 접근 거부', async () => {
    const { status } = await apiRequest('GET', '/api/cashiers');
    expect(status).toBe(401);
  });
});

test.describe('캐셔 인증', () => {
  let adminToken;
  let cashierId;
  const cashierName = `testcashier_${Date.now()}`;

  test.beforeAll(async () => {
    adminToken = await adminLogin();
    // 테스트용 캐셔 계정 생성
    const { data } = await apiRequest('POST', '/api/cashiers', { name: cashierName, password: 'test1234' }, { 'x-auth-token': adminToken });
    cashierId = data.id;
  });

  test.afterAll(async () => {
    if (cashierId) {
      await apiRequest('DELETE', `/api/cashiers/${cashierId}`, null, { 'x-auth-token': adminToken });
    }
    await apiRequest('POST', '/api/auth/logout', null, { 'x-auth-token': adminToken });
  });

  test('올바른 자격증명으로 캐셔 로그인 성공', async () => {
    const { status, data } = await apiRequest('POST', '/api/cashier/login', { name: cashierName, password: 'test1234' });
    expect(status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.token).toBeTruthy();
    expect(data.name).toBe(cashierName);
    // 로그아웃
    await apiRequest('POST', '/api/cashier/logout', null, { 'x-cashier-token': data.token });
  });

  test('잘못된 비밀번호로 캐셔 로그인 실패', async () => {
    const { status } = await apiRequest('POST', '/api/cashier/login', { name: cashierName, password: 'wrongpass' });
    expect(status).toBe(401);
  });

  test('존재하지 않는 캐셔 로그인 실패', async () => {
    const { status } = await apiRequest('POST', '/api/cashier/login', { name: 'nonexistent', password: '1234' });
    expect(status).toBe(401);
  });
});

test.describe('고객 인증', () => {
  test('고객 회원가입 및 로그인', async () => {
    const phone = TEST_PHONE;
    const email = `qa_${Date.now()}@test.com`;

    // 회원가입
    const { status: regStatus, data: regData } = await registerCustomer(phone, 'Test1234!', '테스트고객', email);
    expect(regStatus).toBe(200);
    expect(regData.success).toBe(true);
    expect(regData.token).toBeTruthy();

    // 로그인
    const { status: loginStatus, data: loginData } = await apiRequest('POST', '/api/customers/login', { phone, password: 'Test1234!' });
    expect(loginStatus).toBe(200);
    expect(loginData.token).toBeTruthy();

    // /me 조회
    const { status: meStatus, data: meData } = await apiRequest('GET', '/api/customers/me', null, { 'x-customer-token': loginData.token });
    expect(meStatus).toBe(200);
    // /me 응답은 { customer: {...}, orders: [] } 구조
    expect(meData.customer?.phone).toBe(phone);
  });

  test('잘못된 비밀번호로 고객 로그인 실패', async () => {
    const { status } = await apiRequest('POST', '/api/customers/login', { phone: TEST_PHONE, password: 'wrongpass' });
    // 가입 안 됐거나 틀린 비번 → 4xx
    expect(status).toBeGreaterThanOrEqual(400);
  });

  test('토큰 없이 /me 접근 거부', async () => {
    const { status } = await apiRequest('GET', '/api/customers/me');
    expect(status).toBe(401);
  });
});
