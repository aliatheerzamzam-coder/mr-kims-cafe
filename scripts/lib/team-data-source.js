'use strict';

const http = require('http');
const https = require('https');
const { URL } = require('url');

const TARGET_URL = process.env.QA_TARGET_URL || 'http://localhost:3000';
const PROD_URL = process.env.PROD_TARGET_URL || 'https://mrkimscafe.com';
const CASHIER_NAME = process.env.CASHIER_LOGIN_NAME;
const CASHIER_PASS = process.env.CASHIER_LOGIN_PASSWORD;
const ADMIN_USER = process.env.ADMIN_LOGIN_USER;
const ADMIN_PASS = process.env.ADMIN_LOGIN_PASSWORD;
const IG_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN || '';
const IG_USER_ID = process.env.INSTAGRAM_USER_ID || '';

function request(method, urlString, headers = {}, body = null, timeoutMs = 10_000) {
  return new Promise((resolve, reject) => {
    const u = new URL(urlString);
    const lib = u.protocol === 'https:' ? https : http;
    const opts = {
      method,
      hostname: u.hostname,
      port: u.port || (u.protocol === 'https:' ? 443 : 80),
      path: u.pathname + u.search,
      headers: { Accept: 'application/json', ...headers },
    };
    const start = Date.now();
    const handle = res => {
      let data = '';
      res.on('data', c => (data += c));
      res.on('end', () => resolve({ status: res.statusCode, body: data, ms: Date.now() - start }));
    };
    let req;
    if (body) {
      const payload = typeof body === 'string' ? body : JSON.stringify(body);
      opts.headers['Content-Type'] = 'application/json';
      opts.headers['Content-Length'] = Buffer.byteLength(payload);
      req = lib.request(opts, handle);
      req.on('error', reject);
      req.setTimeout(timeoutMs, () => req.destroy(new Error('timeout')));
      req.write(payload);
      req.end();
    } else {
      req = lib.request(opts, handle);
      req.on('error', reject);
      req.setTimeout(timeoutMs, () => req.destroy(new Error('timeout')));
      req.end();
    }
  });
}

async function loginCashier() {
  if (!CASHIER_NAME || !CASHIER_PASS) throw new Error('CASHIER_LOGIN_NAME/PASSWORD not set');
  const res = await request('POST', `${TARGET_URL}/api/cashier/login`, {}, {
    name: CASHIER_NAME,
    password: CASHIER_PASS,
  });
  if (res.status !== 200) throw new Error(`cashier login ${res.status}: ${res.body.slice(0, 200)}`);
  return JSON.parse(res.body).token;
}

async function loginAdmin() {
  if (!ADMIN_USER || !ADMIN_PASS) return null;
  try {
    const res = await request('POST', `${TARGET_URL}/api/auth/login`, {}, {
      username: ADMIN_USER,
      password: ADMIN_PASS,
    });
    if (res.status !== 200) return null;
    return JSON.parse(res.body).token;
  } catch (_) {
    return null;
  }
}

async function fetchSales(cashierToken, period = 'day') {
  try {
    const res = await request('GET', `${TARGET_URL}/api/sales/summary?period=${period}`, {
      'x-cashier-token': cashierToken,
    });
    if (res.status !== 200) return null;
    return JSON.parse(res.body);
  } catch (_) {
    return null;
  }
}

async function fetchOrders(cashierToken) {
  try {
    const res = await request('GET', `${TARGET_URL}/api/orders`, {
      'x-cashier-token': cashierToken,
    });
    if (res.status !== 200) return null;
    return JSON.parse(res.body);
  } catch (_) {
    return null;
  }
}

async function fetchIngredients(adminToken) {
  if (!adminToken) return null;
  try {
    const res = await request('GET', `${TARGET_URL}/api/ingredients`, {
      'x-auth-token': adminToken,
    });
    if (res.status !== 200) return null;
    return JSON.parse(res.body);
  } catch (_) {
    return null;
  }
}

