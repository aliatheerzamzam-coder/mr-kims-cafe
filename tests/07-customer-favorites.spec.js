/**
 * 테스트 7: 고객 즐겨찾기 시스템 테스트
 * - 즐겨찾기 목록 조회
 * - 즐겨찾기 추가 (toggle)
 * - 즐겨찾기 제거 (재토글)
 * - 인증 없이 접근 거부
 * - menu_key 없이 요청 400
 */

const { test, expect } = require('@playwright/test');
const { apiRequest, registerCustomer, customerLogin } = require('./helpers/api');

test.describe('고객 즐겨찾기', () => {
  let customerToken;
  const phone = `077${Date.now().toString().slice(-7)}`;
  const password = 'Fav1234!';

  test.beforeAll(async () => {
    await registerCustomer(phone, password, '즐겨찾기테스터', `fav_${Date.now()}@test.com`);
    customerToken = await customerLogin(phone, password);
  });

  test('인증 없이 즐겨찾기 조회 → 401', async () => {
    const { status } = await apiRequest('GET', '/api/customers/favorites');
    expect(status).toBe(401);
  });

  test('초기 즐겨찾기 목록은 빈 배열', async () => {
    const { status, data } = await apiRequest('GET', '/api/customers/favorites', null, {
      'x-customer-token': customerToken,
    });
    expect(status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(0);
  });

  test('즐겨찾기 추가 (action: added)', async () => {
    const { status, data } = await apiRequest('POST', '/api/customers/favorites', {
      menu_key: 'americano',
      menu_name: '아메리카노',
      menu_name_ar: 'أمريكانو',
      menu_emoji: '☕',
      menu_price: 3000,
    }, { 'x-customer-token': customerToken });

    expect(status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.action).toBe('added');
  });

  test('즐겨찾기 목록에 추가된 항목 확인', async () => {
    const { status, data } = await apiRequest('GET', '/api/customers/favorites', null, {
      'x-customer-token': customerToken,
    });
    expect(status).toBe(200);
    expect(data.length).toBe(1);
    expect(data[0].menu_key).toBe('americano');
    expect(data[0].menu_name).toBe('아메리카노');
    expect(data[0].menu_price).toBe(3000);
  });

  test('두 번째 메뉴 즐겨찾기 추가', async () => {
    const { data } = await apiRequest('POST', '/api/customers/favorites', {
      menu_key: 'latte',
      menu_name: '라떼',
      menu_name_ar: 'لاتيه',
      menu_emoji: '🥛',
      menu_price: 4000,
    }, { 'x-customer-token': customerToken });

    expect(data.action).toBe('added');

    const { data: list } = await apiRequest('GET', '/api/customers/favorites', null, {
      'x-customer-token': customerToken,
    });
    expect(list.length).toBe(2);
  });

  test('같은 메뉴 다시 토글 → 제거 (action: removed)', async () => {
    const { status, data } = await apiRequest('POST', '/api/customers/favorites', {
      menu_key: 'americano',
      menu_name: '아메리카노',
    }, { 'x-customer-token': customerToken });

    expect(status).toBe(200);
    expect(data.action).toBe('removed');
  });

  test('제거 후 목록에서 해당 항목 없음', async () => {
    const { data } = await apiRequest('GET', '/api/customers/favorites', null, {
      'x-customer-token': customerToken,
    });
    expect(data.length).toBe(1);
    const americano = data.find(f => f.menu_key === 'americano');
    expect(americano).toBeUndefined();
  });

  test('menu_key 없이 즐겨찾기 추가 → 400', async () => {
    const { status } = await apiRequest('POST', '/api/customers/favorites', {
      menu_name: '아메리카노',
    }, { 'x-customer-token': customerToken });
    expect(status).toBe(400);
  });

  test('인증 없이 즐겨찾기 추가 → 401', async () => {
    const { status } = await apiRequest('POST', '/api/customers/favorites', {
      menu_key: 'americano',
    });
    expect(status).toBe(401);
  });
});
