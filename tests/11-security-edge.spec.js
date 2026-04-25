/**
 * 테스트 11: 보안 & 엣지 케이스 테스트
 * - 비밀번호 변경 (성공 / 짧은 비밀번호 / 인증 없음)
 * - 재고 출고 시 부족 → 400
 * - 재고 입고 수량 0 → 정상 허용 여부 확인
 * - 인증 미들웨어 토큰 없음 / 잘못된 토큰
 * - SQL 인젝션 시도 (이름 필드)
 */

const { test, expect } = require('@playwright/test');
const { apiRequest, adminLogin } = require('./helpers/api');

test.describe('비밀번호 변경 API', () => {
  let adminToken;

  test.beforeAll(async () => {
    // 이전 테스트 실패로 비밀번호가 변경됐을 수 있으므로 여러 후보 시도
    for (const pw of ['1234', 'admin1234', 'ab12', 'testPass99']) {
      try {
        adminToken = await adminLogin(pw);
        // 로그인 성공 시 표준 비밀번호 1234로 복구
        if (pw !== '1234') {
          await apiRequest('POST', '/api/auth/change-password', { newPassword: '1234' }, { 'x-auth-token': adminToken });
        }
        break;
      } catch (_) { /* 다음 후보 시도 */ }
    }
    if (!adminToken) throw new Error('관리자 로그인 실패 (모든 후보 시도)');
  });

  test.afterAll(async () => {
    await apiRequest('POST', '/api/auth/logout', null, { 'x-auth-token': adminToken });
  });

  test('인증 없이 비밀번호 변경 → 401', async () => {
    const { status } = await apiRequest('POST', '/api/auth/change-password', {
      newPassword: 'newPass123',
    });
    expect(status).toBe(401);
  });

  test('너무 짧은 비밀번호 → 400 (3자)', async () => {
    const { status, data } = await apiRequest('POST', '/api/auth/change-password', {
      newPassword: 'abc',
    }, { 'x-auth-token': adminToken });
    expect(status).toBe(400);
    expect(data.error).toBeTruthy(); // 아랍어 에러 메시지: "يجب أن تكون كلمة المرور 4 أحرف على الأقل"
  });

  test('newPassword 없이 요청 → 400', async () => {
    const { status } = await apiRequest('POST', '/api/auth/change-password', {}, {
      'x-auth-token': adminToken,
    });
    expect(status).toBe(400);
  });

  test('정확히 4자 비밀번호 → 성공', async () => {
    const { status, data } = await apiRequest('POST', '/api/auth/change-password', {
      newPassword: 'ab12',
    }, { 'x-auth-token': adminToken });
    expect(status).toBe(200);
    expect(data.success).toBe(true);

    // 원래 비밀번호로 복구
    await apiRequest('POST', '/api/auth/change-password', {
      newPassword: '1234',
    }, { 'x-auth-token': adminToken });
  });

  test('기존 토큰은 비밀번호 변경 후에도 유효 (세션 유지)', async () => {
    // 비밀번호 변경 후에도 adminToken은 여전히 사용 가능해야 함
    await apiRequest('POST', '/api/auth/change-password', {
      newPassword: 'testPass99',
    }, { 'x-auth-token': adminToken });

    // 기존 토큰으로 조회 → 여전히 200
    const { status } = await apiRequest('GET', '/api/ingredients', null, {
      'x-auth-token': adminToken,
    });
    expect(status).toBe(200);

    // 원래 비밀번호로 복구
    await apiRequest('POST', '/api/auth/change-password', {
      newPassword: '1234',
    }, { 'x-auth-token': adminToken });
  });
});

