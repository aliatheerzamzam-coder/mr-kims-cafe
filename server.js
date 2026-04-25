const express = require('express');
const Database = require('better-sqlite3');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const path = require('path');
const https = require('https');
const QRCode = require('qrcode');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// ─── أداة تشفير كلمة المرور (bcrypt، دعم SHA-256 القديم) ─────────────────────
const BCRYPT_ROUNDS = 10;

function hashPassword(plain) {
  return bcrypt.hashSync(plain, BCRYPT_ROUNDS);
}

function verifyPassword(plain, stored) {
  if (stored.startsWith('$2')) {
    // صيغة bcrypt
    return bcrypt.compareSync(plain, stored);
  }
  // SHA-256 القديم
  return crypto.createHash('sha256').update(plain).digest('hex') === stored;
}

// ─── إرسال WhatsApp تلقائي (UltraMsg) ──────────────────────────────────────────
// متغيرات البيئة: ULTRAMSG_INSTANCE, ULTRAMSG_TOKEN
function sendWhatsApp(toPhone, message) {
  const instance = process.env.ULTRAMSG_INSTANCE;
  const token = process.env.ULTRAMSG_TOKEN;
  if (!instance || !token) return; // تخطي إذا لم يكن مفتاح API موجوداً (طريقة الكاشير اليدوية)

  // تحويل رقم العراق: 0xxx → 964xxx
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
  req.on('error', e => console.error('[WA] فشل الإرسال:', e.message));
  req.write(body);
  req.end();
}

const app = express();
const PORT = process.env.PORT || 3000;