async function fetchDashboardData(adminToken) {
  if (!adminToken) return null;
  try {
    const res = await request('GET', `${TARGET_URL}/api/dashboard`, {
      'x-auth-token': adminToken,
    });
    if (res.status !== 200) return null;
    return JSON.parse(res.body);
  } catch (_) {
    return null;
  }
}

async function checkHealth(url) {
  try {
    const res = await request('GET', url, {}, null, 8000);
    return { url, ok: res.status >= 200 && res.status < 400, status: res.status, ms: res.ms };
  } catch (err) {
    return { url, ok: false, status: 0, ms: 0, error: String(err.message || err) };
  }
}

async function fetchInstagram() {
  if (!IG_TOKEN || !IG_USER_ID) {
    return {
      configured: false,
      note: 'INSTAGRAM_ACCESS_TOKEN / INSTAGRAM_USER_ID not set in .env. 마케팅 팀 보고서에 수동 입력 필요.',
    };
  }
  try {
    const fields = 'id,caption,media_type,media_url,permalink,timestamp,like_count,comments_count';
    const url = `https://graph.instagram.com/${encodeURIComponent(IG_USER_ID)}/media?fields=${fields}&limit=10&access_token=${encodeURIComponent(IG_TOKEN)}`;
    const res = await request('GET', url, {}, null, 10_000);
    if (res.status !== 200) {
      return { configured: true, ok: false, status: res.status, error: res.body.slice(0, 300) };
    }
    const json = JSON.parse(res.body);
    return { configured: true, ok: true, recent: json.data || [] };
  } catch (err) {
    return { configured: true, ok: false, error: String(err.message || err) };
  }
}

async function collectAll() {
  const errors = [];
  let cashierToken = null;
  try {
    cashierToken = await loginCashier();
  } catch (err) {
    errors.push(`cashier login failed: ${err.message}`);
  }
  const adminToken = await loginAdmin();
  if (!adminToken) errors.push('admin login skipped or failed (ingredients/dashboard limited)');

  const [salesDay, salesWeek, salesMonth, orders, ingredients, dashboard, healthLocal, healthProd, instagram] =
    await Promise.all([
      cashierToken ? fetchSales(cashierToken, 'day') : Promise.resolve(null),
      cashierToken ? fetchSales(cashierToken, 'week') : Promise.resolve(null),
      cashierToken ? fetchSales(cashierToken, 'month') : Promise.resolve(null),
      cashierToken ? fetchOrders(cashierToken) : Promise.resolve(null),
      fetchIngredients(adminToken),
      fetchDashboardData(adminToken),
      checkHealth(TARGET_URL),
      checkHealth(PROD_URL),
      fetchInstagram(),
    ]);

  const lowStock = Array.isArray(ingredients)
    ? ingredients
        .map(i => ({
          id: i.id,
          name: i.name_ko || i.name_ar || `id:${i.id}`,
          unit: i.unit || '',
          current: Array.isArray(i.locations) && i.locations.length
            ? i.locations.reduce((s, l) => s + (Number(l.qty) || 0), 0)
            : Number(i.current_qty) || 0,
          min: Number(i.min_qty) || 0,
          expiry_date: i.expiry_date || null,
        }))
        .filter(x => x.min > 0 && x.current < x.min)
    : [];

  return {
    collected_at: new Date().toISOString(),
    target_url: TARGET_URL,
    prod_url: PROD_URL,
    errors,
    sales: { day: salesDay, week: salesWeek, month: salesMonth },
    orders_recent: Array.isArray(orders) ? orders.slice(0, 30) : null,
    orders_count_total: Array.isArray(orders) ? orders.length : null,
    ingredients_total: Array.isArray(ingredients) ? ingredients.length : null,
    low_stock: lowStock,
    dashboard,
    web_health: { local: healthLocal, prod: healthProd },
    instagram,
  };
}

module.exports = { collectAll, request, loginCashier, loginAdmin };
