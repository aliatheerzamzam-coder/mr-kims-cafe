const express = require('express');
const Database = require('better-sqlite3');
const crypto = require('crypto');
const path = require('path');
const https = require('https');
const QRCode = require('qrcode');

// ─── WhatsApp 자동 발송 (UltraMsg) ─────────────────────────────────────────────
// 환경변수: ULTRAMSG_INSTANCE, ULTRAMSG_TOKEN
function sendWhatsApp(toPhone, message) {
  const instance = process.env.ULTRAMSG_INSTANCE;
  const token    = process.env.ULTRAMSG_TOKEN;
  if (!instance || !token) return; // API 키 없으면 스킵 (캐셔 대시보드 수동 방식)

  // 이라크 번호 변환: 0xxx → 964xxx
  let wa = toPhone.replace(/[^0-9]/g, '');
  if (wa.startsWith('0')) wa = '964' + wa.slice(1);

  const body = JSON.stringify({ token, to: wa, body: message });
  const options = {
    hostname: `api.ultramsg.com`,
    path: `/${instance}/messages/chat`,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
  };
  const req = https.request(options, (res) => {
    let d = '';
    res.on('data', c => d += c);
    res.on('end', () => console.log(`[WA] ${toPhone} → ${res.statusCode}`));
  });
  req.on('error', e => console.error('[WA] 전송 실패:', e.message));
  req.write(body);
  req.end();
}

const app = express();
const PORT = process.env.PORT || 3000;