// ─── مسار قاعدة البيانات: Railway Volume أو محلي ────────────────────────────
const DB_PATH = process.env.RAILWAY_VOLUME_MOUNT_PATH
  ? path.join(process.env.RAILWAY_VOLUME_MOUNT_PATH, 'cafe-warehouse.db')
  : path.join(__dirname, 'cafe-warehouse.db');

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ─── إنشاء الجداول ────────────────────────────────────────────────────────────
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
    category      TEXT NOT NULL DEFAULT '기타',
    box_qty       INTEGER NOT NULL DEFAULT 0,
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

  CREATE TABLE IF NOT EXISTS size_recipes (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    menu_item     TEXT NOT NULL,
    ingredient_id INTEGER NOT NULL,
    menu_category TEXT NOT NULL DEFAULT '음료',
    s_qty         REAL NOT NULL DEFAULT 8,
    m_qty         REAL NOT NULL DEFAULT 16,
    l_qty         REAL NOT NULL DEFAULT 24,
    UNIQUE(menu_item, ingredient_id),
    FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE CASCADE
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

  CREATE TABLE IF NOT EXISTS dine_sessions (
    session_token TEXT PRIMARY KEY,
    qr_token      TEXT NOT NULL,
    table_num     TEXT NOT NULL,
    created_at    INTEGER NOT NULL,
    expires_at    INTEGER NOT NULL
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
    role       TEXT NOT NULL DEFAULT 'cashier',
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS cashier_sessions (
    token      TEXT PRIMARY KEY,
    cashier_id INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (cashier_id) REFERENCES cashiers(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS customer_stamps (
    customer_id   INTEGER PRIMARY KEY,
    total_earned  INTEGER NOT NULL DEFAULT 0,
    total_redeemed INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS stamp_history (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    type        TEXT NOT NULL,
    amount      INTEGER NOT NULL DEFAULT 1,
    order_id    TEXT,
    note        TEXT,
    created_at  INTEGER NOT NULL,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS reservations (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id  INTEGER,
    name         TEXT NOT NULL,
    phone        TEXT NOT NULL,
    date         TEXT NOT NULL,
    time         TEXT NOT NULL,
    party_size   INTEGER NOT NULL DEFAULT 2,
    notes        TEXT,
    status       TEXT NOT NULL DEFAULT 'pending',
    created_at   INTEGER NOT NULL,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
  );
`);

// ترحيل قاعدة البيانات للتوافق مع الإصدارات القديمة
try { db.exec("ALTER TABLE cashiers ADD COLUMN role TEXT NOT NULL DEFAULT 'cashier'"); } catch (_) { }
try { db.exec('ALTER TABLE orders ADD COLUMN customer_id INTEGER REFERENCES customers(id)'); } catch (_) { }
try { db.exec('ALTER TABLE orders ADD COLUMN arrival_time TEXT'); } catch (_) { }
try { db.exec('ALTER TABLE orders ADD COLUMN cashier_name TEXT'); } catch (_) { }
try { db.exec('ALTER TABLE reservations ADD COLUMN table_num TEXT'); } catch (_) { }
try { db.exec('ALTER TABLE ingredients ADD COLUMN expiry_date TEXT'); } catch (_) { }
try { db.exec('ALTER TABLE ingredients ADD COLUMN supplier TEXT'); } catch (_) { }

// Migration: size_recipes — menu_item UNIQUE → UNIQUE(menu_item, ingredient_id)
try {
  const tbl = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='size_recipes'").get();
  if (tbl && /menu_item\s+TEXT\s+NOT\s+NULL\s+UNIQUE/i.test(tbl.sql)) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS size_recipes_new (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        menu_item     TEXT NOT NULL,
        ingredient_id INTEGER NOT NULL,
        menu_category TEXT NOT NULL DEFAULT '음료',
        s_qty         REAL NOT NULL DEFAULT 8,
        m_qty         REAL NOT NULL DEFAULT 16,
        l_qty         REAL NOT NULL DEFAULT 24,
        UNIQUE(menu_item, ingredient_id),
        FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE CASCADE
      );
      INSERT OR IGNORE INTO size_recipes_new SELECT * FROM size_recipes;
      DROP TABLE size_recipes;
      ALTER TABLE size_recipes_new RENAME TO size_recipes;
    `);
    console.log('[Migration] size_recipes schema upgraded');
  }
} catch (e) { console.error('[Migration] size_recipes failed:', e.message); }

// جدول أسعار القوائم (menu selling prices)
db.exec(`
  CREATE TABLE IF NOT EXISTS menu_prices (
    menu_item     TEXT PRIMARY KEY,
    selling_price REAL NOT NULL DEFAULT 0
  );
`);

// جدول حجوزات غرفة الاجتماعات
db.exec(`
  CREATE TABLE IF NOT EXISTS meeting_reservations (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL,
    phone      TEXT NOT NULL,
    date       TEXT NOT NULL,
    slot       TEXT NOT NULL,
    notes      TEXT,
    status     TEXT NOT NULL DEFAULT 'pending',
    created_at INTEGER NOT NULL
  );
`);

// بيانات افتراضية
if (!db.prepare("SELECT value FROM settings WHERE key='admin_pw'").get()) {
  const hash = crypto.createHash('sha256').update('1234').digest('hex');
  db.prepare("INSERT INTO settings (key, value) VALUES ('admin_pw', ?)").run(hash);
}
if (!db.prepare("SELECT id FROM order_counter WHERE id=1").get()) {
  db.prepare("INSERT INTO order_counter (id, value) VALUES (1, 1)").run();
}

// ─── جلسة المدير (SQLite، TTL 12 ساعة) ───────────────────────────────────────
const ADMIN_SESSION_TTL = 12 * 60 * 60 * 1000; // 12 ساعة

function requireAuth(req, res, next) {
  const token = req.headers['x-auth-token'];
  if (!token) return res.status(401).json({ error: 'يجب تسجيل دخول المدير' });
  const row = db.prepare('SELECT created_at FROM admin_sessions WHERE token=?').get(token);
  if (!row) return res.status(401).json({ error: 'يجب تسجيل دخول المدير' });
  if (Date.now() - row.created_at > ADMIN_SESSION_TTL) {
    db.prepare('DELETE FROM admin_sessions WHERE token=?').run(token);
    return res.status(401).json({ error: 'انتهت الجلسة. يرجى تسجيل الدخول مجدداً' });
  }
  // جلسة منزلقة: يُجدَّد TTL عند كل استخدام
  db.prepare('UPDATE admin_sessions SET created_at=? WHERE token=?').run(Date.now(), token);
  next();
}

// تنظيف جلسات المدير المنتهية (كل ساعة)
setInterval(() => {
  db.prepare('DELETE FROM admin_sessions WHERE created_at < ?').run(Date.now() - ADMIN_SESSION_TTL);
}, 60 * 60 * 1000);

// ─── جلسة الكاشير (TTL 12 ساعة) ──────────────────────────────────────────────
const CASHIER_SESSION_TTL = 12 * 60 * 60 * 1000;

function requireCashierOrAdmin(req, res, next) {
  // قبول رمز المدير أيضاً
  const adminToken = req.headers['x-auth-token'];
  if (adminToken) {
    const row = db.prepare('SELECT created_at FROM admin_sessions WHERE token=?').get(adminToken);
    if (row && Date.now() - row.created_at <= ADMIN_SESSION_TTL) {
      db.prepare('UPDATE admin_sessions SET created_at=? WHERE token=?').run(Date.now(), adminToken);
      req.cashierName = 'مدير';
      return next();
    }
  }
  // رمز الكاشير — يقبل الرأس أو معامل الاستعلام (EventSource لا يدعم الرؤوس المخصصة)
  const cashierToken = req.headers['x-cashier-token'] || req.query.token;
  if (!cashierToken) return res.status(401).json({ error: 'تسجيل الدخول مطلوب' });
  const row = db.prepare('SELECT cs.*, c.name FROM cashier_sessions cs JOIN cashiers c ON c.id=cs.cashier_id WHERE cs.token=?').get(cashierToken);
  if (!row) return res.status(401).json({ error: 'تسجيل الدخول مطلوب' });
  if (Date.now() - row.created_at > CASHIER_SESSION_TTL) {
    db.prepare('DELETE FROM cashier_sessions WHERE token=?').run(cashierToken);
    return res.status(401).json({ error: 'انتهت الجلسة. يرجى تسجيل الدخول مجدداً' });
  }
  db.prepare('UPDATE cashier_sessions SET created_at=? WHERE token=?').run(Date.now(), cashierToken);
  req.cashierName = row.name;
  next();
}

// تنظيف جلسات الكاشير المنتهية (كل ساعة)
setInterval(() => {
  db.prepare('DELETE FROM cashier_sessions WHERE created_at < ?').run(Date.now() - CASHIER_SESSION_TTL);
}, 60 * 60 * 1000);

// ─── جلسة العميل (قاعدة البيانات، TTL 30 يوماً) ──────────────────────────────
const CUSTOMER_SESSION_TTL = 30 * 24 * 60 * 60 * 1000; // 30 يوماً

function requireCustomer(req, res, next) {
  const token = req.headers['x-customer-token'];
  if (!token) return res.status(401).json({ error: 'Login required / تسجيل الدخول مطلوب' });
  const row = db.prepare('SELECT * FROM customer_sessions WHERE token=?').get(token);
  if (!row) return res.status(401).json({ error: 'Session not found. Please log in again / الجلسة غير موجودة. يرجى تسجيل الدخول مجدداً' });
  if (Date.now() - row.created_at > CUSTOMER_SESSION_TTL) {
    db.prepare('DELETE FROM customer_sessions WHERE token=?').run(token);
    return res.status(401).json({ error: 'Session expired. Please log in again / انتهت الجلسة. يرجى تسجيل الدخول مجدداً' });
  }
  // جلسة منزلقة: يُجدَّد TTL عند كل استخدام
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

// تنظيف جلسات العميل المنتهية (كل ساعة)
setInterval(() => {
  const cutoff = Date.now() - CUSTOMER_SESSION_TTL;
  db.prepare('DELETE FROM customer_sessions WHERE created_at < ?').run(cutoff);
}, 60 * 60 * 1000);

// تنظيف جلسات Dine-in المنتهية (كل ساعة)
setInterval(() => {
  db.prepare('DELETE FROM dine_sessions WHERE expires_at < ?').run(Date.now());
}, 60 * 60 * 1000);

// تنظيف رموز التحقق من الهاتف المنتهية (كل ساعة، TTL 5 دقائق)
const PHONE_VERIFY_TTL = 5 * 60 * 1000; // 5 دقائق
setInterval(() => {
  db.prepare('DELETE FROM phone_verifications WHERE created_at < ?').run(Date.now() - PHONE_VERIFY_TTL);
}, 60 * 60 * 1000);

// ─── قائمة عملاء SSE (للإشعارات الفورية للكاشير) ─────────────────────────────
const sseClients = new Set();

function broadcastSSE(data) {
  const msg = `data: ${JSON.stringify(data)}\n\n`;
  sseClients.forEach(res => { try { res.write(msg); } catch (_) { } });
}

// ─── الوسيط ───────────────────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      scriptSrcAttr: ["'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", "data:", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));
app.use(express.json());
app.use(express.static(path.join(__dirname)));



// ─── Rate Limiters ────────────────────────────────────────────────────────────
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many login attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.ip === '127.0.0.1' || req.ip === '::1' || req.ip === '::ffff:127.0.0.1',
});

// ─── AUTH ─────────────────────────────────────────────────────────────────────
app.post('/api/auth/login', loginLimiter, (req, res) => {
  const stored = db.prepare("SELECT value FROM settings WHERE key='admin_pw'").get();
  if (stored && verifyPassword(req.body.password || '', stored.value)) {
    // إعادة تشفير SHA-256 القديم إلى bcrypt
    if (!stored.value.startsWith('$2')) {
      db.prepare("UPDATE settings SET value=? WHERE key='admin_pw'").run(hashPassword(req.body.password));
    }
    const token = crypto.randomBytes(32).toString('hex');
    db.prepare('INSERT INTO admin_sessions (token, created_at) VALUES (?,?)').run(token, Date.now());
    res.json({ success: true, token });
  } else {
    res.status(401).json({ success: false, error: 'كلمة المرور غير صحيحة' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  db.prepare('DELETE FROM admin_sessions WHERE token=?').run(req.headers['x-auth-token']);
  res.json({ success: true });
});

app.post('/api/auth/change-password', requireAuth, (req, res) => {
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 4)
    return res.status(400).json({ error: 'يجب أن تكون كلمة المرور 4 أحرف على الأقل' });
  db.prepare("UPDATE settings SET value=? WHERE key='admin_pw'").run(hashPassword(newPassword));
  res.json({ success: true });
});

// ─── CASHIER AUTH ─────────────────────────────────────────────────────────────

app.post('/api/cashier/login', loginLimiter, (req, res) => {
  const { name, password } = req.body;
  if (!name || !password) return res.status(400).json({ error: 'أدخل الاسم وكلمة المرور' });
  const cashier = db.prepare('SELECT * FROM cashiers WHERE name=?').get(name.trim());
  if (!cashier || !verifyPassword(password, cashier.password))
    return res.status(401).json({ error: 'الاسم أو كلمة المرور غير صحيح' });
  // إعادة تشفير SHA-256 القديم إلى bcrypt
  if (!cashier.password.startsWith('$2')) {
    db.prepare('UPDATE cashiers SET password=? WHERE id=?').run(hashPassword(password), cashier.id);
  }
  const token = crypto.randomBytes(32).toString('hex');
  db.prepare('INSERT INTO cashier_sessions (token, cashier_id, created_at) VALUES (?,?,?)').run(token, cashier.id, Date.now());
  res.json({ success: true, token, name: cashier.name, role: cashier.role || 'cashier' });
});

app.post('/api/cashier/logout', (req, res) => {
  db.prepare('DELETE FROM cashier_sessions WHERE token=?').run(req.headers['x-cashier-token']);
  res.json({ success: true });
});

// جلب قائمة الكاشيرين (للمدير فقط)
app.get('/api/cashiers', requireAuth, (req, res) => {
  res.json(db.prepare('SELECT id, name, role, created_at FROM cashiers ORDER BY name').all());
});

// إنشاء حساب كاشير (للمدير فقط)
app.post('/api/cashiers', requireAuth, (req, res) => {
  const { name, password, role } = req.body;
  if (!name || !password) return res.status(400).json({ error: 'أدخل الاسم وكلمة المرور' });
  if (password.length < 4) return res.status(400).json({ error: 'يجب أن تكون كلمة المرور 4 أحرف على الأقل' });
  const safeRole = role === 'manager' ? 'manager' : 'cashier';
  try {
    const r = db.prepare('INSERT INTO cashiers (name, password, role, created_at) VALUES (?,?,?,?)').run(name.trim(), hashPassword(password), safeRole, Date.now());
    res.json({ success: true, id: r.lastInsertRowid, name: name.trim(), role: safeRole });
  } catch (e) {
    res.status(400).json({ error: 'الاسم موجود بالفعل' });
  }
});

// حذف حساب كاشير (للمدير فقط)
app.delete('/api/cashiers/:id', requireAuth, (req, res) => {
  db.prepare('DELETE FROM cashier_sessions WHERE cashier_id=?').run(req.params.id);
  db.prepare('DELETE FROM cashiers WHERE id=?').run(req.params.id);
  res.json({ success: true });
});

// ─── رموز الطاولة (مصادقة Dine-in بـ QR) ─────────────────────────────────────

// جلب القائمة الكاملة
app.get('/api/table-tokens', requireCashierOrAdmin, (req, res) => {
  res.json(db.prepare('SELECT * FROM table_tokens ORDER BY CAST(table_num AS INTEGER)').all());
});

// إنشاء/إعادة إصدار الرمز
app.post('/api/table-tokens', requireCashierOrAdmin, (req, res) => {
  const { tableNum } = req.body;
  if (!tableNum) return res.status(400).json({ error: 'tableNum مطلوب' });
  const token = crypto.randomBytes(8).toString('hex'); // 16 حرف hex
  db.prepare('INSERT OR REPLACE INTO table_tokens (table_num, token) VALUES (?,?)').run(String(tableNum), token);
  res.json({ success: true, table_num: String(tableNum), token });
});

// حذف الرمز
app.delete('/api/table-tokens/:tableNum', requireCashierOrAdmin, (req, res) => {
  db.prepare('DELETE FROM table_tokens WHERE table_num=?').run(req.params.tableNum);
  res.json({ success: true });
});

// ─── جلسة Dine-in (ساعة واحدة بعد مسح QR) ────────────────────────────────────

const DINE_SESSION_TTL = 60 * 60 * 1000; // ساعة واحدة

// إصدار الجلسة عند مسح QR (وقت المسح الأول ثابت، لا يُمدَّد عند إعادة المسح)
app.post('/api/dine-session', (req, res) => {
  const { qrToken } = req.body;
  if (!qrToken) return res.status(400).json({ error: 'qrToken مطلوب' });
  const tableRow = db.prepare('SELECT table_num FROM table_tokens WHERE token=?').get(qrToken);
  if (!tableRow) return res.status(403).json({ error: 'QR_INVALID' });

  // إرجاع الجلسة الصالحة الموجودة كما هي (وقت الانتهاء ثابت)
  const existing = db.prepare(
    'SELECT * FROM dine_sessions WHERE qr_token=? AND expires_at > ?'
  ).get(qrToken, Date.now());
  if (existing) {
    return res.json({ sessionToken: existing.session_token, expiresAt: existing.expires_at, tableNum: existing.table_num });
  }

  // تنظيف الجلسات المنتهية وإنشاء جلسة جديدة
  db.prepare('DELETE FROM dine_sessions WHERE qr_token=?').run(qrToken);
  const sessionToken = crypto.randomBytes(16).toString('hex');
  const now = Date.now();
  const expiresAt = now + DINE_SESSION_TTL;
  db.prepare(
    'INSERT INTO dine_sessions (session_token, qr_token, table_num, created_at, expires_at) VALUES (?,?,?,?,?)'
  ).run(sessionToken, qrToken, tableRow.table_num, now, expiresAt);

  res.json({ sessionToken, expiresAt, tableNum: tableRow.table_num });
});

// تمديد جلسة Dine-in بساعة إضافية (يستدعيه الكاشير)
app.post('/api/dine-sessions/extend', requireCashierOrAdmin, (req, res) => {
  const { tableNum } = req.body;
  if (!tableNum) return res.status(400).json({ error: 'tableNum مطلوب' });
  const session = db.prepare(
    'SELECT * FROM dine_sessions WHERE table_num=? ORDER BY expires_at DESC LIMIT 1'
  ).get(String(tableNum));
  if (!session) return res.status(404).json({ error: 'لا توجد جلسة نشطة لهذه الطاولة' });
  const newExpiry = Math.max(session.expires_at, Date.now()) + DINE_SESSION_TTL;
  db.prepare('UPDATE dine_sessions SET expires_at=? WHERE session_token=?').run(newExpiry, session.session_token);
  res.json({ success: true, expiresAt: newExpiry, tableNum: session.table_num });
});

// إنشاء صورة QR (من جانب الخادم، بدون CDN)
app.get('/api/qr-image', requireCashierOrAdmin, async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'url معامل مطلوب' });
  try {
    const dataUrl = await QRCode.toDataURL(url, { width: 200, margin: 1, errorCorrectionLevel: 'M' });
    res.json({ dataUrl });
  } catch (e) {
    res.status(500).json({ error: 'فشل إنشاء QR' });
  }
});

// ─── CUSTOMER AUTH ────────────────────────────────────────────────────────────

// تسجيل
app.post('/api/customers/register', (req, res) => {
  const { name, email, phone, password, birthdate } = req.body;
  if (!name || !email || !phone || !password)
    return res.status(400).json({ error: 'Please fill in all fields / يرجى ملء جميع الحقول' });
  if (password.length < 8)
    return res.status(400).json({ error: 'Password must be at least 8 characters / يجب أن تكون كلمة المرور 8 أحرف على الأقل' });

  try {
    const r = db.prepare(
      'INSERT INTO customers (name, email, phone, password, birthdate) VALUES (?,?,?,?,?)'
    ).run(name.trim(), email.trim().toLowerCase(), phone.trim(), hashPassword(password), birthdate || null);
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

// تسجيل الدخول
app.post('/api/customers/login', (req, res) => {
  const { phone, password } = req.body;
  if (!phone || !password) return res.status(400).json({ error: 'Phone number and password are required / رقم الهاتف وكلمة المرور مطلوبان' });
  const customer = db.prepare('SELECT * FROM customers WHERE phone=?').get(phone.trim());
  if (!customer || !verifyPassword(password, customer.password))
    return res.status(401).json({ error: 'Incorrect phone number or password / رقم الهاتف أو كلمة المرور غير صحيحة' });
  // إعادة تشفير SHA-256 القديم إلى bcrypt
  if (!customer.password.startsWith('$2')) {
    db.prepare('UPDATE customers SET password=? WHERE id=?').run(hashPassword(password), customer.id);
  }
  const token = crypto.randomBytes(32).toString('hex');
  db.prepare('INSERT INTO customer_sessions (token, customer_id, created_at) VALUES (?,?,?)').run(token, customer.id, Date.now());
  const { password: _, ...safe } = customer;
  res.json({ success: true, token, customer: safe });
});

// تسجيل الخروج
app.post('/api/customers/logout', (req, res) => {
  db.prepare('DELETE FROM customer_sessions WHERE token=?').run(req.headers['x-customer-token']);
  res.json({ success: true });
});

// معلوماتي + الطلبات الأخيرة
app.get('/api/customers/me', requireCustomer, (req, res) => {
  const customer = db.prepare('SELECT id, name, email, phone, birthdate, created_at FROM customers WHERE id=?').get(req.customerId);
  if (!customer) return res.status(404).json({ error: 'المستخدم غير موجود' });
  const orders = db.prepare('SELECT * FROM orders WHERE customer_id=? ORDER BY timestamp DESC LIMIT 30').all(req.customerId);
  res.json({ customer, orders: orders.map(parseOrder) });
});

// قائمة حجوزاتي (العميل)
app.get('/api/customers/reservations', requireCustomer, (req, res) => {
  const rows = db.prepare(
    "SELECT * FROM reservations WHERE customer_id=? ORDER BY date DESC, time DESC LIMIT 20"
  ).all(req.customerId);
  res.json(rows);
});

// قائمة المفضلة
app.get('/api/customers/favorites', requireCustomer, (req, res) => {
  const favs = db.prepare('SELECT * FROM favorites WHERE customer_id=? ORDER BY id DESC').all(req.customerId);
  res.json(favs);
});

// تبديل المفضلة (إضافة/إزالة)
app.post('/api/customers/favorites', requireCustomer, (req, res) => {
  const { menu_key, menu_name, menu_name_ar, menu_emoji, menu_price } = req.body;
  if (!menu_key) return res.status(400).json({ error: 'menu_key مطلوب' });
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

// إنشاء طلب (الموقع → الخادم)
app.post('/api/orders', optionalCustomer, (req, res) => {
  let { type, tableNum, customerName, customerPhone, arrivalTime, items, total } = req.body;
  if (!type || !items?.length || total == null)
    return res.status(400).json({ error: 'Invalid order data / بيانات الطلب غير صحيحة' });
  if (type === 'pickup' && !arrivalTime)
    return res.status(400).json({ error: 'Pickup orders require an arrival time / طلبات الاستلام تتطلب وقت الوصول' });
  if (type === 'dine') {
    const { dineSessionToken } = req.body;
    if (!dineSessionToken) return res.status(403).json({ error: 'QR_REQUIRED' });
    const session = db.prepare('SELECT * FROM dine_sessions WHERE session_token=?').get(dineSessionToken);
    if (!session) return res.status(403).json({ error: 'QR_INVALID' });
    if (session.expires_at < Date.now()) return res.status(403).json({ error: 'QR_EXPIRED' });
  }

  // ملء معلومات العميل تلقائياً: إذا كان مسجلاً، يُجلب الاسم/الهاتف من قاعدة البيانات
  if (req.customerId && (!customerName || !customerPhone)) {
    const customer = db.prepare('SELECT name, phone FROM customers WHERE id=?').get(req.customerId);
    if (customer) {
      if (!customerName) customerName = customer.name;
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
    console.error('خطأ في إنشاء الطلب:', e);
    res.status(500).json({ error: 'Failed to place order. Please try again / فشل في إرسال الطلب. يرجى المحاولة مجدداً' });
  }
});

// جلب قائمة الطلبات
app.get('/api/orders', requireCashierOrAdmin, (req, res) => {
  const { date, status } = req.query;
  let sql = 'SELECT * FROM orders';
  const params = [];
  const conditions = [];

  if (date) {
    // فلتر التاريخ بتوقيت بغداد (UTC+3): يستخدم عمود timestamp (integer ms)
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
    console.error('خطأ في جلب الطلبات:', e);
    res.status(500).json({ error: 'فشل في جلب الطلبات' });
  }
});

// تغيير حالة الطلب (الكاشير → الخادم)
app.put('/api/orders/:id/status', requireCashierOrAdmin, (req, res) => {
  const { status } = req.body;
  if (!['new', 'making', 'done', 'cancelled'].includes(status))
    return res.status(400).json({ error: 'حالة غير صالحة' });

  // اسم الكاشير يُعيَّن في req.cashierName بواسطة الوسيط requireCashierOrAdmin
  const cashierName = req.cashierName || null;

  try {
    const prevOrder = db.prepare("SELECT * FROM orders WHERE id=?").get(req.params.id);
    if (!prevOrder) return res.status(404).json({ error: 'الطلب غير موجود' });

    if (cashierName) {
      db.prepare("UPDATE orders SET status=?, cashier_name=? WHERE id=?").run(status, cashierName, req.params.id);
    } else {
      db.prepare("UPDATE orders SET status=? WHERE id=?").run(status, req.params.id);
    }
    const order = db.prepare("SELECT * FROM orders WHERE id=?").get(req.params.id);
    const parsed = parseOrder(order);
    broadcastSSE({ type: 'order_updated', order: parsed });

    // 주문 완료 시 레시피 기반 재고 자동 차감
    if (status === 'done' && prevOrder.status !== 'done') {
      try {
        const orderItems = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
        for (const item of (orderItems || [])) {
          const menuName = item.name;
          const orderQty = item.qty || 1;
          const recipeRows = db.prepare(
            'SELECT r.ingredient_id, r.quantity, i.current_qty, i.capacity_ml, i.name_ko, i.unit FROM recipes r JOIN ingredients i ON r.ingredient_id=i.id WHERE r.menu_item=?'
          ).all(menuName);
          for (const row of recipeRows) {
            let deduct;
            if (row.capacity_ml > 0) {
              // 레시피 quantity는 mL/g 단위, capacity_ml은 1단위당 mL/g
              deduct = (row.quantity / row.capacity_ml) * orderQty;
            } else {
              // capacity 미설정 시 재료 단위 그대로 차감
              deduct = row.quantity * orderQty;
            }
            const newQty = Math.max(0, row.current_qty - deduct);
            db.prepare('UPDATE ingredients SET current_qty=? WHERE id=?').run(newQty, row.ingredient_id);
            db.prepare(
              'INSERT INTO inventory_history (ingredient_id, ingredient_name, change_type, quantity, reason) VALUES (?,?,?,?,?)'
            ).run(row.ingredient_id, row.name_ko, 'out', deduct, `주문 #${order.num} - ${menuName} x${orderQty}`);
          }
        }
      } catch (de) {
        console.error('재고 자동 차감 오류:', de);
      }
    }

    // عند الانتقال إلى "done": منح العميل المسجل طابعاً واحداً تلقائياً
    // منع التكرار إذا كان الطلب "done" بالفعل
    if (status === 'done' && prevOrder.status !== 'done' && order.customer_id) {
      try {
        db.prepare('INSERT OR IGNORE INTO customer_stamps (customer_id, total_earned, total_redeemed) VALUES (?,0,0)').run(order.customer_id);
        db.prepare('UPDATE customer_stamps SET total_earned = total_earned + 1 WHERE customer_id=?').run(order.customer_id);
        db.prepare('INSERT INTO stamp_history (customer_id, type, amount, order_id, created_at) VALUES (?,?,?,?,?)').run(order.customer_id, 'earn', 1, order.id, Date.now());
        const stampRow = db.prepare('SELECT * FROM customer_stamps WHERE customer_id=?').get(order.customer_id);
        broadcastSSE({ type: 'stamp_earned', customer_id: order.customer_id, available: stampRow.total_earned - stampRow.total_redeemed });
      } catch (se) {
        console.error('خطأ في منح الطابع:', se);
      }
    }

    res.json({ success: true, order: parsed });
  } catch (e) {
    console.error('خطأ في تغيير الحالة:', e);
    res.status(500).json({ error: 'فشل في تغيير الحالة' });
  }
});

// SSE — بث مباشر للكاشير
app.get('/api/orders/stream', requireCashierOrAdmin, (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();
  res.write('data: {"type":"connected"}\n\n');

  sseClients.add(res);
  const heartbeat = setInterval(() => {
    try { res.write(':heartbeat\n\n'); } catch (_) { }
  }, 25000);

  req.on('close', () => {
    clearInterval(heartbeat);
    sseClients.delete(res);
  });
});

// جلب طلب واحد (لتتبع الحالة من قِبل العميل — يجب أن يكون بعد /stream)
// المصادقة اختيارية: الكاشير/المدير يحصلان على البيانات الكاملة، العميل يحصل على حالة فقط
app.get('/api/orders/:id', (req, res) => {
  try {
    const order = db.prepare("SELECT * FROM orders WHERE id=?").get(req.params.id);
    if (!order) return res.status(404).json({ error: 'الطلب غير موجود' });

    const parsed = parseOrder(order);

    // 인증된 캐셔/어드민 여부 확인
    const adminToken = req.headers['x-auth-token'];
    const cashierToken = req.headers['x-cashier-token'];
    const isStaff = (adminToken && db.prepare('SELECT 1 FROM admin_sessions WHERE token=?').get(adminToken)) ||
                    (cashierToken && db.prepare('SELECT 1 FROM cashier_sessions WHERE token=?').get(cashierToken));

    if (isStaff) {
      return res.json(parsed);
    }

    // 미인증 요청: PII(이름, 전화번호) 제거 후 반환
    const { customer_name, customer_phone, ...safeOrder } = parsed;
    res.json(safeOrder);
  } catch (e) {
    res.status(500).json({ error: 'فشل في جلب الطلب' });
  }
});

function parseOrder(row) {
  return {
    ...row,
    items: typeof row.items === 'string' ? JSON.parse(row.items) : row.items
  };
}

// ─── INGREDIENTS ──────────────────────────────────────────────────────────────

// 컬럼 없으면 추가 (기존 DB 마이그레이션)
try { db.prepare("ALTER TABLE ingredients ADD COLUMN category TEXT NOT NULL DEFAULT '기타'").run(); } catch { }
try { db.prepare("ALTER TABLE ingredients ADD COLUMN box_qty INTEGER NOT NULL DEFAULT 0").run(); } catch { }
try { db.prepare("ALTER TABLE ingredients ADD COLUMN capacity_ml INTEGER NOT NULL DEFAULT 0").run(); } catch { }
try { db.prepare("ALTER TABLE recipes ADD COLUMN menu_category TEXT NOT NULL DEFAULT '기타'").run(); } catch { }
try { db.prepare("ALTER TABLE recipes ADD COLUMN unit TEXT NOT NULL DEFAULT 'ml'").run(); } catch { }

// 이름에서 용량(mL/g) 자동 파싱 — capacity_ml = 0 인 재료만 업데이트
(function migrateCapacityFromName() {
  function parseCapacity(name) {
    const m = name.match(/\((\d+\.?\d*)(mL|ml|L|kg|g)/i);
    if (!m) return 0;
    const val = parseFloat(m[1]);
    const unit = m[2].toLowerCase();
    if (unit === 'l')  return Math.round(val * 1000);
    if (unit === 'kg') return Math.round(val * 1000);
    return Math.round(val); // ml, g
  }
  const rows = db.prepare('SELECT id, name_ko FROM ingredients WHERE capacity_ml = 0').all();
  const upd  = db.prepare('UPDATE ingredients SET capacity_ml = ? WHERE id = ?');
  rows.forEach(r => { const c = parseCapacity(r.name_ko); if (c > 0) upd.run(c, r.id); });
})();

// 이름에서 카테고리 자동 추론
function inferCategory(name) {
  const n = (name || '').toLowerCase();
  if (n.includes('smoothie') || n.includes('스무디')) return '스무디';
  if (n.includes('syrup') || n.includes('시럽')) return '시럽';
  if (n.includes('sauce') || n.includes('소스')) return '소스';
  if (n.includes('powder') || n.includes('파우더')) return '파우더';
  if (n.includes('pulp') || n.includes('과육')) return '과육';
  return '기타';
}

// 카테고리 정렬 순서
const CATEGORY_ORDER = ['시럽', '소스', '스무디', '파우더', '과육', '기타'];

app.get('/api/ingredients', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT * FROM ingredients ORDER BY category, name_ko').all();
  res.json(rows);
});

app.post('/api/ingredients', requireAuth, (req, res) => {
  const { name_ko, name_ar, unit, current_qty, min_qty, cost_per_unit, box_qty, category: bodyCategory, capacity_ml, expiry_date, supplier } = req.body;
  if (!name_ko || !unit) return res.status(400).json({ error: 'أدخل الاسم والوحدة' });
  const category = (bodyCategory && bodyCategory.trim()) ? bodyCategory.trim() : inferCategory(name_ko);
  const r = db.prepare(
    'INSERT INTO ingredients (name_ko, name_ar, unit, current_qty, min_qty, cost_per_unit, category, box_qty, capacity_ml, expiry_date, supplier) VALUES (?,?,?,?,?,?,?,?,?,?,?)'
  ).run(name_ko, name_ar || '', unit, current_qty ?? 0, min_qty ?? 1, cost_per_unit ?? 0, category, box_qty ?? 0, capacity_ml ?? 0, expiry_date || null, supplier || null);
  res.json({ success: true, id: r.lastInsertRowid });
});

app.put('/api/ingredients/:id', requireAuth, (req, res) => {
  const { name_ko, name_ar, unit, current_qty, min_qty, cost_per_unit, box_qty, category: bodyCategory, capacity_ml, expiry_date, supplier } = req.body;
  const existing = db.prepare('SELECT id FROM ingredients WHERE id=?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'المادة غير موجودة' });
  const category = (bodyCategory && bodyCategory.trim()) ? bodyCategory.trim() : inferCategory(name_ko);
  db.prepare(
    'UPDATE ingredients SET name_ko=?, name_ar=?, unit=?, current_qty=?, min_qty=?, cost_per_unit=?, category=?, box_qty=?, capacity_ml=?, expiry_date=?, supplier=? WHERE id=?'
  ).run(name_ko, name_ar || '', unit, current_qty ?? existing.current_qty ?? 0, min_qty, cost_per_unit, category, box_qty ?? 0, capacity_ml ?? 0, expiry_date || null, supplier || null, req.params.id);
  res.json({ success: true });
});

app.patch('/api/ingredients/:id', requireAuth, (req, res) => {
  const existing = db.prepare('SELECT * FROM ingredients WHERE id=?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'المادة غير موجودة' });
  const { name_ko, name_ar, unit, min_qty, cost_per_unit, box_qty, category: bodyCategory, capacity_ml, expiry_date, supplier } = req.body;
  const name_ko_f = name_ko ?? existing.name_ko;
  const category = (bodyCategory !== undefined)
    ? ((bodyCategory && bodyCategory.trim()) ? bodyCategory.trim() : inferCategory(name_ko_f))
    : existing.category;
  db.prepare(
    'UPDATE ingredients SET name_ko=?, name_ar=?, unit=?, min_qty=?, cost_per_unit=?, category=?, box_qty=?, capacity_ml=?, expiry_date=?, supplier=? WHERE id=?'
  ).run(
    name_ko_f,
    name_ar ?? existing.name_ar,
    unit ?? existing.unit,
    min_qty ?? existing.min_qty,
    cost_per_unit ?? existing.cost_per_unit,
    category,
    box_qty ?? existing.box_qty,
    capacity_ml ?? existing.capacity_ml,
    expiry_date !== undefined ? (expiry_date || null) : existing.expiry_date,
    supplier !== undefined ? (supplier || null) : existing.supplier,
    req.params.id
  );
  res.json({ success: true });
});

app.delete('/api/ingredients/:id', requireAuth, (req, res) => {
  const existing = db.prepare('SELECT id FROM ingredients WHERE id=?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'المادة غير موجودة' });
  db.prepare('DELETE FROM ingredients WHERE id=?').run(req.params.id);
  res.json({ success: true });
});

// ─── INVENTORY ADJUST ─────────────────────────────────────────────────────────
app.post('/api/inventory/adjust', requireAuth, (req, res) => {
  const { ingredient_id, change_type, quantity, reason } = req.body;
  const ing = db.prepare('SELECT * FROM ingredients WHERE id=?').get(ingredient_id);
  if (!ing) return res.status(404).json({ error: 'المادة غير موجودة' });

  const newQty = change_type === 'in'
    ? ing.current_qty + quantity
    : ing.current_qty - quantity;

  if (newQty < 0) return res.status(400).json({ error: `مخزون غير كافٍ (الحالي: ${ing.current_qty}${ing.unit})` });

  db.prepare('UPDATE ingredients SET current_qty=? WHERE id=?').run(newQty, ingredient_id);
  db.prepare(
    'INSERT INTO inventory_history (ingredient_id, ingredient_name, change_type, quantity, reason) VALUES (?,?,?,?,?)'
  ).run(ingredient_id, ing.name_ko, change_type, quantity, reason || '');

  res.json({ success: true, new_qty: newQty });
});

app.get('/api/inventory/history', requireAuth, (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 200, 500);
  res.json(db.prepare('SELECT * FROM inventory_history ORDER BY created_at DESC LIMIT ?').all(limit));
});

app.delete('/api/inventory/history/:id', requireAuth, (req, res) => {
  const id = parseInt(req.params.id);
  const row = db.prepare('SELECT * FROM inventory_history WHERE id=?').get(id);
  if (!row) return res.status(404).json({ error: 'السجل غير موجود' });
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
    return res.status(400).json({ error: 'بيانات غير صالحة' });
  const row = db.prepare('SELECT * FROM inventory_history WHERE id=?').get(id);
  if (!row) return res.status(404).json({ error: 'السجل غير موجود' });
  if (row.ingredient_id) {
    const ing = db.prepare('SELECT * FROM ingredients WHERE id=?').get(row.ingredient_id);
    if (ing) {
      const revert = row.change_type === 'in' ? -row.quantity : row.quantity;
      const apply = change_type === 'in' ? quantity : -quantity;
      const newQty = Math.max(0, ing.current_qty + revert + apply);
      db.prepare('UPDATE ingredients SET current_qty=? WHERE id=?').run(newQty, row.ingredient_id);
    }
  }
  db.prepare('UPDATE inventory_history SET change_type=?, quantity=?, reason=? WHERE id=?')
    .run(change_type, parseFloat(quantity), reason || '', id);
  res.json({ success: true });
});

// ─── RECIPES ─────────────────────────────────────────────────────────────────
app.get('/api/recipes', requireAuth, (req, res) => {
  res.json(db.prepare(`
    SELECT r.id, r.menu_item, r.ingredient_id, r.quantity,
           r.menu_category, r.unit AS recipe_unit,
           i.name_ko, i.name_ar, i.unit AS ing_unit, i.cost_per_unit, i.capacity_ml
    FROM recipes r JOIN ingredients i ON r.ingredient_id = i.id
    ORDER BY r.menu_category, r.menu_item, i.name_ko
  `).all());
});

app.post('/api/recipes', requireAuth, (req, res) => {
  const { menu_item, items, menu_category } = req.body;
  if (!menu_item || !items?.length)
    return res.status(400).json({ error: 'أدخل اسم القائمة والمواد' });
  const category = (menu_category && menu_category.trim()) ? menu_category.trim() : '기타';
  const del = db.prepare('DELETE FROM recipes WHERE menu_item=?');
  const ins = db.prepare('INSERT INTO recipes (menu_item, ingredient_id, quantity, menu_category, unit) VALUES (?,?,?,?,?)');
  del.run(menu_item);
  for (const item of items) {
    const unit = ['ml', 'g'].includes(item.unit) ? item.unit : 'ml';
    ins.run(menu_item, item.ingredient_id, item.quantity, category, unit);
  }
  res.json({ success: true });
});

app.delete('/api/recipes/menu/:menuItem', requireAuth, (req, res) => {
  db.prepare('DELETE FROM recipes WHERE menu_item=?').run(req.params.menuItem);
  res.json({ success: true });
});

app.get('/api/cost/:menuItem', (req, res) => {
  const rows = db.prepare(`
    SELECT r.quantity, i.cost_per_unit, i.unit, i.name_ko, i.capacity_ml
    FROM recipes r JOIN ingredients i ON r.ingredient_id = i.id
    WHERE r.menu_item=?
  `).all(req.params.menuItem);
  const total = rows.reduce((s, r) => {
    const unitCost = r.capacity_ml > 0 ? r.cost_per_unit / r.capacity_ml : r.cost_per_unit;
    return s + r.quantity * unitCost;
  }, 0);
  res.json({ menu_item: req.params.menuItem, items: rows, total_cost: Math.round(total) });
});

// ─── DAILY SALES ──────────────────────────────────────────────────────────────
app.post('/api/daily-sales', requireAuth, (req, res) => {
  const { sale_date, sales } = req.body;
  if (!sale_date || !sales?.length)
    return res.status(400).json({ error: 'أدخل التاريخ وبيانات المبيعات' });

  const errors = [];
  try {
    const processSales = db.transaction(() => {
      for (const sale of sales) {
        if (!sale.quantity || sale.quantity <= 0) continue;
        const recipeItems = db.prepare(`
          SELECT r.ingredient_id, r.quantity AS recipe_qty,
                 i.name_ko, i.current_qty, i.unit, i.capacity_ml
          FROM recipes r JOIN ingredients i ON r.ingredient_id = i.id
          WHERE r.menu_item=?
        `).all(sale.menu_item);

        if (!recipeItems.length) {
          errors.push(`"${sale.menu_item}" لا توجد وصفة → تم تخطي خصم المخزون`);
        } else {
          for (const item of recipeItems) {
            const deduct = item.capacity_ml > 0
              ? (item.recipe_qty / item.capacity_ml) * sale.quantity
              : item.recipe_qty * sale.quantity;
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
    console.error('خطأ في حفظ المبيعات:', e);
    res.status(500).json({ error: 'فشل في حفظ المبيعات: ' + e.message });
  }
});

app.get('/api/daily-sales', requireCashierOrAdmin, (req, res) => {
  const { date } = req.query;
  if (date) {
    res.json(db.prepare('SELECT * FROM daily_sales WHERE sale_date=? ORDER BY menu_item').all(date));
  } else {
    res.json(db.prepare('SELECT * FROM daily_sales ORDER BY sale_date DESC, menu_item LIMIT 300').all());
  }
});

// ─── SIZE RECIPES ─────────────────────────────────────────────────────────────
app.get('/api/size-recipes', requireAuth, (_req, res) => {
  res.json(db.prepare(`
    SELECT sr.id, sr.menu_item, sr.ingredient_id, sr.menu_category,
           sr.s_qty, sr.m_qty, sr.l_qty,
           i.name_ko, i.name_ar, i.unit
    FROM size_recipes sr JOIN ingredients i ON sr.ingredient_id = i.id
    ORDER BY sr.menu_category, sr.menu_item
  `).all());
});

app.post('/api/size-recipes', requireAuth, (req, res) => {
  const { menu_item, menu_category, items } = req.body;
  if (!menu_item || !items?.length)
    return res.status(400).json({ error: '메뉴명과 재료 목록을 입력하세요' });
  for (const it of items) {
    if (!it.ingredient_id || it.s_qty == null || it.m_qty == null || it.l_qty == null)
      return res.status(400).json({ error: '모든 재료의 S/M/L 수량을 입력하세요' });
    if (it.s_qty < 0 || it.m_qty < 0 || it.l_qty < 0)
      return res.status(400).json({ error: '수량은 0 이상이어야 합니다' });
  }
  const category = (menu_category && menu_category.trim()) ? menu_category.trim() : '음료';
  const del = db.prepare('DELETE FROM size_recipes WHERE menu_item=?');
  const ins = db.prepare(`
    INSERT INTO size_recipes (menu_item, ingredient_id, menu_category, s_qty, m_qty, l_qty)
    VALUES (?,?,?,?,?,?)
  `);
  db.transaction(() => {
    del.run(menu_item);
    for (const it of items) {
      ins.run(menu_item, it.ingredient_id, category, it.s_qty, it.m_qty, it.l_qty);
    }
  })();
  res.json({ success: true });
});

app.delete('/api/size-recipes/menu/:menuItem', requireAuth, (req, res) => {
  db.prepare('DELETE FROM size_recipes WHERE menu_item=?').run(req.params.menuItem);
  res.json({ success: true });
});

// ─── SIZE SALES ───────────────────────────────────────────────────────────────
app.post('/api/size-sales', requireAuth, (req, res) => {
  const { sale_date, sales } = req.body;
  if (!sale_date || !sales?.length)
    return res.status(400).json({ error: '날짜와 판매 데이터를 입력하세요' });

  const warnings = [];
  try {
    const process = db.transaction(() => {
      for (const sale of sales) {
        const s = parseInt(sale.s_count) || 0;
        const m = parseInt(sale.m_count) || 0;
        const l = parseInt(sale.l_count) || 0;
        if (s + m + l === 0) continue;

        const recipeRows = db.prepare(`
          SELECT sr.ingredient_id, sr.s_qty, sr.m_qty, sr.l_qty,
                 i.name_ko, i.current_qty
          FROM size_recipes sr JOIN ingredients i ON sr.ingredient_id = i.id
          WHERE sr.menu_item=?
        `).all(sale.menu_item);

        if (!recipeRows.length) {
          warnings.push(`"${sale.menu_item}" 사이즈 레시피 없음 → 재고 차감 생략`);
          continue;
        }

        for (const recipe of recipeRows) {
          const deduct = s * recipe.s_qty + m * recipe.m_qty + l * recipe.l_qty;
          const newQty = Math.max(0, recipe.current_qty - deduct);
          db.prepare('UPDATE ingredients SET current_qty=? WHERE id=?').run(newQty, recipe.ingredient_id);
          db.prepare(
            'INSERT INTO inventory_history (ingredient_id, ingredient_name, change_type, quantity, reason) VALUES (?,?,?,?,?)'
          ).run(recipe.ingredient_id, recipe.name_ko, 'out', deduct,
            `${sale_date} | ${sale.menu_item} S×${s} M×${m} L×${l} = ${deduct}g`);
        }

        const totalQty = s + m + l;
        db.prepare('INSERT INTO daily_sales (sale_date, menu_item, quantity) VALUES (?,?,?)').run(sale_date, sale.menu_item, totalQty);
      }
    });
    process();
    res.json({ success: true, warnings });
  } catch (e) {
    console.error('사이즈 판매 저장 오류:', e);
    res.status(500).json({ error: '저장 실패: ' + e.message });
  }
});

// ─── STAMPS ───────────────────────────────────────────────────────────────────

// جلب طوابعي + منح مكافأة عيد الميلاد تلقائياً
app.get('/api/customers/stamps', requireCustomer, (req, res) => {
  db.prepare('INSERT OR IGNORE INTO customer_stamps (customer_id, total_earned, total_redeemed) VALUES (?,0,0)').run(req.customerId);
  let row = db.prepare('SELECT * FROM customer_stamps WHERE customer_id=?').get(req.customerId);

  // مكافأة عيد الميلاد: طابعان إضافيان في يوم الميلاد (مرة واحدة في السنة)
  const customer = db.prepare('SELECT birthdate FROM customers WHERE id=?').get(req.customerId);
  if (customer && customer.birthdate) {
    const today = new Date();
    const bd = new Date(customer.birthdate);
    const isBirthday = bd.getMonth() === today.getMonth() && bd.getDate() === today.getDate();
    if (isBirthday) {
      const thisYear = today.getFullYear();
      const alreadyGiven = db.prepare(
        "SELECT id FROM stamp_history WHERE customer_id=? AND type='birthday' AND created_at >= ? AND created_at < ?"
      ).get(req.customerId, new Date(thisYear, 0, 1).getTime(), new Date(thisYear + 1, 0, 1).getTime());
      if (!alreadyGiven) {
        db.prepare('UPDATE customer_stamps SET total_earned = total_earned + 2 WHERE customer_id=?').run(req.customerId);
        db.prepare('INSERT INTO stamp_history (customer_id, type, amount, note, created_at) VALUES (?,?,?,?,?)').run(
          req.customerId, 'birthday', 2, 'Happy Birthday! 🎂 +2 bonus stamps', Date.now()
        );
        row = db.prepare('SELECT * FROM customer_stamps WHERE customer_id=?').get(req.customerId);
      }
    }
  }

  const available = row.total_earned - row.total_redeemed;
  const history = db.prepare('SELECT * FROM stamp_history WHERE customer_id=? ORDER BY created_at DESC LIMIT 30').all(req.customerId);
  res.json({ total_earned: row.total_earned, total_redeemed: row.total_redeemed, available, history });
});

// منح طابع (يستدعيه الكاشير عند إتمام الطلب)
app.post('/api/stamps/earn', requireCashierOrAdmin, (req, res) => {
  let { customer_id, phone, order_id, amount } = req.body;
  // يمكن البحث برقم الهاتف (عند المنح من واجهة الكاشير)
  if (!customer_id && phone) {
    const c = db.prepare('SELECT id FROM customers WHERE phone=?').get(phone.trim());
    if (!c) return res.status(404).json({ error: 'العضو غير موجود — تحقق من رقم الهاتف المسجل' });
    customer_id = c.id;
  }
  if (!customer_id) return res.status(400).json({ error: 'customer_id أو phone مطلوب' });
  const n = Math.max(1, parseInt(amount) || 1);

  db.prepare('INSERT OR IGNORE INTO customer_stamps (customer_id, total_earned, total_redeemed) VALUES (?,0,0)').run(customer_id);
  db.prepare('UPDATE customer_stamps SET total_earned = total_earned + ? WHERE customer_id=?').run(n, customer_id);
  db.prepare('INSERT INTO stamp_history (customer_id, type, amount, order_id, created_at) VALUES (?,?,?,?,?)').run(customer_id, 'earn', n, order_id || null, Date.now());

  const row = db.prepare('SELECT * FROM customer_stamps WHERE customer_id=?').get(customer_id);
  res.json({ success: true, stamps_earned: n, total_earned: row.total_earned, total_redeemed: row.total_redeemed, available: row.total_earned - row.total_redeemed });
});

// استبدال مشروب مجاني (يستدعيه الكاشير — 9 طوابع = مرة واحدة)
app.post('/api/stamps/redeem', requireCashierOrAdmin, (req, res) => {
  let { customer_id, phone } = req.body;
  if (!customer_id && phone) {
    const c = db.prepare('SELECT id FROM customers WHERE phone=?').get(phone.trim());
    if (!c) return res.status(404).json({ error: 'العضو غير موجود — تحقق من رقم الهاتف المسجل' });
    customer_id = c.id;
  }
  if (!customer_id) return res.status(400).json({ error: 'customer_id أو phone مطلوب' });

  db.prepare('INSERT OR IGNORE INTO customer_stamps (customer_id, total_earned, total_redeemed) VALUES (?,0,0)').run(customer_id);
  const row = db.prepare('SELECT * FROM customer_stamps WHERE customer_id=?').get(customer_id);
  const available = row.total_earned - row.total_redeemed;
  if (available < 9) return res.status(400).json({ error: `طوابع غير كافية (الحالي ${available}، مطلوب 9)` });

  db.prepare('UPDATE customer_stamps SET total_redeemed = total_redeemed + 9 WHERE customer_id=?').run(customer_id);
  db.prepare('INSERT INTO stamp_history (customer_id, type, amount, note, created_at) VALUES (?,?,?,?,?)').run(customer_id, 'redeem', 9, 'استبدال مشروب مجاني', Date.now());

  const updated = db.prepare('SELECT * FROM customer_stamps WHERE customer_id=?').get(customer_id);
  res.json({ success: true, total_earned: updated.total_earned, total_redeemed: updated.total_redeemed, available: updated.total_earned - updated.total_redeemed });
});

// جلب حالة الطوابع (الكاشير — بحث برقم هاتف العميل)
app.get('/api/stamps/lookup', requireCashierOrAdmin, (req, res) => {
  const { phone } = req.query;
  if (!phone) return res.status(400).json({ error: 'phone مطلوب' });
  const customer = db.prepare('SELECT id, name, phone FROM customers WHERE phone=?').get(phone.trim());
  if (!customer) return res.status(404).json({ error: 'العضو غير موجود' });

  let row = db.prepare('SELECT * FROM customer_stamps WHERE customer_id=?').get(customer.id);
  if (!row) row = { total_earned: 0, total_redeemed: 0 };
  res.json({ customer, total_earned: row.total_earned, total_redeemed: row.total_redeemed, available: row.total_earned - row.total_redeemed });
});

// ─── RESERVATIONS ─────────────────────────────────────────────────────────────

// إنشاء حجز (العميل — تسجيل الدخول اختياري)
app.post('/api/reservations', optionalCustomer, (req, res) => {
  const { name, phone, date, time, party_size, notes, table_num } = req.body;
  if (!name || !phone || !date || !time)
    return res.status(400).json({ error: 'Name, phone, date and time are required / الاسم والهاتف والتاريخ والوقت مطلوبة' });
  if (party_size && (party_size < 1 || party_size > 20))
    return res.status(400).json({ error: 'Party size must be 1–20' });

  // منع التكرار في نفس التاريخ/الوقت (حد أقصى 4 مجموعات)
  const existing = db.prepare("SELECT COUNT(*) as cnt FROM reservations WHERE date=? AND time=? AND status != 'cancelled'").get(date, time);
  if (existing.cnt >= 4)
    return res.status(409).json({ error: 'This time slot is fully booked. Please choose another time / هذا الوقت محجوز بالكامل. يرجى اختيار وقت آخر' });

  const r = db.prepare(
    'INSERT INTO reservations (customer_id, name, phone, date, time, party_size, notes, table_num, status, created_at) VALUES (?,?,?,?,?,?,?,?,?,?)'
  ).run(req.customerId || null, name.trim(), phone.trim(), date, time, party_size || 2, notes || null, table_num || null, 'pending', Date.now());

  const reservation = db.prepare('SELECT * FROM reservations WHERE id=?').get(r.lastInsertRowid);
  broadcastSSE({ type: 'new_reservation', reservation });
  res.json({ success: true, reservation });
});

// قائمة الحجوزات (الكاشير/المدير)
app.get('/api/reservations', requireCashierOrAdmin, (req, res) => {
  const { date, status } = req.query;
  let sql = 'SELECT * FROM reservations';
  const params = [];
  const conds = [];
  if (date) { conds.push('date = ?'); params.push(date); }
  if (status) { conds.push('status = ?'); params.push(status); }
  if (conds.length) sql += ' WHERE ' + conds.join(' AND ');
  sql += ' ORDER BY date ASC, time ASC';
  res.json(db.prepare(sql).all(...params));
});

// تغيير حالة الحجز (الكاشير)
app.put('/api/reservations/:id/status', requireCashierOrAdmin, (req, res) => {
  const { status } = req.body;
  if (!['pending', 'confirmed', 'cancelled'].includes(status))
    return res.status(400).json({ error: 'حالة غير صالحة' });
  db.prepare('UPDATE reservations SET status=? WHERE id=?').run(status, req.params.id);
  const reservation = db.prepare('SELECT * FROM reservations WHERE id=?').get(req.params.id);
  if (!reservation) return res.status(404).json({ error: 'الحجز غير موجود' });
  broadcastSSE({ type: 'reservation_updated', reservation });
  res.json({ success: true, reservation });
});

// جلب الأوقات المتاحة حسب التاريخ (عام)
app.get('/api/reservations/availability', (req, res) => {
  const { date } = req.query;
  if (!date) return res.status(400).json({ error: 'date مطلوب' });
  const ALL_SLOTS = ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'];
  const rows = db.prepare("SELECT time, COUNT(*) as count FROM reservations WHERE date=? AND status != 'cancelled' GROUP BY time").all(date);
  const slotMap = {};
  rows.forEach(r => { slotMap[r.time] = r.count; });
  const slots = ALL_SLOTS.map(t => ({ time: t, count: slotMap[t] || 0 }));
  res.json({ slots });
});

// ─── MEETING ROOM RESERVATIONS ────────────────────────────────────────────────

// إنشاء حجز غرفة الاجتماعات (عام)
app.post('/api/meeting-reservations', (req, res) => {
  const { name, phone, date, slot, notes } = req.body;
  if (!name || !phone || !date || !slot) return res.status(400).json({ error: 'حقول مطلوبة مفقودة' });
  const existing = db.prepare("SELECT COUNT(*) as cnt FROM meeting_reservations WHERE date=? AND slot=? AND status != 'cancelled'").get(date, slot);
  if (existing.cnt > 0) return res.status(409).json({ error: 'هذا الوقت محجوز بالفعل' });
  const r = db.prepare('INSERT INTO meeting_reservations (name, phone, date, slot, notes, status, created_at) VALUES (?,?,?,?,?,?,?)').run(
    name, phone, date, slot, notes || null, 'pending', Date.now()
  );
  const reservation = db.prepare('SELECT * FROM meeting_reservations WHERE id=?').get(r.lastInsertRowid);
  broadcastSSE({ type: 'new_meeting_reservation', reservation });
  res.json({ success: true, reservation });
});

// قائمة حجوزات غرفة الاجتماعات (الكاشير/المدير)
app.get('/api/meeting-reservations', requireCashierOrAdmin, (req, res) => {
  const { date } = req.query;
  let sql = 'SELECT * FROM meeting_reservations';
  const params = [];
  if (date) { sql += ' WHERE date=?'; params.push(date); }
  sql += ' ORDER BY date ASC, slot ASC';
  res.json(db.prepare(sql).all(...params));
});

// تغيير حالة حجز غرفة الاجتماعات (الكاشير/المدير)
app.put('/api/meeting-reservations/:id/status', requireCashierOrAdmin, (req, res) => {
  const { status } = req.body;
  if (!['pending', 'confirmed', 'cancelled', 'completed'].includes(status)) return res.status(400).json({ error: 'حالة غير صالحة' });
  db.prepare('UPDATE meeting_reservations SET status=? WHERE id=?').run(status, req.params.id);
  const reservation = db.prepare('SELECT * FROM meeting_reservations WHERE id=?').get(req.params.id);
  if (!reservation) return res.status(404).json({ error: 'الحجز غير موجود' });
  broadcastSSE({ type: 'meeting_reservation_updated', reservation });
  res.json({ success: true, reservation });
});

// جلب أوقات غرفة الاجتماعات المتاحة (عام)
app.get('/api/meeting-reservations/availability', (req, res) => {
  const { date } = req.query;
  if (!date) return res.status(400).json({ error: 'date مطلوب' });
  const MEETING_SLOTS = ['09:00–11:00', '11:00–13:00', '13:00–15:00', '15:00–17:00', '17:00–19:00', '19:00–21:00'];
  const rows = db.prepare("SELECT slot FROM meeting_reservations WHERE date=? AND status != 'cancelled'").all(date);
  const booked = new Set(rows.map(r => r.slot));
  res.json({ slots: MEETING_SLOTS.map(s => ({ slot: s, available: !booked.has(s) })) });
});

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
app.get('/api/dashboard', requireAuth, (req, res) => {
  const ingredients = db.prepare('SELECT * FROM ingredients ORDER BY name_ko').all();
  const lowStock = ingredients.filter(i => i.current_qty <= i.min_qty);
  const recentHistory = db.prepare(
    'SELECT * FROM inventory_history ORDER BY created_at DESC LIMIT 8'
  ).all();

  // 유통기한 D-7 이내 경고 (Baghdad UTC+3 기준)
  const now = new Date();
  const todayBgd = new Date(now.getTime() + 3 * 60 * 60 * 1000);
  const todayStr = todayBgd.toISOString().slice(0, 10);
  const in7Days = new Date(todayBgd);
  in7Days.setDate(in7Days.getDate() + 7);
  const in7Str = in7Days.toISOString().slice(0, 10);
  const expiringSoon = ingredients.filter(i => {
    if (!i.expiry_date) return false;
    return i.expiry_date <= in7Str;
  }).map(i => {
    const diffMs = new Date(i.expiry_date) - new Date(todayStr);
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return { ...i, days_left: diffDays };
  });

  res.json({ ingredients, low_stock: lowStock, recent_history: recentHistory, expiring_soon: expiringSoon });
});

// ─── MENU PRICES ──────────────────────────────────────────────────────────────
app.get('/api/menu-prices', requireCashierOrAdmin, (_req, res) => {
  const rows = db.prepare('SELECT * FROM menu_prices').all();
  res.json(rows);
});

app.post('/api/menu-prices', requireAuth, (req, res) => {
  const { menu_item, selling_price } = req.body;
  if (!menu_item) return res.status(400).json({ error: 'menu_item required' });
  db.prepare(
    'INSERT INTO menu_prices (menu_item, selling_price) VALUES (?,?) ON CONFLICT(menu_item) DO UPDATE SET selling_price=excluded.selling_price'
  ).run(menu_item, selling_price ?? 0);
  res.json({ success: true });
});

// ─── SALES SUMMARY (대시보드 차트용) ────────────────────────────────────────────
app.get('/api/sales/summary', requireCashierOrAdmin, (req, res) => {
  const { period = 'week' } = req.query;

  // 기간별 날짜 범위 계산 (Baghdad UTC+3)
  const now = new Date();
  const todayBgd = new Date(now.getTime() + 3 * 60 * 60 * 1000);
  const todayStr = todayBgd.toISOString().slice(0, 10);

  let days = 7;
  if (period === 'month') days = 30;
  if (period === 'day') days = 1;

  const startDate = new Date(todayBgd);
  startDate.setDate(startDate.getDate() - (days - 1));
  const startStr = startDate.toISOString().slice(0, 10);

  // 일별 주문 수 + 매출 (orders 테이블 기준)
  const dailyOrders = db.prepare(`
    SELECT
      date(datetime(timestamp/1000, 'unixepoch', '+3 hours')) as day,
      COUNT(*) as order_count,
      ROUND(SUM(total), 0) as revenue
    FROM orders
    WHERE status != 'cancelled'
      AND date(datetime(timestamp/1000, 'unixepoch', '+3 hours')) BETWEEN ? AND ?
    GROUP BY day
    ORDER BY day ASC
  `).all(startStr, todayStr);

  // 베스트셀러 TOP5 (daily_sales 테이블 기준)
  const top5 = db.prepare(`
    SELECT menu_item, SUM(quantity) as total_qty
    FROM daily_sales
    WHERE sale_date BETWEEN ? AND ?
    GROUP BY menu_item
    ORDER BY total_qty DESC
    LIMIT 5
  `).all(startStr, todayStr);

  // 기간 합계
  const totals = db.prepare(`
    SELECT COUNT(*) as total_orders, ROUND(SUM(total), 0) as total_revenue
    FROM orders
    WHERE status != 'cancelled'
      AND date(datetime(timestamp/1000, 'unixepoch', '+3 hours')) BETWEEN ? AND ?
  `).get(startStr, todayStr);

  // 오늘 합계
  const todayTotals = db.prepare(`
    SELECT COUNT(*) as order_count, ROUND(SUM(total), 0) as revenue
    FROM orders
    WHERE status != 'cancelled'
      AND date(datetime(timestamp/1000, 'unixepoch', '+3 hours')) = ?
  `).get(todayStr);

  res.json({
    period,
    start_date: startStr,
    end_date: todayStr,
    daily: dailyOrders,
    top5,
    totals,
    today: todayTotals
  });
});

// ─── CONTACT FORM ─────────────────────────────────────────────────────────────
// Create contact_messages table if not exists
db.prepare(`CREATE TABLE IF NOT EXISTS contact_messages (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  name      TEXT NOT NULL,
  email     TEXT NOT NULL,
  message   TEXT NOT NULL,
  lang      TEXT DEFAULT 'en',
  created_at INTEGER DEFAULT (strftime('%s','now'))
)`).run();

app.post('/api/contact', (req, res) => {
  const { name, email, message, lang } = req.body;
  if (!name || !email || !message)
    return res.status(400).json({ error: 'Missing required fields' });
  db.prepare('INSERT INTO contact_messages (name, email, message, lang) VALUES (?,?,?,?)')
    .run(name.trim(), email.trim().toLowerCase(), message.trim(), lang || 'en');
  res.json({ success: true });
});

// ─── START ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n✅  Mr. Kim's Cafe — النظام يعمل`);
  console.log(`   🌐  http://localhost:${PORT}`);
  console.log(`   🏪  الموقع:     http://localhost:${PORT}/index.html`);
  console.log(`   💳  الكاشير:   http://localhost:${PORT}/cashier.html`);
  console.log(`   📦  المخزن:    http://localhost:${PORT}/warehouse.html`);
  console.log(`   🔑  كلمة المرور الافتراضية: 1234\n`);
});
