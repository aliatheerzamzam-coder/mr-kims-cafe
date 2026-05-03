'use strict';

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const http = require('http');
const { URL } = require('url');

const ROOT = path.resolve(__dirname, '..');
const REPORTS_DIR = path.join(ROOT, '.claude', 'reports', 'daily-report');

const { buildReport, buildShortPush, hasUrgent, todayKstDate } = require('./lib/report-template');
const { sendReportEmail } = require('./lib/notify-email');
const { sendWhatsAppPush } = require('./lib/notify-whatsapp');

const TARGET_URL = process.env.QA_TARGET_URL || 'http://localhost:3000';
const CASHIER_NAME = process.env.CASHIER_LOGIN_NAME;
const CASHIER_PASS = process.env.CASHIER_LOGIN_PASSWORD;
const ADMIN_USER = process.env.ADMIN_LOGIN_USER;
const ADMIN_PASS = process.env.ADMIN_LOGIN_PASSWORD;
const SKIP_NOTIFY = process.argv.includes('--no-notify');

function log(...args) {
  // eslint-disable-next-line no-console
  console.log('[daily-report]', ...args);
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function request(method, urlString, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const u = new URL(urlString);
    const opts = {
      method,
      hostname: u.hostname,
      port: u.port || 80,
      path: u.pathname + u.search,
      headers: { Accept: 'application/json', ...headers },
    };
    if (body) {
      const payload = typeof body === 'string' ? body : JSON.stringify(body);
      opts.headers['Content-Type'] = 'application/json';
      opts.headers['Content-Length'] = Buffer.byteLength(payload);
      const req = http.request(opts, res => {
        let data = '';
        res.on('data', c => (data += c));
        res.on('end', () => resolve({ status: res.statusCode, body: data }));
      });
      req.on('error', reject);
      req.setTimeout(10_000, () => {
        req.destroy(new Error('timeout'));
      });
      req.write(payload);
      req.end();
    } else {
      const req = http.request(opts, res => {
        let data = '';
        res.on('data', c => (data += c));
        res.on('end', () => resolve({ status: res.statusCode, body: data }));
      });
      req.on('error', reject);
      req.setTimeout(10_000, () => {
        req.destroy(new Error('timeout'));
      });
      req.end();
    }
  });
}

async function loginCashier() {
  if (!CASHIER_NAME || !CASHIER_PASS) {
    throw new Error('CASHIER_LOGIN_NAME / CASHIER_LOGIN_PASSWORD not set');
  }
  const res = await request('POST', `${TARGET_URL}/api/cashier/login`, {}, {
    name: CASHIER_NAME,
    password: CASHIER_PASS,
  });
  if (res.status !== 200) throw new Error(`cashier login failed: ${res.status} ${res.body}`);
  const json = JSON.parse(res.body);
  return json.token;
}

async function loginAdmin() {
  if (!ADMIN_USER || !ADMIN_PASS) return null;
  const res = await request('POST', `${TARGET_URL}/api/auth/login`, {}, {
    username: ADMIN_USER,
    password: ADMIN_PASS,
  });
  if (res.status !== 200) {
    log('admin login failed (will skip ingredients):', res.status);
    return null;
  }
  return JSON.parse(res.body).token;
}

async function fetchSalesSummary(cashierToken) {
  const res = await request('GET', `${TARGET_URL}/api/sales/summary?period=day`, {
    'x-cashier-token': cashierToken,
  });
  if (res.status !== 200) throw new Error(`sales summary failed: ${res.status} ${res.body}`);
  return JSON.parse(res.body);
}

async function fetchIngredients(adminToken) {
  if (!adminToken) return null;
  const res = await request('GET', `${TARGET_URL}/api/ingredients`, {
    'x-auth-token': adminToken,
  });
  if (res.status !== 200) {
    log('ingredients fetch failed:', res.status);
    return null;
  }
  return JSON.parse(res.body);
}

function totalQty(ing) {
  if (Array.isArray(ing.locations) && ing.locations.length > 0) {
    return ing.locations.reduce((s, l) => s + (Number(l.qty) || 0), 0);
  }
  return Number(ing.current_qty) || 0;
}