// ─── DB 경로: Railway 볼륨 or 로컬 ────────────────────────────────────────────
const DB_PATH = process.env.RAILWAY_VOLUME_MOUNT_PATH
  ? path.join(process.env.RAILWAY_VOLUME_MOUNT_PATH, 'cafe-warehouse.db')
  : path.join(__dirname, 'cafe-warehouse.db');

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ─── 테이블 생성 ───────────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS ingredients (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name_ko       TEXT NOT NULL,
    name_ar       TEXT NOT NULL DEFAULT '',
    unit          TEXT NOT NULL,
    current_qty   REAL NOT NULL DEFAULT 0,
    min_qty       REAL NOT NULL DEFAULT 1,
    cost_per_unit REAL NOT NULL DEFAULT 0,
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS recipes (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    menu_item     TEXT NOT NULL,
    ingredient_id INTEGER NOT NULL,
    quantity      REAL NOT NULL,
    FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS inventory_history (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    ingredient_id   INTEGER,
    ingredient_name TEXT NOT NULL,
    change_type     TEXT NOT NULL,
    quantity        REAL NOT NULL,
    reason          TEXT,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS daily_sales (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    sale_date  TEXT NOT NULL,
    menu_item  TEXT NOT NULL,
    quantity   INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS orders (
    id             TEXT PRIMARY KEY,
    num            INTEGER NOT NULL,
    timestamp      INTEGER NOT NULL,
    status         TEXT NOT NULL DEFAULT 'new',
    type           TEXT NOT NULL,
    table_num      TEXT,
    customer_name  TEXT,
    customer_phone TEXT,
    arrival_time   TEXT,
    items          TEXT NOT NULL,
    total          REAL NOT NULL,
    created_at     DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS order_counter (
    id    INTEGER PRIMARY KEY CHECK (id = 1),
    value INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS customers (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL,
    email      TEXT NOT NULL UNIQUE,
    phone      TEXT NOT NULL UNIQUE,
    password   TEXT NOT NULL,
    birthdate  TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS customer_sessions (
    token       TEXT PRIMARY KEY,
    customer_id INTEGER NOT NULL,
    created_at  INTEGER NOT NULL,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS phone_verifications (
    phone      TEXT PRIMARY KEY,
    code       TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS admin_sessions (
    token      TEXT PRIMARY KEY,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS table_tokens (
    table_num  TEXT PRIMARY KEY,
    token      TEXT NOT NULL UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS favorites (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id  INTEGER NOT NULL,
    menu_key     TEXT NOT NULL,
    menu_name    TEXT NOT NULL,
    menu_name_ar TEXT NOT NULL DEFAULT '',
    menu_emoji   TEXT NOT NULL DEFAULT '',
    menu_price   REAL NOT NULL DEFAULT 0,
    UNIQUE(customer_id, menu_key),
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS cashiers (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL UNIQUE,
    password   TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS cashier_sessions (
    token      TEXT PRIMARY KEY,
    cashier_id INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (cashier_id) REFERENCES cashiers(id) ON DELETE CASCADE
  );
`);

// 기존 DB 호환 마이그레이션
try { db.exec('ALTER TABLE orders ADD COLUMN customer_id INTEGER REFERENCES customers(id)'); } catch (_) {}
try { db.exec('ALTER TABLE orders ADD COLUMN arrival_time TEXT'); } catch (_) {}
try { db.exec('ALTER TABLE orders ADD COLUMN cashier_name TEXT'); } catch (_) {}

// 기본 데이터
if (!db.prepare("SELECT value FROM settings WHERE key='admin_pw'").get()) {
  const hash = crypto.createHash('sha256').update('1234').digest('hex');
  db.prepare("INSERT INTO settings (key, value) VALUES ('admin_pw', ?)").run(hash);
}
if (!db.prepare("SELECT id FROM order_counter WHERE id=1").get()) {
  db.prepare("INSERT INTO order_counter (id, value) VALUES (1, 1)").run();
}

// ─── 관리자 세션 (SQLite, 12시간 TTL) ─────────────────────────────────────────
const ADMIN_SESSION_TTL = 12 * 60 * 60 * 1000; // 12시간

function requireAuth(req, res, next) {
  const token = req.headers['x-auth-token'];
  if (!token) return res.status(401).json({ error: '관리자 로그인이 필요합니다' });
  const row = db.prepare('SELECT created_at FROM admin_sessions WHERE token=?').get(token);
  if (!row) return res.status(401).json({ error: '관리자 로그인이 필요합니다' });
  if (Date.now() - row.created_at > ADMIN_SESSION_TTL) {
    db.prepare('DELETE FROM admin_sessions WHERE token=?').run(token);
    return res.status(401).json({ error: '세션이 만료되었습니다. 다시 로그인하세요' });
  }
  // 슬라이딩 세션: 사용할 때마다 TTL 갱신
  db.prepare('UPDATE admin_sessions SET created_at=? WHERE token=?').run(Date.now(), token);
  next();
}

// 만료된 관리자 세션 정리 (1시간마다)
setInterval(() => {
  db.prepare('DELETE FROM admin_sessions WHERE created_at < ?').run(Date.now() - ADMIN_SESSION_TTL);
}, 60 * 60 * 1000);

// ─── 캐셔 세션 (12시간 TTL) ────────────────────────────────────────────────────
const CASHIER_SESSION_TTL = 12 * 60 * 60 * 1000;

function requireCashierOrAdmin(req, res, next) {
  // 관리자 토큰도 허용
  const adminToken = req.headers['x-auth-token'];
  if (adminToken) {
    const row = db.prepare('SELECT created_at FROM admin_sessions WHERE token=?').get(adminToken);
    if (row && Date.now() - row.created_at <= ADMIN_SESSION_TTL) {
      db.prepare('UPDATE admin_sessions SET created_at=? WHERE token=?').run(Date.now(), adminToken);
      req.cashierName = '관리자';
      return next();
    }
  }
  // 캐셔 토큰
  const cashierToken = req.headers['x-cashier-token'];
  if (!cashierToken) return res.status(401).json({ error: '로그인이 필요합니다' });
  const row = db.prepare('SELECT cs.*, c.name FROM cashier_sessions cs JOIN cashiers c ON c.id=cs.cashier_id WHERE cs.token=?').get(cashierToken);
  if (!row) return res.status(401).json({ error: '로그인이 필요합니다' });
  if (Date.now() - row.created_at > CASHIER_SESSION_TTL) {
    db.prepare('DELETE FROM cashier_sessions WHERE token=?').run(cashierToken);
    return res.status(401).json({ error: '세션이 만료되었습니다. 다시 로그인하세요' });
  }
  db.prepare('UPDATE cashier_sessions SET created_at=? WHERE token=?').run(Date.now(), cashierToken);
  req.cashierName = row.name;
  next();
}

// 만료된 캐셔 세션 정리 (1시간마다)
setInterval(() => {
  db.prepare('DELETE FROM cashier_sessions WHERE created_at < ?').run(Date.now() - CASHIER_SESSION_TTL);
}, 60 * 60 * 1000);

// ─── 고객 세션 (DB 기반, 30일 TTL) ───────────────────────────────────────────
const CUSTOMER_SESSION_TTL = 30 * 24 * 60 * 60 * 1000; // 30일

function requireCustomer(req, res, next) {
  const token = req.headers['x-customer-token'];
  if (!token) return res.status(401).json({ error: 'Login required / تسجيل الدخول مطلوب' });
  const row = db.prepare('SELECT * FROM customer_sessions WHERE token=?').get(token);
  if (!row) return res.status(401).json({ error: 'Session not found. Please log in again / الجلسة غير موجودة. يرجى تسجيل الدخول مجدداً' });
  if (Date.now() - row.created_at > CUSTOMER_SESSION_TTL) {
    db.prepare('DELETE FROM customer_sessions WHERE token=?').run(token);
    return res.status(401).json({ error: 'Session expired. Please log in again / انتهت الجلسة. يرجى تسجيل الدخول مجدداً' });
  }
  // 슬라이딩 세션: 사용할 때마다 TTL 갱신
  db.prepare('UPDATE customer_sessions SET created_at=? WHERE token=?').run(Date.now(), token);
  req.customerId = row.customer_id;
  next();
}

function optionalCustomer(req, res, next) {
  const token = req.headers['x-customer-token'];
  if (token) {
    const row = db.prepare('SELECT * FROM customer_sessions WHERE token=?').get(token);
    if (row && Date.now() - row.created_at <= CUSTOMER_SESSION_TTL) {
      req.customerId = row.customer_id;
    }
  }
  next();
}

// 만료된 고객 세션 정리 (1시간마다)
setInterval(() => {
  const cutoff = Date.now() - CUSTOMER_SESSION_TTL;
  db.prepare('DELETE FROM customer_sessions WHERE created_at < ?').run(cutoff);
}, 60 * 60 * 1000);

// ─── SSE 클라이언트 목록 (캐셔 실시간 알림용) ───────────────────────────────────
const sseClients = new Set();

function broadcastSSE(data) {
  const msg = `data: ${JSON.stringify(data)}\n\n`;
  sseClients.forEach(res => { try { res.write(msg); } catch (_) {} });
}

// ─── 미들웨어 ──────────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.static(path.join(__dirname)));



// ─── AUTH ─────────────────────────────────────────────────────────────────────
app.post('/api/auth/login', (req, res) => {
  const hash = crypto.createHash('sha256').update(req.body.password || '').digest('hex');
  const stored = db.prepare("SELECT value FROM settings WHERE key='admin_pw'").get();
  if (stored?.value === hash) {
    const token = crypto.randomBytes(32).toString('hex');
    db.prepare('INSERT INTO admin_sessions (token, created_at) VALUES (?,?)').run(token, Date.now());
    res.json({ success: true, token });
  } else {
    res.status(401).json({ success: false, error: '비밀번호가 틀렸습니다' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  db.prepare('DELETE FROM admin_sessions WHERE token=?').run(req.headers['x-auth-token']);
  res.json({ success: true });
});

app.post('/api/auth/change-password', requireAuth, (req, res) => {
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 4)
    return res.status(400).json({ error: '비밀번호는 4자 이상이어야 합니다' });
  const hash = crypto.createHash('sha256').update(newPassword).digest('hex');
  db.prepare("UPDATE settings SET value=? WHERE key='admin_pw'").run(hash);
  res.json({ success: true });
});

// ─── CASHIER AUTH ─────────────────────────────────────────────────────────────

app.post('/api/cashier/login', (req, res) => {
  const { name, password } = req.body;
  if (!name || !password) return res.status(400).json({ error: '이름과 비밀번호를 입력하세요' });
  const hash = crypto.createHash('sha256').update(password).digest('hex');
  const cashier = db.prepare('SELECT * FROM cashiers WHERE name=? AND password=?').get(name.trim(), hash);
  if (!cashier) return res.status(401).json({ error: '이름 또는 비밀번호가 틀렸습니다' });
  const token = crypto.randomBytes(32).toString('hex');
  db.prepare('INSERT INTO cashier_sessions (token, cashier_id, created_at) VALUES (?,?,?)').run(token, cashier.id, Date.now());
  res.json({ success: true, token, name: cashier.name });
});

app.post('/api/cashier/logout', (req, res) => {
  db.prepare('DELETE FROM cashier_sessions WHERE token=?').run(req.headers['x-cashier-token']);
  res.json({ success: true });
});

// 캐셔 목록 조회 (관리자 전용)
app.get('/api/cashiers', requireAuth, (req, res) => {
  res.json(db.prepare('SELECT id, name, created_at FROM cashiers ORDER BY name').all());
});

// 캐셔 계정 생성 (관리자 전용)
app.post('/api/cashiers', requireAuth, (req, res) => {
  const { name, password } = req.body;
  if (!name || !password) return res.status(400).json({ error: '이름과 비밀번호를 입력하세요' });
  if (password.length < 4) return res.status(400).json({ error: '비밀번호는 4자 이상이어야 합니다' });
  const hash = crypto.createHash('sha256').update(password).digest('hex');
  try {
    const r = db.prepare('INSERT INTO cashiers (name, password, created_at) VALUES (?,?,?)').run(name.trim(), hash, Date.now());
    res.json({ success: true, id: r.lastInsertRowid, name: name.trim() });
  } catch (e) {
    res.status(400).json({ error: '이미 존재하는 이름입니다' });
  }
});

// 캐셔 계정 삭제 (관리자 전용)
app.delete('/api/cashiers/:id', requireAuth, (req, res) => {
  db.prepare('DELETE FROM cashier_sessions WHERE cashier_id=?').run(req.params.id);
  db.prepare('DELETE FROM cashiers WHERE id=?').run(req.params.id);
  res.json({ success: true });
});

// ─── TABLE TOKENS (QR코드 Dine-in 인증) ───────────────────────────────────────

// 전체 목록 조회
app.get('/api/table-tokens', requireCashierOrAdmin, (req, res) => {
  res.json(db.prepare('SELECT * FROM table_tokens ORDER BY CAST(table_num AS INTEGER)').all());
});

// 토큰 생성/재발급
app.post('/api/table-tokens', requireCashierOrAdmin, (req, res) => {
  const { tableNum } = req.body;
  if (!tableNum) return res.status(400).json({ error: 'tableNum 필요' });
  const token = crypto.randomBytes(8).toString('hex'); // 16자 hex
  db.prepare('INSERT OR REPLACE INTO table_tokens (table_num, token) VALUES (?,?)').run(String(tableNum), token);
  res.json({ success: true, table_num: String(tableNum), token });
});

// 토큰 삭제
app.delete('/api/table-tokens/:tableNum', requireCashierOrAdmin, (req, res) => {
  db.prepare('DELETE FROM table_tokens WHERE table_num=?').run(req.params.tableNum);
  res.json({ success: true });
});

// QR 이미지 생성 (서버 사이드, CDN 불필요)
app.get('/api/qr-image', requireCashierOrAdmin, async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'url 파라미터 필요' });
  try {
    const dataUrl = await QRCode.toDataURL(url, { width: 200, margin: 1, errorCorrectionLevel: 'M' });
    res.json({ dataUrl });
  } catch (e) {
    res.status(500).json({ error: 'QR 생성 실패' });
  }
});

// ─── CUSTOMER AUTH ────────────────────────────────────────────────────────────

// 회원가입
app.post('/api/customers/register', (req, res) => {
  const { name, email, phone, password, birthdate } = req.body;
  if (!name || !email || !phone || !password)
    return res.status(400).json({ error: 'Please fill in all fields / يرجى ملء جميع الحقول' });
  if (password.length < 8)
    return res.status(400).json({ error: 'Password must be at least 8 characters / يجب أن تكون كلمة المرور 8 أحرف على الأقل' });

  const hash = crypto.createHash('sha256').update(password).digest('hex');
  try {
    const r = db.prepare(
      'INSERT INTO customers (name, email, phone, password, birthdate) VALUES (?,?,?,?,?)'
    ).run(name.trim(), email.trim().toLowerCase(), phone.trim(), hash, birthdate || null);
    const token = crypto.randomBytes(32).toString('hex');
    db.prepare('INSERT INTO customer_sessions (token, customer_id, created_at) VALUES (?,?,?)')
      .run(token, r.lastInsertRowid, Date.now());
    const customer = db.prepare('SELECT id, name, email, phone, birthdate, created_at FROM customers WHERE id=?').get(r.lastInsertRowid);
    res.json({ success: true, token, customer });
  } catch (e) {
    if (e.message.includes('UNIQUE')) {
      if (e.message.includes('email')) return res.status(409).json({ error: 'Email already in use / البريد الإلكتروني مستخدم بالفعل' });
      if (e.message.includes('phone')) return res.status(409).json({ error: 'Phone number already registered / رقم الهاتف مسجل بالفعل' });
    }
    res.status(500).json({ error: 'Registration failed / فشل التسجيل' });
  }
});

// 로그인
app.post('/api/customers/login', (req, res) => {
  const { phone, password } = req.body;
  if (!phone || !password) return res.status(400).json({ error: 'Phone number and password are required / رقم الهاتف وكلمة المرور مطلوبان' });
  const hash = crypto.createHash('sha256').update(password).digest('hex');
  const customer = db.prepare('SELECT * FROM customers WHERE phone=? AND password=?').get(phone.trim(), hash);
  if (!customer) return res.status(401).json({ error: 'Incorrect phone number or password / رقم الهاتف أو كلمة المرور غير صحيحة' });
  const token = crypto.randomBytes(32).toString('hex');
  db.prepare('INSERT INTO customer_sessions (token, customer_id, created_at) VALUES (?,?,?)').run(token, customer.id, Date.now());
  const { password: _, ...safe } = customer;
  res.json({ success: true, token, customer: safe });
});

// 로그아웃
app.post('/api/customers/logout', (req, res) => {
  db.prepare('DELETE FROM customer_sessions WHERE token=?').run(req.headers['x-customer-token']);
  res.json({ success: true });
});

// 내 정보 + 최근 주문
app.get('/api/customers/me', requireCustomer, (req, res) => {
  const customer = db.prepare('SELECT id, name, email, phone, birthdate, created_at FROM customers WHERE id=?').get(req.customerId);
  if (!customer) return res.status(404).json({ error: '회원 없음' });
  const orders = db.prepare('SELECT * FROM orders WHERE customer_id=? ORDER BY timestamp DESC LIMIT 30').all(req.customerId);
  res.json({ customer, orders: orders.map(parseOrder) });
});

// 즐겨찾기 목록
app.get('/api/customers/favorites', requireCustomer, (req, res) => {
  const favs = db.prepare('SELECT * FROM favorites WHERE customer_id=? ORDER BY id DESC').all(req.customerId);
  res.json(favs);
});

// 즐겨찾기 토글 (추가/제거)
app.post('/api/customers/favorites', requireCustomer, (req, res) => {
  const { menu_key, menu_name, menu_name_ar, menu_emoji, menu_price } = req.body;
  if (!menu_key) return res.status(400).json({ error: 'menu_key 필요' });
  const existing = db.prepare('SELECT id FROM favorites WHERE customer_id=? AND menu_key=?').get(req.customerId, menu_key);
  if (existing) {
    db.prepare('DELETE FROM favorites WHERE customer_id=? AND menu_key=?').run(req.customerId, menu_key);
    res.json({ success: true, action: 'removed' });
  } else {
    db.prepare('INSERT INTO favorites (customer_id, menu_key, menu_name, menu_name_ar, menu_emoji, menu_price) VALUES (?,?,?,?,?,?)')
      .run(req.customerId, menu_key, menu_name || '', menu_name_ar || '', menu_emoji || '', menu_price || 0);
    res.json({ success: true, action: 'added' });
  }
});

// ─── ORDERS ───────────────────────────────────────────────────────────────────

// 주문 생성 (웹사이트 → 서버)
app.post('/api/orders', optionalCustomer, (req, res) => {
  let { type, tableNum, customerName, customerPhone, arrivalTime, items, total } = req.body;
  if (!type || !items?.length || total == null)
    return res.status(400).json({ error: 'Invalid order data / بيانات الطلب غير صحيحة' });
  if (type === 'pickup' && !arrivalTime)
    return res.status(400).json({ error: 'Pickup orders require an arrival time / طلبات الاستلام تتطلب وقت الوصول' });
  if (type === 'dine') {
    const { dineToken } = req.body;
    if (!dineToken) return res.status(403).json({ error: 'QR_REQUIRED' });
    const tableRow = db.prepare('SELECT table_num FROM table_tokens WHERE token=?').get(dineToken);
    if (!tableRow) return res.status(403).json({ error: 'QR_INVALID' });
  }

  // 로그인 고객 정보 자동 채움: 로그인 상태면 이름/전화 누락 시 고객 DB에서 가져옴
  if (req.customerId && (!customerName || !customerPhone)) {
    const customer = db.prepare('SELECT name, phone FROM customers WHERE id=?').get(req.customerId);
    if (customer) {
      if (!customerName)  customerName  = customer.name;
      if (!customerPhone) customerPhone = customer.phone;
    }
  }

  try {
    const createOrder = db.transaction(() => {
      const counter = db.prepare("SELECT value FROM order_counter WHERE id=1").get();
      const num = counter.value;
      db.prepare("UPDATE order_counter SET value=value+1 WHERE id=1").run();
      const id = Date.now().toString() + Math.random().toString(36).slice(2, 6);
      db.prepare(`
        INSERT INTO orders (id, num, timestamp, status, type, table_num, customer_name, customer_phone, arrival_time, items, total, customer_id)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
      `).run(id, num, Date.now(), 'new', type,
        tableNum || null, customerName || null, customerPhone || null,
        arrivalTime || null, JSON.stringify(items), total, req.customerId || null);
      return db.prepare("SELECT * FROM orders WHERE id=?").get(id);
    });

    const order = parseOrder(createOrder());
    broadcastSSE({ type: 'new_order', order });
    res.json({ success: true, order });
  } catch (e) {
    console.error('주문 생성 오류:', e);
    res.status(500).json({ error: 'Failed to place order. Please try again / فشل في إرسال الطلب. يرجى المحاولة مجدداً' });
  }
});

// 주문 목록 조회
app.get('/api/orders', (req, res) => {
  const { date, status } = req.query;
  let sql = 'SELECT * FROM orders';
  const params = [];
  const conditions = [];

  if (date) {
    // Baghdad(UTC+3) 기준 날짜 필터: timestamp 컬럼 사용 (integer ms)
    conditions.push("date(datetime(timestamp/1000, 'unixepoch', '+3 hours')) = ?");
    params.push(date);
  }
  if (status) {
    conditions.push("status = ?");
    params.push(status);
  }
  if (conditions.length) sql += ' WHERE ' + conditions.join(' AND ');
  sql += ' ORDER BY timestamp DESC';

  try {
    const rows = db.prepare(sql).all(...params);
    res.json(rows.map(parseOrder));
  } catch (e) {
    console.error('주문 조회 오류:', e);
    res.status(500).json({ error: '주문 조회 실패' });
  }
});

// 주문 상태 변경 (캐셔 → 서버)
app.put('/api/orders/:id/status', requireCashierOrAdmin, (req, res) => {
  const { status } = req.body;
  if (!['new', 'making', 'done', 'cancelled'].includes(status))
    return res.status(400).json({ error: '유효하지 않은 상태' });

  // 캐셔 이름은 requireCashierOrAdmin 미들웨어가 req.cashierName에 설정
  const cashierName = req.cashierName || null;

  try {
    if (cashierName) {
      db.prepare("UPDATE orders SET status=?, cashier_name=? WHERE id=?").run(status, cashierName, req.params.id);
    } else {
      db.prepare("UPDATE orders SET status=? WHERE id=?").run(status, req.params.id);
    }
    const order = db.prepare("SELECT * FROM orders WHERE id=?").get(req.params.id);
    if (!order) return res.status(404).json({ error: '주문 없음' });
    const parsed = parseOrder(order);
    broadcastSSE({ type: 'order_updated', order: parsed });
    res.json({ success: true, order: parsed });
  } catch (e) {
    console.error('상태 변경 오류:', e);
    res.status(500).json({ error: '상태 변경 실패' });
  }
});

// SSE — 캐셔 실시간 스트림
app.get('/api/orders/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();
  res.write('data: {"type":"connected"}\n\n');

  sseClients.add(res);
  const heartbeat = setInterval(() => {
    try { res.write(':heartbeat\n\n'); } catch (_) {}
  }, 25000);

  req.on('close', () => {
    clearInterval(heartbeat);
    sseClients.delete(res);
  });
});

// 주문 단건 조회 (고객 상태 추적용 — 인증 불필요, 반드시 /stream 뒤에 위치)
app.get('/api/orders/:id', (req, res) => {
  try {
    const order = db.prepare("SELECT * FROM orders WHERE id=?").get(req.params.id);
    if (!order) return res.status(404).json({ error: '주문을 찾을 수 없습니다' });
    res.json(parseOrder(order));
  } catch (e) {
    res.status(500).json({ error: '주문 조회 실패' });
  }
});

function parseOrder(row) {
  return {
    ...row,
    items: typeof row.items === 'string' ? JSON.parse(row.items) : row.items
  };
}

// ─── INGREDIENTS ──────────────────────────────────────────────────────────────
app.get('/api/ingredients', (req, res) => {
  res.json(db.prepare('SELECT * FROM ingredients ORDER BY name_ko').all());
});

app.post('/api/ingredients', requireAuth, (req, res) => {
  const { name_ko, name_ar, unit, current_qty, min_qty, cost_per_unit } = req.body;
  if (!name_ko || !unit) return res.status(400).json({ error: '이름과 단위를 입력하세요' });
  const r = db.prepare(
    'INSERT INTO ingredients (name_ko, name_ar, unit, current_qty, min_qty, cost_per_unit) VALUES (?,?,?,?,?,?)'
  ).run(name_ko, name_ar || '', unit, current_qty ?? 0, min_qty ?? 1, cost_per_unit ?? 0);
  res.json({ success: true, id: r.lastInsertRowid });
});

app.put('/api/ingredients/:id', requireAuth, (req, res) => {
  const { name_ko, name_ar, unit, min_qty, cost_per_unit } = req.body;
  db.prepare(
    'UPDATE ingredients SET name_ko=?, name_ar=?, unit=?, min_qty=?, cost_per_unit=? WHERE id=?'
  ).run(name_ko, name_ar || '', unit, min_qty, cost_per_unit, req.params.id);
  res.json({ success: true });
});

app.delete('/api/ingredients/:id', requireAuth, (req, res) => {
  db.prepare('DELETE FROM ingredients WHERE id=?').run(req.params.id);
  res.json({ success: true });
});

// ─── INVENTORY ADJUST ─────────────────────────────────────────────────────────
app.post('/api/inventory/adjust', requireAuth, (req, res) => {
  const { ingredient_id, change_type, quantity, reason } = req.body;
  const ing = db.prepare('SELECT * FROM ingredients WHERE id=?').get(ingredient_id);
  if (!ing) return res.status(404).json({ error: '재료를 찾을 수 없습니다' });

  const newQty = change_type === 'in'
    ? ing.current_qty + quantity
    : ing.current_qty - quantity;

  if (newQty < 0) return res.status(400).json({ error: `재고 부족 (현재: ${ing.current_qty}${ing.unit})` });

  db.prepare('UPDATE ingredients SET current_qty=? WHERE id=?').run(newQty, ingredient_id);
  db.prepare(
    'INSERT INTO inventory_history (ingredient_id, ingredient_name, change_type, quantity, reason) VALUES (?,?,?,?,?)'
  ).run(ingredient_id, ing.name_ko, change_type, quantity, reason || '');

  res.json({ success: true, new_qty: newQty });
});

app.get('/api/inventory/history', (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 200, 500);
  res.json(db.prepare('SELECT * FROM inventory_history ORDER BY created_at DESC LIMIT ?').all(limit));
});

app.delete('/api/inventory/history/:id', requireAuth, (req, res) => {
  const id = parseInt(req.params.id);
  const row = db.prepare('SELECT * FROM inventory_history WHERE id=?').get(id);
  if (!row) return res.status(404).json({ error: '기록을 찾을 수 없습니다' });
  if (row.ingredient_id) {
    const ing = db.prepare('SELECT * FROM ingredients WHERE id=?').get(row.ingredient_id);
    if (ing) {
      const delta = row.change_type === 'in' ? -row.quantity : row.quantity;
      const newQty = Math.max(0, ing.current_qty + delta);
      db.prepare('UPDATE ingredients SET current_qty=? WHERE id=?').run(newQty, row.ingredient_id);
    }
  }
  db.prepare('DELETE FROM inventory_history WHERE id=?').run(id);
  res.json({ success: true });
});

app.put('/api/inventory/history/:id', requireAuth, (req, res) => {
  const id = parseInt(req.params.id);
  const { change_type, quantity, reason } = req.body;
  if (!['in', 'out'].includes(change_type) || !(quantity > 0))
    return res.status(400).json({ error: '유효하지 않은 데이터입니다' });
  const row = db.prepare('SELECT * FROM inventory_history WHERE id=?').get(id);
  if (!row) return res.status(404).json({ error: '기록을 찾을 수 없습니다' });
  if (row.ingredient_id) {
    const ing = db.prepare('SELECT * FROM ingredients WHERE id=?').get(row.ingredient_id);
    if (ing) {
      const revert = row.change_type === 'in' ? -row.quantity : row.quantity;
      const apply  = change_type === 'in' ? quantity : -quantity;
      const newQty = Math.max(0, ing.current_qty + revert + apply);
      db.prepare('UPDATE ingredients SET current_qty=? WHERE id=?').run(newQty, row.ingredient_id);
    }
  }
  db.prepare('UPDATE inventory_history SET change_type=?, quantity=?, reason=? WHERE id=?')
    .run(change_type, parseFloat(quantity), reason || '', id);
  res.json({ success: true });
});

// ─── RECIPES ─────────────────────────────────────────────────────────────────
app.get('/api/recipes', (req, res) => {
  res.json(db.prepare(`
    SELECT r.id, r.menu_item, r.ingredient_id, r.quantity,
           i.name_ko, i.name_ar, i.unit, i.cost_per_unit
    FROM recipes r JOIN ingredients i ON r.ingredient_id = i.id
    ORDER BY r.menu_item, i.name_ko
  `).all());
});

app.post('/api/recipes', requireAuth, (req, res) => {
  const { menu_item, items } = req.body;
  if (!menu_item || !items?.length)
    return res.status(400).json({ error: '메뉴명과 재료를 입력하세요' });
  const del = db.prepare('DELETE FROM recipes WHERE menu_item=?');
  const ins = db.prepare('INSERT INTO recipes (menu_item, ingredient_id, quantity) VALUES (?,?,?)');
  del.run(menu_item);
  for (const item of items) ins.run(menu_item, item.ingredient_id, item.quantity);
  res.json({ success: true });
});

app.delete('/api/recipes/menu/:menuItem', requireAuth, (req, res) => {
  db.prepare('DELETE FROM recipes WHERE menu_item=?').run(req.params.menuItem);
  res.json({ success: true });
});

app.get('/api/cost/:menuItem', (req, res) => {
  const rows = db.prepare(`
    SELECT r.quantity, i.cost_per_unit, i.unit, i.name_ko
    FROM recipes r JOIN ingredients i ON r.ingredient_id = i.id
    WHERE r.menu_item=?
  `).all(req.params.menuItem);
  const total = rows.reduce((s, r) => s + r.quantity * r.cost_per_unit, 0);
  res.json({ menu_item: req.params.menuItem, items: rows, total_cost: Math.round(total) });
});

// ─── DAILY SALES ──────────────────────────────────────────────────────────────
app.post('/api/daily-sales', requireAuth, (req, res) => {
  const { sale_date, sales } = req.body;
  if (!sale_date || !sales?.length)
    return res.status(400).json({ error: '날짜와 판매 데이터를 입력하세요' });

  const errors = [];
  try {
    const processSales = db.transaction(() => {
      for (const sale of sales) {
        if (!sale.quantity || sale.quantity <= 0) continue;
        const recipeItems = db.prepare(`
          SELECT r.ingredient_id, r.quantity AS recipe_qty,
                 i.name_ko, i.current_qty, i.unit
          FROM recipes r JOIN ingredients i ON r.ingredient_id = i.id
          WHERE r.menu_item=?
        `).all(sale.menu_item);

        if (!recipeItems.length) {
          errors.push(`"${sale.menu_item}" 레시피 없음 → 재고 차감 건너뜀`);
        } else {
          for (const item of recipeItems) {
            const deduct = item.recipe_qty * sale.quantity;
            const newQty = Math.max(0, item.current_qty - deduct);
            db.prepare('UPDATE ingredients SET current_qty=? WHERE id=?').run(newQty, item.ingredient_id);
            db.prepare(
              'INSERT INTO inventory_history (ingredient_id, ingredient_name, change_type, quantity, reason) VALUES (?,?,?,?,?)'
            ).run(item.ingredient_id, item.name_ko, 'out', deduct, `${sale_date} | ${sale.menu_item} x${sale.quantity}`);
          }
        }
        db.prepare('INSERT INTO daily_sales (sale_date, menu_item, quantity) VALUES (?,?,?)').run(sale_date, sale.menu_item, sale.quantity);
      }
    });
    processSales();
    res.json({ success: true, warnings: errors });
  } catch (e) {
    console.error('판매 저장 오류:', e);
    res.status(500).json({ error: '판매 저장 실패: ' + e.message });
  }
});

app.get('/api/daily-sales', (req, res) => {
  const { date } = req.query;
  if (date) {
    res.json(db.prepare('SELECT * FROM daily_sales WHERE sale_date=? ORDER BY menu_item').all(date));
  } else {
    res.json(db.prepare('SELECT * FROM daily_sales ORDER BY sale_date DESC, menu_item LIMIT 300').all());
  }
});

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
app.get('/api/dashboard', (req, res) => {
  const ingredients = db.prepare('SELECT * FROM ingredients ORDER BY name_ko').all();
  const lowStock = ingredients.filter(i => i.current_qty <= i.min_qty);
  const recentHistory = db.prepare(
    'SELECT * FROM inventory_history ORDER BY created_at DESC LIMIT 8'
  ).all();
  res.json({ ingredients, low_stock: lowStock, recent_history: recentHistory });
});

// ─── START ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n✅  Mr. Kim's Cafe 시스템 실행 중`);
  console.log(`   🌐  http://localhost:${PORT}`);
  console.log(`   🏪  웹사이트:   http://localhost:${PORT}/index.html`);
  console.log(`   💳  캐셔:       http://localhost:${PORT}/cashier.html`);
  console.log(`   📦  창고:       http://localhost:${PORT}/warehouse.html`);
  console.log(`   🔑  기본 비밀번호: 1234\n`);
});
