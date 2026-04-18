/**
 * Mr. Kim's Cafe - API 테스트 헬퍼
 * 직접 HTTP 요청으로 서버 상태를 검증
 */

const BASE_URL = 'http://localhost:3000';

async function apiRequest(method, path, body = null, headers = {}) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE_URL}${path}`, opts);
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

// 관리자 로그인 (창고 시스템용)
async function adminLogin(password = '1234') {
  const { status, data } = await apiRequest('POST', '/api/auth/login', { password });
  if (status !== 200 || !data.token) throw new Error(`관리자 로그인 실패: ${JSON.stringify(data)}`);
  return data.token;
}

// 캐셔 로그인
async function cashierLogin(name = 'ali atheer', password = '1234') {
  const { status, data } = await apiRequest('POST', '/api/cashier/login', { name, password });
  if (status !== 200 || !data.token) throw new Error(`캐셔 로그인 실패: ${JSON.stringify(data)}`);
  return data.token;
}

// 고객 등록 (테스트용 임시 계정)
async function registerCustomer(phone, password, name = '테스트고객', email = null) {
  email = email || `test_${Date.now()}@cafe.test`;
  const { status, data } = await apiRequest('POST', '/api/customers/register', {
    name,
    email,
    phone,
    password,
    birthdate: '1990-01-01',
  });
  return { status, data };
}

// 고객 로그인
async function customerLogin(phone, password) {
  const { status, data } = await apiRequest('POST', '/api/customers/login', { phone, password });
  if (status !== 200 || !data.token) throw new Error(`고객 로그인 실패: ${JSON.stringify(data)}`);
  return data.token;
}

// dine-in 세션 시작: qrToken → dineSessionToken
async function startDineSession(qrToken) {
  const { status, data } = await apiRequest('POST', '/api/dine-session', { qrToken });
  if (status !== 200 || !data.sessionToken) throw new Error(`다인 세션 시작 실패: ${JSON.stringify(data)}`);
  return data.sessionToken;
}

// 주문 생성 (고객 토큰, dine 세션 토큰 선택적)
async function createOrder({ type = 'pickup', items, total, customerName, customerPhone, arrivalTime, customerToken = null, dineSessionToken = null }) {
  const headers = customerToken ? { 'x-customer-token': customerToken } : {};
  const body = { type, items, total, customerName, customerPhone };
  if (type === 'pickup') body.arrivalTime = arrivalTime || '15:00';
  if (type === 'dine' && dineSessionToken) body.dineSessionToken = dineSessionToken;
  const { status, data } = await apiRequest('POST', '/api/orders', body, headers);
  return { status, data };
}

// 주문 상태 변경 (캐셔 또는 관리자)
async function updateOrderStatus(orderId, status, { adminToken = null, cashierToken = null } = {}) {
  const headers = {};
  if (adminToken) headers['x-auth-token'] = adminToken;
  if (cashierToken) headers['x-cashier-token'] = cashierToken;
  return apiRequest('PUT', `/api/orders/${orderId}/status`, { status }, headers);
}

// 재고 조회 (관리자 토큰 필요)
async function getIngredients(adminToken = null) {
  const headers = adminToken ? { 'x-auth-token': adminToken } : {};
  const { data } = await apiRequest('GET', '/api/ingredients', null, headers);
  return Array.isArray(data) ? data : [];
}

// 일일 판매 등록 (재고 차감 트리거)
async function recordDailySales(sale_date, sales, adminToken) {
  return apiRequest('POST', '/api/daily-sales', { sale_date, sales }, { 'x-auth-token': adminToken });
}

// 주문 목록 조회 (캐셔 또는 관리자 토큰 필요)
async function getOrders(params = {}, { adminToken = null, cashierToken = null } = {}) {
  const qs = new URLSearchParams(params).toString();
  const headers = {};
  if (adminToken) headers['x-auth-token'] = adminToken;
  if (cashierToken) headers['x-cashier-token'] = cashierToken;
  const { data } = await apiRequest('GET', `/api/orders${qs ? '?' + qs : ''}`, null, headers);
  return Array.isArray(data) ? data : [];
}

// 특정 재료의 현재 재고 조회 (관리자 토큰 필요)
async function getIngredientQty(ingredientId, adminToken = null) {
  const ingredients = await getIngredients(adminToken);
  const found = ingredients.find(i => i.id === ingredientId);
  return found ? found.current_qty : null;
}

module.exports = {
  apiRequest,
  adminLogin,
  cashierLogin,
  registerCustomer,
  customerLogin,
  startDineSession,
  createOrder,
  updateOrderStatus,
  getIngredients,
  recordDailySales,
  getOrders,
  getIngredientQty,
  BASE_URL,
};