function buildExtraSection(sales, ingredients) {
  const lines = [];
  lines.push('## 매출 요약 (오늘)');
  if (sales && sales.today) {
    const t = sales.today;
    const orderCount = t.order_count || 0;
    const revenue = Number(t.revenue) || 0;
    const avg = orderCount > 0 ? Math.round(revenue / orderCount) : 0;
    lines.push(`- 주문 수: ${orderCount}건`);
    lines.push(`- 매출 (기록 기준): ${revenue.toLocaleString()} IQD`);
    lines.push(`- 평균 주문 금액: ${avg.toLocaleString()} IQD`);
  } else {
    lines.push('- 데이터 없음');
  }
  lines.push('');
  lines.push('> ⚠️ 외부 PG(카드/Zain/Switch) 연동이 미완료라 위 매출은 **기록된 주문 합계**일 뿐, 실제 결제 검증과는 다를 수 있음.');
  lines.push('');

  if (sales && Array.isArray(sales.top5) && sales.top5.length > 0) {
    lines.push('## TOP5 메뉴 (최근 1일)');
    sales.top5.forEach((it, i) => {
      lines.push(`${i + 1}. ${it.menu_item} — ${it.total_qty}개`);
    });
    lines.push('');
  }

  if (ingredients && Array.isArray(ingredients)) {
    const all = ingredients.map(ing => ({
      name: ing.name_ko || ing.name_ar || `id:${ing.id}`,
      unit: ing.unit || '',
      current: totalQty(ing),
      min: Number(ing.min_qty) || 0,
    }));
    const low = all.filter(x => x.min > 0 && x.current < x.min);
    lines.push('## 재고 점검');
    lines.push(`- 총 재료 종수: ${all.length}`);
    lines.push(`- 최소치 미만(low stock): ${low.length}`);
    if (low.length > 0) {
      lines.push('');
      lines.push('| 재료 | 현재 | 최소 | 단위 |');
      lines.push('|---|---|---|---|');
      for (const r of low.slice(0, 30)) {
        lines.push(`| ${r.name} | ${r.current} | ${r.min} | ${r.unit} |`);
      }
      if (low.length > 30) lines.push(`| ... 외 ${low.length - 30}건 | | | |`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

function buildFindings(sales, ingredients) {
  const findings = [];

  if (sales && sales.today) {
    const orderCount = sales.today.order_count || 0;
    if (orderCount === 0) {
      findings.push({
        severity: 'High',
        title: '오늘 주문 0건 — 사이트/POS 마비 의심',
        what: '/api/sales/summary?period=day 의 today.order_count = 0',
        why: '영업일에 주문이 한 건도 없으면 사이트 다운, POS 미가동, 또는 데이터베이스 문제 가능성',
        ifNotFixed: '실제로 막혀 있다면 매장 매출 손실 지속',
        reproduce: 'curl -H "x-cashier-token: $TOKEN" ' + TARGET_URL + '/api/sales/summary?period=day',
      });
    }
  }

  if (ingredients && Array.isArray(ingredients)) {
    for (const ing of ingredients) {
      const current = totalQty(ing);
      const min = Number(ing.min_qty) || 0;
      if (min <= 0) continue;
      if (current <= 0) {
        findings.push({
          severity: 'Critical',
          title: `재고 0 — ${ing.name_ko || ing.name_ar || `id:${ing.id}`}`,
          what: `ingredients.id=${ing.id} (${ing.name_ko}) current=${current} ${ing.unit}`,
          why: '재료 0이면 해당 메뉴 판매 즉시 차단',
          ifNotFixed: '고객이 주문한 메뉴를 만들지 못해 클레임/환불 발생',
        });
      } else if (current < min * 0.5) {
        findings.push({
          severity: 'High',
          title: `재고 임박 — ${ing.name_ko || ing.name_ar || `id:${ing.id}`}`,
          what: `ingredients.id=${ing.id} current=${current} / min=${min} ${ing.unit}`,
          why: '최소치의 50% 미만 — 곧 소진',
          ifNotFixed: '주말/공휴일 발주 지연 시 재고 0 가능',
        });
      }
    }
  }

  return findings;
}

async function main() {
  ensureDir(REPORTS_DIR);
  const date = todayKstDate();
  const reportPath = path.join(REPORTS_DIR, `${date}.md`);

  let cashierToken;
  try {
    cashierToken = await loginCashier();
  } catch (err) {
    const findings = [
      {
        severity: 'High',
        title: 'Cashier 로그인 실패 — Daily Report 생성 불가',
        what: `error: ${err.message}`,
        why: '리포트 API는 cashier 권한 필요 — 로그인 실패 시 매출 조회 불가',
        ifNotFixed: '오늘 매출/재고 리포트 누락',
        reproduce: `POST ${TARGET_URL}/api/cashier/login`,
      },
    ];
    const md = buildReport({
      kind: 'Daily Report',
      target: TARGET_URL,
      summary: 'NOT RUN (login failed)',
      findings,
    });
    fs.writeFileSync(reportPath, md, 'utf8');
    log('saved (login fail):', reportPath);
    if (!SKIP_NOTIFY) await notifyAll('Daily Report', md, findings);
    process.exit(2);
  }

  const adminToken = await loginAdmin().catch(err => {
    log('admin login error:', err.message);
    return null;
  });

  let sales = null;
  let ingredients = null;
  try {
    sales = await fetchSalesSummary(cashierToken);
  } catch (err) {
    log('sales fetch failed:', err.message);
  }
  try {
    ingredients = await fetchIngredients(adminToken);
  } catch (err) {
    log('ingredients fetch failed:', err.message);
  }

  const extra = buildExtraSection(sales, ingredients);
  const findings = buildFindings(sales, ingredients);
  const summary = sales && sales.today
    ? `주문 ${sales.today.order_count || 0}건 / 매출 ${(Number(sales.today.revenue) || 0).toLocaleString()} IQD`
    : 'data unavailable';

  const md = buildReport({
    kind: 'Daily Report',
    target: TARGET_URL,
    summary,
    findings,
    extra,
  });
  fs.writeFileSync(reportPath, md, 'utf8');
  log('saved:', reportPath, '/ findings:', findings.length);

  if (!SKIP_NOTIFY) await notifyAll('Daily Report', md, findings);
  process.exit(0);
}

async function notifyAll(kind, markdown, findings) {
  const date = todayKstDate();
  const subject = `[Mr. Kims Cafe] ${kind} ${date} — ${findings.length}건 알림`;
  try {
    await sendReportEmail({ subject, markdown });
    log('email sent');
  } catch (err) {
    log('email failed:', err.message);
  }
  if (hasUrgent(findings)) {
    try {
      const push = buildShortPush({ kind, findings });
      if (push) {
        await sendWhatsAppPush(push);
        log('whatsapp sent');
      }
    } catch (err) {
      log('whatsapp failed:', err.message);
    }
  }
}

main().catch(err => {
  // eslint-disable-next-line no-console
  console.error('[daily-report] fatal:', err);
  process.exit(99);
});