test.describe('재고 출고 부족 엣지케이스', () => {
  let adminToken;
  let ingredientId;

  test.beforeAll(async () => {
    adminToken = await adminLogin();

    // 재고 50g으로 재료 생성
    const { data } = await apiRequest('POST', '/api/ingredients', {
      name_ko: `QA부족테스트_${Date.now()}`,
      unit: 'g',
      current_qty: 50,
      min_qty: 5,
      cost_per_unit: 10,
    }, { 'x-auth-token': adminToken });
    ingredientId = data.id;
  });

  test.afterAll(async () => {
    if (ingredientId) {
      await apiRequest('DELETE', `/api/ingredients/${ingredientId}`, null, { 'x-auth-token': adminToken });
    }
    await apiRequest('POST', '/api/auth/logout', null, { 'x-auth-token': adminToken });
  });

  test('현재 재고보다 많은 수량 출고 → 400 (재고 부족)', async () => {
    const { status, data } = await apiRequest('POST', '/api/inventory/adjust', {
      ingredient_id: ingredientId,
      change_type: 'out',
      quantity: 100, // 현재 50g인데 100g 출고 시도
      reason: 'QA 재고 부족 테스트',
    }, { 'x-auth-token': adminToken });

    expect(status).toBe(400);
    expect(data.error).toBeTruthy(); // 아랍어 에러 메시지: "مخزون غير كافٍ"
  });

  test('정확히 현재 재고만큼 출고 → 성공 (남은 재고 0)', async () => {
    const { status, data } = await apiRequest('POST', '/api/inventory/adjust', {
      ingredient_id: ingredientId,
      change_type: 'out',
      quantity: 50, // 정확히 전량 출고
      reason: 'QA 전량 출고 테스트',
    }, { 'x-auth-token': adminToken });

    expect(status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.new_qty).toBe(0);
  });

  test('재고 0인 상태에서 1이라도 출고 시도 → 400', async () => {
    const { status } = await apiRequest('POST', '/api/inventory/adjust', {
      ingredient_id: ingredientId,
      change_type: 'out',
      quantity: 1,
      reason: 'QA 0 재고 출고 시도',
    }, { 'x-auth-token': adminToken });

    expect(status).toBe(400);
  });

  test('재고 없는 재료 ID → 404', async () => {
    const { status } = await apiRequest('POST', '/api/inventory/adjust', {
      ingredient_id: 99999999,
      change_type: 'in',
      quantity: 10,
    }, { 'x-auth-token': adminToken });

    expect(status).toBe(404);
  });
});

test.describe('인증 미들웨어 엣지케이스', () => {
  test('잘못된 관리자 토큰으로 재료 생성 → 401', async () => {
    const { status } = await apiRequest('POST', '/api/ingredients', {
      name_ko: '테스트재료',
      unit: 'g',
    }, { 'x-auth-token': 'totally_invalid_token_xyz' });

    expect(status).toBe(401);
  });

  test('토큰 없이 재료 생성 → 401', async () => {
    const { status } = await apiRequest('POST', '/api/ingredients', {
      name_ko: '테스트재료',
      unit: 'g',
    });
    expect(status).toBe(401);
  });

  test('토큰 없이 재고 조정 → 401', async () => {
    const { status } = await apiRequest('POST', '/api/inventory/adjust', {
      ingredient_id: 1,
      change_type: 'in',
      quantity: 10,
    });
    expect(status).toBe(401);
  });

  test('인증 없이 레시피 등록 → 401', async () => {
    const { status } = await apiRequest('POST', '/api/recipes', {
      menu_item: 'test_menu',
      items: [{ ingredient_id: 1, quantity: 5 }],
    });
    expect(status).toBe(401);
  });
});

test.describe('SQL 인젝션 방어', () => {
  let adminToken;
  let createdId;

  test.beforeAll(async () => {
    adminToken = await adminLogin();
  });

  test.afterAll(async () => {
    if (createdId) {
      await apiRequest('DELETE', `/api/ingredients/${createdId}`, null, { 'x-auth-token': adminToken });
    }
    await apiRequest('POST', '/api/auth/logout', null, { 'x-auth-token': adminToken });
  });

  test("SQL 인젝션 시도 이름으로 재료 생성 → 정상 저장 (안전 처리)", async () => {
    const maliciousName = `QA'; DROP TABLE ingredients; --`;
    const { status, data } = await apiRequest('POST', '/api/ingredients', {
      name_ko: maliciousName,
      unit: 'g',
      current_qty: 10,
      min_qty: 1,
      cost_per_unit: 1,
    }, { 'x-auth-token': adminToken });

    // 서버가 파라미터화 쿼리를 사용하면 200 반환하고 이름 그대로 저장됨
    expect(status).toBe(200);
    expect(data.id).toBeTruthy();
    createdId = data.id;

    // 재료 목록 조회 → DB가 멀쩡한지 확인
    const { status: listStatus, data: list } = await apiRequest('GET', '/api/ingredients', null, { 'x-auth-token': adminToken });
    expect(listStatus).toBe(200);
    expect(Array.isArray(list)).toBe(true);
  });
});
