require('dotenv').config();
const express = require('express');
const Database = require('better-sqlite3');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const https = require('https');
const QRCode = require('qrcode');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const multer = require('multer');

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

// ─── دليل تحميل الصور (Railway Volume أو محلي) ───────────────────────────────
const UPLOAD_DIR = process.env.UPLOAD_DIR
  || (process.env.RAILWAY_VOLUME_MOUNT_PATH
    ? path.join(process.env.RAILWAY_VOLUME_MOUNT_PATH, 'uploads')
    : path.join(__dirname, 'uploads'));
try { fs.mkdirSync(UPLOAD_DIR, { recursive: true }); } catch (e) { console.warn('[boot] mkdir UPLOAD_DIR failed', UPLOAD_DIR, e.message); }

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

  CREATE TABLE IF NOT EXISTS workforce_sessions (
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

// ─── helper: idempotent ALTER TABLE ADD COLUMN ─────────────────────────────
// SQLite يرمي "duplicate column name" إذا كان العمود موجوداً بالفعل (طبيعي).
// أي خطأ آخر يُسجَّل في console.warn حتى يمكن متابعته.
function tryAlter(sql) {
  try { db.exec(sql); console.log('[migrate]', sql); }
  catch (e) {
    if (!/duplicate column name/i.test(e.message)) {
      console.warn('[migrate] failed', sql, e.message);
    }
  }
}

// ترحيل قاعدة البيانات للتوافق مع الإصدارات القديمة
tryAlter("ALTER TABLE cashiers ADD COLUMN role TEXT NOT NULL DEFAULT 'cashier'");
tryAlter('ALTER TABLE orders ADD COLUMN customer_id INTEGER REFERENCES customers(id)');
tryAlter('ALTER TABLE orders ADD COLUMN arrival_time TEXT');
tryAlter('ALTER TABLE orders ADD COLUMN cashier_name TEXT');
tryAlter('ALTER TABLE reservations ADD COLUMN table_num TEXT');
tryAlter('ALTER TABLE ingredients ADD COLUMN expiry_date TEXT');
tryAlter('ALTER TABLE ingredients ADD COLUMN supplier TEXT');
tryAlter("ALTER TABLE orders ADD COLUMN source TEXT NOT NULL DEFAULT 'cashier'");
tryAlter('ALTER TABLE orders ADD COLUMN inventory_settled INTEGER NOT NULL DEFAULT 0');
// Sprint 2.7+ — per-category emoji rendered as the circle on customer-site tiles
// and in POS settings list. Optional (NULL → default 📋 in client).
tryAlter('ALTER TABLE menu_categories ADD COLUMN icon TEXT');
tryAlter('ALTER TABLE menu_items_v2 ADD COLUMN is_new INTEGER NOT NULL DEFAULT 0');
tryAlter('ALTER TABLE menu_items_v2 ADD COLUMN is_best INTEGER NOT NULL DEFAULT 0');
tryAlter('ALTER TABLE menu_items_v2 ADD COLUMN is_signature INTEGER NOT NULL DEFAULT 0');
tryAlter('ALTER TABLE orders ADD COLUMN settled_at INTEGER');

// ─── Sprint 1: roles, audit_log, cashiers extensions ─────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS roles (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    code        TEXT NOT NULL UNIQUE,
    name_en     TEXT NOT NULL,
    name_ar     TEXT NOT NULL,
    permissions TEXT NOT NULL DEFAULT '{}',
    is_system   INTEGER NOT NULL DEFAULT 0,
    created_at  INTEGER NOT NULL,
    updated_at  INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS audit_log (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    actor_id        INTEGER,
    actor_name      TEXT,
    actor_role      TEXT,
    approver_id     INTEGER,
    approver_name   TEXT,
    reason          TEXT,
    action          TEXT NOT NULL,
    target_type     TEXT,
    target_id       TEXT,
    before_json     TEXT,
    after_json      TEXT,
    ip              TEXT,
    at              INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_audit_at ON audit_log(at DESC);
  CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_log(actor_id, at DESC);
  CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_log(action, at DESC);
`);

// extend cashiers with Sprint 1 columns
tryAlter('ALTER TABLE cashiers ADD COLUMN email TEXT');
tryAlter('ALTER TABLE cashiers ADD COLUMN phone TEXT');
tryAlter('ALTER TABLE cashiers ADD COLUMN active INTEGER NOT NULL DEFAULT 1');
tryAlter('ALTER TABLE cashiers ADD COLUMN must_change_pw INTEGER NOT NULL DEFAULT 0');
tryAlter('ALTER TABLE cashiers ADD COLUMN role_id INTEGER REFERENCES roles(id)');
tryAlter('ALTER TABLE cashiers ADD COLUMN created_by INTEGER');
tryAlter('ALTER TABLE cashiers ADD COLUMN updated_at INTEGER');
tryAlter('ALTER TABLE cashiers ADD COLUMN last_login_at INTEGER');
tryAlter('ALTER TABLE audit_log ADD COLUMN reason TEXT');

// ─── Sprint 2: menu data model (categories first, items/modifiers/sets later) ─
//
// Design notes:
//   * `code` is the stable identifier carried into menu_prices, recipes,
//     daily_sales, etc. Changing the code is forbidden after creation;
//     display names (name_en/name_ar/name_ko) can be edited freely.
//   * Categories support sort order, color, and active flag (soft-disable).
//   * `kind` on menu_items_v2 distinguishes 'single' from 'set' so the order
//     screen can render set components when user picks a set item.
//   * Modifier groups (size, milk, syrup, …) are reusable across many items
//     via M:N table `menu_item_modifiers`. Each option carries a price_delta_iqd.
//   * Sold-out is a runtime flag on menu_items_v2 (changes broadcast via SSE).
db.exec(`
  CREATE TABLE IF NOT EXISTS menu_categories (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    code        TEXT NOT NULL UNIQUE,
    name_en     TEXT NOT NULL,
    name_ar     TEXT NOT NULL DEFAULT '',
    name_ko     TEXT NOT NULL DEFAULT '',
    color       TEXT,
    sort_order  INTEGER NOT NULL DEFAULT 100,
    active      INTEGER NOT NULL DEFAULT 1,
    created_at  INTEGER NOT NULL,
    updated_at  INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS menu_items_v2 (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    code          TEXT NOT NULL UNIQUE,
    name_en       TEXT NOT NULL,
    name_ar       TEXT NOT NULL DEFAULT '',
    name_ko       TEXT NOT NULL DEFAULT '',
    emoji         TEXT,
    photo_url     TEXT,
    category_id   INTEGER,
    base_price    REAL NOT NULL DEFAULT 0,
    kind          TEXT NOT NULL DEFAULT 'single', -- 'single' | 'set'
    active        INTEGER NOT NULL DEFAULT 1,
    sold_out      INTEGER NOT NULL DEFAULT 0,
    sort_order    INTEGER NOT NULL DEFAULT 100,
    description   TEXT,
    created_at    INTEGER NOT NULL,
    updated_at    INTEGER NOT NULL,
    FOREIGN KEY (category_id) REFERENCES menu_categories(id) ON DELETE SET NULL
  );
  CREATE INDEX IF NOT EXISTS idx_mi_v2_cat ON menu_items_v2(category_id, sort_order);
  CREATE INDEX IF NOT EXISTS idx_mi_v2_active ON menu_items_v2(active, sort_order);

  CREATE TABLE IF NOT EXISTS menu_modifier_groups (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    code          TEXT NOT NULL UNIQUE,
    name_en       TEXT NOT NULL,
    name_ar       TEXT NOT NULL DEFAULT '',
    name_ko       TEXT NOT NULL DEFAULT '',
    selection     TEXT NOT NULL DEFAULT 'single', -- 'single' | 'multi'
    required      INTEGER NOT NULL DEFAULT 0,
    sort_order    INTEGER NOT NULL DEFAULT 100,
    created_at    INTEGER NOT NULL,
    updated_at    INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS menu_modifier_options (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id        INTEGER NOT NULL,
    code            TEXT NOT NULL,
    name_en         TEXT NOT NULL,
    name_ar         TEXT NOT NULL DEFAULT '',
    name_ko         TEXT NOT NULL DEFAULT '',
    price_delta_iqd INTEGER NOT NULL DEFAULT 0,
    is_default      INTEGER NOT NULL DEFAULT 0,
    sort_order      INTEGER NOT NULL DEFAULT 100,
    UNIQUE(group_id, code),
    FOREIGN KEY (group_id) REFERENCES menu_modifier_groups(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS menu_item_modifiers (
    item_id    INTEGER NOT NULL,
    group_id   INTEGER NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 100,
    PRIMARY KEY (item_id, group_id),
    FOREIGN KEY (item_id) REFERENCES menu_items_v2(id) ON DELETE CASCADE,
    FOREIGN KEY (group_id) REFERENCES menu_modifier_groups(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS menu_set_components (
    set_item_id        INTEGER NOT NULL,
    component_item_id  INTEGER NOT NULL,
    quantity           INTEGER NOT NULL DEFAULT 1,
    sort_order         INTEGER NOT NULL DEFAULT 100,
    PRIMARY KEY (set_item_id, component_item_id),
    FOREIGN KEY (set_item_id)       REFERENCES menu_items_v2(id) ON DELETE CASCADE,
    FOREIGN KEY (component_item_id) REFERENCES menu_items_v2(id) ON DELETE CASCADE
  );
`);

// ─── جدول الموردين (suppliers) ────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS suppliers (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    name            TEXT NOT NULL UNIQUE,
    contact_person  TEXT,
    phone           TEXT,
    whatsapp        TEXT,
    address         TEXT,
    note            TEXT,
    created_at      INTEGER NOT NULL DEFAULT (CAST(strftime('%s','now') AS INTEGER) * 1000)
  );
`);

// ─── أعمدة جديدة لجدول المواد (ingredients) ──────────────────────────────────
tryAlter('ALTER TABLE ingredients ADD COLUMN origin TEXT');
tryAlter('ALTER TABLE ingredients ADD COLUMN market_name TEXT');
tryAlter('ALTER TABLE ingredients ADD COLUMN qty_per_box REAL');
tryAlter('ALTER TABLE ingredients ADD COLUMN num_boxes REAL');
tryAlter('ALTER TABLE ingredients ADD COLUMN market_price REAL');
tryAlter('ALTER TABLE ingredients ADD COLUMN received_date TEXT');
tryAlter('ALTER TABLE ingredients ADD COLUMN image_path TEXT');
tryAlter('ALTER TABLE ingredients ADD COLUMN supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL');

// ─── ترحيل: الموردون النصيون القدماء → جدول suppliers ─────────────────────────
try {
  const legacy = db.prepare(
    "SELECT DISTINCT TRIM(supplier) AS name FROM ingredients WHERE supplier IS NOT NULL AND TRIM(supplier) != ''"
  ).all();
  const ins = db.prepare('INSERT OR IGNORE INTO suppliers (name) VALUES (?)');
  const upd = db.prepare(
    'UPDATE ingredients SET supplier_id=(SELECT id FROM suppliers WHERE name=?) WHERE supplier_id IS NULL AND TRIM(supplier)=?'
  );
  const tx = db.transaction((rows) => {
    for (const r of rows) {
      if (!r.name) continue;
      ins.run(r.name);
      upd.run(r.name, r.name);
    }
  });
  tx(legacy);
} catch (e) { console.error('[Migration] supplier text→table failed:', e.message); }

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

// جدول الاستردادات (refunds) — server-authoritative refund history
db.exec(`
  CREATE TABLE IF NOT EXISTS refunds (
    id           TEXT PRIMARY KEY,
    order_id     TEXT NOT NULL,
    amount       REAL NOT NULL,
    lines        TEXT,
    full_refund  INTEGER NOT NULL DEFAULT 0,
    cashier_name TEXT,
    created_at   INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_refunds_order_id ON refunds(order_id);
`);

// 멱등성 보장: 동일 order_id 에 대해 'earn' 적립은 단 한 번만 가능
// (transitionedToDone 가드와 함께 이중 안전장치)
try {
  db.exec("CREATE UNIQUE INDEX IF NOT EXISTS uniq_stamp_earn_order ON stamp_history(order_id) WHERE type='earn' AND order_id IS NOT NULL");
} catch (e) {
  console.error('stamp_history unique index 생성 실패:', e.message);
}

// جدول مواقع المخزون (ingredient locations) — per-shelf qty tracking
// location_code format: ^[1-9][A-E][1-9]$  (e.g., '2A2'). 'UNSET' is a reserved
// migration sentinel for legacy stock that has not yet been assigned a shelf.
db.exec(`
  CREATE TABLE IF NOT EXISTS ingredient_locations (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    ingredient_id INTEGER NOT NULL,
    location_code TEXT NOT NULL,
    qty           REAL NOT NULL DEFAULT 0,
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(ingredient_id, location_code),
    FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE CASCADE
  );
  CREATE INDEX IF NOT EXISTS idx_ing_loc_ing  ON ingredient_locations(ingredient_id);
  CREATE INDEX IF NOT EXISTS idx_ing_loc_code ON ingredient_locations(location_code);
`);

// One-shot migration: any ingredient with current_qty > 0 and no location rows
// gets a single 'UNSET' row carrying the existing stock, so totals are preserved.
try {
  const orphans = db.prepare(`
    SELECT i.id, i.current_qty
      FROM ingredients i
      LEFT JOIN ingredient_locations l ON l.ingredient_id = i.id
     WHERE i.current_qty > 0
     GROUP BY i.id
    HAVING COUNT(l.id) = 0
  `).all();
  if (orphans.length > 0) {
    const ins = db.prepare(`
      INSERT INTO ingredient_locations (ingredient_id, location_code, qty)
      VALUES (?, 'UNSET', ?)
    `);
    const tx = db.transaction((rows) => { for (const r of rows) ins.run(r.id, r.current_qty); });
    tx(orphans);
    console.log(`[Migration] ingredient_locations: seeded UNSET for ${orphans.length} ingredient(s)`);
  }
} catch (e) {
  console.error('[Migration] ingredient_locations failed:', e.message);
}

// ─── Purchase Orders / Receipts / Stock Counts / Profit history ──────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS purchase_orders (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    po_number     TEXT NOT NULL UNIQUE,
    supplier_id   INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,
    status        TEXT NOT NULL DEFAULT 'draft',
    notes         TEXT,
    expected_date TEXT,
    total_amount  REAL NOT NULL DEFAULT 0,
    created_by    TEXT,
    submitted_at  INTEGER,
    approved_by   TEXT,
    approved_at   INTEGER,
    cancelled_at  INTEGER,
    created_at    INTEGER NOT NULL DEFAULT (CAST(strftime('%s','now') AS INTEGER) * 1000),
    updated_at    INTEGER NOT NULL DEFAULT (CAST(strftime('%s','now') AS INTEGER) * 1000)
  );
  CREATE INDEX IF NOT EXISTS idx_po_status   ON purchase_orders(status);
  CREATE INDEX IF NOT EXISTS idx_po_supplier ON purchase_orders(supplier_id);

  CREATE TABLE IF NOT EXISTS purchase_order_items (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    po_id         INTEGER NOT NULL,
    ingredient_id INTEGER NOT NULL,
    ordered_qty   REAL NOT NULL,
    received_qty  REAL NOT NULL DEFAULT 0,
    unit_cost     REAL NOT NULL DEFAULT 0,
    line_total    REAL NOT NULL DEFAULT 0,
    FOREIGN KEY (po_id) REFERENCES purchase_orders(id) ON DELETE CASCADE,
    FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE RESTRICT
  );
  CREATE INDEX IF NOT EXISTS idx_po_items_po  ON purchase_order_items(po_id);
  CREATE INDEX IF NOT EXISTS idx_po_items_ing ON purchase_order_items(ingredient_id);

  CREATE TABLE IF NOT EXISTS goods_receipts (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    po_id       INTEGER NOT NULL,
    received_at INTEGER NOT NULL DEFAULT (CAST(strftime('%s','now') AS INTEGER) * 1000),
    received_by TEXT,
    notes       TEXT,
    FOREIGN KEY (po_id) REFERENCES purchase_orders(id) ON DELETE CASCADE
  );
  CREATE INDEX IF NOT EXISTS idx_gr_po ON goods_receipts(po_id);

  CREATE TABLE IF NOT EXISTS goods_receipt_items (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    receipt_id    INTEGER NOT NULL,
    po_item_id    INTEGER NOT NULL,
    ingredient_id INTEGER NOT NULL,
    qty           REAL NOT NULL,
    location_code TEXT NOT NULL DEFAULT 'UNSET',
    FOREIGN KEY (receipt_id) REFERENCES goods_receipts(id) ON DELETE CASCADE,
    FOREIGN KEY (po_item_id) REFERENCES purchase_order_items(id) ON DELETE CASCADE,
    FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE RESTRICT
  );
  CREATE INDEX IF NOT EXISTS idx_gri_receipt ON goods_receipt_items(receipt_id);

  CREATE TABLE IF NOT EXISTS stock_counts (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    count_name    TEXT NOT NULL,
    status        TEXT NOT NULL DEFAULT 'open',
    notes         TEXT,
    started_by    TEXT,
    submitted_at  INTEGER,
    reconciled_by TEXT,
    reconciled_at INTEGER,
    total_variance_value REAL NOT NULL DEFAULT 0,
    created_at    INTEGER NOT NULL DEFAULT (CAST(strftime('%s','now') AS INTEGER) * 1000)
  );
  CREATE INDEX IF NOT EXISTS idx_sc_status ON stock_counts(status);

  CREATE TABLE IF NOT EXISTS stock_count_items (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    count_id        INTEGER NOT NULL,
    ingredient_id   INTEGER NOT NULL,
    expected_qty    REAL NOT NULL DEFAULT 0,
    counted_qty     REAL,
    variance_qty    REAL,
    variance_value  REAL,
    notes           TEXT,
    UNIQUE(count_id, ingredient_id),
    FOREIGN KEY (count_id) REFERENCES stock_counts(id) ON DELETE CASCADE,
    FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE CASCADE
  );
  CREATE INDEX IF NOT EXISTS idx_sci_count ON stock_count_items(count_id);

  CREATE TABLE IF NOT EXISTS menu_price_history (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    menu_item     TEXT NOT NULL,
    selling_price REAL NOT NULL,
    recorded_at   INTEGER NOT NULL DEFAULT (CAST(strftime('%s','now') AS INTEGER) * 1000)
  );
  CREATE INDEX IF NOT EXISTS idx_mph_menu ON menu_price_history(menu_item);

  CREATE TABLE IF NOT EXISTS ingredient_cost_history (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    ingredient_id INTEGER NOT NULL,
    cost_per_unit REAL NOT NULL,
    recorded_at   INTEGER NOT NULL DEFAULT (CAST(strftime('%s','now') AS INTEGER) * 1000),
    FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE CASCADE
  );
  CREATE INDEX IF NOT EXISTS idx_ich_ing ON ingredient_cost_history(ingredient_id);
`);

// Recalculate ingredients.current_qty from the sum of its location rows.
// Treat ingredient_locations.qty as the source of truth and keep current_qty as a cache.
function recalcIngredientQty(ingredientId) {
  const row = db.prepare(
    'SELECT COALESCE(SUM(qty), 0) AS total FROM ingredient_locations WHERE ingredient_id = ?'
  ).get(ingredientId);
  db.prepare('UPDATE ingredients SET current_qty = ? WHERE id = ?').run(row.total, ingredientId);
  return row.total;
}

// Apply a stock delta (positive in / negative out) to an ingredient by mutating
// its UNSET location row, then recalc current_qty from location sums. This is
// the single legitimate path for legacy code paths (orders, refunds, daily sales,
// history rollback) that don't know about specific shelf locations.
function applyStockDelta(ingredientId, delta) {
  if (!Number.isFinite(delta) || delta === 0) return recalcIngredientQty(ingredientId);
  let row = db.prepare(
    "SELECT id, qty FROM ingredient_locations WHERE ingredient_id = ? AND location_code = 'UNSET'"
  ).get(ingredientId);
  if (!row) {
    db.prepare(
      "INSERT INTO ingredient_locations (ingredient_id, location_code, qty) VALUES (?, 'UNSET', 0)"
    ).run(ingredientId);
    row = db.prepare(
      "SELECT id, qty FROM ingredient_locations WHERE ingredient_id = ? AND location_code = 'UNSET'"
    ).get(ingredientId);
  }
  const next = Math.max(0, (row.qty || 0) + delta);
  db.prepare('UPDATE ingredient_locations SET qty = ? WHERE id = ?').run(next, row.id);
  return recalcIngredientQty(ingredientId);
}

const LOC_CODE_RE = /^[1-9][A-E][1-9]$/;

// بيانات افتراضية — admin password seed (no insecure default)
if (!db.prepare("SELECT value FROM settings WHERE key='admin_pw'").get()) {
  const envPw = (process.env.ADMIN_INITIAL_PW || '').trim();
  const initial = envPw && envPw.length >= 8
    ? envPw
    : crypto.randomBytes(12).toString('base64').replace(/[^A-Za-z0-9]/g,'').slice(0,16);
  db.prepare("INSERT INTO settings (key, value) VALUES ('admin_pw', ?)").run(hashPassword(initial));
  if (!envPw) {
    console.log('────────────────────────────────────────────────────');
    console.log('  ADMIN INITIAL PASSWORD (one-time, change after login):');
    console.log('  ' + initial);
    console.log('  Set ADMIN_INITIAL_PW env var to override on next fresh boot.');
    console.log('────────────────────────────────────────────────────');
  } else {
    console.log('Admin password seeded from ADMIN_INITIAL_PW env var.');
  }
}
// Block legacy SHA-256 hash of "1234" if it survives an old DB
{
  const legacy = crypto.createHash('sha256').update('1234').digest('hex');
  const cur = db.prepare("SELECT value FROM settings WHERE key='admin_pw'").get();
  if (cur && cur.value === legacy) {
    const forced = crypto.randomBytes(12).toString('base64').replace(/[^A-Za-z0-9]/g,'').slice(0,16);
    db.prepare("UPDATE settings SET value=? WHERE key='admin_pw'").run(hashPassword(forced));
    console.log('────────────────────────────────────────────────────');
    console.log('  Default "1234" admin password detected and rotated.');
    console.log('  NEW ADMIN PASSWORD: ' + forced);
    console.log('  Change it immediately after logging in.');
    console.log('────────────────────────────────────────────────────');
  }
}
if (!db.prepare("SELECT id FROM order_counter WHERE id=1").get()) {
  db.prepare("INSERT INTO order_counter (id, value) VALUES (1, 1)").run();
}

// ─── Sprint 1: seed system roles with default permission matrix ──────────────
// permission codes (38) — frozen list. UI editor toggles boolean fields and
// numeric limit fields here. Codes ending with _limit/_max are numeric (IQD or %),
// codes ending with _count_limit are integers (per day), all others boolean.
const PERMISSION_CODES = [
  // cash & drawer
  'cash_drawer_open_no_sale', 'cash_deposit', 'cash_withdraw', 'change_payment_method',
  // orders & refunds
  'void_before_payment', 'void_after_payment', 'refund', 'refund_max_iqd',
  'reopen_closed_order', 'transfer_order', 'merge_split_orders', 'kitchen_recall',
  'comp_item', 'assign_to_other_cashier',
  // discounts
  'discount_percent', 'discount_percent_max', 'discount_fixed', 'discount_fixed_max_iqd',
  'discount_employee_meal', 'discount_daily_count_limit', 'price_override',
  'gift_voucher_issue', 'tip_adjust',
  // shifts
  'open_shift', 'close_shift', 'close_shift_force', 'view_other_cashier_sales',
  // customers & stamps
  'customer_data_view', 'customer_data_edit', 'customer_delete', 'stamp_manual_grant',
  // menu & inventory
  'menu_edit', 'menu_sold_out_toggle', 'inventory_edit', 'inventory_count',
  // reports & data
  'view_basic_reports', 'view_advanced_reports', 'view_cost_margin', 'view_payroll',
  'export_data',
  // admin only (locked, not toggleable for non-owner)
  'settings_change', 'staff_manage', 'role_manage', 'view_audit_log',
  'manage_pg_keys', 'database_export', 'factory_reset'
];

const ROLE_DEFAULTS = {
  owner: {
    name_en: 'Owner', name_ar: 'المالك',
    perms: Object.fromEntries(PERMISSION_CODES.map(c => {
      if (c.endsWith('_max') || c.endsWith('_max_iqd')) return [c, 100];
      if (c === 'discount_daily_count_limit') return [c, 999];
      return [c, true];
    }).concat([
      ['discount_percent_max', 100],
      ['discount_fixed_max_iqd', 999999999],
      ['refund_max_iqd', 999999999],
      ['discount_daily_count_limit', 999]
    ]))
  },
  manager: {
    name_en: 'Manager', name_ar: 'مدير',
    perms: {
      cash_drawer_open_no_sale: true, cash_deposit: true, cash_withdraw: true,
      change_payment_method: true,
      void_before_payment: true, void_after_payment: true, refund: true, refund_max_iqd: 50000,
      reopen_closed_order: true, transfer_order: true, merge_split_orders: true,
      kitchen_recall: true, comp_item: true, assign_to_other_cashier: true,
      discount_percent: true, discount_percent_max: 30, discount_fixed: true,
      discount_fixed_max_iqd: 20000, discount_employee_meal: true,
      discount_daily_count_limit: 50, price_override: true,
      gift_voucher_issue: true, tip_adjust: true,
      open_shift: true, close_shift: true, close_shift_force: true,
      view_other_cashier_sales: true,
      customer_data_view: true, customer_data_edit: true, customer_delete: false,
      stamp_manual_grant: true,
      menu_edit: true, menu_sold_out_toggle: true, inventory_edit: true, inventory_count: true,
      view_basic_reports: true, view_advanced_reports: true, view_cost_margin: true,
      view_payroll: true, export_data: true,
      // admin-only locked: false
      settings_change: false, staff_manage: false, role_manage: false,
      view_audit_log: true, manage_pg_keys: false, database_export: false, factory_reset: false
    }
  },
  cashier: {
    name_en: 'Cashier', name_ar: 'كاشير',
    perms: {
      cash_drawer_open_no_sale: false, cash_deposit: false, cash_withdraw: false,
      change_payment_method: false,
      void_before_payment: true, void_after_payment: false, refund: false, refund_max_iqd: 0,
      reopen_closed_order: false, transfer_order: true, merge_split_orders: false,
      kitchen_recall: false, comp_item: false, assign_to_other_cashier: false,
      discount_percent: true, discount_percent_max: 10, discount_fixed: false,
      discount_fixed_max_iqd: 0, discount_employee_meal: false,
      discount_daily_count_limit: 5, price_override: false,
      gift_voucher_issue: false, tip_adjust: false,
      open_shift: true, close_shift: true, close_shift_force: false,
      view_other_cashier_sales: false,
      customer_data_view: true, customer_data_edit: false, customer_delete: false,
      stamp_manual_grant: false,
      menu_edit: false, menu_sold_out_toggle: true, inventory_edit: false, inventory_count: false,
      view_basic_reports: true, view_advanced_reports: false, view_cost_margin: false,
      view_payroll: false, export_data: false,
      settings_change: false, staff_manage: false, role_manage: false,
      view_audit_log: false, manage_pg_keys: false, database_export: false, factory_reset: false
    }
  },
  barista: {
    name_en: 'Barista', name_ar: 'باريستا',
    perms: {
      cash_drawer_open_no_sale: false, cash_deposit: false, cash_withdraw: false,
      change_payment_method: false,
      void_before_payment: false, void_after_payment: false, refund: false, refund_max_iqd: 0,
      reopen_closed_order: false, transfer_order: false, merge_split_orders: false,
      kitchen_recall: false, comp_item: false, assign_to_other_cashier: false,
      discount_percent: false, discount_percent_max: 0, discount_fixed: false,
      discount_fixed_max_iqd: 0, discount_employee_meal: false,
      discount_daily_count_limit: 0, price_override: false,
      gift_voucher_issue: false, tip_adjust: false,
      open_shift: false, close_shift: false, close_shift_force: false,
      view_other_cashier_sales: false,
      customer_data_view: false, customer_data_edit: false, customer_delete: false,
      stamp_manual_grant: false,
      menu_edit: false, menu_sold_out_toggle: true, inventory_edit: false, inventory_count: false,
      view_basic_reports: false, view_advanced_reports: false, view_cost_margin: false,
      view_payroll: false, export_data: false,
      settings_change: false, staff_manage: false, role_manage: false,
      view_audit_log: false, manage_pg_keys: false, database_export: false, factory_reset: false
    }
  }
};

// idempotent role seed (only inserts missing system roles, never overwrites edits)
{
  const now = Date.now();
  const insRole = db.prepare(`INSERT INTO roles
    (code, name_en, name_ar, permissions, is_system, created_at, updated_at)
    VALUES (?,?,?,?,1,?,?)`);
  for (const [code, def] of Object.entries(ROLE_DEFAULTS)) {
    const existing = db.prepare('SELECT id FROM roles WHERE code=?').get(code);
    if (!existing) {
      insRole.run(code, def.name_en, def.name_ar, JSON.stringify(def.perms), now, now);
    }
  }
}

// migrate existing cashiers.role (TEXT) → cashiers.role_id (FK)
{
  const rows = db.prepare("SELECT id, role FROM cashiers WHERE role_id IS NULL").all();
  for (const c of rows) {
    const code = (c.role === 'owner' || c.role === 'manager' || c.role === 'barista') ? c.role : 'cashier';
    const r = db.prepare('SELECT id FROM roles WHERE code=?').get(code);
    if (r) db.prepare('UPDATE cashiers SET role_id=? WHERE id=?').run(r.id, c.id);
  }
}

// ─── Sprint 2.1: seed default categories matching legacy hardcoded MENU codes ─
// These are the same 6 codes (hot/ice/tea/smo/des/foo) the frontend already uses,
// imported once so settings UI has something to edit and so future menu items
// can FK into a category. The seed is idempotent — only inserts missing codes.
// Sprint 2.7: 12 categories matching customer site (index.js menuData keys).
// Codes are kebab-case to match the customer-site `data-cat` attributes so
// /api/menu/public can be consumed directly without translation.
const CATEGORY_DEFAULTS = [
  { code: 'hot-coffee',  name_en: 'Hot Coffee',   name_ar: 'قهوة ساخنة',  name_ko: '핫 커피',         icon: '☕',  color: '#8b4513', sort_order: 10 },
  { code: 'cold-coffee', name_en: 'Cold Coffee',  name_ar: 'قهوة باردة', name_ko: '아이스 커피',     icon: '🧊',  color: '#4682b4', sort_order: 20 },
  { code: 'matcha',      name_en: 'Matcha',       name_ar: 'ماتشا',       name_ko: '말차',             icon: '🍵',  color: '#228b22', sort_order: 30 },
  { code: 'hot-tea',     name_en: 'Hot Tea',      name_ar: 'شاي ساخن',    name_ko: '핫 티',            icon: '🫖',  color: '#a0522d', sort_order: 40 },
  { code: 'smoothie',    name_en: 'Smoothie',     name_ar: 'سموثي',       name_ko: '스무디',           icon: '🥤',  color: '#dc143c', sort_order: 50 },
  { code: 'frappe',      name_en: 'Frappé',       name_ar: 'فرابيه',      name_ko: '프라페',           icon: '🧋',  color: '#9370db', sort_order: 60 },
  { code: 'milkshake',   name_en: 'Milkshake',    name_ar: 'ميلك شيك',    name_ko: '밀크쉐이크',       icon: '🥛',  color: '#deb887', sort_order: 70 },
  { code: 'mojito',      name_en: 'Mojito',       name_ar: 'موهيتو',      name_ko: '모히토',           icon: '🌿',  color: '#3cb371', sort_order: 80 },
  { code: 'yogurt',      name_en: 'Yogurt',       name_ar: 'يوغرت',       name_ko: '요거트',           icon: '🍦',  color: '#ffd700', sort_order: 90 },
  { code: 'pastry',      name_en: 'Pastry',       name_ar: 'معجنات',      name_ko: '페이스트리',       icon: '🥐',  color: '#cd853f', sort_order: 100 },
  { code: 'dessert',     name_en: 'Dessert',      name_ar: 'حلويات',      name_ko: '디저트',           icon: '🍰',  color: '#daa520', sort_order: 110 },
  { code: 'food',        name_en: 'Food',         name_ar: 'مأكولات',     name_ko: '푸드',             icon: '🍽️',  color: '#ff8c00', sort_order: 120 }
];
{
  const now = Date.now();
  // One-time cleanup: remove the 6 legacy 3-letter codes (hot/ice/tea/smo/des/foo)
  // ONLY if they have zero items linked. After Sprint 2.7 we use kebab-case codes
  // matching the customer site. If owner manually added items under legacy codes,
  // skip the delete to avoid losing data — they'll just see both.
  const LEGACY_CODES = ['hot', 'ice', 'tea', 'smo', 'des', 'foo'];
  for (const lc of LEGACY_CODES) {
    const row = db.prepare('SELECT id FROM menu_categories WHERE code=?').get(lc);
    if (!row) continue;
    const used = db.prepare('SELECT COUNT(*) AS n FROM menu_items_v2 WHERE category_id=?').get(row.id).n;
    if (used === 0) {
      db.prepare('DELETE FROM menu_categories WHERE id=?').run(row.id);
    }
  }
  // Seed defaults ONLY when the table is empty (first install). Once the owner
  // has added/removed/renamed even one category, we leave the table alone —
  // re-seeding would resurrect rows the owner deleted. (Sprint 2.7)
  const existingCount = db.prepare('SELECT COUNT(*) AS n FROM menu_categories').get().n;
  if (existingCount === 0) {
    const ins = db.prepare(`INSERT INTO menu_categories
      (code, name_en, name_ar, name_ko, icon, color, sort_order, active, created_at, updated_at)
      VALUES (?,?,?,?,?,?,?,1,?,?)`);
    for (const c of CATEGORY_DEFAULTS) {
      ins.run(c.code, c.name_en, c.name_ar, c.name_ko, c.icon, c.color, c.sort_order, now, now);
    }
  } else {
    // Sprint 2.7+: backfill `icon` for default-coded rows that exist but have
    // NULL icon (post-migration on databases seeded before the icon column
    // was added). Idempotent and only touches rows where the owner has not
    // already set an icon — never overwrites custom values.
    const upd = db.prepare("UPDATE menu_categories SET icon=? WHERE code=? AND (icon IS NULL OR icon='')");
    for (const c of CATEGORY_DEFAULTS) {
      upd.run(c.icon, c.code);
    }
  }
}

// ─── Sprint 2.3: seed default modifier groups + options ──────────────────────
// These mirror the legacy hardcoded option set in pos-data.js so the eventual
// 2.7 migration of MENU items can hook into existing groups by code. Idempotent.
const MODIFIER_GROUP_DEFAULTS = [
  {
    code: 'size', selection: 'single', required: 1, sort_order: 10,
    name_en: 'Size', name_ar: 'الحجم', name_ko: '사이즈',
    options: [
      { code: 'reg',   name_en: 'Regular', name_ar: 'عادي',   name_ko: '레귤러', price_delta_iqd: 0,    is_default: 1, sort_order: 10 },
      { code: 'venti', name_en: 'Venti',   name_ar: 'كبير',   name_ko: '벤티',   price_delta_iqd: 1000, is_default: 0, sort_order: 20 }
    ]
  },
  {
    code: 'temp', selection: 'single', required: 1, sort_order: 20,
    name_en: 'Temperature', name_ar: 'الحرارة', name_ko: '온도',
    options: [
      { code: 'hot', name_en: 'Hot',  name_ar: 'ساخن',  name_ko: '핫',     price_delta_iqd: 0, is_default: 1, sort_order: 10 },
      { code: 'ice', name_en: 'Iced', name_ar: 'مثلج',  name_ko: '아이스', price_delta_iqd: 0, is_default: 0, sort_order: 20 }
    ]
  },
  {
    code: 'milk', selection: 'single', required: 0, sort_order: 30,
    name_en: 'Milk', name_ar: 'الحليب', name_ko: '우유',
    options: [
      { code: 'whole',  name_en: 'Whole milk',  name_ar: 'حليب كامل',     name_ko: '전유',     price_delta_iqd: 0,    is_default: 1, sort_order: 10 },
      { code: 'oat',    name_en: 'Oat milk',    name_ar: 'حليب الشوفان',  name_ko: '오트밀크', price_delta_iqd: 1000, is_default: 0, sort_order: 20 },
      { code: 'almond', name_en: 'Almond milk', name_ar: 'حليب اللوز',    name_ko: '아몬드',   price_delta_iqd: 1000, is_default: 0, sort_order: 30 },
      { code: 'no',     name_en: 'No milk',     name_ar: 'بدون حليب',     name_ko: '우유 없음',price_delta_iqd: 0,    is_default: 0, sort_order: 40 }
    ]
  },
  {
    code: 'shot', selection: 'single', required: 0, sort_order: 40,
    name_en: 'Espresso shots', name_ar: 'الشوتات', name_ko: '샷',
    options: [
      { code: 's1', name_en: '1 shot',  name_ar: 'شوت 1',  name_ko: '1샷', price_delta_iqd: 0,    is_default: 1, sort_order: 10 },
      { code: 's2', name_en: '2 shots', name_ar: 'شوت 2',  name_ko: '2샷', price_delta_iqd: 1000, is_default: 0, sort_order: 20 },
      { code: 's3', name_en: '3 shots', name_ar: 'شوت 3',  name_ko: '3샷', price_delta_iqd: 2000, is_default: 0, sort_order: 30 }
    ]
  },
  {
    code: 'syrup', selection: 'multi', required: 0, sort_order: 50,
    name_en: 'Syrups', name_ar: 'الشراب', name_ko: '시럽',
    options: [
      { code: 'vanilla', name_en: 'Vanilla', name_ar: 'فانيلا',  name_ko: '바닐라', price_delta_iqd: 500, is_default: 0, sort_order: 10 },
      { code: 'caramel', name_en: 'Caramel', name_ar: 'كراميل',  name_ko: '카라멜', price_delta_iqd: 500, is_default: 0, sort_order: 20 },
      { code: 'hazel',   name_en: 'Hazelnut',name_ar: 'بندق',    name_ko: '헤이즐넛', price_delta_iqd: 500, is_default: 0, sort_order: 30 }
    ]
  }
];
{
  // Same first-install-only policy as categories — once the owner has shaped
  // their modifier groups in Settings, re-seeding would resurrect deleted rows.
  const existingGroups = db.prepare('SELECT COUNT(*) AS n FROM menu_modifier_groups').get().n;
  if (existingGroups === 0) {
    const now = Date.now();
    const insGroup = db.prepare(`INSERT INTO menu_modifier_groups
      (code, name_en, name_ar, name_ko, selection, required, sort_order, created_at, updated_at)
      VALUES (?,?,?,?,?,?,?,?,?)`);
    const insOpt = db.prepare(`INSERT INTO menu_modifier_options
      (group_id, code, name_en, name_ar, name_ko, price_delta_iqd, is_default, sort_order)
      VALUES (?,?,?,?,?,?,?,?)`);
    for (const g of MODIFIER_GROUP_DEFAULTS) {
      const r = insGroup.run(g.code, g.name_en, g.name_ar, g.name_ko, g.selection, g.required, g.sort_order, now, now);
      const gid = r.lastInsertRowid;
      for (const o of g.options) {
        insOpt.run(gid, o.code, o.name_en, o.name_ar, o.name_ko, o.price_delta_iqd, o.is_default, o.sort_order);
      }
    }
  }
}

// ─── Workforce password seed (separate from admin) ───────────────────────────
if (!db.prepare("SELECT value FROM settings WHERE key='workforce_pw'").get()) {
  const envPw = (process.env.WORKFORCE_INITIAL_PASSWORD || '').trim();
  if (envPw && envPw.length >= 8) {
    db.prepare("INSERT INTO settings (key, value) VALUES ('workforce_pw', ?)").run(hashPassword(envPw));
    console.log('Workforce password seeded from WORKFORCE_INITIAL_PASSWORD env var.');
  } else {
    console.log('────────────────────────────────────────────────────');
    console.log('  WORKFORCE password not configured.');
    console.log('  Set WORKFORCE_INITIAL_PASSWORD env var (>= 8 chars) and restart');
    console.log('  to enable /workforce dashboard login.');
    console.log('────────────────────────────────────────────────────');
  }
}

// ─── جلسة المدير (SQLite، TTL 12 ساعة) ───────────────────────────────────────
const ADMIN_SESSION_TTL = 12 * 60 * 60 * 1000; // 12 ساعة

function requireAuth(req, res, next) {
  const token = req.headers['x-auth-token'];
  if (token) {
    const row = db.prepare('SELECT created_at FROM admin_sessions WHERE token=?').get(token);
    if (row) {
      if (Date.now() - row.created_at > ADMIN_SESSION_TTL) {
        db.prepare('DELETE FROM admin_sessions WHERE token=?').run(token);
        return res.status(401).json({ error: 'انتهت الجلسة. يرجى تسجيل الدخول مجدداً' });
      }
      db.prepare('UPDATE admin_sessions SET created_at=? WHERE token=?').run(Date.now(), token);
      req.cashier = { id: 0, name: 'Admin', role: 'owner', role_id: null, permissions: getOwnerPermissions(), isAdmin: true };
      return next();
    }
  }
  // Sprint 1: also accept a cashier token if its role is owner — owners can
  // operate admin endpoints from the POS UI without a separate admin login.
  const cashierToken = req.headers['x-cashier-token'];
  if (cashierToken) {
    const row = db.prepare('SELECT cs.*, c.id as cid, c.name, c.role, c.role_id, c.active FROM cashier_sessions cs JOIN cashiers c ON c.id=cs.cashier_id WHERE cs.token=?').get(cashierToken);
    if (row && row.active !== 0 && (Date.now() - row.created_at) <= CASHIER_SESSION_TTL) {
      const ctx = resolveCashierContext(row);
      if (ctx.role === 'owner') {
        db.prepare('UPDATE cashier_sessions SET created_at=? WHERE token=?').run(Date.now(), cashierToken);
        req.cashier = { id: row.cid, name: row.name, role: 'owner', role_id: ctx.role_id, permissions: ctx.permissions, isAdmin: false };
        return next();
      }
    }
  }
  return res.status(401).json({ error: 'يجب تسجيل دخول المدير' });
}

// تنظيف جلسات المدير المنتهية (كل ساعة)
setInterval(() => {
  db.prepare('DELETE FROM admin_sessions WHERE created_at < ?').run(Date.now() - ADMIN_SESSION_TTL);
}, 60 * 60 * 1000);

// ─── Sprint 1: audit_log retention cron (1 year, runs every 24h) ─────────────
const AUDIT_LOG_RETENTION_MS = 365 * 24 * 60 * 60 * 1000;
function purgeOldAuditLog() {
  const cutoff = Date.now() - AUDIT_LOG_RETENTION_MS;
  db.prepare('DELETE FROM audit_log WHERE at < ?').run(cutoff);
}
purgeOldAuditLog();
setInterval(purgeOldAuditLog, 24 * 60 * 60 * 1000);

// ─── Sprint 1: audit_log writer (single insert helper) ───────────────────────
const insertAuditStmt = db.prepare(`INSERT INTO audit_log
  (actor_id, actor_name, actor_role, approver_id, approver_name, reason,
   action, target_type, target_id, before_json, after_json, ip, at)
  VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`);

function writeAudit({ actor, approver, reason, action, target_type, target_id, before, after, ip }) {
  insertAuditStmt.run(
    actor?.id || null,
    actor?.name || null,
    actor?.role || null,
    approver?.id || null,
    approver?.name || null,
    reason ? String(reason).slice(0, 500) : null,
    String(action),
    target_type || null,
    target_id != null ? String(target_id) : null,
    before != null ? JSON.stringify(before) : null,
    after != null ? JSON.stringify(after) : null,
    ip || null,
    Date.now()
  );
}

// ─── Workforce session (separate from admin, header: x-workforce-token) ──────
const WORKFORCE_SESSION_TTL = 12 * 60 * 60 * 1000;

function requireWorkforce(req, res, next) {
  const token = req.headers['x-workforce-token'];
  if (!token) return res.status(401).json({ error: 'Workforce login required' });
  const row = db.prepare('SELECT created_at FROM workforce_sessions WHERE token=?').get(token);
  if (!row) return res.status(401).json({ error: 'Workforce login required' });
  if (Date.now() - row.created_at > WORKFORCE_SESSION_TTL) {
    db.prepare('DELETE FROM workforce_sessions WHERE token=?').run(token);
    return res.status(401).json({ error: 'Session expired. Please log in again.' });
  }
  // Sliding TTL
  db.prepare('UPDATE workforce_sessions SET created_at=? WHERE token=?').run(Date.now(), token);
  req.workforceToken = token;
  next();
}

setInterval(() => {
  db.prepare('DELETE FROM workforce_sessions WHERE created_at < ?').run(Date.now() - WORKFORCE_SESSION_TTL);
}, 60 * 60 * 1000);

// ─── جلسة الكاشير ────────────────────────────────────────────────────────────
// Sprint 1: cashier sessions are *manual logout only* (no auto-expiry) per
// owner request — overtime shifts can run past 12h. Keep a long safety TTL
// (30d) so abandoned sessions still get garbage collected.
const CASHIER_SESSION_TTL = 30 * 24 * 60 * 60 * 1000;

// Resolve role + parsed permissions for a cashier row (joins roles table).
// Returns { role: code, role_id, permissions: {} } or sane defaults if missing.
function resolveCashierContext(cashierRow) {
  let role = 'cashier';
  let role_id = cashierRow.role_id || null;
  let permissions = {};
  if (role_id) {
    const r = db.prepare('SELECT code, permissions FROM roles WHERE id=?').get(role_id);
    if (r) {
      role = r.code;
      try { permissions = JSON.parse(r.permissions || '{}'); } catch (_) { permissions = {}; }
    }
  } else if (cashierRow.role) {
    role = cashierRow.role;
    const r = db.prepare('SELECT id, permissions FROM roles WHERE code=?').get(role);
    if (r) {
      role_id = r.id;
      try { permissions = JSON.parse(r.permissions || '{}'); } catch (_) { permissions = {}; }
    }
  }
  return { role, role_id, permissions };
}

// Owner permission set (used when admin token authenticates — admin has every
// permission). Loaded lazily once and cached in process memory; if owner role
// permissions are edited via API, the cache is invalidated by ownerPermsCache=null.
let ownerPermsCache = null;
function getOwnerPermissions() {
  if (ownerPermsCache) return ownerPermsCache;
  const r = db.prepare("SELECT permissions FROM roles WHERE code='owner'").get();
  try { ownerPermsCache = JSON.parse(r?.permissions || '{}'); } catch (_) { ownerPermsCache = {}; }
  return ownerPermsCache;
}
function invalidateOwnerPermsCache() { ownerPermsCache = null; }

function requireCashierOrAdmin(req, res, next) {
  // قبول رمز المدير أيضاً
  const adminToken = req.headers['x-auth-token'];
  if (adminToken) {
    const row = db.prepare('SELECT created_at FROM admin_sessions WHERE token=?').get(adminToken);
    if (row && Date.now() - row.created_at <= ADMIN_SESSION_TTL) {
      db.prepare('UPDATE admin_sessions SET created_at=? WHERE token=?').run(Date.now(), adminToken);
      req.cashierName = 'مدير';
      req.cashier = { id: 0, name: 'Admin', role: 'owner', role_id: null, permissions: getOwnerPermissions(), isAdmin: true };
      return next();
    }
  }
  // رمز الكاشير — الرأس فقط (SSE يستخدم تذاكر منفصلة عبر /api/orders/stream-ticket)
  const cashierToken = req.headers['x-cashier-token'];
  if (!cashierToken) return res.status(401).json({ error: 'تسجيل الدخول مطلوب' });
  const row = db.prepare('SELECT cs.*, c.id as cid, c.name, c.role, c.role_id, c.active FROM cashier_sessions cs JOIN cashiers c ON c.id=cs.cashier_id WHERE cs.token=?').get(cashierToken);
  if (!row) return res.status(401).json({ error: 'تسجيل الدخول مطلوب' });
  if (Date.now() - row.created_at > CASHIER_SESSION_TTL) {
    db.prepare('DELETE FROM cashier_sessions WHERE token=?').run(cashierToken);
    return res.status(401).json({ error: 'انتهت الجلسة. يرجى تسجيل الدخول مجدداً' });
  }
  if (row.active === 0) {
    db.prepare('DELETE FROM cashier_sessions WHERE token=?').run(cashierToken);
    return res.status(403).json({ error: 'الحساب معطّل' });
  }
  db.prepare('UPDATE cashier_sessions SET created_at=? WHERE token=?').run(Date.now(), cashierToken);
  req.cashierName = row.name;
  const ctx = resolveCashierContext(row);
  req.cashier = { id: row.cid, name: row.name, role: ctx.role, role_id: ctx.role_id, permissions: ctx.permissions, isAdmin: false };
  next();
}

// Permission gate factory — wraps requireCashierOrAdmin to also enforce a
// specific permission code. Use as: app.post('/x', requirePermission('refund'), handler).
function requirePermission(code) {
  return (req, res, next) => {
    requireCashierOrAdmin(req, res, (err) => {
      if (err) return next(err);
      const v = req.cashier?.permissions?.[code];
      if (v === true) return next();
      return res.status(403).json({ error: 'permission_denied', missing: code });
    });
  };
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
  const dead = [];
  sseClients.forEach(res => {
    try {
      if (res.writableEnded || res.destroyed) {
        dead.push(res);
        return;
      }
      res.write(msg);
    } catch (_) {
      dead.push(res);
    }
  });
  dead.forEach(res => {
    sseClients.delete(res);
    // already-closed response; ignore
    try { res.end(); } catch (_) { }
  });
}

// ─── تذاكر بث SSE (لمنع تسرّب الرمز في URL) ───────────────────────────────
// EventSource لا يدعم الرؤوس المخصصة، لذا نستخدم تذكرة قصيرة العمر مرّة واحدة
const STREAM_TICKET_TTL = 30 * 1000; // 30 ثانية
const streamTickets = new Map(); // ticket → { name, expires }

setInterval(() => {
  const now = Date.now();
  for (const [k, v] of streamTickets) {
    if (v.expires < now) streamTickets.delete(k);
  }
}, 60 * 1000);

// ─── الوسيط ───────────────────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://static.cloudflareinsights.com"],
      scriptSrcAttr: ["'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://cloudflareinsights.com"],
      fontSrc: ["'self'", "data:", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      frameSrc: ["'self'", "https://www.google.com", "https://maps.google.com"],
      frameAncestors: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));
app.use(express.json());
app.use(express.static(path.join(__dirname), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
  }
}));

// ─── خدمة الصور المرفوعة ─────────────────────────────────────────────────────
app.use('/uploads', express.static(UPLOAD_DIR, {
  fallthrough: false,
  maxAge: '7d',
}));

// ─── multer لرفع صور المنتجات ────────────────────────────────────────────────
const ALLOWED_IMAGE_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MIME_EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
const ingredientImageUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => {
      const ext = MIME_EXT[file.mimetype] || 'bin';
      const ingId = parseInt(req.params.id, 10) || 'new';
      const stamp = Date.now();
      const rand = crypto.randomBytes(4).toString('hex');
      cb(null, `ingredient-${ingId}-${stamp}-${rand}.${ext}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_IMAGE_MIME.has(file.mimetype)) cb(null, true);
    else cb(new Error('UNSUPPORTED_MIME'));
  },
});

// Sprint 2.2: separate uploader for menu item photos (kept distinct from
// ingredient photos so future moderation/CDN policies can differ).
const menuItemImageUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => {
      const ext = MIME_EXT[file.mimetype] || 'bin';
      const itemId = parseInt(req.params.id, 10) || 'new';
      const stamp  = Date.now();
      const rand   = crypto.randomBytes(4).toString('hex');
      cb(null, `menu-${itemId}-${stamp}-${rand}.${ext}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_IMAGE_MIME.has(file.mimetype)) cb(null, true);
    else cb(new Error('UNSUPPORTED_MIME'));
  },
});

// ─── /workforce — AI Workforce Office SPA (apps/workforce/dist) ──────────────
// Static assets first, then SPA catch-all so deep links (/workforce/approvals etc.)
// resolve to index.html. Page itself is public; client fetches `/api/workforce/auth/me`
// and shows a login screen when no token is present.
app.use('/workforce', express.static(path.join(__dirname, 'apps/workforce/dist'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
  }
}));
app.get(/^\/workforce(\/.*)?$/, (_req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.sendFile(path.join(__dirname, 'apps/workforce/dist/index.html'));
});

// ─── /admin 별도 경로 (사장 전용 대시보드) ────────────────────────────────────
// dashboard.html을 직접 서빙하지만, 대시보드 내부의 모든 API 호출은
// admin 토큰(x-auth-token)으로 인증함. /dashboard.html 직접 접근도 허용(레거시).
app.get('/admin', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.sendFile(path.join(__dirname, 'dashboard.html'));
});



// ─── Rate Limiters ────────────────────────────────────────────────────────────
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many login attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.ip === '127.0.0.1' || req.ip === '::1' || req.ip === '::ffff:127.0.0.1',
});

// Production: 5 attempts per 15 minutes — anti-bruteforce.
// Test (NODE_ENV=test): 5 attempts per 1 second + localhost is NOT skipped so
// 24-workforce-security-patch can verify the limiter trips. The M9 spec fires
// its 6 requests in parallel (Promise.all), so a 1s window is enough; the
// short window also means sibling describes always start with a fresh limiter.
const workforceLoginLimiter = rateLimit({
  windowMs: process.env.NODE_ENV === 'test' ? 1000 : 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many login attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV !== 'test' && (req.ip === '127.0.0.1' || req.ip === '::1' || req.ip === '::ffff:127.0.0.1'),
});

const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { error: 'Too many messages. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.ip === '127.0.0.1' || req.ip === '::1' || req.ip === '::ffff:127.0.0.1',
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { error: 'Too many registration attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.ip === '127.0.0.1' || req.ip === '::1' || req.ip === '::ffff:127.0.0.1',
});

const orderLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 30,
  message: { error: 'Too many orders. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.ip === '127.0.0.1' || req.ip === '::1' || req.ip === '::ffff:127.0.0.1',
});

const reservationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { error: 'Too many reservation requests. Please try again later.' },
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

// ─── WORKFORCE AUTH (AI Workforce Office) ────────────────────────────────────
app.post('/api/workforce/auth/login', workforceLoginLimiter, (req, res) => {
  const stored = db.prepare("SELECT value FROM settings WHERE key='workforce_pw'").get();
  if (!stored) {
    return res.status(503).json({
      success: false,
      error: 'Workforce password not configured. Set WORKFORCE_INITIAL_PASSWORD env var and restart.'
    });
  }
  if (!verifyPassword(req.body.password || '', stored.value)) {
    return res.status(401).json({ success: false, error: 'Invalid password' });
  }
  const token = crypto.randomBytes(32).toString('hex');
  db.prepare('INSERT INTO workforce_sessions (token, created_at) VALUES (?,?)').run(token, Date.now());
  res.json({ success: true, token });
});

app.post('/api/workforce/auth/logout', (req, res) => {
  const token = req.headers['x-workforce-token'];
  if (token) db.prepare('DELETE FROM workforce_sessions WHERE token=?').run(token);
  res.json({ success: true });
});

app.post('/api/workforce/auth/change-password', requireWorkforce, (req, res) => {
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 8)
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  db.prepare("UPDATE settings SET value=? WHERE key='workforce_pw'").run(hashPassword(newPassword));
  res.json({ success: true });
});

app.get('/api/workforce/auth/me', requireWorkforce, (_req, res) => {
  res.json({ success: true });
});

// ─── WORKFORCE DATA TABLES (approvals, tasks) ─────────────────────────────────
db.prepare(`CREATE TABLE IF NOT EXISTS workforce_approvals (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  title        TEXT NOT NULL,
  detail       TEXT,
  category     TEXT,
  amount_iqd   INTEGER,
  requested_by TEXT,
  assignee_id  TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'pending',
  decision_note TEXT,
  created_at   INTEGER NOT NULL,
  decided_at   INTEGER
)`).run();
db.prepare(`CREATE INDEX IF NOT EXISTS idx_wf_approvals_status ON workforce_approvals(status, created_at)`).run();
// Add created_by_token column if it doesn't exist (for permission isolation)
db.prepare(`PRAGMA table_info(workforce_approvals)`).all().forEach(col => {
  if (col.name === 'created_by_token') return;
});
const appColInfo = db.prepare(`PRAGMA table_info(workforce_approvals)`).all();
if (!appColInfo.find(c => c.name === 'created_by_token')) {
  db.prepare(`ALTER TABLE workforce_approvals ADD COLUMN created_by_token TEXT`).run();
}

// Add created_by_token column to agent_meetings if it doesn't exist
const mtgColInfo = db.prepare(`PRAGMA table_info(agent_meetings)`).all();
if (mtgColInfo.length > 0 && !mtgColInfo.find(c => c.name === 'created_by_token')) {
  db.prepare(`ALTER TABLE agent_meetings ADD COLUMN created_by_token TEXT`).run();
}

db.prepare(`CREATE TABLE IF NOT EXISTS workforce_tasks (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  title         TEXT NOT NULL,
  detail        TEXT,
  assignee_id   TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'todo',
  meeting_id    TEXT,
  created_at    INTEGER NOT NULL,
  updated_at    INTEGER NOT NULL,
  completed_at  INTEGER
)`).run();
db.prepare(`CREATE INDEX IF NOT EXISTS idx_wf_tasks_status ON workforce_tasks(status, updated_at)`).run();

// ─── WORKFORCE AGENT REGISTRY (24 agents → 8 backend teams) ───────────────────
// Source of truth shared with apps/workforce/src/lib/data/agents.ts.
// Each agent has its own micro-persona injected into prompts; team_id selects
// which persona file (CEO/CFO/COO/Marketing/Developer/Tax/Legal/HR) drives the
// underlying Anthropic call.
const WORKFORCE_AGENTS = [
  { id: 'ceo',   team_id: 'ceo',       team_label: '경영',     role_ko: 'CEO',                role_en: 'CEO' },
  { id: 'cfo',   team_id: 'cfo',       team_label: '재무',     role_ko: 'CFO',                role_en: 'CFO' },
  { id: 'cpo',   team_id: 'coo',       team_label: '경영',     role_ko: '총괄책임자',         role_en: 'COO / Chief of Staff' },
  { id: 'pm-1',  team_id: 'coo',       team_label: '프로덕트', role_ko: '프로덕트 리드',      role_en: 'Head of Product' },
  { id: 'pm-2',  team_id: 'coo',       team_label: '프로덕트', role_ko: '리서처',             role_en: 'Researcher' },
  { id: 'cto',   team_id: 'developer', team_label: '엔지니어링', role_ko: 'CTO',              role_en: 'CTO' },
  { id: 'eng-1', team_id: 'developer', team_label: '엔지니어링', role_ko: '백엔드 엔지니어',  role_en: 'Backend Engineer' },
  { id: 'eng-2', team_id: 'developer', team_label: '엔지니어링', role_ko: '프론트엔드 엔지니어', role_en: 'Frontend Engineer' },
  { id: 'eng-3', team_id: 'developer', team_label: '엔지니어링', role_ko: 'DevOps',           role_en: 'DevOps' },
  { id: 'eng-4', team_id: 'developer', team_label: '엔지니어링', role_ko: 'QA',               role_en: 'QA' },
  { id: 'des-1', team_id: 'marketing', team_label: '디자인',   role_ko: '디자인 리드',        role_en: 'Head of Design' },
  { id: 'des-2', team_id: 'marketing', team_label: '디자인',   role_ko: '프로덕트 디자이너',  role_en: 'Product Designer' },
  { id: 'cmo',   team_id: 'marketing', team_label: '마케팅',   role_ko: 'CMO',                role_en: 'CMO' },
  { id: 'mkt-1', team_id: 'marketing', team_label: '마케팅',   role_ko: '콘텐츠 작가',        role_en: 'Content Writer' },
  { id: 'mkt-2', team_id: 'marketing', team_label: '마케팅',   role_ko: '퍼포먼스 마케터',    role_en: 'Performance Marketer' },
  { id: 'mkt-3', team_id: 'marketing', team_label: '마케팅',   role_ko: 'SEO 분석가',         role_en: 'SEO Analyst' },
  { id: 'cro',   team_id: 'coo',       team_label: '세일즈',   role_ko: 'CRO',                role_en: 'CRO' },
  { id: 'sls-1', team_id: 'coo',       team_label: '세일즈',   role_ko: 'SDR',                role_en: 'SDR' },
  { id: 'sls-2', team_id: 'coo',       team_label: '세일즈',   role_ko: 'AE',                 role_en: 'Account Executive' },
  { id: 'fin-1', team_id: 'cfo',       team_label: '재무',     role_ko: '재무 분석가',        role_en: 'Financial Analyst' },
  { id: 'fin-2', team_id: 'cfo',       team_label: '재무',     role_ko: '회계',               role_en: 'Accountant' },
  { id: 'clo',   team_id: 'legal',     team_label: '법무',     role_ko: '법무 책임자',        role_en: 'General Counsel' },
  { id: 'lgl-1', team_id: 'legal',     team_label: '법무',     role_ko: '컴플라이언스',       role_en: 'Compliance' },
];
const workforceAgentById = Object.fromEntries(WORKFORCE_AGENTS.map(a => [a.id, a]));

function buildWorkforceAskPrompt(agent, history) {
  const team = getAgentTeam(agent.team_id);
  if (!team) return null;
  const turns = history.map(m => {
    if (m.role === 'user') return `[사장 질문]\n${m.content}`;
    return `[${agent.role_ko} 답변]\n${m.content}`;
  });
  // GUARD: Wrap user prompts in code fences to prevent injection
  const guardedTurns = turns.map((turn, idx) => {
    if (history[idx].role === 'user') {
      return turn.replace('[사장 질문]\n', `[사장 질문]\n\`\`\`\n`).replace(/\n\n(?=\[|$)/, '\n\`\`\`\n\n');
    }
    return turn;
  });
  const built = buildAskPrompt(team, []);
  const userTask = [
    `# 1:1 즉석 회의 — ${agent.role_ko} (${agent.role_en})`,
    '',
    '## 너의 역할',
    `너는 ${team.label} 페르소나 안에서 **${agent.role_ko} (${agent.role_en})** 직책으로 답한다.`,
    `소속 팀: ${agent.team_label}. 너의 직무 범위에서만 답하고, 다른 직책 영역이면 "이건 ○○이 봐야 할 부분" 한 줄로만 표시.`,
    '',
    '## 집중 영역',
    team.focus,
    '',
    '## 대화 기록 (시간순)',
    guardedTurns.join('\n\n') || '(첫 질문)',
    '',
    '## 응답 규칙',
    `- 한국어, 150~350 단어`,
    `- ${agent.role_ko}의 시각으로 답할 것 (회사 일반론 X, 카페 사업 컨텍스트 안에서)`,
    `- 카페는 이라크 1호점, 메인 https://mrkimscafe.com, POS 운영 중`,
    `- 데이터 없으면 추측 금지, "데이터 없음/수동 확인 필요" 명시`,
    `- 자동 수정/자동 실행 금지, 사용자 승인 필요한 액션만`,
    `- PG(카드/Zain/Switch) 미연동은 결제/매출 관련 시 항상 짚을 것`,
    `- 답변 끝에 "— ${agent.role_ko}" 한 줄`,
  ].join('\n');
  return { persona: built.persona, userTask };
}

// 1:1 chat with a specific workforce agent (creates a new ask meeting)
app.post('/api/workforce/chat/start', requireWorkforce, (req, res) => {
  const agentId = asString(req.body && req.body.agent_id, 32);
  const prompt = asString(req.body && req.body.prompt, 4000);
  const agent = workforceAgentById[agentId];
  if (!agent) return res.status(400).json({ error: 'invalid agent_id' });
  if (!prompt) return res.status(400).json({ error: 'prompt required' });
  const team = getAgentTeam(agent.team_id);
  if (!team) return res.status(400).json({ error: 'team mapping broken' });
  // GUARD: Wrap user prompt in code fences to prevent injection
  const guardedPrompt = `\`\`\`\n${prompt}\n\`\`\``;
  const meetingId = insertMeeting('ask', [agent.team_id], `[${agentId}] ${prompt.slice(0, 60)}`, req.workforceToken);
  insertMessage(meetingId, 'user', null, guardedPrompt);
  const built = buildWorkforceAskPrompt(agent, [{ role: 'user', content: guardedPrompt }]);
  setImmediate(() => processMeetingAsync(meetingId, 'ask', [team], [built]));
  res.json({ meeting_id: meetingId, agent_id: agentId });
});

// Follow-up message in an existing ask meeting
app.post('/api/workforce/chat/:id/message', requireWorkforce, (req, res) => {
  const id = asString(req.params.id, 64);
  const agentId = asString(req.body && req.body.agent_id, 32);
  const prompt = asString(req.body && req.body.prompt, 4000);
  if (!prompt) return res.status(400).json({ error: 'prompt required' });
  const agent = workforceAgentById[agentId];
  if (!agent) return res.status(400).json({ error: 'invalid agent_id' });
  const meeting = getMeeting(id);
  if (!meeting) return res.status(404).json({ error: 'meeting not found' });
  if (meeting.type !== 'ask') return res.status(400).json({ error: 'only ask meetings support follow-up' });
  if (meeting.status === 'running') return res.status(409).json({ error: 'previous turn still running' });
  const team = getAgentTeam(agent.team_id);
  if (!team) return res.status(400).json({ error: 'team mapping broken' });
  // GUARD: Wrap user prompt in code fences to prevent injection
  const guardedPrompt = `\`\`\`\n${prompt}\n\`\`\``;
  insertMessage(id, 'user', null, guardedPrompt);
  setMeetingStatus(id, 'running', null);
  const history = getMeetingMessages(id).map(m => ({ role: m.role, content: m.content }));
  const built = buildWorkforceAskPrompt(agent, history);
  setImmediate(() => processMeetingAsync(id, 'ask', [team], [built]));
  res.json({ meeting_id: id });
});

// Poll meeting state (status + messages)
app.get('/api/workforce/chat/:id', requireWorkforce, (req, res) => {
  const id = asString(req.params.id, 64);
  const meeting = getMeeting(id);
  if (!meeting) return res.status(404).json({ error: 'not found' });
  res.json(meeting);
});

// Multi-agent meeting (round-table)
app.post('/api/workforce/meeting/start', requireWorkforce, (req, res) => {
  const agentIds = Array.isArray(req.body && req.body.agent_ids) ? req.body.agent_ids.map(s => asString(s, 32)).filter(Boolean) : [];
  const topic = asString(req.body && req.body.topic, 2000);
  if (agentIds.length < 2) return res.status(400).json({ error: 'at least 2 agent_ids' });
  if (agentIds.length > 6) return res.status(400).json({ error: 'max 6 agents' });
  if (!topic) return res.status(400).json({ error: 'topic required' });
  const agents = agentIds.map(id => workforceAgentById[id]).filter(Boolean);
  if (agents.length !== agentIds.length) return res.status(400).json({ error: 'invalid agent_id in list' });
  // Dedupe by team_id but keep agent labels for the prompt
  const teamIds = [...new Set(agents.map(a => a.team_id))];
  const teams = teamIds.map(getAgentTeam);
  if (teams.some(t => !t)) return res.status(400).json({ error: 'team mapping broken' });
  // GUARD: Wrap user topic in code fences to prevent injection
  const guardedTopic = `\`\`\`\n${topic}\n\`\`\``;
  const meetingId = insertMeeting('multi', teamIds, topic, req.workforceToken);
  insertMessage(meetingId, 'user', null, guardedTopic);
  const built = teams.map(t => buildMeetingPrompt(t, topic, teams));
  setImmediate(() => processMeetingAsync(meetingId, 'multi', teams, built));
  res.json({ meeting_id: meetingId });
});

// List recent meetings (across both ask + multi)
app.get('/api/workforce/meetings', requireWorkforce, (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);
  const rows = db.prepare(`SELECT id, type, team_ids, topic, status, created_at, updated_at, created_by_token FROM agent_meetings WHERE created_by_token = ? ORDER BY created_at DESC LIMIT ?`).all(req.workforceToken, limit);
  res.json({
    meetings: rows.map(r => ({
      id: r.id,
      type: r.type,
      team_ids: JSON.parse(r.team_ids),
      topic: r.topic,
      status: r.status,
      created_at: r.created_at,
      updated_at: r.updated_at,
      created_by_token: r.created_by_token,
    })),
  });
});

// Get individual meeting with permission check
app.get('/api/workforce/meeting/:id', requireWorkforce, (req, res) => {
  const id = asString(req.params.id, 64);
  const row = db.prepare(`SELECT * FROM agent_meetings WHERE id=? AND created_by_token=?`).get(id, req.workforceToken);
  if (!row) return res.status(404).json({ error: 'not found' });
  const messages = db.prepare(`SELECT role, team_id, content, created_at FROM agent_meeting_messages WHERE meeting_id=? ORDER BY created_at ASC, id ASC`).all(id);
  res.json({
    id: row.id,
    type: row.type,
    team_ids: JSON.parse(row.team_ids),
    topic: row.topic,
    status: row.status,
    error: row.error,
    created_at: row.created_at,
    updated_at: row.updated_at,
    messages: messages.map(m => ({ role: m.role, team_id: m.team_id, content: m.content, created_at: m.created_at })),
  });
});

// KPIs for the home dashboard
app.get('/api/workforce/kpis', requireWorkforce, (_req, res) => {
  const dayStart = new Date(); dayStart.setHours(0, 0, 0, 0);
  const cutoff = dayStart.getTime();
  const meetings24h = db.prepare(`SELECT COUNT(*) AS n FROM agent_meetings WHERE created_at >= ?`).get(cutoff).n;
  const messages24h = db.prepare(`SELECT COUNT(*) AS n FROM agent_meeting_messages WHERE created_at >= ? AND role='agent'`).get(cutoff).n;
  const liveMeetings = db.prepare(`SELECT COUNT(*) AS n FROM agent_meetings WHERE status='running'`).get().n;
  const tasksOpen = db.prepare(`SELECT COUNT(*) AS n FROM workforce_tasks WHERE status IN ('todo','in_progress')`).get().n;
  const tasksDone24h = db.prepare(`SELECT COUNT(*) AS n FROM workforce_tasks WHERE completed_at IS NOT NULL AND completed_at >= ?`).get(cutoff).n;
  const approvalsPending = db.prepare(`SELECT COUNT(*) AS n FROM workforce_approvals WHERE status='pending'`).get().n;
  res.json({
    total_agents: WORKFORCE_AGENTS.length,
    meetings_24h: meetings24h,
    agent_replies_24h: messages24h,
    live_meetings: liveMeetings,
    tasks_open: tasksOpen,
    tasks_done_24h: tasksDone24h,
    approvals_pending: approvalsPending,
  });
});

// Activity feed (union of recent meetings, tasks, approvals)
app.get('/api/workforce/activity', requireWorkforce, (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 30, 100);
  const meetings = db.prepare(`SELECT id, type, team_ids, topic, status, created_at FROM agent_meetings ORDER BY created_at DESC LIMIT ?`).all(limit);
  const tasks = db.prepare(`SELECT id, title, assignee_id, status, updated_at FROM workforce_tasks ORDER BY updated_at DESC LIMIT ?`).all(limit);
  const approvals = db.prepare(`SELECT id, title, assignee_id, status, decided_at, created_at FROM workforce_approvals ORDER BY COALESCE(decided_at, created_at) DESC LIMIT ?`).all(limit);
  const items = [
    ...meetings.map(m => ({ kind: 'meeting', t: m.created_at, ref: m.id, type: m.type, topic: m.topic, status: m.status, team_ids: JSON.parse(m.team_ids) })),
    ...tasks.map(t => ({ kind: 'task', t: t.updated_at, ref: String(t.id), title: t.title, assignee_id: t.assignee_id, status: t.status })),
    ...approvals.map(a => ({ kind: 'approval', t: a.decided_at || a.created_at, ref: String(a.id), title: a.title, assignee_id: a.assignee_id, status: a.status })),
  ].sort((a, b) => b.t - a.t).slice(0, limit);
  res.json({ items });
});

// ── Workforce: approvals queue ──────────────────────────────────────────────
app.get('/api/workforce/approvals', requireWorkforce, (req, res) => {
  const status = asString(req.query.status, 16);
  const where = status ? 'WHERE created_by_token=? AND status=?' : 'WHERE created_by_token=?';
  const args = status ? [req.workforceToken, status] : [req.workforceToken];
  const rows = db.prepare(`SELECT * FROM workforce_approvals ${where} ORDER BY status='pending' DESC, created_at DESC LIMIT 100`).all(...args);
  res.json({ approvals: rows });
});

app.post('/api/workforce/approvals', requireWorkforce, (req, res) => {
  const title = asString(req.body && req.body.title, 200);
  const detail = asString(req.body && req.body.detail, 4000);
  const category = asString(req.body && req.body.category, 32);
  const amount = parseInt(req.body && req.body.amount_iqd, 10);
  const requestedBy = asString(req.body && req.body.requested_by, 64);
  const assigneeId = asString(req.body && req.body.assignee_id, 32);
  if (!title) return res.status(400).json({ error: 'title required' });
  if (!assigneeId || !workforceAgentById[assigneeId]) return res.status(400).json({ error: 'invalid assignee_id' });
  const info = db.prepare(`INSERT INTO workforce_approvals (title, detail, category, amount_iqd, requested_by, assignee_id, status, created_at, created_by_token) VALUES (?,?,?,?,?,?, 'pending', ?, ?)`)
    .run(title, detail || null, category || null, Number.isFinite(amount) ? amount : null, requestedBy || null, assigneeId, Date.now(), req.workforceToken);
  res.json({ id: info.lastInsertRowid });
});

app.post('/api/workforce/approvals/:id/decide', requireWorkforce, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const decision = asString(req.body && req.body.decision, 16);
  const note = asString(req.body && req.body.note, 1000);
  if (!['approved', 'rejected'].includes(decision)) return res.status(400).json({ error: 'decision must be approved or rejected' });
  const row = db.prepare(`SELECT * FROM workforce_approvals WHERE id=?`).get(id);
  if (!row) return res.status(404).json({ error: 'not found' });
  if (row.status !== 'pending') return res.status(409).json({ error: 'already decided' });
  db.prepare(`UPDATE workforce_approvals SET status=?, decision_note=?, decided_at=? WHERE id=?`)
    .run(decision, note || null, Date.now(), id);
  res.json({ success: true });
});

// ── Workforce: tasks board ──────────────────────────────────────────────────
app.get('/api/workforce/tasks', requireWorkforce, (req, res) => {
  const status = asString(req.query.status, 16);
  const where = status ? 'WHERE status=?' : '';
  const args = status ? [status] : [];
  const rows = db.prepare(`SELECT * FROM workforce_tasks ${where} ORDER BY updated_at DESC LIMIT 200`).all(...args);
  res.json({ tasks: rows });
});

app.post('/api/workforce/tasks', requireWorkforce, (req, res) => {
  const title = asString(req.body && req.body.title, 200);
  const detail = asString(req.body && req.body.detail, 4000);
  const assigneeId = asString(req.body && req.body.assignee_id, 32);
  const delegate = !!(req.body && req.body.delegate);  // if true, automatically start an ask meeting
  if (!title) return res.status(400).json({ error: 'title required' });
  const agent = workforceAgentById[assigneeId];
  if (!agent) return res.status(400).json({ error: 'invalid assignee_id' });
  const now = Date.now();
  let meetingId = null;
  if (delegate) {
    const team = getAgentTeam(agent.team_id);
    if (team) {
      meetingId = insertMeeting('ask', [agent.team_id], `[작업위임] ${title}`);
      const delegationPrompt = `# 작업 위임\n\n## 제목\n${title}\n\n${detail ? '## 세부\n' + detail + '\n\n' : ''}## 너에게 부탁하는 것\n위 작업의 실행 계획(단계, 데이터 필요, 리스크, 예상 소요)을 ${agent.role_ko} 시각으로 200~300단어로 작성. 자동 실행 금지, 다음 액션 1~2개만 명확히 제안.`;
      insertMessage(meetingId, 'user', null, delegationPrompt);
      const built = buildWorkforceAskPrompt(agent, [{ role: 'user', content: delegationPrompt }]);
      setImmediate(() => processMeetingAsync(meetingId, 'ask', [team], [built]));
    }
  }
  const info = db.prepare(`INSERT INTO workforce_tasks (title, detail, assignee_id, status, meeting_id, created_at, updated_at) VALUES (?,?,?, 'todo', ?, ?, ?)`)
    .run(title, detail || null, assigneeId, meetingId, now, now);
  res.json({ id: info.lastInsertRowid, meeting_id: meetingId });
});

app.post('/api/workforce/tasks/:id/status', requireWorkforce, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const status = asString(req.body && req.body.status, 16);
  if (!['todo', 'in_progress', 'done', 'cancelled'].includes(status)) return res.status(400).json({ error: 'invalid status' });
  const row = db.prepare(`SELECT * FROM workforce_tasks WHERE id=?`).get(id);
  if (!row) return res.status(404).json({ error: 'not found' });
  const now = Date.now();
  const completedAt = status === 'done' ? now : null;
  db.prepare(`UPDATE workforce_tasks SET status=?, updated_at=?, completed_at=? WHERE id=?`)
    .run(status, now, completedAt, id);
  res.json({ success: true });
});

app.delete('/api/workforce/tasks/:id', requireWorkforce, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const row = db.prepare(`SELECT id FROM workforce_tasks WHERE id=?`).get(id);
  if (!row) return res.status(404).json({ error: 'not found' });
  db.prepare(`DELETE FROM workforce_tasks WHERE id=?`).run(id);
  res.json({ success: true });
});

// Public list of workforce agents (no auth — also used by admin landing if needed)
app.get('/api/workforce/agents', requireWorkforce, (_req, res) => {
  res.json({ agents: WORKFORCE_AGENTS });
});

// ─── CASHIER AUTH ─────────────────────────────────────────────────────────────

app.post('/api/cashier/login', loginLimiter, (req, res) => {
  const { name, password } = req.body;
  if (!name || !password) return res.status(400).json({ error: 'أدخل الاسم وكلمة المرور' });
  const cashier = db.prepare('SELECT * FROM cashiers WHERE name=?').get(name.trim());
  if (!cashier || !verifyPassword(password, cashier.password))
    return res.status(401).json({ error: 'الاسم أو كلمة المرور غير صحيح' });
  if (cashier.active === 0) return res.status(403).json({ error: 'الحساب معطّل' });
  // إعادة تشفير SHA-256 القديم إلى bcrypt
  if (!cashier.password.startsWith('$2')) {
    db.prepare('UPDATE cashiers SET password=? WHERE id=?').run(hashPassword(password), cashier.id);
  }
  const token = crypto.randomBytes(32).toString('hex');
  db.prepare('INSERT INTO cashier_sessions (token, cashier_id, created_at) VALUES (?,?,?)').run(token, cashier.id, Date.now());
  db.prepare('UPDATE cashiers SET last_login_at=? WHERE id=?').run(Date.now(), cashier.id);
  const ctx = resolveCashierContext(cashier);
  writeAudit({
    actor: { id: cashier.id, name: cashier.name, role: ctx.role },
    action: 'auth.login', target_type: 'cashier', target_id: cashier.id,
    ip: req.ip
  });
  res.json({
    success: true, token,
    id: cashier.id,
    name: cashier.name,
    role: ctx.role,
    role_id: ctx.role_id,
    permissions: ctx.permissions,
    must_change_pw: cashier.must_change_pw === 1
  });
});

app.post('/api/cashier/logout', (req, res) => {
  const tok = req.headers['x-cashier-token'];
  if (tok) {
    const row = db.prepare('SELECT cashier_id FROM cashier_sessions WHERE token=?').get(tok);
    if (row) {
      const c = db.prepare('SELECT id, name, role FROM cashiers WHERE id=?').get(row.cashier_id);
      if (c) writeAudit({ actor: c, action: 'auth.logout', target_type: 'cashier', target_id: c.id, ip: req.ip });
    }
    db.prepare('DELETE FROM cashier_sessions WHERE token=?').run(tok);
  }
  res.json({ success: true });
});

// Cashier self-service: change own password (also clears must_change_pw flag).
app.post('/api/cashier/change-password', requireCashierOrAdmin, (req, res) => {
  if (req.cashier.isAdmin) return res.status(400).json({ error: 'استخدم تغيير كلمة مرور المدير' });
  const { current_password, new_password } = req.body || {};
  if (!current_password || !new_password) return res.status(400).json({ error: 'الحقول ناقصة' });
  if (new_password.length < 6) return res.status(400).json({ error: 'يجب أن تكون 6 أحرف على الأقل' });
  const c = db.prepare('SELECT * FROM cashiers WHERE id=?').get(req.cashier.id);
  if (!c || !verifyPassword(current_password, c.password))
    return res.status(401).json({ error: 'كلمة المرور الحالية غير صحيحة' });
  db.prepare('UPDATE cashiers SET password=?, must_change_pw=0, updated_at=? WHERE id=?')
    .run(hashPassword(new_password), Date.now(), c.id);
  writeAudit({ actor: req.cashier, action: 'cashier.change_own_password', target_type: 'cashier', target_id: c.id, ip: req.ip });
  res.json({ success: true });
});

// Get current authenticated user's profile (used by frontend to load permissions)
app.get('/api/cashier/me', requireCashierOrAdmin, (req, res) => {
  res.json({
    id: req.cashier.id,
    name: req.cashier.name,
    role: req.cashier.role,
    role_id: req.cashier.role_id,
    permissions: req.cashier.permissions,
    isAdmin: !!req.cashier.isAdmin
  });
});

// ─── Sprint 1: manager override (inline approval, single-step UX) ────────────
// A low-permission user (cashier) hitting a guarded action (refund, comp,
// force-close shift, etc.) submits the action with `manager_override` inline:
//   { name, password, reason }
// The action handler calls validateManagerOverride() — if the manager exists,
// password matches, account is active, and the manager holds the required
// permission, the override succeeds and audit_log records actor + approver +
// reason atomically with the action.
//
// Returns: { ok: true, approver: {id,name} } | { ok: false, error: '...' }
function validateManagerOverride({ manager_name, manager_password, required_perm }) {
  if (!manager_name || !manager_password) return { ok: false, error: 'manager_credentials_missing' };
  const mgr = db.prepare('SELECT * FROM cashiers WHERE name=?').get(String(manager_name).trim());
  if (!mgr || !verifyPassword(manager_password, mgr.password))
    return { ok: false, error: 'manager_invalid_credentials' };
  if (mgr.active === 0) return { ok: false, error: 'manager_account_disabled' };
  const ctx = resolveCashierContext(mgr);
  if (required_perm && ctx.permissions[required_perm] !== true)
    return { ok: false, error: 'manager_lacks_permission' };
  return { ok: true, approver: { id: mgr.id, name: mgr.name, role: ctx.role } };
}

// Convenience endpoint for the frontend modal to pre-validate manager
// credentials without committing the action — used to show inline error
// before the user is prompted again. Does NOT issue a token (action endpoints
// re-validate inline). Records nothing — pure pre-check.
app.post('/api/manager-validate', requireCashierOrAdmin, (req, res) => {
  const { manager_name, manager_password, required_perm } = req.body || {};
  const r = validateManagerOverride({ manager_name, manager_password, required_perm });
  if (!r.ok) return res.status(401).json({ error: r.error });
  res.json({ success: true, approver_name: r.approver.name, approver_role: r.approver.role });
});

// ─── Sprint 1: roles & permissions API (admin only) ──────────────────────────
app.get('/api/admin/roles', requireAuth, (_req, res) => {
  const rows = db.prepare('SELECT id, code, name_en, name_ar, permissions, is_system, created_at, updated_at FROM roles ORDER BY id').all();
  res.json(rows.map(r => ({
    ...r,
    permissions: (() => { try { return JSON.parse(r.permissions || '{}'); } catch (_) { return {}; } })(),
    is_system: r.is_system === 1
  })));
});

// List of permission codes the UI can render — single source of truth.
app.get('/api/admin/permission-codes', requireAuth, (_req, res) => {
  res.json({ codes: PERMISSION_CODES });
});

app.put('/api/admin/roles/:id', requireAuth, (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'invalid id' });
  const before = db.prepare('SELECT * FROM roles WHERE id=?').get(id);
  if (!before) return res.status(404).json({ error: 'not found' });
  const { name_en, name_ar, permissions } = req.body || {};
  if (typeof permissions !== 'object' || permissions === null)
    return res.status(400).json({ error: 'permissions must be object' });
  // sanitize: only known permission codes
  const clean = {};
  for (const code of PERMISSION_CODES) {
    if (code in permissions) clean[code] = permissions[code];
  }
  db.prepare('UPDATE roles SET name_en=COALESCE(?,name_en), name_ar=COALESCE(?,name_ar), permissions=?, updated_at=? WHERE id=?')
    .run(name_en || null, name_ar || null, JSON.stringify(clean), Date.now(), id);
  if (before.code === 'owner') invalidateOwnerPermsCache();
  const after = db.prepare('SELECT * FROM roles WHERE id=?').get(id);
  writeAudit({
    actor: req.cashier,
    action: 'role.update', target_type: 'role', target_id: id,
    before: { name_en: before.name_en, name_ar: before.name_ar, permissions: JSON.parse(before.permissions || '{}') },
    after:  { name_en: after.name_en,  name_ar: after.name_ar,  permissions: JSON.parse(after.permissions || '{}') },
    ip: req.ip
  });
  res.json({ success: true });
});

// ─── Sprint 1: staff management API (admin only) ─────────────────────────────
app.get('/api/admin/staff', requireAuth, (_req, res) => {
  const rows = db.prepare(`SELECT c.id, c.name, c.email, c.phone, c.active, c.must_change_pw,
                                  c.role_id, r.code AS role, c.created_at, c.updated_at, c.last_login_at
                           FROM cashiers c LEFT JOIN roles r ON r.id=c.role_id
                           ORDER BY c.name`).all();
  res.json(rows.map(r => ({ ...r, active: r.active !== 0, must_change_pw: r.must_change_pw === 1 })));
});

app.post('/api/admin/staff', requireAuth, (req, res) => {
  const { name, password, role_id, email, phone, active } = req.body || {};
  if (!name || !password) return res.status(400).json({ error: 'الاسم وكلمة المرور مطلوبان' });
  if (password.length < 6) return res.status(400).json({ error: 'كلمة المرور 6 أحرف على الأقل' });
  const role = role_id ? db.prepare('SELECT id, code FROM roles WHERE id=?').get(role_id)
                       : db.prepare("SELECT id, code FROM roles WHERE code='cashier'").get();
  if (!role) return res.status(400).json({ error: 'الدور غير صالح' });
  try {
    const now = Date.now();
    const r = db.prepare(`INSERT INTO cashiers
      (name, password, role, role_id, email, phone, active, must_change_pw, created_at, updated_at)
      VALUES (?,?,?,?,?,?,?,1,?,?)`).run(
      name.trim(), hashPassword(password), role.code, role.id,
      email || null, phone || null, active === false ? 0 : 1, now, now
    );
    writeAudit({
      actor: req.cashier,
      action: 'staff.create', target_type: 'cashier', target_id: r.lastInsertRowid,
      after: { name: name.trim(), role: role.code, email: email || null, phone: phone || null },
      ip: req.ip
    });
    res.json({ success: true, id: r.lastInsertRowid });
  } catch (e) {
    if (String(e.message).includes('UNIQUE')) return res.status(400).json({ error: 'الاسم موجود بالفعل' });
    res.status(500).json({ error: 'فشل الإنشاء' });
  }
});

app.put('/api/admin/staff/:id', requireAuth, (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'invalid id' });
  const before = db.prepare('SELECT * FROM cashiers WHERE id=?').get(id);
  if (!before) return res.status(404).json({ error: 'not found' });
  const { name, role_id, email, phone, active } = req.body || {};
  let role_code = before.role;
  if (role_id != null) {
    const r = db.prepare('SELECT id, code FROM roles WHERE id=?').get(role_id);
    if (!r) return res.status(400).json({ error: 'الدور غير صالح' });
    role_code = r.code;
  }
  db.prepare(`UPDATE cashiers SET
    name=COALESCE(?,name),
    role=?,
    role_id=COALESCE(?,role_id),
    email=?,
    phone=?,
    active=?,
    updated_at=?
    WHERE id=?`).run(
    name ? name.trim() : null,
    role_code,
    role_id || null,
    email !== undefined ? (email || null) : before.email,
    phone !== undefined ? (phone || null) : before.phone,
    active === undefined ? before.active : (active ? 1 : 0),
    Date.now(),
    id
  );
  // if deactivated, kill all sessions
  if (active === false) db.prepare('DELETE FROM cashier_sessions WHERE cashier_id=?').run(id);
  const after = db.prepare('SELECT * FROM cashiers WHERE id=?').get(id);
  writeAudit({
    actor: req.cashier,
    action: 'staff.update', target_type: 'cashier', target_id: id,
    before: { name: before.name, role: before.role, email: before.email, phone: before.phone, active: before.active === 1 },
    after:  { name: after.name,  role: after.role,  email: after.email,  phone: after.phone,  active: after.active === 1 },
    ip: req.ip
  });
  res.json({ success: true });
});

app.post('/api/admin/staff/:id/reset-password', requireAuth, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const c = db.prepare('SELECT id, name FROM cashiers WHERE id=?').get(id);
  if (!c) return res.status(404).json({ error: 'not found' });
  const { new_password } = req.body || {};
  // generate if not supplied
  const pw = (new_password && String(new_password).length >= 6)
    ? String(new_password)
    : crypto.randomBytes(9).toString('base64').replace(/[^A-Za-z0-9]/g,'').slice(0,10);
  db.prepare('UPDATE cashiers SET password=?, must_change_pw=1, updated_at=? WHERE id=?')
    .run(hashPassword(pw), Date.now(), id);
  db.prepare('DELETE FROM cashier_sessions WHERE cashier_id=?').run(id);
  writeAudit({
    actor: req.cashier,
    action: 'staff.reset_password', target_type: 'cashier', target_id: id,
    ip: req.ip
  });
  res.json({ success: true, new_password: pw, must_change_pw: true });
});

app.delete('/api/admin/staff/:id', requireAuth, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const c = db.prepare('SELECT id, name, role FROM cashiers WHERE id=?').get(id);
  if (!c) return res.status(404).json({ error: 'not found' });
  db.prepare('DELETE FROM cashier_sessions WHERE cashier_id=?').run(id);
  db.prepare('DELETE FROM cashiers WHERE id=?').run(id);
  writeAudit({
    actor: req.cashier,
    action: 'staff.delete', target_type: 'cashier', target_id: id,
    before: { name: c.name, role: c.role },
    ip: req.ip
  });
  res.json({ success: true });
});

// ─── Sprint 1: store info & security settings (admin only) ───────────────────
function readJsonSetting(key, fallback) {
  const r = db.prepare('SELECT value FROM settings WHERE key=?').get(key);
  if (!r) return fallback;
  try { return JSON.parse(r.value); } catch (_) { return fallback; }
}
function writeJsonSetting(key, value) {
  const json = JSON.stringify(value);
  const exists = db.prepare('SELECT 1 FROM settings WHERE key=?').get(key);
  if (exists) db.prepare('UPDATE settings SET value=? WHERE key=?').run(json, key);
  else db.prepare('INSERT INTO settings (key, value) VALUES (?,?)').run(key, json);
}

const STORE_INFO_DEFAULT = {
  name_en: "Mr. Kim's Cafe", name_ar: 'مستر كيمز',
  address_en: '', address_ar: '',
  phone: '', tax_id: '', logo_url: '',
  hours: { mon:{open:'08:00',close:'23:00',closed:false},
           tue:{open:'08:00',close:'23:00',closed:false},
           wed:{open:'08:00',close:'23:00',closed:false},
           thu:{open:'08:00',close:'23:00',closed:false},
           fri:{open:'08:00',close:'23:00',closed:false},
           sat:{open:'08:00',close:'23:00',closed:false},
           sun:{open:'08:00',close:'23:00',closed:false} },
  receipt_footer_en: 'Thank you!',
  receipt_footer_ar: 'شكراً لزيارتكم'
};
const SECURITY_CFG_DEFAULT = {
  // auto_logout_minutes: 0 = manual only (Sprint 1 owner decision)
  auto_logout_minutes: 0,
  login_max_attempts: 5,
  login_lockout_minutes: 15
};

app.get('/api/admin/settings/store', requireAuth, (_req, res) => {
  res.json(readJsonSetting('store_info', STORE_INFO_DEFAULT));
});
app.put('/api/admin/settings/store', requireAuth, (req, res) => {
  const before = readJsonSetting('store_info', STORE_INFO_DEFAULT);
  const next = { ...before, ...(req.body || {}) };
  writeJsonSetting('store_info', next);
  writeAudit({
    actor: req.cashier,
    action: 'settings.store.update', target_type: 'settings', target_id: 'store_info',
    before, after: next, ip: req.ip
  });
  res.json({ success: true, value: next });
});

app.get('/api/admin/settings/security', requireAuth, (_req, res) => {
  res.json(readJsonSetting('security_config', SECURITY_CFG_DEFAULT));
});
app.put('/api/admin/settings/security', requireAuth, (req, res) => {
  const before = readJsonSetting('security_config', SECURITY_CFG_DEFAULT);
  const next = { ...before, ...(req.body || {}) };
  writeJsonSetting('security_config', next);
  writeAudit({
    actor: req.cashier,
    action: 'settings.security.update', target_type: 'settings', target_id: 'security_config',
    before, after: next, ip: req.ip
  });
  res.json({ success: true, value: next });
});

// ─── Sprint 1: audit log query (admin only, read-only — never deletable) ─────
app.get('/api/admin/audit', requireAuth, (req, res) => {
  const { from, to, actor_id, action, limit } = req.query;
  const where = [];
  const args = [];
  if (from)      { where.push('at >= ?'); args.push(parseInt(from,10) || 0); }
  if (to)        { where.push('at <= ?'); args.push(parseInt(to,10) || Date.now()); }
  if (actor_id)  { where.push('actor_id = ?'); args.push(parseInt(actor_id,10)); }
  if (action)    { where.push('action LIKE ?'); args.push(String(action) + '%'); }
  const cap = Math.min(parseInt(limit,10) || 200, 1000);
  const sql = `SELECT * FROM audit_log ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY at DESC LIMIT ${cap}`;
  const rows = db.prepare(sql).all(...args);
  res.json(rows.map(r => ({
    ...r,
    before: r.before_json ? safeJson(r.before_json) : null,
    after:  r.after_json  ? safeJson(r.after_json)  : null
  })));
});
function safeJson(s) { try { return JSON.parse(s); } catch (_) { return s; } }

// ─── Sprint 2.1: menu category CRUD (admin / owner-cashier) ──────────────────
// Permission: requires `menu_edit`. Owner-cashier passes via requireAuth's
// owner-token shortcut. Other roles must hold menu_edit explicitly.
function requireMenuEdit(req, res, next) {
  requireAuth(req, res, (err) => {
    if (err) return next(err);
    if (req.cashier?.permissions?.menu_edit !== true)
      return res.status(403).json({ error: 'permission_denied', missing: 'menu_edit' });
    next();
  });
}

app.get('/api/admin/menu/categories', requireAuth, (_req, res) => {
  const rows = db.prepare('SELECT * FROM menu_categories ORDER BY sort_order, name_en').all();
  res.json(rows.map(r => ({ ...r, active: r.active === 1 })));
});

// Reorder categories in bulk. Body: { order: [id1, id2, ...] }. Sort_order is
// reassigned in 100-step increments so future inserts have room to slot in.
// Must be defined BEFORE the PUT/:id route below — Express otherwise treats
// "reorder" as an :id param and lands on the wrong handler.
app.put('/api/admin/menu/categories/reorder', requireMenuEdit, (req, res) => {
  const order = Array.isArray(req.body?.order) ? req.body.order : null;
  if (!order || !order.length) return res.status(400).json({ error: 'invalid_order' });
  const ids = order.map(n => parseInt(n, 10));
  if (ids.some(n => !Number.isFinite(n))) return res.status(400).json({ error: 'invalid_order' });
  const rows = db.prepare(`SELECT id FROM menu_categories WHERE id IN (${ids.map(() => '?').join(',')})`).all(...ids);
  if (rows.length !== ids.length) return res.status(400).json({ error: 'unknown_ids' });
  const upd = db.prepare('UPDATE menu_categories SET sort_order=?, updated_at=? WHERE id=?');
  const now = Date.now();
  const tx = db.transaction(() => {
    ids.forEach((id, idx) => upd.run((idx + 1) * 100, now, id));
  });
  tx();
  writeAudit({
    actor: req.cashier,
    action: 'menu.category.reorder',
    target_type: 'menu_category',
    after: { order: ids },
    ip: req.ip
  });
  res.json({ success: true });
});

app.post('/api/admin/menu/categories', requireMenuEdit, (req, res) => {
  const { code, name_en, name_ar, name_ko, icon, color, sort_order, active } = req.body || {};
  if (!code || !/^[a-z0-9_-]{2,32}$/.test(String(code))) {
    return res.status(400).json({ error: 'invalid_code', detail: 'lowercase letters/digits/underscore/dash, 2–32 chars' });
  }
  if (!name_en || !String(name_en).trim()) {
    return res.status(400).json({ error: 'name_en_required' });
  }
  // Sprint 2.7+ (D): name_ar is required for the customer-facing customer site
  // (Iraq market is Arabic-first). Existing rows pre-validation may have empty
  // name_ar; PUT can patch them. New POSTs must include it.
  if (!name_ar || !String(name_ar).trim()) {
    return res.status(400).json({ error: 'name_ar_required' });
  }
  try {
    const now = Date.now();
    const r = db.prepare(`INSERT INTO menu_categories
      (code, name_en, name_ar, name_ko, icon, color, sort_order, active, created_at, updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?)`).run(
      String(code).trim(),
      String(name_en).trim(),
      String(name_ar).trim(),
      name_ko ? String(name_ko).trim() : '',
      icon ? String(icon).trim().slice(0, 8) : null,
      color || null,
      Number.isFinite(Number(sort_order)) ? Number(sort_order) : 100,
      active === false ? 0 : 1,
      now, now
    );
    writeAudit({
      actor: req.cashier,
      action: 'menu.category.create',
      target_type: 'menu_category',
      target_id: r.lastInsertRowid,
      after: { code, name_en, name_ar, name_ko, icon, color, sort_order },
      ip: req.ip
    });
    res.json({ success: true, id: r.lastInsertRowid });
  } catch (e) {
    if (String(e.message).includes('UNIQUE')) return res.status(400).json({ error: 'code_exists' });
    res.status(500).json({ error: 'create_failed' });
  }
});

app.put('/api/admin/menu/categories/:id', requireMenuEdit, (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'invalid_id' });
  const before = db.prepare('SELECT * FROM menu_categories WHERE id=?').get(id);
  if (!before) return res.status(404).json({ error: 'not_found' });
  // code is immutable — never updatable
  const { name_en, name_ar, name_ko, icon, color, sort_order, active } = req.body || {};
  if (name_en !== undefined && !String(name_en).trim())
    return res.status(400).json({ error: 'name_en_required' });
  // (D) name_ar can be patched but never to an empty string. Owners fixing the
  // legacy empty-name_ar rows must provide a real Arabic name.
  if (name_ar !== undefined && !String(name_ar).trim())
    return res.status(400).json({ error: 'name_ar_required' });
  db.prepare(`UPDATE menu_categories SET
    name_en    = COALESCE(?, name_en),
    name_ar    = COALESCE(?, name_ar),
    name_ko    = COALESCE(?, name_ko),
    icon       = COALESCE(?, icon),
    color      = COALESCE(?, color),
    sort_order = COALESCE(?, sort_order),
    active     = COALESCE(?, active),
    updated_at = ?
    WHERE id=?`).run(
    name_en !== undefined ? String(name_en).trim() : null,
    name_ar !== undefined ? String(name_ar).trim() : null,
    name_ko !== undefined ? String(name_ko).trim() : null,
    icon    !== undefined ? (icon ? String(icon).trim().slice(0, 8) : '') : null,
    color   !== undefined ? color   : null,
    sort_order !== undefined && Number.isFinite(Number(sort_order)) ? Number(sort_order) : null,
    active  !== undefined ? (active ? 1 : 0) : null,
    Date.now(), id
  );
  const after = db.prepare('SELECT * FROM menu_categories WHERE id=?').get(id);
  writeAudit({
    actor: req.cashier,
    action: 'menu.category.update',
    target_type: 'menu_category',
    target_id: id,
    before,
    after,
    ip: req.ip
  });
  res.json({ success: true });
});

app.delete('/api/admin/menu/categories/:id', requireMenuEdit, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const c = db.prepare('SELECT * FROM menu_categories WHERE id=?').get(id);
  if (!c) return res.status(404).json({ error: 'not_found' });
  // refuse delete if any menu_items_v2 rows reference this category
  const used = db.prepare('SELECT COUNT(*) AS n FROM menu_items_v2 WHERE category_id=?').get(id).n;
  if (used > 0) {
    const items = db.prepare('SELECT id, name_en, name_ar FROM menu_items_v2 WHERE category_id=? ORDER BY sort_order, name_en').all(id);
    return res.status(409).json({ error: 'category_in_use', items: used, item_list: items });
  }
  db.prepare('DELETE FROM menu_categories WHERE id=?').run(id);
  writeAudit({
    actor: req.cashier,
    action: 'menu.category.delete',
    target_type: 'menu_category',
    target_id: id,
    before: c,
    ip: req.ip
  });
  res.json({ success: true });
});

// Bulk-reassign all menu items from one category to another (or to NULL).
// Used by the warehouse UI when deleting a category that has items attached.
app.post('/api/admin/menu/categories/:id/move-items', requireMenuEdit, (req, res) => {
  const fromId = parseInt(req.params.id, 10);
  if (!Number.isFinite(fromId)) return res.status(400).json({ error: 'invalid_id' });
  const from = db.prepare('SELECT * FROM menu_categories WHERE id=?').get(fromId);
  if (!from) return res.status(404).json({ error: 'not_found' });
  const rawTo = req.body?.to_category_id;
  let toId = null;
  if (rawTo !== null && rawTo !== undefined && rawTo !== '') {
    toId = parseInt(rawTo, 10);
    if (!Number.isFinite(toId)) return res.status(400).json({ error: 'invalid_to_id' });
    if (toId === fromId) return res.status(400).json({ error: 'same_category' });
    const to = db.prepare('SELECT id FROM menu_categories WHERE id=?').get(toId);
    if (!to) return res.status(404).json({ error: 'to_not_found' });
  }
  const before = db.prepare('SELECT id, category_id FROM menu_items_v2 WHERE category_id=?').all(fromId);
  const result = db.prepare('UPDATE menu_items_v2 SET category_id=? WHERE category_id=?').run(toId, fromId);
  writeAudit({
    actor: req.cashier,
    action: 'menu.category.move_items',
    target_type: 'menu_category',
    target_id: fromId,
    before: { from_category_id: fromId, items: before.map(i => i.id) },
    after:  { to_category_id: toId, moved: result.changes },
    ip: req.ip
  });
  res.json({ success: true, moved: result.changes });
});

// Public read endpoint — used by index.html (customer site) and cashier order
// screen (Sprint 2.7). No permission gate: only returns active categories.
app.get('/api/menu/categories', (_req, res) => {
  const rows = db.prepare('SELECT id, code, name_en, name_ar, name_ko, icon, color, sort_order FROM menu_categories WHERE active=1 ORDER BY sort_order, name_en').all();
  res.json(rows);
});

// Sprint 2.7: single-shot public menu bundle for the cashier order screen and
// the customer-facing index.html. Returns everything needed to render menu UIs
// without requiring multiple API round-trips. No auth — only active rows leak.
//
// Response shape:
//   {
//     categories: [{id, code, name_en, name_ar, name_ko, color, sort_order}, ...],
//     items: [{
//       id, code, name_en, name_ar, name_ko, emoji, photo_url,
//       category_id, category_code, base_price, kind, sold_out, sort_order,
//       description, modifier_group_ids: [int],
//       components: [{item_id, code, name_en, ..., quantity}] | null
//     }, ...],
//     modifier_groups: [{id, code, name_en, name_ar, name_ko, selection,
//                        required, sort_order, options: [{id, code, ...,
//                        price_delta_iqd, is_default, sort_order}]}, ...]
//   }
app.get('/api/menu/public', (_req, res) => {
  const categories = db.prepare(`
    SELECT id, code, name_en, name_ar, name_ko, icon, color, sort_order
    FROM menu_categories WHERE active=1
    ORDER BY sort_order, name_en
  `).all();

  const itemRows = db.prepare(`
    SELECT i.*, c.code AS category_code
    FROM menu_items_v2 i
    LEFT JOIN menu_categories c ON c.id = i.category_id
    WHERE i.active = 1
    ORDER BY i.sort_order, i.name_en
  `).all();

  const items = itemRows.map(r => {
    const base = serializeMenuItem(r);
    base.modifier_group_ids = getItemModifierGroupIds(r.id);
    base.components = (r.kind === 'set') ? loadSetComponents(r.id) : null;
    return base;
  });

  const groupRows = db.prepare(`
    SELECT id FROM menu_modifier_groups ORDER BY sort_order, name_en
  `).all();
  const modifier_groups = groupRows.map(g => loadModifierGroup(g.id)).filter(Boolean);

  res.json({ categories, items, modifier_groups });
});

// ─── Sprint 2.2: menu item CRUD (single items; modifiers/sets in 2.3-2.5) ────
// Menu items live in menu_items_v2 (parallel to legacy hardcoded MENU array
// in pos-data.js). The two coexist until Sprint 2.7 imports the legacy data.
//
// Identity rules:
//   * id (PK) is the stable internal handle.
//   * code is a human-readable unique string used for cross-table refs and
//     can match a legacy SKU (e.g. 'C001'). code is editable until first sale.
//   * name_en/name_ar/name_ko all required (en + at least one localized).
//
// Permission: menu_edit. Owner-cashier passes via requireAuth shortcut.

function serializeMenuItem(row, opts = {}) {
  if (!row) return null;
  return {
    id: row.id,
    code: row.code,
    name_en: row.name_en,
    name_ar: row.name_ar,
    name_ko: row.name_ko,
    emoji: row.emoji,
    photo_url: row.photo_url,
    category_id: row.category_id,
    category_code: row.category_code || null,
    base_price: row.base_price,
    kind: row.kind,
    active: row.active === 1,
    sold_out: row.sold_out === 1,
    sort_order: row.sort_order,
    description: row.description,
    is_new: row.is_new === 1,
    is_best: row.is_best === 1,
    is_signature: row.is_signature === 1,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

app.get('/api/admin/menu/items', requireAuth, (req, res) => {
  const { category_id } = req.query;
  let sql = `SELECT i.*, c.code AS category_code FROM menu_items_v2 i
             LEFT JOIN menu_categories c ON c.id = i.category_id`;
  const args = [];
  if (category_id) {
    sql += ' WHERE i.category_id = ?';
    args.push(parseInt(category_id, 10));
  }
  sql += ' ORDER BY i.sort_order, i.name_en';
  const rows = db.prepare(sql).all(...args);
  res.json(rows.map(r => serializeMenuItem(r)));
});

app.get('/api/admin/menu/items/:id', requireAuth, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const row = db.prepare(`SELECT i.*, c.code AS category_code FROM menu_items_v2 i
                          LEFT JOIN menu_categories c ON c.id = i.category_id
                          WHERE i.id = ?`).get(id);
  if (!row) return res.status(404).json({ error: 'not_found' });
  res.json(serializeMenuItem(row));
});

app.post('/api/admin/menu/items', requireMenuEdit, (req, res) => {
  const {
    code, name_en, name_ar, name_ko, emoji, category_id,
    base_price, kind, active, sort_order, description,
    is_new, is_best, is_signature
  } = req.body || {};
  if (!code || !/^[A-Za-z0-9_]{2,32}$/.test(String(code))) {
    return res.status(400).json({ error: 'invalid_code', detail: 'letters/digits/underscore, 2–32 chars' });
  }
  if (!name_en || !String(name_en).trim()) return res.status(400).json({ error: 'name_en_required' });
  const price = Number(base_price);
  if (!Number.isFinite(price) || price < 0) return res.status(400).json({ error: 'invalid_price' });
  const safeKind = (kind === 'set') ? 'set' : 'single';

  // verify category if supplied
  let catId = null;
  if (category_id != null) {
    const c = db.prepare('SELECT id FROM menu_categories WHERE id=?').get(category_id);
    if (!c) return res.status(400).json({ error: 'invalid_category' });
    catId = c.id;
  }

  try {
    const now = Date.now();
    const r = db.prepare(`INSERT INTO menu_items_v2
      (code, name_en, name_ar, name_ko, emoji, category_id, base_price,
       kind, active, sold_out, sort_order, description,
       is_new, is_best, is_signature, created_at, updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,0,?,?,?,?,?,?,?)`).run(
      String(code).trim(),
      String(name_en).trim(),
      name_ar ? String(name_ar).trim() : '',
      name_ko ? String(name_ko).trim() : '',
      emoji || null,
      catId,
      price,
      safeKind,
      active === false ? 0 : 1,
      Number.isFinite(Number(sort_order)) ? Number(sort_order) : 100,
      description || null,
      is_new ? 1 : 0,
      is_best ? 1 : 0,
      is_signature ? 1 : 0,
      now, now
    );
    writeAudit({
      actor: req.cashier,
      action: 'menu.item.create',
      target_type: 'menu_item',
      target_id: r.lastInsertRowid,
      after: { code, name_en, base_price: price, category_id: catId, kind: safeKind },
      ip: req.ip
    });
    res.json({ success: true, id: r.lastInsertRowid });
  } catch (e) {
    if (String(e.message).includes('UNIQUE')) return res.status(400).json({ error: 'code_exists' });
    console.error('menu.item.create failed:', e);
    res.status(500).json({ error: 'create_failed' });
  }
});

app.put('/api/admin/menu/items/:id', requireMenuEdit, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const before = db.prepare('SELECT * FROM menu_items_v2 WHERE id=?').get(id);
  if (!before) return res.status(404).json({ error: 'not_found' });

  const {
    code, name_en, name_ar, name_ko, emoji, category_id,
    base_price, kind, active, sort_order, description,
    is_new, is_best, is_signature
  } = req.body || {};

  // code change allowed but must match the format and be unique
  let nextCode = before.code;
  if (code !== undefined && code !== before.code) {
    if (!/^[A-Za-z0-9_]{2,32}$/.test(String(code))) {
      return res.status(400).json({ error: 'invalid_code' });
    }
    const dup = db.prepare('SELECT id FROM menu_items_v2 WHERE code=? AND id<>?').get(code, id);
    if (dup) return res.status(400).json({ error: 'code_exists' });
    nextCode = String(code).trim();
  }
  if (name_en !== undefined && !String(name_en).trim())
    return res.status(400).json({ error: 'name_en_required' });
  let priceArg = null;
  if (base_price !== undefined) {
    const p = Number(base_price);
    if (!Number.isFinite(p) || p < 0) return res.status(400).json({ error: 'invalid_price' });
    priceArg = p;
  }
  let catId = before.category_id;
  if (category_id !== undefined) {
    if (category_id == null) catId = null;
    else {
      const c = db.prepare('SELECT id FROM menu_categories WHERE id=?').get(category_id);
      if (!c) return res.status(400).json({ error: 'invalid_category' });
      catId = c.id;
    }
  }

  db.prepare(`UPDATE menu_items_v2 SET
    code = ?,
    name_en      = COALESCE(?, name_en),
    name_ar      = COALESCE(?, name_ar),
    name_ko      = COALESCE(?, name_ko),
    emoji        = ?,
    category_id  = ?,
    base_price   = COALESCE(?, base_price),
    kind         = COALESCE(?, kind),
    active       = COALESCE(?, active),
    sort_order   = COALESCE(?, sort_order),
    description  = ?,
    is_new       = COALESCE(?, is_new),
    is_best      = COALESCE(?, is_best),
    is_signature = COALESCE(?, is_signature),
    updated_at   = ?
    WHERE id=?`).run(
    nextCode,
    name_en !== undefined ? String(name_en).trim() : null,
    name_ar !== undefined ? String(name_ar||'').trim() : null,
    name_ko !== undefined ? String(name_ko||'').trim() : null,
    emoji !== undefined ? (emoji || null) : before.emoji,
    catId,
    priceArg,
    kind !== undefined ? ((kind === 'set') ? 'set' : 'single') : null,
    active !== undefined ? (active ? 1 : 0) : null,
    sort_order !== undefined && Number.isFinite(Number(sort_order)) ? Number(sort_order) : null,
    description !== undefined ? (description || null) : before.description,
    is_new       !== undefined ? (is_new ? 1 : 0) : null,
    is_best      !== undefined ? (is_best ? 1 : 0) : null,
    is_signature !== undefined ? (is_signature ? 1 : 0) : null,
    Date.now(),
    id
  );
  const after = db.prepare('SELECT * FROM menu_items_v2 WHERE id=?').get(id);
  writeAudit({
    actor: req.cashier,
    action: 'menu.item.update',
    target_type: 'menu_item',
    target_id: id,
    before, after,
    ip: req.ip
  });
  res.json({ success: true });
});

// Sold-out toggle — separate endpoint so cashiers (with menu_sold_out_toggle
// permission) can flip it without holding full menu_edit.
app.post('/api/admin/menu/items/:id/sold-out', requireCashierOrAdmin, (req, res) => {
  if (req.cashier?.permissions?.menu_sold_out_toggle !== true) {
    return res.status(403).json({ error: 'permission_denied', missing: 'menu_sold_out_toggle' });
  }
  const id = parseInt(req.params.id, 10);
  const before = db.prepare('SELECT * FROM menu_items_v2 WHERE id=?').get(id);
  if (!before) return res.status(404).json({ error: 'not_found' });
  const { sold_out } = req.body || {};
  const next = sold_out ? 1 : 0;
  db.prepare('UPDATE menu_items_v2 SET sold_out=?, updated_at=? WHERE id=?').run(next, Date.now(), id);
  writeAudit({
    actor: req.cashier,
    action: 'menu.item.sold_out',
    target_type: 'menu_item',
    target_id: id,
    before: { sold_out: before.sold_out === 1 },
    after:  { sold_out: next === 1 },
    ip: req.ip
  });
  // SSE broadcast so all connected cashier screens update instantly
  try { broadcastSSE({ type: 'menu_item_sold_out', id, sold_out: next === 1 }); } catch (_) {}
  res.json({ success: true, sold_out: next === 1 });
});

// Photo upload (multipart) — replaces existing photo_url and removes the old
// file if it lived inside UPLOAD_DIR.
app.post('/api/admin/menu/items/:id/photo', requireMenuEdit, menuItemImageUpload.single('photo'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'no_file' });
  const id = parseInt(req.params.id, 10);
  const before = db.prepare('SELECT * FROM menu_items_v2 WHERE id=?').get(id);
  if (!before) {
    try { fs.unlinkSync(req.file.path); } catch (_) {}
    return res.status(404).json({ error: 'not_found' });
  }
  // delete old photo if it lives in UPLOAD_DIR (path traversal guard)
  if (before.photo_url) {
    try {
      const oldPath = path.resolve(UPLOAD_DIR, path.basename(before.photo_url));
      if (oldPath.startsWith(path.resolve(UPLOAD_DIR)) && fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    } catch (_) {}
  }
  const newUrl = '/uploads/' + req.file.filename;
  db.prepare('UPDATE menu_items_v2 SET photo_url=?, updated_at=? WHERE id=?').run(newUrl, Date.now(), id);
  writeAudit({
    actor: req.cashier,
    action: 'menu.item.photo',
    target_type: 'menu_item',
    target_id: id,
    after: { photo_url: newUrl },
    ip: req.ip
  });
  res.json({ success: true, photo_url: newUrl });
});

app.delete('/api/admin/menu/items/:id/photo', requireMenuEdit, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const before = db.prepare('SELECT * FROM menu_items_v2 WHERE id=?').get(id);
  if (!before) return res.status(404).json({ error: 'not_found' });
  if (before.photo_url) {
    try {
      const p = path.resolve(UPLOAD_DIR, path.basename(before.photo_url));
      if (p.startsWith(path.resolve(UPLOAD_DIR)) && fs.existsSync(p)) fs.unlinkSync(p);
    } catch (_) {}
  }
  db.prepare('UPDATE menu_items_v2 SET photo_url=NULL, updated_at=? WHERE id=?').run(Date.now(), id);
  writeAudit({
    actor: req.cashier,
    action: 'menu.item.photo.delete',
    target_type: 'menu_item',
    target_id: id,
    ip: req.ip
  });
  res.json({ success: true });
});

app.delete('/api/admin/menu/items/:id', requireMenuEdit, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const before = db.prepare('SELECT * FROM menu_items_v2 WHERE id=?').get(id);
  if (!before) return res.status(404).json({ error: 'not_found' });
  // remove photo file if any
  if (before.photo_url) {
    try {
      const p = path.resolve(UPLOAD_DIR, path.basename(before.photo_url));
      if (p.startsWith(path.resolve(UPLOAD_DIR)) && fs.existsSync(p)) fs.unlinkSync(p);
    } catch (_) {}
  }
  db.prepare('DELETE FROM menu_items_v2 WHERE id=?').run(id);
  writeAudit({
    actor: req.cashier,
    action: 'menu.item.delete',
    target_type: 'menu_item',
    target_id: id,
    before,
    ip: req.ip
  });
  res.json({ success: true });
});

// Public read — active items only, with category code joined for client filter.
app.get('/api/menu/items', (_req, res) => {
  const rows = db.prepare(`
    SELECT i.id, i.code, i.name_en, i.name_ar, i.name_ko, i.emoji, i.photo_url,
           i.category_id, c.code AS category_code, i.base_price, i.kind,
           i.sold_out, i.sort_order, i.description
    FROM menu_items_v2 i
    LEFT JOIN menu_categories c ON c.id = i.category_id
    WHERE i.active = 1
    ORDER BY i.sort_order, i.name_en
  `).all();
  res.json(rows.map(r => ({ ...r, sold_out: r.sold_out === 1 })));
});

// ─── Sprint 2.3: modifier groups + options CRUD ──────────────────────────────
// Each group has many options. Groups are reusable across many items
// (the M:N table `menu_item_modifiers` is wired in Sprint 2.4).
//
// Helper: load a group with nested options (single query each, kept simple).
function loadModifierGroup(id) {
  const g = db.prepare('SELECT * FROM menu_modifier_groups WHERE id=?').get(id);
  if (!g) return null;
  const opts = db.prepare(`SELECT id, code, name_en, name_ar, name_ko,
    price_delta_iqd, is_default, sort_order
    FROM menu_modifier_options WHERE group_id=? ORDER BY sort_order, name_en`).all(id);
  return {
    ...g,
    required: g.required === 1,
    options: opts.map(o => ({ ...o, is_default: o.is_default === 1 }))
  };
}

app.get('/api/admin/menu/modifier-groups', requireAuth, (_req, res) => {
  const groups = db.prepare('SELECT id FROM menu_modifier_groups ORDER BY sort_order, name_en').all();
  res.json(groups.map(g => loadModifierGroup(g.id)));
});

// Reorder modifier groups in bulk. Must be defined BEFORE PUT/:id below.
app.put('/api/admin/menu/modifier-groups/reorder', requireMenuEdit, (req, res) => {
  const order = Array.isArray(req.body?.order) ? req.body.order : null;
  if (!order || !order.length) return res.status(400).json({ error: 'invalid_order' });
  const ids = order.map(n => parseInt(n, 10));
  if (ids.some(n => !Number.isFinite(n))) return res.status(400).json({ error: 'invalid_order' });
  const rows = db.prepare(`SELECT id FROM menu_modifier_groups WHERE id IN (${ids.map(() => '?').join(',')})`).all(...ids);
  if (rows.length !== ids.length) return res.status(400).json({ error: 'unknown_ids' });
  const upd = db.prepare('UPDATE menu_modifier_groups SET sort_order=?, updated_at=? WHERE id=?');
  const now = Date.now();
  const tx = db.transaction(() => {
    ids.forEach((id, idx) => upd.run((idx + 1) * 100, now, id));
  });
  tx();
  writeAudit({
    actor: req.cashier,
    action: 'menu.modifier_group.reorder',
    target_type: 'menu_modifier_group',
    after: { order: ids },
    ip: req.ip
  });
  res.json({ success: true });
});

app.get('/api/admin/menu/modifier-groups/:id', requireAuth, (req, res) => {
  const g = loadModifierGroup(parseInt(req.params.id, 10));
  if (!g) return res.status(404).json({ error: 'not_found' });
  res.json(g);
});

app.post('/api/admin/menu/modifier-groups', requireMenuEdit, (req, res) => {
  const { code, name_en, name_ar, name_ko, selection, required, sort_order } = req.body || {};
  if (!code || !/^[a-z0-9_]{2,32}$/.test(String(code)))
    return res.status(400).json({ error: 'invalid_code' });
  if (!name_en || !String(name_en).trim()) return res.status(400).json({ error: 'name_en_required' });
  const sel = (selection === 'multi') ? 'multi' : 'single';
  try {
    const now = Date.now();
    const r = db.prepare(`INSERT INTO menu_modifier_groups
      (code, name_en, name_ar, name_ko, selection, required, sort_order, created_at, updated_at)
      VALUES (?,?,?,?,?,?,?,?,?)`).run(
      String(code).trim(), String(name_en).trim(),
      name_ar ? String(name_ar).trim() : '', name_ko ? String(name_ko).trim() : '',
      sel, required ? 1 : 0,
      Number.isFinite(Number(sort_order)) ? Number(sort_order) : 100,
      now, now
    );
    writeAudit({
      actor: req.cashier,
      action: 'menu.modifier_group.create',
      target_type: 'menu_modifier_group',
      target_id: r.lastInsertRowid,
      after: { code, name_en, selection: sel, required: !!required },
      ip: req.ip
    });
    res.json({ success: true, id: r.lastInsertRowid });
  } catch (e) {
    if (String(e.message).includes('UNIQUE')) return res.status(400).json({ error: 'code_exists' });
    res.status(500).json({ error: 'create_failed' });
  }
});

app.put('/api/admin/menu/modifier-groups/:id', requireMenuEdit, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const before = db.prepare('SELECT * FROM menu_modifier_groups WHERE id=?').get(id);
  if (!before) return res.status(404).json({ error: 'not_found' });
  const { name_en, name_ar, name_ko, selection, required, sort_order } = req.body || {};
  if (name_en !== undefined && !String(name_en).trim())
    return res.status(400).json({ error: 'name_en_required' });
  const sel = selection !== undefined ? ((selection === 'multi') ? 'multi' : 'single') : null;
  db.prepare(`UPDATE menu_modifier_groups SET
    name_en    = COALESCE(?, name_en),
    name_ar    = COALESCE(?, name_ar),
    name_ko    = COALESCE(?, name_ko),
    selection  = COALESCE(?, selection),
    required   = COALESCE(?, required),
    sort_order = COALESCE(?, sort_order),
    updated_at = ?
    WHERE id=?`).run(
    name_en !== undefined ? String(name_en).trim() : null,
    name_ar !== undefined ? String(name_ar||'').trim() : null,
    name_ko !== undefined ? String(name_ko||'').trim() : null,
    sel,
    required !== undefined ? (required ? 1 : 0) : null,
    sort_order !== undefined && Number.isFinite(Number(sort_order)) ? Number(sort_order) : null,
    Date.now(), id
  );
  const after = db.prepare('SELECT * FROM menu_modifier_groups WHERE id=?').get(id);
  writeAudit({
    actor: req.cashier,
    action: 'menu.modifier_group.update',
    target_type: 'menu_modifier_group',
    target_id: id,
    before, after,
    ip: req.ip
  });
  res.json({ success: true });
});

app.delete('/api/admin/menu/modifier-groups/:id', requireMenuEdit, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const before = db.prepare('SELECT * FROM menu_modifier_groups WHERE id=?').get(id);
  if (!before) return res.status(404).json({ error: 'not_found' });
  // refuse if any item references this group
  const used = db.prepare('SELECT COUNT(*) AS n FROM menu_item_modifiers WHERE group_id=?').get(id).n;
  if (used > 0) return res.status(409).json({ error: 'group_in_use', items: used });
  db.prepare('DELETE FROM menu_modifier_groups WHERE id=?').run(id); // CASCADE deletes options
  writeAudit({
    actor: req.cashier,
    action: 'menu.modifier_group.delete',
    target_type: 'menu_modifier_group',
    target_id: id,
    before,
    ip: req.ip
  });
  res.json({ success: true });
});


// ─── modifier OPTIONS (nested under a group) ─────────────────────────────────
app.post('/api/admin/menu/modifier-groups/:gid/options', requireMenuEdit, (req, res) => {
  const gid = parseInt(req.params.gid, 10);
  const g = db.prepare('SELECT id FROM menu_modifier_groups WHERE id=?').get(gid);
  if (!g) return res.status(404).json({ error: 'group_not_found' });
  const { code, name_en, name_ar, name_ko, price_delta_iqd, is_default, sort_order } = req.body || {};
  if (!code || !/^[a-z0-9_]{1,32}$/.test(String(code)))
    return res.status(400).json({ error: 'invalid_code' });
  if (!name_en || !String(name_en).trim()) return res.status(400).json({ error: 'name_en_required' });
  const delta = Math.floor(Number(price_delta_iqd) || 0);
  if (!Number.isFinite(delta)) return res.status(400).json({ error: 'invalid_price' });
  try {
    const r = db.prepare(`INSERT INTO menu_modifier_options
      (group_id, code, name_en, name_ar, name_ko, price_delta_iqd, is_default, sort_order)
      VALUES (?,?,?,?,?,?,?,?)`).run(
      gid, String(code).trim(), String(name_en).trim(),
      name_ar ? String(name_ar).trim() : '', name_ko ? String(name_ko).trim() : '',
      delta, is_default ? 1 : 0,
      Number.isFinite(Number(sort_order)) ? Number(sort_order) : 100
    );
    writeAudit({
      actor: req.cashier,
      action: 'menu.modifier_option.create',
      target_type: 'menu_modifier_option',
      target_id: r.lastInsertRowid,
      after: { group_id: gid, code, name_en, price_delta_iqd: delta },
      ip: req.ip
    });
    res.json({ success: true, id: r.lastInsertRowid });
  } catch (e) {
    if (String(e.message).includes('UNIQUE')) return res.status(400).json({ error: 'code_exists' });
    res.status(500).json({ error: 'create_failed' });
  }
});

app.put('/api/admin/menu/modifier-options/:id', requireMenuEdit, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const before = db.prepare('SELECT * FROM menu_modifier_options WHERE id=?').get(id);
  if (!before) return res.status(404).json({ error: 'not_found' });
  const { name_en, name_ar, name_ko, price_delta_iqd, is_default, sort_order } = req.body || {};
  if (name_en !== undefined && !String(name_en).trim())
    return res.status(400).json({ error: 'name_en_required' });
  let deltaArg = null;
  if (price_delta_iqd !== undefined) {
    const d = Math.floor(Number(price_delta_iqd));
    if (!Number.isFinite(d)) return res.status(400).json({ error: 'invalid_price' });
    deltaArg = d;
  }
  db.prepare(`UPDATE menu_modifier_options SET
    name_en         = COALESCE(?, name_en),
    name_ar         = COALESCE(?, name_ar),
    name_ko         = COALESCE(?, name_ko),
    price_delta_iqd = COALESCE(?, price_delta_iqd),
    is_default      = COALESCE(?, is_default),
    sort_order      = COALESCE(?, sort_order)
    WHERE id=?`).run(
    name_en !== undefined ? String(name_en).trim() : null,
    name_ar !== undefined ? String(name_ar||'').trim() : null,
    name_ko !== undefined ? String(name_ko||'').trim() : null,
    deltaArg,
    is_default !== undefined ? (is_default ? 1 : 0) : null,
    sort_order !== undefined && Number.isFinite(Number(sort_order)) ? Number(sort_order) : null,
    id
  );
  const after = db.prepare('SELECT * FROM menu_modifier_options WHERE id=?').get(id);
  writeAudit({
    actor: req.cashier,
    action: 'menu.modifier_option.update',
    target_type: 'menu_modifier_option',
    target_id: id,
    before, after,
    ip: req.ip
  });
  res.json({ success: true });
});

app.delete('/api/admin/menu/modifier-options/:id', requireMenuEdit, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const before = db.prepare('SELECT * FROM menu_modifier_options WHERE id=?').get(id);
  if (!before) return res.status(404).json({ error: 'not_found' });
  db.prepare('DELETE FROM menu_modifier_options WHERE id=?').run(id);
  writeAudit({
    actor: req.cashier,
    action: 'menu.modifier_option.delete',
    target_type: 'menu_modifier_option',
    target_id: id,
    before,
    ip: req.ip
  });
  res.json({ success: true });
});

// Reorder options within a group in bulk. Body: { order: [id1, id2, ...] }.
// All ids must belong to the same group_id (gid).
app.put('/api/admin/menu/modifier-groups/:gid/options/reorder', requireMenuEdit, (req, res) => {
  const gid = parseInt(req.params.gid, 10);
  const g = db.prepare('SELECT id FROM menu_modifier_groups WHERE id=?').get(gid);
  if (!g) return res.status(404).json({ error: 'group_not_found' });
  const order = Array.isArray(req.body?.order) ? req.body.order : null;
  if (!order || !order.length) return res.status(400).json({ error: 'invalid_order' });
  const ids = order.map(n => parseInt(n, 10));
  if (ids.some(n => !Number.isFinite(n))) return res.status(400).json({ error: 'invalid_order' });
  const rows = db.prepare(`SELECT id FROM menu_modifier_options WHERE group_id=? AND id IN (${ids.map(() => '?').join(',')})`).all(gid, ...ids);
  if (rows.length !== ids.length) return res.status(400).json({ error: 'unknown_or_foreign_ids' });
  const upd = db.prepare('UPDATE menu_modifier_options SET sort_order=? WHERE id=?');
  const tx = db.transaction(() => {
    ids.forEach((id, idx) => upd.run((idx + 1) * 100, id));
  });
  tx();
  writeAudit({
    actor: req.cashier,
    action: 'menu.modifier_option.reorder',
    target_type: 'menu_modifier_option',
    target_id: gid,
    after: { group_id: gid, order: ids },
    ip: req.ip
  });
  res.json({ success: true });
});

// Public — used by order screen to render option pickers.
app.get('/api/menu/modifier-groups', (_req, res) => {
  const groups = db.prepare('SELECT id FROM menu_modifier_groups ORDER BY sort_order, name_en').all();
  res.json(groups.map(g => loadModifierGroup(g.id)));
});

// ─── Sprint 2.4: menu item ↔ modifier group assignment (M:N) ─────────────────
// Each menu item can be associated with any number of modifier groups.
// The set of attached groups is replaced atomically per PUT call.
//
// Public reads embed attached groups inside the item record so the order
// screen can render the option picker without a second roundtrip.

function getItemModifierGroupIds(itemId) {
  return db.prepare('SELECT group_id FROM menu_item_modifiers WHERE item_id=? ORDER BY sort_order').all(itemId).map(r => r.group_id);
}

app.get('/api/admin/menu/items/:id/modifier-groups', requireAuth, (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!db.prepare('SELECT id FROM menu_items_v2 WHERE id=?').get(id))
    return res.status(404).json({ error: 'not_found' });
  const ids = getItemModifierGroupIds(id);
  res.json({ item_id: id, group_ids: ids });
});

app.put('/api/admin/menu/items/:id/modifier-groups', requireMenuEdit, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const item = db.prepare('SELECT id FROM menu_items_v2 WHERE id=?').get(id);
  if (!item) return res.status(404).json({ error: 'not_found' });

  const body = req.body || {};
  const incoming = Array.isArray(body.group_ids) ? body.group_ids : null;
  if (!incoming) return res.status(400).json({ error: 'group_ids_required' });

  // sanitize: every id must reference a real group; preserve order
  const cleanIds = [];
  const seen = new Set();
  for (const raw of incoming) {
    const gid = parseInt(raw, 10);
    if (!Number.isFinite(gid) || seen.has(gid)) continue;
    const exists = db.prepare('SELECT id FROM menu_modifier_groups WHERE id=?').get(gid);
    if (!exists) return res.status(400).json({ error: 'invalid_group_id', group_id: gid });
    cleanIds.push(gid);
    seen.add(gid);
  }

  const before = getItemModifierGroupIds(id);
  const tx = db.transaction(() => {
    db.prepare('DELETE FROM menu_item_modifiers WHERE item_id=?').run(id);
    const ins = db.prepare('INSERT INTO menu_item_modifiers (item_id, group_id, sort_order) VALUES (?,?,?)');
    cleanIds.forEach((gid, idx) => ins.run(id, gid, (idx + 1) * 10));
  });
  tx();

  writeAudit({
    actor: req.cashier,
    action: 'menu.item.modifier_groups',
    target_type: 'menu_item',
    target_id: id,
    before: { group_ids: before },
    after:  { group_ids: cleanIds },
    ip: req.ip
  });

  res.json({ success: true, group_ids: cleanIds });
});

// Public — return one item with its attached modifier groups (and nested options).
app.get('/api/menu/items/:id/full', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const i = db.prepare(`
    SELECT i.id, i.code, i.name_en, i.name_ar, i.name_ko, i.emoji, i.photo_url,
           i.category_id, c.code AS category_code, i.base_price, i.kind,
           i.sold_out, i.sort_order, i.description, i.active
    FROM menu_items_v2 i
    LEFT JOIN menu_categories c ON c.id = i.category_id
    WHERE i.id = ?
  `).get(id);
  if (!i || i.active !== 1) return res.status(404).json({ error: 'not_found' });
  const groupIds = getItemModifierGroupIds(id);
  const groups = groupIds.map(gid => loadModifierGroup(gid)).filter(Boolean);
  // Sprint 2.5: include set components if this is a set
  let components = null;
  if (i.kind === 'set') components = loadSetComponents(id);
  res.json({ ...i, sold_out: i.sold_out === 1, modifier_groups: groups, components });
});

// ─── Sprint 2.5: set / combo components ──────────────────────────────────────
// A set item (menu_items_v2.kind='set') has a fixed price (base_price). Its
// components are other menu_items_v2 rows joined via menu_set_components.
// Components serve two purposes:
//   1. Display on the order screen so the customer/staff sees what's included.
//   2. Inventory: when a set is sold, each component's recipe should be
//      consumed (wired up in Sprint 2.7 alongside MENU migration).
//
// Validation rules:
//   * The host item MUST have kind='set' to receive components.
//   * A component cannot be a 'set' (no nested sets).
//   * A component cannot be the host itself (no self-loops).

function loadSetComponents(setId) {
  return db.prepare(`
    SELECT sc.component_item_id AS item_id, sc.quantity, sc.sort_order,
           i.code, i.name_en, i.name_ar, i.name_ko, i.emoji, i.photo_url,
           i.base_price, i.sold_out
    FROM menu_set_components sc
    JOIN menu_items_v2 i ON i.id = sc.component_item_id
    WHERE sc.set_item_id = ?
    ORDER BY sc.sort_order
  `).all(setId).map(r => ({ ...r, sold_out: r.sold_out === 1 }));
}

app.get('/api/admin/menu/items/:id/set-components', requireAuth, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const item = db.prepare('SELECT id, kind FROM menu_items_v2 WHERE id=?').get(id);
  if (!item) return res.status(404).json({ error: 'not_found' });
  res.json({ item_id: id, kind: item.kind, components: loadSetComponents(id) });
});

// PUT replaces the full component list atomically (mirrors the modifier-groups
// endpoint pattern from 2.4 — cleaner than per-row CRUD for an admin UI).
app.put('/api/admin/menu/items/:id/set-components', requireMenuEdit, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const item = db.prepare('SELECT id, kind FROM menu_items_v2 WHERE id=?').get(id);
  if (!item) return res.status(404).json({ error: 'not_found' });
  if (item.kind !== 'set') return res.status(400).json({ error: 'not_a_set', detail: 'item.kind must be "set" first' });

  const body = req.body || {};
  if (!Array.isArray(body.components))
    return res.status(400).json({ error: 'components_required' });

  const clean = [];
  const seen = new Set();
  for (const c of body.components) {
    const compId = parseInt(c?.item_id ?? c?.component_item_id, 10);
    const qty = Math.max(1, Math.floor(Number(c?.quantity) || 1));
    if (!Number.isFinite(compId)) continue;
    if (compId === id) return res.status(400).json({ error: 'self_loop', detail: 'set cannot include itself' });
    if (seen.has(compId)) continue;
    const comp = db.prepare('SELECT id, kind FROM menu_items_v2 WHERE id=?').get(compId);
    if (!comp) return res.status(400).json({ error: 'invalid_component', component_id: compId });
    if (comp.kind === 'set') return res.status(400).json({ error: 'nested_set_forbidden', component_id: compId });
    clean.push({ component_id: compId, quantity: qty });
    seen.add(compId);
  }

  const before = loadSetComponents(id);
  const tx = db.transaction(() => {
    db.prepare('DELETE FROM menu_set_components WHERE set_item_id=?').run(id);
    const ins = db.prepare('INSERT INTO menu_set_components (set_item_id, component_item_id, quantity, sort_order) VALUES (?,?,?,?)');
    clean.forEach((c, idx) => ins.run(id, c.component_id, c.quantity, (idx + 1) * 10));
  });
  tx();

  const after = loadSetComponents(id);
  writeAudit({
    actor: req.cashier,
    action: 'menu.item.set_components',
    target_type: 'menu_item',
    target_id: id,
    before: { components: before.map(c => ({ id: c.item_id, qty: c.quantity })) },
    after:  { components: after.map(c  => ({ id: c.item_id, qty: c.quantity })) },
    ip: req.ip
  });

  res.json({ success: true, components: after });
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
app.post('/api/customers/register', registerLimiter, (req, res) => {
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
app.post('/api/customers/login', loginLimiter, (req, res) => {
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

// حماية ضد التلاعب بالأسعار من جانب العميل: يحسب الخادم الحد الأقصى للإجمالي
// from menu_prices table. Items not in table fall back to client price capped at MAX_UNIT_PRICE.
const MAX_UNIT_PRICE = 1_000_000; // IQD per unit hard cap (anti-overflow)
const TAX_RATE = 0.10;
function getServerExpectedTotal(items) {
  if (!Array.isArray(items) || items.length === 0) return { expected: 0, ok: false };

  const priceRows = db.prepare('SELECT menu_item, selling_price FROM menu_prices').all();
  const priceMap = new Map();
  for (const r of priceRows) priceMap.set(r.menu_item, Number(r.selling_price) || 0);

  const getV2ById   = db.prepare('SELECT base_price FROM menu_items_v2 WHERE id=?');
  const getV2ByCode = db.prepare('SELECT base_price FROM menu_items_v2 WHERE code=?');
  const getV2ByName = db.prepare('SELECT base_price FROM menu_items_v2 WHERE name_en=? OR name_ko=? OR name_ar=? LIMIT 1');

  function resolveBasePrice(it) {
    // base_price=0 in menu_items_v2 is treated as "price not configured" so we
    // fall through to client/menu_prices instead of locking the order to 0.
    if (it.menu_item_id != null) {
      const r = getV2ById.get(parseInt(it.menu_item_id, 10));
      const p = Number(r && r.base_price) || 0;
      if (p > 0) return p;
    }
    if (it.code) {
      const r = getV2ByCode.get(String(it.code));
      const p = Number(r && r.base_price) || 0;
      if (p > 0) return p;
    }
    if (it.name) {
      const r = getV2ByName.get(it.name, it.name, it.name);
      const p = Number(r && r.base_price) || 0;
      if (p > 0) return p;
      if (priceMap.has(it.name)) {
        const mp = Number(priceMap.get(it.name)) || 0;
        if (mp > 0) return mp;
      }
    }
    // last resort: trust client price, capped
    return Math.max(0, Math.min(MAX_UNIT_PRICE, Number(it && (it.price ?? it.p)) || 0));
  }

  function resolveModifierDelta(it) {
    const raw = Array.isArray(it.modifier_option_ids) ? it.modifier_option_ids
              : Array.isArray(it.modifiers) ? it.modifiers
              : [];
    if (!raw.length) return 0;
    const ids = raw.map(x => parseInt(x, 10)).filter(Number.isFinite);
    if (!ids.length) return 0;
    const placeholders = ids.map(() => '?').join(',');
    const row = db.prepare(
      `SELECT COALESCE(SUM(price_delta_iqd),0) AS s FROM menu_modifier_options WHERE id IN (${placeholders})`
    ).get(...ids);
    return Number(row?.s) || 0;
  }

  let subtotal = 0;
  for (const it of items) {
    const qty = Math.max(0, Math.floor(Number(it && (it.qty ?? it.q ?? it.quantity)) || 0));
    if (qty <= 0) continue;
    const base = resolveBasePrice(it);
    const delta = resolveModifierDelta(it);
    const unitPrice = Math.max(0, Math.min(MAX_UNIT_PRICE, base + delta));
    subtotal += unitPrice * qty;
  }
  const tax = Math.round(subtotal * TAX_RATE);
  const expected = subtotal + tax;
  return { expected, subtotal, tax, ok: true };
}

// إنشاء طلب (الموقع → الخادم)
app.post('/api/orders', orderLimiter, optionalCustomer, (req, res) => {
  let { type, tableNum, customerName, customerPhone, arrivalTime, items, total, source,
        discount_kind, discount_value, manager_override } = req.body;
  if (!type || !items?.length || total == null)
    return res.status(400).json({ error: 'Invalid order data / بيانات الطلب غير صحيحة' });

  // CRITICAL: server-side price validation. Reject if client total exceeds the
  // maximum total computed from menu_prices. Allow legitimate discounts (total < expected).
  const numericTotal = Number(total);
  if (!Number.isFinite(numericTotal) || numericTotal < 0)
    return res.status(400).json({ error: 'Invalid total / إجمالي غير صالح' });
  const { expected: serverExpected, subtotal: serverSubtotal } = getServerExpectedTotal(items);
  if (numericTotal > serverExpected + 1) {
    return res.status(400).json({ error: 'PRICE_MISMATCH', expected: serverExpected, received: numericTotal });
  }
  total = numericTotal;
  source = (source === 'online') ? 'online' : 'cashier';
  if (type === 'pickup' && !arrivalTime)
    return res.status(400).json({ error: 'Pickup orders require an arrival time / طلبات الاستلام تتطلب وقت الوصول' });

  // Resolve cashier identity for this request — needed for both QR fallback and
  // Sprint 1.5 discount permission check. Returns either { cashier, isAdmin } or null.
  function resolveCashierFromHeaders() {
    const adminToken = req.headers['x-auth-token'];
    if (adminToken) {
      const row = db.prepare('SELECT created_at FROM admin_sessions WHERE token=?').get(adminToken);
      if (row && Date.now() - row.created_at <= ADMIN_SESSION_TTL) {
        return { cashier: { id: 0, name: 'Admin', role: 'owner', permissions: getOwnerPermissions(), isAdmin: true } };
      }
    }
    const cashierToken = req.headers['x-cashier-token'];
    if (cashierToken) {
      const row = db.prepare('SELECT cs.*, c.id as cid, c.name, c.role, c.role_id FROM cashier_sessions cs JOIN cashiers c ON c.id=cs.cashier_id WHERE cs.token=?').get(cashierToken);
      if (row && (Date.now() - row.created_at) <= CASHIER_SESSION_TTL) {
        const ctx = resolveCashierContext(row);
        return { cashier: { id: row.cid, name: row.name, role: ctx.role, role_id: ctx.role_id, permissions: ctx.permissions, isAdmin: false } };
      }
    }
    return null;
  }
  const authCtx = resolveCashierFromHeaders();
  const isCashierOrAdmin = !!authCtx;

  if (type === 'dine' && !isCashierOrAdmin) {
    const { dineSessionToken } = req.body;
    if (!dineSessionToken) return res.status(403).json({ error: 'QR_REQUIRED' });
    const session = db.prepare('SELECT * FROM dine_sessions WHERE session_token=?').get(dineSessionToken);
    if (!session) return res.status(403).json({ error: 'QR_INVALID' });
    if (session.expires_at < Date.now()) return res.status(403).json({ error: 'QR_EXPIRED' });
  }

  // ── Sprint 1.5: discount permission gating (cashier orders only) ───────
  let discountAuditPayload = null;
  if (isCashierOrAdmin && discount_kind && Number(discount_value) > 0) {
    const actor = authCtx.cashier;
    const kind = (discount_kind === 'fixed') ? 'fixed' : 'percent';
    const value = Number(discount_value);

    // determine permission keys involved
    const boolKey  = (kind === 'fixed') ? 'discount_fixed'        : 'discount_percent';
    const limitKey = (kind === 'fixed') ? 'discount_fixed_max_iqd' : 'discount_percent_max';

    const actorAllowed = actor.permissions?.[boolKey] === true;
    const actorLimit   = Number(actor.permissions?.[limitKey]) || 0;
    const dailyLimit   = Number(actor.permissions?.discount_daily_count_limit) || 0;

    // count today's discount audit_log entries for this actor
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const todayCount = db.prepare(
      "SELECT COUNT(*) AS c FROM audit_log WHERE actor_id=? AND action='order.discount_applied' AND at>=?"
    ).get(actor.id || 0, startOfDay.getTime()).c;

    const overflowsValue = value > actorLimit;
    const overflowsCount = todayCount >= dailyLimit;
    const needsManager   = !actorAllowed || overflowsValue || overflowsCount;

    let approver = null;
    let reason   = null;
    if (needsManager) {
      if (!manager_override || !manager_override.name || !manager_override.password) {
        return res.status(403).json({
          error: 'permission_denied',
          missing: boolKey,
          reason: !actorAllowed ? 'no_permission' : (overflowsValue ? 'limit_exceeded' : 'daily_count_exceeded'),
          actor_limit: actorLimit,
          today_count: todayCount,
          daily_limit: dailyLimit,
          value: value,
          kind: kind
        });
      }
      if (!manager_override.reason || !String(manager_override.reason).trim()) {
        return res.status(400).json({ error: 'reason_required' });
      }
      const v = validateManagerOverride({
        manager_name: manager_override.name,
        manager_password: manager_override.password,
        required_perm: boolKey
      });
      if (!v.ok) return res.status(401).json({ error: v.error });
      const mgrRow = db.prepare('SELECT * FROM cashiers WHERE id=?').get(v.approver.id);
      const mgrCtx = resolveCashierContext(mgrRow);
      const mgrLimit = Number(mgrCtx.permissions?.[limitKey]) || 0;
      if (value > mgrLimit) {
        return res.status(403).json({ error: 'manager_limit_exceeded', approver_limit: mgrLimit, value });
      }
      approver = v.approver;
      reason   = String(manager_override.reason).trim();
    }
    discountAuditPayload = { actor, approver, reason, kind, value };
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
      const id = Date.now().toString(36) + crypto.randomBytes(8).toString('hex');
      db.prepare(`
        INSERT INTO orders (id, num, timestamp, status, type, table_num, customer_name, customer_phone, arrival_time, items, total, customer_id, source)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
      `).run(id, num, Date.now(), 'new', type,
        tableNum || null, customerName || null, customerPhone || null,
        arrivalTime || null, JSON.stringify(items), total, req.customerId || null, source);
      return db.prepare("SELECT * FROM orders WHERE id=?").get(id);
    });

    const order = parseOrder(createOrder());
    broadcastSSE({ type: 'new_order', order });

    // Sprint 1.5: audit (after order insert so target_id matches)
    if (discountAuditPayload) {
      writeAudit({
        actor: discountAuditPayload.actor,
        approver: discountAuditPayload.approver,
        reason: discountAuditPayload.reason,
        action: 'order.discount_applied',
        target_type: 'order',
        target_id: order.id,
        after: { kind: discountAuditPayload.kind, value: discountAuditPayload.value, total },
        ip: req.ip
      });
    }

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
    // 원자적 상태 변경: 동일 트랜잭션 내에서 prevStatus 캡처 + UPDATE
    // → 동시 PUT done 호출 시 단 한 번만 transitionedToDone=true 가 된다
    let prevOrderRow = null;
    let transitionedToDone = false;
    const txStatus = db.transaction(() => {
      const prev = db.prepare("SELECT * FROM orders WHERE id=?").get(req.params.id);
      if (!prev) return null;
      prevOrderRow = prev;
      if (status === 'done' && prev.status !== 'done') {
        const upd = cashierName
          ? db.prepare("UPDATE orders SET status='done', cashier_name=? WHERE id=? AND status!='done'").run(cashierName, req.params.id)
          : db.prepare("UPDATE orders SET status='done' WHERE id=? AND status!='done'").run(req.params.id);
        transitionedToDone = upd.changes === 1;
      } else {
        if (cashierName) {
          db.prepare("UPDATE orders SET status=?, cashier_name=? WHERE id=?").run(status, cashierName, req.params.id);
        } else {
          db.prepare("UPDATE orders SET status=? WHERE id=?").run(status, req.params.id);
        }
      }
      return db.prepare("SELECT * FROM orders WHERE id=?").get(req.params.id);
    });
    const order = txStatus();
    if (!order) return res.status(404).json({ error: 'الطلب غير موجود' });
    const prevOrder = prevOrderRow;
    const parsed = parseOrder(order);
    broadcastSSE({ type: 'order_updated', order: parsed });

    // 자동 재고 차감 비활성화 — 일일 정산(/api/inventory/daily-settle)에서 일괄 처리.
    // 사용자 결정: cashier.html POS와 web-orders.html 모두 done 시점에는 차감하지 않고,
    // inventory_settled=0 으로 남겨둔 뒤 매일 저녁 정산 버튼에서 한꺼번에 차감한다.

    // عند الانتقال إلى "done": منح العميل المسجل طابعاً واحداً تلقائياً
    // 동시 호출에서도 transitionedToDone 가드로 1회만 실행됨
    if (status === 'done' && transitionedToDone) {
      try {
        let cid = order.customer_id;
        // 온라인 주문은 로그인된 customer_id가 있을 때만 적립(요구사항 1).
        // POS 주문은 customer_id 없이도 phone/name 매칭으로 회원 식별 가능(요구사항 2,3).
        const isPosOrder = order.source !== 'online';
        if (!cid && isPosOrder) {
          const normPhone = order.customer_phone
            ? String(order.customer_phone).replace(/\D/g, '')
            : '';
          const trimmedName = order.customer_name
            ? String(order.customer_name).trim()
            : '';

          // 1순위: 정규화된 전화번호 정확 일치
          if (normPhone) {
            const phoneMatch = db.prepare(
              "SELECT id FROM customers WHERE replace(replace(replace(replace(phone,' ',''),'-',''),'+',''),'(','') = ?"
            ).get(normPhone);
            if (phoneMatch) cid = phoneMatch.id;
          }

          // 2순위: 이름 정확 일치 + 동명이인 없음(단 1명)일 때만 매칭
          // 동명이인이 있으면 신뢰할 수 없으므로 매칭하지 않음
          if (!cid && trimmedName) {
            const nameMatches = db.prepare(
              'SELECT id FROM customers WHERE name = ? LIMIT 2'
            ).all(trimmedName);
            if (nameMatches.length === 1) cid = nameMatches[0].id;
          }

          if (cid) {
            db.prepare('UPDATE orders SET customer_id=? WHERE id=?').run(cid, order.id);
          }
        }
        if (cid) {
          // 멱등 적립: stamp_history.uniq_stamp_earn_order 인덱스 + 트랜잭션으로 1회만 보장
          // (transitionedToDone 가드는 1차, 인덱스는 2차 안전장치)
          const stampTx = db.transaction(() => {
            try {
              const ins = db.prepare('INSERT INTO stamp_history (customer_id, type, amount, order_id, created_at) VALUES (?,?,?,?,?)').run(cid, 'earn', 1, order.id, Date.now());
              if (ins.changes === 1) {
                db.prepare('INSERT OR IGNORE INTO customer_stamps (customer_id, total_earned, total_redeemed) VALUES (?,0,0)').run(cid);
                db.prepare('UPDATE customer_stamps SET total_earned = total_earned + 1 WHERE customer_id=?').run(cid);
                return true;
              }
              return false;
            } catch (err) {
              if (err && err.code === 'SQLITE_CONSTRAINT_UNIQUE') return false;
              throw err;
            }
          });
          if (stampTx()) {
            const stampRow = db.prepare('SELECT * FROM customer_stamps WHERE customer_id=?').get(cid);
            broadcastSSE({ type: 'stamp_earned', customer_id: cid, available: stampRow.total_earned - stampRow.total_redeemed });
          }
        }
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

// استرداد طلب (refund) — يستعيد المخزون وفقاً للوصفات ويسجّل الحدث
//
// Sprint 1.5 permission gating:
//   1. Caller must hold `refund` permission.
//      If not, body must contain manager_override = { name, password, reason };
//      the manager must hold `refund`.
//   2. Refund amount must not exceed the actor's `refund_max_iqd` limit.
//      If it does, manager_override is required AND the manager's
//      `refund_max_iqd` must cover the amount.
//   3. Every refund writes audit_log with actor + (optional) approver + reason.
app.post('/api/orders/:id/refund', requireCashierOrAdmin, (req, res) => {
  const { lines, total, full, manager_override } = req.body || {};
  if (!Array.isArray(lines) || lines.length === 0) {
    return res.status(400).json({ error: 'بنود الاسترداد مطلوبة' });
  }
  const refundAmount = Number(total) || 0;
  if (refundAmount <= 0) {
    return res.status(400).json({ error: 'مبلغ الاسترداد غير صالح' });
  }
  // CRITICAL: refund amount must not exceed the prices LOCKED into the original
  // order (refund lines themselves carry only {name, qty} — the price is the
  // source of truth at the order, not in the live menu).
  const orderRowForPricing = db.prepare("SELECT * FROM orders WHERE id=?").get(req.params.id);
  if (!orderRowForPricing) return res.status(404).json({ error: 'الطلب غير موجود' });
  const parsedForPricing = parseOrder(orderRowForPricing);
  const orderItemsForPricing = Array.isArray(parsedForPricing.items) ? parsedForPricing.items : [];
  const priceByName = new Map();
  for (const it of orderItemsForPricing) {
    const nm = it && it.name;
    const p  = Number(it && (it.price ?? it.p)) || 0;
    if (nm && !priceByName.has(nm)) priceByName.set(nm, p);
  }
  const linesWithPrice = lines.map(ln => {
    const nm = ln && ln.name;
    if (ln && (ln.price != null)) return ln;
    if (nm && priceByName.has(nm)) return { ...ln, price: priceByName.get(nm) };
    return ln;
  });
  const { expected: serverExpectedRefund } = getServerExpectedTotal(linesWithPrice);
  if (refundAmount > serverExpectedRefund + 1) {
    return res.status(400).json({ error: 'REFUND_PRICE_MISMATCH', expected: serverExpectedRefund, received: refundAmount });
  }

  // ── Permission gating ──────────────────────────────────────────────────
  const actor = req.cashier;
  const actorPerm   = actor.permissions?.refund === true;
  const actorLimit  = Number(actor.permissions?.refund_max_iqd) || 0;
  const overflows   = refundAmount > actorLimit;
  const needsManager = !actorPerm || overflows;
  let approver = null;
  let reason   = null;
  if (needsManager) {
    if (!manager_override || !manager_override.name || !manager_override.password) {
      return res.status(403).json({
        error: 'permission_denied',
        missing: 'refund',
        reason: !actorPerm ? 'no_permission' : 'limit_exceeded',
        actor_limit: actorLimit,
        amount: refundAmount
      });
    }
    if (!manager_override.reason || !String(manager_override.reason).trim()) {
      return res.status(400).json({ error: 'reason_required' });
    }
    const v = validateManagerOverride({
      manager_name: manager_override.name,
      manager_password: manager_override.password,
      required_perm: 'refund'
    });
    if (!v.ok) return res.status(401).json({ error: v.error });
    // manager's own limit must cover the refund amount
    const mgrRow = db.prepare('SELECT * FROM cashiers WHERE id=?').get(v.approver.id);
    const mgrCtx = resolveCashierContext(mgrRow);
    const mgrLimit = Number(mgrCtx.permissions?.refund_max_iqd) || 0;
    if (refundAmount > mgrLimit) {
      return res.status(403).json({
        error: 'manager_limit_exceeded',
        approver_limit: mgrLimit,
        amount: refundAmount
      });
    }
    approver = v.approver;
    reason   = String(manager_override.reason).trim();
  }

  const cashierName = req.cashierName || null;
  const isFull = full === true || full === 1;

  try {
    const order = db.prepare("SELECT * FROM orders WHERE id=?").get(req.params.id);
    if (!order) return res.status(404).json({ error: 'الطلب غير موجود' });

    const refundId = 'RF-' + Date.now().toString(36).toUpperCase() + '-' + crypto.randomBytes(2).toString('hex').toUpperCase();
    const now = Date.now();

    // طلب أصلي: مجموع الكمية لكل بند
    const parsedOrder = parseOrder(order);
    const orderItems = Array.isArray(parsedOrder.items) ? parsedOrder.items : [];
    const originalQty = new Map();
    for (const it of orderItems) {
      const nm = it && it.name;
      const q = Number(it && (it.qty ?? it.quantity)) || 0;
      if (!nm || q <= 0) continue;
      originalQty.set(nm, (originalQty.get(nm) || 0) + q);
    }

    let txError = null;
    const tx = db.transaction(() => {
      // الكميات المستردة سابقاً (داخل المعاملة لمنع السباق)
      const priorRefunds = db.prepare('SELECT lines FROM refunds WHERE order_id=?').all(order.id);
      const priorQty = new Map();
      for (const r of priorRefunds) {
        let parsedLines = [];
        try { parsedLines = JSON.parse(r.lines || '[]'); } catch (_) { parsedLines = []; }
        for (const ln of parsedLines) {
          const nm = ln && ln.name;
          const q = Number(ln && (ln.qty ?? ln.quantity)) || 0;
          if (!nm || q <= 0) continue;
          priorQty.set(nm, (priorQty.get(nm) || 0) + q);
        }
      }

      // التحقق من عدم تجاوز الكمية الأصلية
      for (const ln of lines) {
        const menuName = ln && ln.name;
        const qty = Number(ln && (ln.qty ?? ln.quantity)) || 0;
        if (!menuName || qty <= 0) continue;
        const original = originalQty.get(menuName) || 0;
        const already = priorQty.get(menuName) || 0;
        if (already + qty > original) {
          txError = { status: 400, message: 'مبلغ الاسترداد يتجاوز الكمية الأصلية', item: menuName, original, already, requested: qty };
          throw new Error('REFUND_OVERFLOW');
        }
      }

      // 정산 후(inventory_settled=1) 환불만 재고 복원. 정산 전이면 차감이 없었으므로 복원 X.
      if (order.inventory_settled === 1) {
        for (const ln of lines) {
          const menuName = ln && ln.name;
          const qty = Number(ln && (ln.qty ?? ln.quantity)) || 0;
          if (!menuName || qty <= 0) continue;
          const recipeRows = db.prepare(
            'SELECT r.ingredient_id, r.quantity, i.current_qty, i.capacity_ml, i.name_ko, i.unit FROM recipes r JOIN ingredients i ON r.ingredient_id=i.id WHERE r.menu_item=?'
          ).all(menuName);
          for (const row of recipeRows) {
            let restore;
            if (row.capacity_ml > 0) restore = (row.quantity / row.capacity_ml) * qty;
            else restore = row.quantity * qty;
            applyStockDelta(row.ingredient_id, restore);
            db.prepare(
              'INSERT INTO inventory_history (ingredient_id, ingredient_name, change_type, quantity, reason) VALUES (?,?,?,?,?)'
            ).run(row.ingredient_id, row.name_ko, 'in', restore, `استرداد ${refundId} - ${menuName} x${qty}`);
          }
        }
      }

      // سجل الاسترداد
      db.prepare(
        'INSERT INTO refunds (id, order_id, amount, lines, full_refund, cashier_name, created_at) VALUES (?,?,?,?,?,?,?)'
      ).run(refundId, order.id, refundAmount, JSON.stringify(lines), isFull ? 1 : 0, cashierName, now);

      // عند الاسترداد الكامل → إلغاء الطلب
      if (isFull && order.status !== 'cancelled') {
        if (cashierName) {
          db.prepare("UPDATE orders SET status='cancelled', cashier_name=? WHERE id=?").run(cashierName, order.id);
        } else {
          db.prepare("UPDATE orders SET status='cancelled' WHERE id=?").run(order.id);
        }
      }
    });

    try {
      tx();
    } catch (err) {
      if (txError) {
        return res.status(txError.status).json({ error: txError.message, item: txError.item, original: txError.original, already_refunded: txError.already, requested: txError.requested });
      }
      throw err;
    }

    const updatedOrder = db.prepare("SELECT * FROM orders WHERE id=?").get(req.params.id);
    const parsed = parseOrder(updatedOrder);
    broadcastSSE({ type: 'order_refunded', refund_id: refundId, order_id: order.id, amount: refundAmount, full: isFull, order: parsed });
    if (isFull) broadcastSSE({ type: 'order_updated', order: parsed });

    // Sprint 1.5: audit
    writeAudit({
      actor: actor,
      approver: approver,
      reason: reason,
      action: 'order.refund',
      target_type: 'order',
      target_id: order.id,
      after: { refund_id: refundId, amount: refundAmount, full: isFull, lines: lines.length },
      ip: req.ip
    });

    res.json({ success: true, refund_id: refundId, amount: refundAmount, full: isFull, order: parsed });
  } catch (e) {
    console.error('خطأ في الاسترداد:', e);
    res.status(500).json({ error: 'فشل في الاسترداد' });
  }
});

// ─── Sprint 1.5: shift close ─────────────────────────────────────────────
// Frontend posts the shift summary (opening cash, counted cash, cash sales,
// txn count, started_at). Server enforces permission gating and writes
// audit_log. If counted != expected (variance != 0), the actor must hold
// `close_shift_force` OR provide manager_override.
app.post('/api/shift/close', requireCashierOrAdmin, (req, res) => {
  const { opening_cash, counted_cash, cash_sales, txn_count, started_at, manager_override } = req.body || {};
  const opening = Number(opening_cash) || 0;
  const counted = Number(counted_cash) || 0;
  const sales   = Number(cash_sales)   || 0;
  const expected = opening + sales;
  const variance = counted - expected;

  const actor = req.cashier;
  if (actor.permissions?.close_shift !== true) {
    return res.status(403).json({ error: 'permission_denied', missing: 'close_shift' });
  }

  let approver = null;
  let reason   = null;
  const hasVariance = Math.abs(variance) > 0;
  if (hasVariance && actor.permissions?.close_shift_force !== true) {
    if (!manager_override || !manager_override.name || !manager_override.password) {
      return res.status(403).json({
        error: 'permission_denied',
        missing: 'close_shift_force',
        reason: 'variance_present',
        variance, expected, counted
      });
    }
    if (!manager_override.reason || !String(manager_override.reason).trim()) {
      return res.status(400).json({ error: 'reason_required' });
    }
    const v = validateManagerOverride({
      manager_name: manager_override.name,
      manager_password: manager_override.password,
      required_perm: 'close_shift_force'
    });
    if (!v.ok) return res.status(401).json({ error: v.error });
    approver = v.approver;
    reason   = String(manager_override.reason).trim();
  }

  writeAudit({
    actor: actor,
    approver: approver,
    reason: reason,
    action: 'shift.close',
    target_type: 'shift',
    target_id: started_at || String(Date.now()),
    after: {
      opening_cash: opening,
      counted_cash: counted,
      cash_sales:   sales,
      expected,
      variance,
      txn_count: Number(txn_count) || 0
    },
    ip: req.ip
  });

  res.json({
    success: true,
    expected,
    variance,
    forced: !!approver
  });
});

// تذكرة بث SSE — يطلبها العميل عبر POST موثّق ثم يستخدمها مرّة واحدة في EventSource
app.post('/api/orders/stream-ticket', requireCashierOrAdmin, (req, res) => {
  const ticket = crypto.randomBytes(24).toString('hex');
  streamTickets.set(ticket, {
    name: req.cashierName || 'staff',
    expires: Date.now() + STREAM_TICKET_TTL,
  });
  res.json({ ticket, ttl: STREAM_TICKET_TTL });
});

// SSE — بث مباشر للكاشير (مصادقة بالتذكرة، استخدام مرّة واحدة)
app.get('/api/orders/stream', (req, res) => {
  const ticket = req.query.ticket;
  if (!ticket || typeof ticket !== 'string') {
    return res.status(401).json({ error: 'تذكرة البث مطلوبة' });
  }
  const entry = streamTickets.get(ticket);
  streamTickets.delete(ticket); // single-use
  if (!entry || entry.expires < Date.now()) {
    return res.status(401).json({ error: 'تذكرة البث غير صالحة أو منتهية' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();
  res.write('data: {"type":"connected"}\n\n');

  sseClients.add(res);
  const heartbeat = setInterval(() => {
    // client disconnected; req.on('close') will clear interval
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

    // 인증된 캐셔/어드민 여부 확인 (TTL까지 검증)
    const adminToken = req.headers['x-auth-token'];
    const cashierToken = req.headers['x-cashier-token'];
    let isStaff = false;
    if (adminToken) {
      const row = db.prepare('SELECT created_at FROM admin_sessions WHERE token=?').get(adminToken);
      if (row && Date.now() - row.created_at <= ADMIN_SESSION_TTL) isStaff = true;
    }
    if (!isStaff && cashierToken) {
      const row = db.prepare('SELECT created_at FROM cashier_sessions WHERE token=?').get(cashierToken);
      if (row && Date.now() - row.created_at <= CASHIER_SESSION_TTL) isStaff = true;
    }

    if (isStaff) {
      return res.json(parsed);
    }

    // 본인 customer_id 일치 시 전체 데이터 (로그인된 회원이 자기 주문 추적)
    const customerToken = req.headers['x-customer-token'];
    if (customerToken && parsed.customer_id) {
      const row = db.prepare('SELECT customer_id, created_at FROM customer_sessions WHERE token=?').get(customerToken);
      if (row && row.customer_id === parsed.customer_id && Date.now() - row.created_at <= CUSTOMER_SESSION_TTL) {
        return res.json(parsed);
      }
    }

    // 미인증 요청: 상태 추적에 필요한 최소 필드만 반환 (PII 및 items/total 제거)
    res.json({
      id: parsed.id,
      num: parsed.num,
      status: parsed.status,
      type: parsed.type,
      arrival_time: parsed.arrival_time,
      timestamp: parsed.timestamp,
    });
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
tryAlter("ALTER TABLE ingredients ADD COLUMN category TEXT NOT NULL DEFAULT '기타'");
tryAlter("ALTER TABLE ingredients ADD COLUMN capacity_ml INTEGER NOT NULL DEFAULT 0");
tryAlter("ALTER TABLE recipes ADD COLUMN menu_category TEXT NOT NULL DEFAULT '기타'");
tryAlter("ALTER TABLE recipes ADD COLUMN unit TEXT NOT NULL DEFAULT 'ml'");
tryAlter("ALTER TABLE recipes ADD COLUMN menu_item_id INTEGER REFERENCES menu_items_v2(id) ON DELETE CASCADE");
tryAlter("CREATE INDEX IF NOT EXISTS idx_recipes_menu_item_id ON recipes(menu_item_id)");

// recipes.menu_item (text) → menu_item_id 백필: code/name_en/name_ko/name_ar 매칭
(function backfillRecipesMenuItemId() {
  try {
    const rows = db.prepare(`SELECT DISTINCT menu_item FROM recipes WHERE menu_item_id IS NULL AND menu_item IS NOT NULL`).all();
    if (!rows.length) return;
    const findItem = db.prepare(`
      SELECT id FROM menu_items_v2
      WHERE code = ? OR name_en = ? OR name_ko = ? OR name_ar = ?
      LIMIT 1
    `);
    const upd = db.prepare(`UPDATE recipes SET menu_item_id = ? WHERE menu_item = ? AND menu_item_id IS NULL`);
    let matched = 0;
    for (const { menu_item: m } of rows) {
      const hit = findItem.get(m, m, m, m);
      if (hit) { upd.run(hit.id, m); matched++; }
    }
    if (matched) console.log(`[migrate] recipes.menu_item_id backfilled: ${matched}/${rows.length}`);
  } catch (e) {
    console.warn('[migrate] recipes.menu_item_id backfill failed', e.message);
  }
})();

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
  const rows = db.prepare(
    `SELECT i.*, s.name AS supplier_name, s.phone AS supplier_phone,
            s.whatsapp AS supplier_whatsapp, s.contact_person AS supplier_contact_person
     FROM ingredients i
     LEFT JOIN suppliers s ON s.id = i.supplier_id
     ORDER BY i.category, i.name_ko`
  ).all();
  const locs = db.prepare(
    'SELECT id, ingredient_id, location_code, qty FROM ingredient_locations ORDER BY location_code'
  ).all();
  const byIng = new Map();
  for (const l of locs) {
    if (!byIng.has(l.ingredient_id)) byIng.set(l.ingredient_id, []);
    byIng.get(l.ingredient_id).push({ id: l.id, location_code: l.location_code, qty: l.qty });
  }
  res.json(rows.map(r => ({ ...r, locations: byIng.get(r.id) || [] })));
});

// ─── SUPPLIERS API ────────────────────────────────────────────────────────────
app.get('/api/suppliers', requireAuth, (_req, res) => {
  const rows = db.prepare('SELECT * FROM suppliers ORDER BY name COLLATE NOCASE').all();
  res.json(rows);
});

app.post('/api/suppliers', requireAuth, (req, res) => {
  const name = String(req.body.name || '').trim();
  if (!name) return res.status(400).json({ error: 'أدخل اسم المورد' });
  const contact_person = (req.body.contact_person || '').trim() || null;
  const phone = (req.body.phone || '').trim() || null;
  const whatsapp = (req.body.whatsapp || '').trim() || null;
  const address = (req.body.address || '').trim() || null;
  const note = (req.body.note || '').trim() || null;
  try {
    const r = db.prepare(
      'INSERT INTO suppliers (name, contact_person, phone, whatsapp, address, note) VALUES (?,?,?,?,?,?)'
    ).run(name, contact_person, phone, whatsapp, address, note);
    res.json({ success: true, id: r.lastInsertRowid });
  } catch (e) {
    if (String(e.message).includes('UNIQUE')) {
      return res.status(409).json({ error: 'اسم المورد موجود مسبقاً' });
    }
    return res.status(500).json({ error: 'فشل حفظ المورد' });
  }
});

app.put('/api/suppliers/:id', requireAuth, (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'معرّف غير صالح' });
  const existing = db.prepare('SELECT id FROM suppliers WHERE id=?').get(id);
  if (!existing) return res.status(404).json({ error: 'المورد غير موجود' });
  const name = String(req.body.name || '').trim();
  if (!name) return res.status(400).json({ error: 'أدخل اسم المورد' });
  try {
    db.prepare(
      'UPDATE suppliers SET name=?, contact_person=?, phone=?, whatsapp=?, address=?, note=? WHERE id=?'
    ).run(
      name,
      (req.body.contact_person || '').trim() || null,
      (req.body.phone || '').trim() || null,
      (req.body.whatsapp || '').trim() || null,
      (req.body.address || '').trim() || null,
      (req.body.note || '').trim() || null,
      id
    );
    res.json({ success: true });
  } catch (e) {
    if (String(e.message).includes('UNIQUE')) {
      return res.status(409).json({ error: 'اسم المورد موجود مسبقاً' });
    }
    return res.status(500).json({ error: 'فشل تحديث المورد' });
  }
});

app.delete('/api/suppliers/:id', requireAuth, (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'معرّف غير صالح' });
  const existing = db.prepare('SELECT id FROM suppliers WHERE id=?').get(id);
  if (!existing) return res.status(404).json({ error: 'المورد غير موجود' });
  db.prepare('DELETE FROM suppliers WHERE id=?').run(id);
  res.json({ success: true });
});

// ─── INGREDIENT LOCATIONS ─────────────────────────────────────────────────────
app.post('/api/ingredients/:id/locations', requireAuth, (req, res) => {
  const ingId = parseInt(req.params.id, 10);
  if (!Number.isInteger(ingId) || ingId <= 0) return res.status(400).json({ error: 'معرّف غير صالح' });
  const ing = db.prepare('SELECT id FROM ingredients WHERE id=?').get(ingId);
  if (!ing) return res.status(404).json({ error: 'المادة غير موجودة' });

  const code = String(req.body.location_code || '').trim().toUpperCase();
  const qty  = Number(req.body.qty);
  if (!LOC_CODE_RE.test(code)) return res.status(400).json({ error: 'رمز موقع غير صالح (مثال: 2A2)' });
  if (!Number.isFinite(qty) || qty < 0) return res.status(400).json({ error: 'الكمية غير صالحة' });

  try {
    db.prepare(
      `INSERT INTO ingredient_locations (ingredient_id, location_code, qty) VALUES (?,?,?)
       ON CONFLICT(ingredient_id, location_code) DO UPDATE SET qty=excluded.qty`
    ).run(ingId, code, qty);
  } catch (e) {
    return res.status(500).json({ error: 'فشل حفظ الموقع' });
  }
  const total = recalcIngredientQty(ingId);
  const row = db.prepare(
    'SELECT id, location_code, qty FROM ingredient_locations WHERE ingredient_id=? AND location_code=?'
  ).get(ingId, code);
  res.json({ success: true, location: row, current_qty: total });
});

app.patch('/api/ingredient-locations/:id', requireAuth, (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'معرّف غير صالح' });
  const existing = db.prepare(
    'SELECT id, ingredient_id, location_code, qty FROM ingredient_locations WHERE id=?'
  ).get(id);
  if (!existing) return res.status(404).json({ error: 'الموقع غير موجود' });

  let nextCode = existing.location_code;
  if (req.body.location_code !== undefined) {
    nextCode = String(req.body.location_code || '').trim().toUpperCase();
    if (!LOC_CODE_RE.test(nextCode)) return res.status(400).json({ error: 'رمز موقع غير صالح (مثال: 2A2)' });
  }
  let nextQty = existing.qty;
  if (req.body.qty !== undefined) {
    nextQty = Number(req.body.qty);
    if (!Number.isFinite(nextQty) || nextQty < 0) return res.status(400).json({ error: 'الكمية غير صالحة' });
  }

  try {
    db.prepare('UPDATE ingredient_locations SET location_code=?, qty=? WHERE id=?').run(nextCode, nextQty, id);
  } catch (e) {
    return res.status(409).json({ error: 'هذا الموقع موجود مسبقاً لنفس المادة' });
  }
  const total = recalcIngredientQty(existing.ingredient_id);
  res.json({ success: true, current_qty: total });
});

app.delete('/api/ingredient-locations/:id', requireAuth, (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'معرّف غير صالح' });
  const row = db.prepare('SELECT ingredient_id FROM ingredient_locations WHERE id=?').get(id);
  if (!row) return res.status(404).json({ error: 'الموقع غير موجود' });
  db.prepare('DELETE FROM ingredient_locations WHERE id=?').run(id);
  const total = recalcIngredientQty(row.ingredient_id);
  res.json({ success: true, current_qty: total });
});

// مساعد: حساب الكمية الإجمالية. لو qty_per_box و num_boxes كلاهما موجود → ضرب،
// وإلا نستخدم current_qty المُدخَل يدوياً.
function computeTotalQty({ qty_per_box, num_boxes, current_qty }) {
  const qpb = Number(qty_per_box);
  const nb = Number(num_boxes);
  if (Number.isFinite(qpb) && qpb > 0 && Number.isFinite(nb) && nb > 0) {
    return qpb * nb;
  }
  const cq = Number(current_qty);
  return Number.isFinite(cq) && cq >= 0 ? cq : 0;
}

function nullableNum(v) {
  if (v === '' || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
function nullableInt(v) {
  if (v === '' || v === null || v === undefined) return null;
  const n = parseInt(v, 10);
  return Number.isInteger(n) && n > 0 ? n : null;
}

app.post('/api/ingredients', requireAuth, (req, res) => {
  const {
    name_ko, name_ar, unit, current_qty, min_qty, cost_per_unit,
    category: bodyCategory, capacity_ml, expiry_date, supplier,
    origin, market_name, qty_per_box, num_boxes, market_price,
    received_date, image_path, supplier_id,
  } = req.body;
  if (!name_ko || !unit) return res.status(400).json({ error: 'أدخل الاسم والوحدة' });
  const category = (bodyCategory && bodyCategory.trim()) ? bodyCategory.trim() : inferCategory(name_ko);
  const initialQty = computeTotalQty({ qty_per_box, num_boxes, current_qty });
  const sid = nullableInt(supplier_id);
  const tx = db.transaction(() => {
    const r = db.prepare(
      `INSERT INTO ingredients (
        name_ko, name_ar, unit, current_qty, min_qty, cost_per_unit, category,
        capacity_ml, expiry_date, supplier,
        origin, market_name, qty_per_box, num_boxes, market_price,
        received_date, image_path, supplier_id
      ) VALUES (?,?,?,?,?,?,?, ?,?,?, ?,?,?,?,?, ?,?,?)`
    ).run(
      name_ko, name_ar || '', unit, 0, min_qty ?? 1, cost_per_unit ?? 0, category,
      capacity_ml ?? 0, expiry_date || null, supplier || null,
      (origin || '').trim() || null,
      (market_name || '').trim() || null,
      nullableNum(qty_per_box),
      nullableNum(num_boxes),
      nullableNum(market_price),
      received_date || null,
      image_path || null,
      sid
    );
    if (initialQty > 0) {
      db.prepare(
        "INSERT INTO ingredient_locations (ingredient_id, location_code, qty) VALUES (?, 'UNSET', ?)"
      ).run(r.lastInsertRowid, initialQty);
      recalcIngredientQty(r.lastInsertRowid);
    }
    return r.lastInsertRowid;
  });
  res.json({ success: true, id: tx() });
});

app.put('/api/ingredients/:id', requireAuth, (req, res) => {
  const {
    name_ko, name_ar, unit, current_qty, min_qty, cost_per_unit,
    category: bodyCategory, capacity_ml, expiry_date, supplier,
    origin, market_name, qty_per_box, num_boxes, market_price,
    received_date, image_path, supplier_id,
  } = req.body;
  const existing = db.prepare('SELECT id, current_qty, image_path, cost_per_unit FROM ingredients WHERE id=?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'المادة غير موجودة' });
  const category = (bodyCategory && bodyCategory.trim()) ? bodyCategory.trim() : inferCategory(name_ko);
  const qpb = nullableNum(qty_per_box);
  const nb = nullableNum(num_boxes);
  const computed = (qpb && nb) ? qpb * nb : (current_qty != null ? Number(current_qty) : null);
  const targetQty = (computed != null && Number.isFinite(computed)) ? computed : Number(existing.current_qty || 0);
  const sid = nullableInt(supplier_id);
  // image_path: لو لم يُرسل في الجسم → نُبقي القديم. لو أُرسل '' → نمسح. غير ذلك → نستبدل.
  const nextImage = image_path === undefined ? existing.image_path : (image_path || null);
  const tx = db.transaction(() => {
    db.prepare(
      `UPDATE ingredients SET
        name_ko=?, name_ar=?, unit=?, min_qty=?, cost_per_unit=?, category=?,
        capacity_ml=?, expiry_date=?, supplier=?,
        origin=?, market_name=?, qty_per_box=?, num_boxes=?, market_price=?,
        received_date=?, image_path=?, supplier_id=?
       WHERE id=?`
    ).run(
      name_ko, name_ar || '', unit, min_qty, cost_per_unit, category,
      capacity_ml ?? 0, expiry_date || null, supplier || null,
      (origin || '').trim() || null,
      (market_name || '').trim() || null,
      qpb,
      nb,
      nullableNum(market_price),
      received_date || null,
      nextImage,
      sid,
      req.params.id
    );
    const shouldUpdateQty = (computed != null && Number.isFinite(computed));
    if (shouldUpdateQty) {
      const namedRow = db.prepare(
        "SELECT COALESCE(SUM(qty), 0) AS total FROM ingredient_locations WHERE ingredient_id=? AND location_code != 'UNSET'"
      ).get(req.params.id);
      const namedTotal = namedRow.total || 0;
      const unsetTarget = Math.max(0, targetQty - namedTotal);
      const unset = db.prepare(
        "SELECT id FROM ingredient_locations WHERE ingredient_id=? AND location_code='UNSET'"
      ).get(req.params.id);
      if (unset) {
        db.prepare('UPDATE ingredient_locations SET qty=? WHERE id=?').run(unsetTarget, unset.id);
      } else if (unsetTarget > 0) {
        db.prepare(
          "INSERT INTO ingredient_locations (ingredient_id, location_code, qty) VALUES (?, 'UNSET', ?)"
        ).run(req.params.id, unsetTarget);
      }
      recalcIngredientQty(req.params.id);
    }
    // 원가 변동 이력
    const newCost = Number(cost_per_unit);
    if (Number.isFinite(newCost) && Math.abs(newCost - (existing.cost_per_unit || 0)) > 1e-9) {
      db.prepare('INSERT INTO ingredient_cost_history (ingredient_id, cost_per_unit) VALUES (?,?)')
        .run(req.params.id, newCost);
    }
  });
  tx();
  res.json({ success: true });
});

app.patch('/api/ingredients/:id', requireAuth, (req, res) => {
  const existing = db.prepare('SELECT * FROM ingredients WHERE id=?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'المادة غير موجودة' });
  const {
    name_ko, name_ar, unit, min_qty, cost_per_unit, category: bodyCategory,
    capacity_ml, expiry_date, supplier,
    origin, market_name, qty_per_box, num_boxes, market_price,
    received_date, image_path, supplier_id,
  } = req.body;
  const name_ko_f = name_ko ?? existing.name_ko;
  const category = (bodyCategory !== undefined)
    ? ((bodyCategory && bodyCategory.trim()) ? bodyCategory.trim() : inferCategory(name_ko_f))
    : existing.category;
  db.prepare(
    `UPDATE ingredients SET
      name_ko=?, name_ar=?, unit=?, min_qty=?, cost_per_unit=?, category=?,
      capacity_ml=?, expiry_date=?, supplier=?,
      origin=?, market_name=?, qty_per_box=?, num_boxes=?, market_price=?,
      received_date=?, image_path=?, supplier_id=?
     WHERE id=?`
  ).run(
    name_ko_f,
    name_ar ?? existing.name_ar,
    unit ?? existing.unit,
    min_qty ?? existing.min_qty,
    cost_per_unit ?? existing.cost_per_unit,
    category,
    capacity_ml ?? existing.capacity_ml,
    expiry_date !== undefined ? (expiry_date || null) : existing.expiry_date,
    supplier !== undefined ? (supplier || null) : existing.supplier,
    origin !== undefined ? ((origin || '').trim() || null) : existing.origin,
    market_name !== undefined ? ((market_name || '').trim() || null) : existing.market_name,
    qty_per_box !== undefined ? nullableNum(qty_per_box) : existing.qty_per_box,
    num_boxes !== undefined ? nullableNum(num_boxes) : existing.num_boxes,
    market_price !== undefined ? nullableNum(market_price) : existing.market_price,
    received_date !== undefined ? (received_date || null) : existing.received_date,
    image_path !== undefined ? (image_path || null) : existing.image_path,
    supplier_id !== undefined ? nullableInt(supplier_id) : existing.supplier_id,
    req.params.id
  );
  if (cost_per_unit !== undefined) {
    const newCost = Number(cost_per_unit);
    if (Number.isFinite(newCost) && Math.abs(newCost - (existing.cost_per_unit || 0)) > 1e-9) {
      db.prepare('INSERT INTO ingredient_cost_history (ingredient_id, cost_per_unit) VALUES (?,?)')
        .run(req.params.id, newCost);
    }
  }
  res.json({ success: true });
});

app.delete('/api/ingredients/:id', requireAuth, (req, res) => {
  const existing = db.prepare('SELECT id, image_path FROM ingredients WHERE id=?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'المادة غير موجودة' });
  db.prepare('DELETE FROM ingredients WHERE id=?').run(req.params.id);
  // حذف الصورة المرفوعة إن وُجدت داخل UPLOAD_DIR فقط (لمنع path traversal)
  if (existing.image_path && existing.image_path.startsWith('/uploads/')) {
    try {
      const filename = path.basename(existing.image_path);
      const full = path.resolve(UPLOAD_DIR, filename);
      if (full.startsWith(path.resolve(UPLOAD_DIR) + path.sep) && fs.existsSync(full)) {
        fs.unlinkSync(full);
      }
    } catch (e) { console.warn('[ingredient-delete] image unlink failed', existing.image_path, e.message); }
  }
  res.json({ success: true });
});

// ─── رفع صورة منتج ────────────────────────────────────────────────────────────
app.post('/api/ingredients/:id/image', requireAuth, (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'معرّف غير صالح' });
  const existing = db.prepare('SELECT id, image_path FROM ingredients WHERE id=?').get(id);
  if (!existing) return res.status(404).json({ error: 'المادة غير موجودة' });

  ingredientImageUpload.single('image')(req, res, (err) => {
    if (err) {
      if (err.message === 'UNSUPPORTED_MIME') {
        return res.status(415).json({ error: 'نوع الصورة غير مدعوم (jpg / png / webp فقط)' });
      }
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ error: 'حجم الصورة يتجاوز 5 ميغابايت' });
      }
      return res.status(400).json({ error: 'فشل رفع الصورة' });
    }
    if (!req.file) return res.status(400).json({ error: 'لم يتم إرفاق صورة' });

    const newPath = '/uploads/' + req.file.filename;
    // حذف الصورة القديمة (لو كانت داخل /uploads/)
    if (existing.image_path && existing.image_path.startsWith('/uploads/') && existing.image_path !== newPath) {
      try {
        const oldName = path.basename(existing.image_path);
        const oldFull = path.resolve(UPLOAD_DIR, oldName);
        if (oldFull.startsWith(path.resolve(UPLOAD_DIR) + path.sep) && fs.existsSync(oldFull)) {
          fs.unlinkSync(oldFull);
        }
      } catch (e) { console.warn('[ingredient-image-replace] old unlink failed', existing.image_path, e.message); }
    }
    db.prepare('UPDATE ingredients SET image_path=? WHERE id=?').run(newPath, id);
    res.json({ success: true, image_path: newPath });
  });
});

// ─── INVENTORY ADJUST ─────────────────────────────────────────────────────────
// Optional `location_code` targets a specific shelf row. Missing → falls back to
// 'UNSET' so existing callers keep working unchanged.
app.post('/api/inventory/adjust', requireCashierOrAdmin, (req, res) => {
  const { ingredient_id, change_type, quantity, reason } = req.body;
  const qty = Number(quantity);
  if (!['in', 'out'].includes(change_type) || !Number.isFinite(qty) || qty <= 0)
    return res.status(400).json({ error: 'بيانات غير صالحة' });
  const ing = db.prepare('SELECT * FROM ingredients WHERE id=?').get(ingredient_id);
  if (!ing) return res.status(404).json({ error: 'المادة غير موجودة' });

  let locCode = req.body.location_code;
  if (locCode !== undefined && locCode !== null && String(locCode).trim() !== '') {
    locCode = String(locCode).trim().toUpperCase();
    if (locCode !== 'UNSET' && !LOC_CODE_RE.test(locCode)) {
      return res.status(400).json({ error: 'رمز موقع غير صالح (مثال: 2A2)' });
    }
  } else {
    locCode = 'UNSET';
  }

  const tx = db.transaction(() => {
    let row = db.prepare(
      'SELECT id, qty FROM ingredient_locations WHERE ingredient_id=? AND location_code=?'
    ).get(ingredient_id, locCode);

    if (change_type === 'in') {
      if (row) {
        db.prepare('UPDATE ingredient_locations SET qty = qty + ? WHERE id=?').run(qty, row.id);
      } else {
        db.prepare(
          'INSERT INTO ingredient_locations (ingredient_id, location_code, qty) VALUES (?,?,?)'
        ).run(ingredient_id, locCode, qty);
      }
    } else {
      if (!row || row.qty < qty) {
        const have = row ? row.qty : 0;
        const err = new Error(`مخزون غير كافٍ في الموقع ${locCode} (الحالي: ${have}${ing.unit})`);
        err.status = 400;
        throw err;
      }
      db.prepare('UPDATE ingredient_locations SET qty = qty - ? WHERE id=?').run(qty, row.id);
    }

    const total = recalcIngredientQty(ingredient_id);
    const reasonStamped = locCode === 'UNSET' ? (reason || '') : `@${locCode} ${reason || ''}`.trim();
    db.prepare(
      'INSERT INTO inventory_history (ingredient_id, ingredient_name, change_type, quantity, reason) VALUES (?,?,?,?,?)'
    ).run(ingredient_id, ing.name_ko, change_type, qty, reasonStamped);
    return total;
  });

  try {
    const newQty = tx();
    res.json({ success: true, new_qty: newQty, location_code: locCode });
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message || 'فشل التعديل' });
  }
});

app.get('/api/inventory/history', requireAuth, (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 200, 500);
  res.json(db.prepare('SELECT * FROM inventory_history ORDER BY created_at DESC LIMIT ?').all(limit));
});

app.delete('/api/inventory/history/:id', requireAuth, (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isInteger(id) || id <= 0)
    return res.status(400).json({ error: 'معرّف غير صالح' });
  const row = db.prepare('SELECT * FROM inventory_history WHERE id=?').get(id);
  if (!row) return res.status(404).json({ error: 'السجل غير موجود' });
  if (row.ingredient_id) {
    const delta = row.change_type === 'in' ? -row.quantity : row.quantity;
    applyStockDelta(row.ingredient_id, delta);
  }
  db.prepare('DELETE FROM inventory_history WHERE id=?').run(id);
  res.json({ success: true });
});

app.put('/api/inventory/history/:id', requireAuth, (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isInteger(id) || id <= 0)
    return res.status(400).json({ error: 'معرّف غير صالح' });
  const { change_type, quantity, reason } = req.body;
  const qty = Number(quantity);
  if (!['in', 'out'].includes(change_type) || !Number.isFinite(qty) || qty <= 0)
    return res.status(400).json({ error: 'بيانات غير صالحة' });
  const row = db.prepare('SELECT * FROM inventory_history WHERE id=?').get(id);
  if (!row) return res.status(404).json({ error: 'السجل غير موجود' });
  if (row.ingredient_id) {
    const revert = row.change_type === 'in' ? -row.quantity : row.quantity;
    const apply = change_type === 'in' ? qty : -qty;
    applyStockDelta(row.ingredient_id, revert + apply);
  }
  db.prepare('UPDATE inventory_history SET change_type=?, quantity=?, reason=? WHERE id=?')
    .run(change_type, parseFloat(quantity), reason || '', id);
  res.json({ success: true });
});

// ─── DAILY INVENTORY SETTLEMENT ──────────────────────────────────────────────
// 미정산(완료되었으나 재고 차감 전인) 주문 미리보기
app.get('/api/inventory/pending-settlement', requireAuth, (req, res) => {
  const date = typeof req.query.date === 'string' ? req.query.date : null;
  let rows;
  if (date) {
    // Baghdad 시간(UTC+3) 기준 날짜 매칭
    rows = db.prepare(
      "SELECT * FROM orders WHERE status='done' AND inventory_settled=0 AND date((timestamp/1000)+3*3600,'unixepoch')=?"
    ).all(date);
  } else {
    rows = db.prepare("SELECT * FROM orders WHERE status='done' AND inventory_settled=0").all();
  }
  res.json({
    count: rows.length,
    total_revenue: rows.reduce((s, r) => s + (Number(r.total) || 0), 0),
    orders: rows.map(parseOrder)
  });
});

// 일괄 정산: 미정산 done 주문에 대해 레시피 기반 재고 차감 + inventory_settled=1 마크
app.post('/api/inventory/daily-settle', requireAuth, (req, res) => {
  const date = req.body && typeof req.body.date === 'string' ? req.body.date : null;
  const now = Date.now();
  let processed = 0;
  let totalRevenue = 0;
  const ingredientDeducts = new Map(); // ingredient_id -> total deduct (요약용)

  try {
    const tx = db.transaction(() => {
      let rows;
      if (date) {
        rows = db.prepare(
          "SELECT * FROM orders WHERE status='done' AND inventory_settled=0 AND date((timestamp/1000)+3*3600,'unixepoch')=?"
        ).all(date);
      } else {
        rows = db.prepare("SELECT * FROM orders WHERE status='done' AND inventory_settled=0").all();
      }

      for (const order of rows) {
        const orderItems = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
        for (const item of (orderItems || [])) {
          const menuName = item && item.name;
          const orderQty = Number(item && item.qty) || 1;
          if (!menuName) continue;
          const recipeRows = db.prepare(
            'SELECT r.ingredient_id, r.quantity, i.capacity_ml, i.name_ko FROM recipes r JOIN ingredients i ON r.ingredient_id=i.id WHERE r.menu_item=?'
          ).all(menuName);
          for (const row of recipeRows) {
            let deduct;
            if (row.capacity_ml > 0) deduct = (row.quantity / row.capacity_ml) * orderQty;
            else deduct = row.quantity * orderQty;
            applyStockDelta(row.ingredient_id, -deduct);
            db.prepare(
              'INSERT INTO inventory_history (ingredient_id, ingredient_name, change_type, quantity, reason) VALUES (?,?,?,?,?)'
            ).run(row.ingredient_id, row.name_ko, 'out', deduct, `Daily settle #${order.num} - ${menuName} x${orderQty}`);
            ingredientDeducts.set(row.ingredient_id, (ingredientDeducts.get(row.ingredient_id) || 0) + deduct);
          }
        }
        db.prepare('UPDATE orders SET inventory_settled=1, settled_at=? WHERE id=?').run(now, order.id);
        processed += 1;
        totalRevenue += Number(order.total) || 0;
      }
    });
    tx();
  } catch (e) {
    console.error('daily-settle error:', e);
    return res.status(500).json({ error: 'فشل التسوية اليومية / Daily settlement failed' });
  }

  res.json({
    success: true,
    processed,
    total_revenue: totalRevenue,
    ingredient_count: ingredientDeducts.size,
    settled_at: now
  });
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
  const { menu_item, menu_item_id, items, menu_category } = req.body;
  const mid = menu_item_id != null ? parseInt(menu_item_id, 10) : null;
  if ((!mid && !menu_item) || !items?.length)
    return res.status(400).json({ error: 'أدخل اسم القائمة والمواد' });

  // Resolve canonical menu_item text from menu_items_v2 if id supplied (so recipes
  // stay aligned even if the caller didn't echo back the latest name).
  let nameText = menu_item ? String(menu_item).trim() : null;
  let menuRow = null;
  if (mid) {
    menuRow = db.prepare('SELECT id, code, name_en, name_ko, name_ar FROM menu_items_v2 WHERE id=?').get(mid);
    if (!menuRow) return res.status(400).json({ error: 'invalid_menu_item_id' });
    if (!nameText) nameText = menuRow.name_en || menuRow.name_ko || menuRow.code;
  }

  const category = (menu_category && menu_category.trim()) ? menu_category.trim() : '기타';
  const ins = db.prepare(`INSERT INTO recipes
    (menu_item, ingredient_id, quantity, menu_category, unit, menu_item_id)
    VALUES (?,?,?,?,?,?)`);

  const tx = db.transaction(() => {
    if (mid) {
      db.prepare('DELETE FROM recipes WHERE menu_item_id=?').run(mid);
      // also clean any legacy text-only rows for the same name to avoid duplicates
      if (nameText) db.prepare('DELETE FROM recipes WHERE menu_item=? AND menu_item_id IS NULL').run(nameText);
    } else {
      db.prepare('DELETE FROM recipes WHERE menu_item=?').run(nameText);
    }
    for (const item of items) {
      const unit = ['ml', 'g'].includes(item.unit) ? item.unit : 'ml';
      ins.run(nameText, item.ingredient_id, item.quantity, category, unit, mid);
    }
  });
  tx();
  res.json({ success: true });
});

app.delete('/api/recipes/menu/:menuItem', requireAuth, (req, res) => {
  db.prepare('DELETE FROM recipes WHERE menu_item=?').run(req.params.menuItem);
  res.json({ success: true });
});

app.delete('/api/recipes/by-id/:id', requireAuth, (req, res) => {
  const mid = parseInt(req.params.id, 10);
  if (!Number.isFinite(mid)) return res.status(400).json({ error: 'invalid_id' });
  db.prepare('DELETE FROM recipes WHERE menu_item_id=?').run(mid);
  res.json({ success: true });
});

function computeRecipeCost(rows) {
  return rows.reduce((s, r) => {
    const unitCost = r.capacity_ml > 0 ? r.cost_per_unit / r.capacity_ml : r.cost_per_unit;
    return s + r.quantity * unitCost;
  }, 0);
}

app.get('/api/cost/:menuItem', requireAuth, (req, res) => {
  const rows = db.prepare(`
    SELECT r.quantity, i.cost_per_unit, i.unit, i.name_ko, i.capacity_ml
    FROM recipes r JOIN ingredients i ON r.ingredient_id = i.id
    WHERE r.menu_item=?
  `).all(req.params.menuItem);
  res.json({ menu_item: req.params.menuItem, items: rows, total_cost: Math.round(computeRecipeCost(rows)) });
});

app.get('/api/cost/by-id/:id', requireAuth, (req, res) => {
  const mid = parseInt(req.params.id, 10);
  if (!Number.isFinite(mid)) return res.status(400).json({ error: 'invalid_id' });
  const rows = db.prepare(`
    SELECT r.quantity, i.cost_per_unit, i.unit, i.name_ko, i.capacity_ml
    FROM recipes r JOIN ingredients i ON r.ingredient_id = i.id
    WHERE r.menu_item_id=?
  `).all(mid);
  res.json({ menu_item_id: mid, items: rows, total_cost: Math.round(computeRecipeCost(rows)) });
});

// Combined view for the warehouse "Menu" tab: every menu_items_v2 row plus its
// recipe-derived unit cost. Front-end can group by category and show margin.
app.get('/api/menu/with-cost', requireAuth, (req, res) => {
  const items = db.prepare(`
    SELECT m.*,
           c.code AS category_code,
           c.name_en AS category_name_en,
           c.name_ar AS category_name_ar,
           c.name_ko AS category_name_ko,
           c.sort_order AS category_sort
    FROM menu_items_v2 m
    LEFT JOIN menu_categories c ON c.id = m.category_id
    ORDER BY COALESCE(c.sort_order, 9999), c.id, m.sort_order, m.id
  `).all();
  const recipeStmt = db.prepare(`
    SELECT r.id AS recipe_id, r.quantity, r.unit AS recipe_unit,
           i.id AS ingredient_id, i.name_ko, i.name_ar, i.unit AS ing_unit,
           i.cost_per_unit, i.capacity_ml
    FROM recipes r JOIN ingredients i ON r.ingredient_id = i.id
    WHERE r.menu_item_id = ?
  `);
  // Legacy fallback for recipes whose menu_item_id couldn't be backfilled.
  const legacyStmt = db.prepare(`
    SELECT r.id AS recipe_id, r.quantity, r.unit AS recipe_unit,
           i.id AS ingredient_id, i.name_ko, i.name_ar, i.unit AS ing_unit,
           i.cost_per_unit, i.capacity_ml
    FROM recipes r JOIN ingredients i ON r.ingredient_id = i.id
    WHERE r.menu_item_id IS NULL AND (r.menu_item = ? OR r.menu_item = ? OR r.menu_item = ?)
  `);
  const out = items.map(it => {
    let recipe = recipeStmt.all(it.id);
    if (!recipe.length) {
      recipe = legacyStmt.all(it.code, it.name_en, it.name_ko);
    }
    const cost = Math.round(computeRecipeCost(recipe));
    return { ...it, cost, recipe };
  });
  res.json(out);
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
            applyStockDelta(item.ingredient_id, -deduct);
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
          applyStockDelta(recipe.ingredient_id, -deduct);
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

// Slots: 07:00 ~ 01:00 (next-day). nextDay=true → 영업일 다음날 새벽 (Iraq UTC+3).
const RESERVATION_SLOTS = [
  { time: '07:00', nextDay: false }, { time: '08:00', nextDay: false },
  { time: '09:00', nextDay: false }, { time: '10:00', nextDay: false },
  { time: '11:00', nextDay: false }, { time: '12:00', nextDay: false },
  { time: '13:00', nextDay: false }, { time: '14:00', nextDay: false },
  { time: '15:00', nextDay: false }, { time: '16:00', nextDay: false },
  { time: '17:00', nextDay: false }, { time: '18:00', nextDay: false },
  { time: '19:00', nextDay: false }, { time: '20:00', nextDay: false },
  { time: '21:00', nextDay: false }, { time: '22:00', nextDay: false },
  { time: '23:00', nextDay: false }, { time: '00:00', nextDay: true  },
  { time: '01:00', nextDay: true  },
];
function slotInstantMs(dateStr, time, nextDay) {
  const [Y, M, D] = dateStr.split('-').map(Number);
  const [h, m] = time.split(':').map(Number);
  const day = D + (nextDay ? 1 : 0);
  return Date.UTC(Y, M - 1, day, h - 3, m, 0);
}
function isSlotPast(dateStr, time, nextDay) {
  return slotInstantMs(dateStr, time, nextDay) <= Date.now();
}

// إنشاء حجز (العميل — تسجيل الدخول اختياري)
app.post('/api/reservations', reservationLimiter, optionalCustomer, (req, res) => {
  const { name, phone, date, time, party_size, notes, table_num } = req.body;
  if (!name || !phone || !date || !time)
    return res.status(400).json({ error: 'Name, phone, date and time are required / الاسم والهاتف والتاريخ والوقت مطلوبة' });
  const ALLOWED_AREAS = ['floor_1', 'floor_2', 'study_room'];
  if (!table_num || !ALLOWED_AREAS.includes(table_num))
    return res.status(400).json({ error: 'Please choose an area: Floor 1, Floor 2, or Study Room / يرجى اختيار المنطقة: الطابق الأول، الطابق الثاني، أو غرفة الدراسة' });
  if (party_size && (party_size < 1 || party_size > 20))
    return res.status(400).json({ error: 'Party size must be 1–20' });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date))
    return res.status(400).json({ error: 'Invalid date format' });
  const slotDef = RESERVATION_SLOTS.find(s => s.time === time);
  if (!slotDef)
    return res.status(400).json({ error: 'Invalid time slot / فترة وقت غير صالحة' });
  if (isSlotPast(date, slotDef.time, slotDef.nextDay))
    return res.status(400).json({ error: 'Cannot book a past time / لا يمكن حجز وقت قد مضى' });

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
  const rows = db.prepare("SELECT time, COUNT(*) as count FROM reservations WHERE date=? AND status != 'cancelled' GROUP BY time").all(date);
  const slotMap = {};
  rows.forEach(r => { slotMap[r.time] = r.count; });
  const slots = RESERVATION_SLOTS.map(s => ({
    time: s.time,
    count: slotMap[s.time] || 0,
    is_past: isSlotPast(date, s.time, s.nextDay),
    is_next_day: s.nextDay,
  }));
  res.json({ slots });
});

// ─── MEETING ROOM RESERVATIONS ────────────────────────────────────────────────

// إنشاء حجز غرفة الاجتماعات (عام)
app.post('/api/meeting-reservations', (req, res) => {
  const { name, phone, date, slot, notes } = req.body;
  if (!name || !phone || !date || !slot) return res.status(400).json({ error: 'حقول مطلوبة مفقودة' });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date))
    return res.status(400).json({ error: 'Invalid date format' });
  const todayStr2 = new Date().toISOString().split('T')[0];
  if (date < todayStr2)
    return res.status(400).json({ error: 'Cannot book a date in the past / لا يمكن حجز تاريخ في الماضي' });
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
  const price = Number(selling_price);
  if (!Number.isFinite(price) || price < 0)
    return res.status(400).json({ error: 'selling_price must be a non-negative number' });
  const rounded = Math.round(price);
  const prev = db.prepare('SELECT selling_price FROM menu_prices WHERE menu_item=?').get(menu_item);
  db.prepare(
    'INSERT INTO menu_prices (menu_item, selling_price) VALUES (?,?) ON CONFLICT(menu_item) DO UPDATE SET selling_price=excluded.selling_price'
  ).run(menu_item, rounded);
  // history: 새 항목이거나 가격이 변경되었을 때만 기록
  if (!prev || prev.selling_price !== rounded) {
    db.prepare('INSERT INTO menu_price_history (menu_item, selling_price) VALUES (?,?)').run(menu_item, rounded);
  }
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

  // 베스트셀러 TOP5 — orders 테이블에서 직접 집계 (daily_sales는 즉석 처리 전용)
  const ordersInRange = db.prepare(`
    SELECT items
    FROM orders
    WHERE status != 'cancelled'
      AND date(datetime(timestamp/1000, 'unixepoch', '+3 hours')) BETWEEN ? AND ?
  `).all(startStr, todayStr);

  // 환불된 수량 차감 — 취소된 주문은 ordersInRange에서 이미 제외되므로 환불도 제외
  const refundsInRange = db.prepare(`
    SELECT r.lines
    FROM refunds r
    JOIN orders o ON r.order_id = o.id
    WHERE o.status != 'cancelled'
      AND date(datetime(o.timestamp/1000, 'unixepoch', '+3 hours')) BETWEEN ? AND ?
  `).all(startStr, todayStr);

  const qtyMap = new Map();
  for (const row of ordersInRange) {
    let items = [];
    try { items = JSON.parse(row.items || '[]'); } catch (_) { items = []; }
    if (!Array.isArray(items)) continue;
    for (const it of items) {
      const nm = it && it.name;
      const q = Number(it && (it.qty ?? it.quantity)) || 0;
      if (!nm || q <= 0) continue;
      qtyMap.set(nm, (qtyMap.get(nm) || 0) + q);
    }
  }
  for (const row of refundsInRange) {
    let lines = [];
    try { lines = JSON.parse(row.lines || '[]'); } catch (_) { lines = []; }
    if (!Array.isArray(lines)) continue;
    for (const ln of lines) {
      const nm = ln && ln.name;
      const q = Number(ln && (ln.qty ?? ln.quantity)) || 0;
      if (!nm || q <= 0) continue;
      const cur = qtyMap.get(nm) || 0;
      const next = cur - q;
      if (next > 0) qtyMap.set(nm, next);
      else qtyMap.delete(nm);
    }
  }

  const top5 = Array.from(qtyMap.entries())
    .map(([menu_item, total_qty]) => ({ menu_item, total_qty }))
    .sort((a, b) => b.total_qty - a.total_qty)
    .slice(0, 5);

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

app.post('/api/contact', contactLimiter, (req, res) => {
  const { name, email, message, lang } = req.body;
  if (!name || !email || !message)
    return res.status(400).json({ error: 'Missing required fields' });
  const cleanName = String(name).trim().slice(0, 120);
  const cleanEmail = String(email).trim().toLowerCase().slice(0, 200);
  const cleanMessage = String(message).trim().slice(0, 4000);
  if (!cleanName || !cleanEmail || !cleanMessage)
    return res.status(400).json({ error: 'Invalid input' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail))
    return res.status(400).json({ error: 'Invalid email' });
  db.prepare('INSERT INTO contact_messages (name, email, message, lang) VALUES (?,?,?,?)')
    .run(cleanName, cleanEmail, cleanMessage, lang || 'en');
  res.json({ success: true });
});

// ─── TEAM REPORTS (본사 8팀 일일 보고서 + 대시보드) ────────────────────────────
const TEAM_REPORTS_ROOT = path.join(__dirname, '.claude', 'reports', 'team-reports');
const TEAM_IDS = new Set(['ceo', 'cfo', 'coo', 'marketing', 'developer', 'tax', 'legal', 'hr']);

function safeDate(s) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;
}

app.get('/api/team-reports/today', requireAuth, (_req, res) => {
  try {
    const latest = path.join(TEAM_REPORTS_ROOT, 'latest.json');
    if (!fs.existsSync(latest)) return res.status(404).json({ error: 'no reports yet' });
    res.json(JSON.parse(fs.readFileSync(latest, 'utf8')));
  } catch (err) {
    res.status(500).json({ error: String(err.message || err) });
  }
});

app.get('/api/team-reports/dates', requireAuth, (_req, res) => {
  try {
    if (!fs.existsSync(TEAM_REPORTS_ROOT)) return res.json({ dates: [] });
    const dates = fs
      .readdirSync(TEAM_REPORTS_ROOT, { withFileTypes: true })
      .filter(d => d.isDirectory() && safeDate(d.name))
      .map(d => d.name)
      .sort()
      .reverse();
    res.json({ dates });
  } catch (err) {
    res.status(500).json({ error: String(err.message || err) });
  }
});

app.get('/api/team-reports/:date', requireAuth, (req, res) => {
  const date = safeDate(req.params.date);
  if (!date) return res.status(400).json({ error: 'invalid date' });
  const indexPath = path.join(TEAM_REPORTS_ROOT, date, 'index.json');
  if (!fs.existsSync(indexPath)) return res.status(404).json({ error: 'not found' });
  try {
    res.json(JSON.parse(fs.readFileSync(indexPath, 'utf8')));
  } catch (err) {
    res.status(500).json({ error: String(err.message || err) });
  }
});

app.get('/api/team-reports/:date/:team', requireAuth, (req, res) => {
  const date = safeDate(req.params.date);
  const team = String(req.params.team || '').toLowerCase();
  if (!date) return res.status(400).json({ error: 'invalid date' });
  if (!TEAM_IDS.has(team)) return res.status(400).json({ error: 'invalid team' });
  const reportPath = path.join(TEAM_REPORTS_ROOT, date, `${team}.md`);
  if (!fs.existsSync(reportPath)) return res.status(404).json({ error: 'not found' });
  try {
    res.json({ date, team, markdown: fs.readFileSync(reportPath, 'utf8') });
  } catch (err) {
    res.status(500).json({ error: String(err.message || err) });
  }
});

// ─── AGENT MEETINGS (대시보드 → 본사 8팀 즉석 회의) ───────────────────────────
db.prepare(`CREATE TABLE IF NOT EXISTS agent_meetings (
  id          TEXT PRIMARY KEY,
  type        TEXT NOT NULL,
  team_ids    TEXT NOT NULL,
  topic       TEXT,
  status      TEXT NOT NULL DEFAULT 'running',
  error       TEXT,
  created_by_token TEXT,
  created_at  INTEGER NOT NULL,
  updated_at  INTEGER NOT NULL
)`).run();
db.prepare(`CREATE TABLE IF NOT EXISTS agent_meeting_messages (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  meeting_id  TEXT NOT NULL,
  role        TEXT NOT NULL,
  team_id     TEXT,
  content     TEXT NOT NULL,
  created_at  INTEGER NOT NULL
)`).run();
db.prepare(`CREATE INDEX IF NOT EXISTS idx_agent_msgs_meeting ON agent_meeting_messages(meeting_id, created_at)`).run();
db.prepare(`CREATE TABLE IF NOT EXISTS dashboard_todos (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  text        TEXT NOT NULL,
  done        INTEGER NOT NULL DEFAULT 0,
  meeting_id  TEXT,
  created_at  INTEGER NOT NULL,
  done_at     INTEGER
)`).run();

const {
  TEAMS: AGENT_TEAMS,
  getTeamById: getAgentTeam,
  buildAskPrompt,
  buildMeetingPrompt,
  buildReportPrompt,
} = require('./scripts/lib/team-prompts');
const { callClaude: callAgentClaude } = require('./scripts/lib/anthropic-sdk');

const MEETING_TYPES = new Set(['ask', 'multi', 'report']);
const MAX_CONCURRENT_MEETINGS = 3;
let runningMeetings = 0;

function newMeetingId() {
  return 'm_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
}

function insertMeeting(type, teamIds, topic, createdByToken = null) {
  const id = newMeetingId();
  const now = Date.now();
  db.prepare(`INSERT INTO agent_meetings (id, type, team_ids, topic, status, created_by_token, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?)`)
    .run(id, type, JSON.stringify(teamIds), topic || null, 'running', createdByToken || null, now, now);
  return id;
}

function insertMessage(meetingId, role, teamId, content) {
  db.prepare(`INSERT INTO agent_meeting_messages (meeting_id, role, team_id, content, created_at) VALUES (?,?,?,?,?)`)
    .run(meetingId, role, teamId || null, content, Date.now());
}

function setMeetingStatus(meetingId, status, error) {
  db.prepare(`UPDATE agent_meetings SET status=?, error=?, updated_at=? WHERE id=?`)
    .run(status, error || null, Date.now(), meetingId);
}

function getMeetingMessages(meetingId) {
  return db.prepare(`SELECT role, team_id, content, created_at FROM agent_meeting_messages WHERE meeting_id=? ORDER BY created_at ASC, id ASC`)
    .all(meetingId);
}

function getMeeting(meetingId) {
  const row = db.prepare(`SELECT * FROM agent_meetings WHERE id=?`).get(meetingId);
  if (!row) return null;
  return {
    id: row.id,
    type: row.type,
    team_ids: JSON.parse(row.team_ids),
    topic: row.topic,
    status: row.status,
    error: row.error,
    created_at: row.created_at,
    updated_at: row.updated_at,
    messages: getMeetingMessages(meetingId),
  };
}

async function runOneTurn(meetingId, team, persona, userTask) {
  try {
    const out = await callAgentClaude({ model: team.model, persona, userTask });
    insertMessage(meetingId, 'agent', team.id, out || '(빈 응답)');
    return { ok: true };
  } catch (err) {
    const msg = String(err.message || err).slice(0, 500);
    insertMessage(meetingId, 'agent', team.id, `❌ 호출 실패: ${msg}`);
    return { ok: false, error: msg };
  }
}

async function processMeetingAsync(meetingId, type, teams, prompts) {
  if (runningMeetings >= MAX_CONCURRENT_MEETINGS) {
    setMeetingStatus(meetingId, 'failed', '동시 실행 한도 초과 (3건). 잠시 후 다시 시도하세요.');
    return;
  }
  runningMeetings += 1;
  try {
    if (type === 'multi') {
      const results = await Promise.all(teams.map((t, i) => runOneTurn(meetingId, t, prompts[i].persona, prompts[i].userTask)));
      const allFailed = results.every(r => !r.ok);
      setMeetingStatus(meetingId, allFailed ? 'failed' : 'done', allFailed ? results[0].error : null);
    } else {
      const r = await runOneTurn(meetingId, teams[0], prompts[0].persona, prompts[0].userTask);
      setMeetingStatus(meetingId, r.ok ? 'done' : 'failed', r.ok ? null : r.error);
    }
  } finally {
    runningMeetings = Math.max(0, runningMeetings - 1);
  }
}

function asString(v, max) {
  if (v == null) return '';
  const s = String(v).trim();
  return max ? s.slice(0, max) : s;
}

app.post('/api/meetings/ask', requireAuth, (req, res) => {
  const teamId = asString(req.body && req.body.team_id, 32);
  const prompt = asString(req.body && req.body.prompt, 4000);
  const team = getAgentTeam(teamId);
  if (!team) return res.status(400).json({ error: 'invalid team_id' });
  if (!prompt) return res.status(400).json({ error: 'prompt required' });
  const meetingId = insertMeeting('ask', [teamId], prompt.slice(0, 80));
  insertMessage(meetingId, 'user', null, prompt);
  const history = [{ role: 'user', content: prompt }];
  const built = buildAskPrompt(team, history);
  setImmediate(() => processMeetingAsync(meetingId, 'ask', [team], [built]));
  res.json({ meeting_id: meetingId });
});

app.post('/api/meetings/multi', requireAuth, (req, res) => {
  const teamIds = Array.isArray(req.body && req.body.team_ids) ? req.body.team_ids.map(s => asString(s, 32)).filter(Boolean) : [];
  const topic = asString(req.body && req.body.topic, 2000);
  if (teamIds.length < 2) return res.status(400).json({ error: 'at least 2 team_ids required' });
  if (teamIds.length > 8) return res.status(400).json({ error: 'max 8 teams' });
  if (!topic) return res.status(400).json({ error: 'topic required' });
  const teams = teamIds.map(getAgentTeam);
  if (teams.some(t => !t)) return res.status(400).json({ error: 'invalid team_id in list' });
  const meetingId = insertMeeting('multi', teamIds, topic);
  insertMessage(meetingId, 'user', null, topic);
  const built = teams.map(t => buildMeetingPrompt(t, topic, teams));
  setImmediate(() => processMeetingAsync(meetingId, 'multi', teams, built));
  res.json({ meeting_id: meetingId });
});

app.post('/api/meetings/report', requireAuth, (req, res) => {
  const teamId = asString(req.body && req.body.team_id, 32);
  const topic = asString(req.body && req.body.topic, 2000);
  const team = getAgentTeam(teamId);
  if (!team) return res.status(400).json({ error: 'invalid team_id' });
  if (!topic) return res.status(400).json({ error: 'topic required' });
  const meetingId = insertMeeting('report', [teamId], topic);
  insertMessage(meetingId, 'user', null, topic);
  const built = buildReportPrompt(team, topic);
  setImmediate(() => processMeetingAsync(meetingId, 'report', [team], [built]));
  res.json({ meeting_id: meetingId });
});

app.post('/api/meetings/:id/message', requireAuth, (req, res) => {
  const id = asString(req.params.id, 64);
  const prompt = asString(req.body && req.body.prompt, 4000);
  if (!prompt) return res.status(400).json({ error: 'prompt required' });
  const meeting = getMeeting(id);
  if (!meeting) return res.status(404).json({ error: 'meeting not found' });
  if (meeting.type !== 'ask') return res.status(400).json({ error: 'only 1:1 ask meetings support follow-up' });
  if (meeting.status === 'running') return res.status(409).json({ error: 'previous turn still running' });
  const team = getAgentTeam(meeting.team_ids[0]);
  if (!team) return res.status(400).json({ error: 'team no longer valid' });
  insertMessage(id, 'user', null, prompt);
  setMeetingStatus(id, 'running', null);
  const history = getMeetingMessages(id).map(m => ({ role: m.role, content: m.content }));
  const built = buildAskPrompt(team, history);
  setImmediate(() => processMeetingAsync(id, 'ask', [team], [built]));
  res.json({ meeting_id: id });
});

app.get('/api/meetings/:id', requireAuth, (req, res) => {
  const id = asString(req.params.id, 64);
  const meeting = getMeeting(id);
  if (!meeting) return res.status(404).json({ error: 'not found' });
  res.json(meeting);
});

app.get('/api/meetings', requireAuth, (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 30, 100);
  const rows = db.prepare(`SELECT id, type, team_ids, topic, status, created_at, updated_at FROM agent_meetings ORDER BY created_at DESC LIMIT ?`).all(limit);
  res.json({
    meetings: rows.map(r => ({
      id: r.id,
      type: r.type,
      team_ids: JSON.parse(r.team_ids),
      topic: r.topic,
      status: r.status,
      created_at: r.created_at,
      updated_at: r.updated_at,
    })),
  });
});

app.get('/api/meetings/teams/list', requireAuth, (_req, res) => {
  res.json({
    teams: AGENT_TEAMS.map(t => ({ id: t.id, label: t.label, model: t.model, focus: t.focus })),
  });
});

// ════════════════════════════════════════════════════════════════════════════
// ─── PURCHASE ORDERS (PO WORKFLOW) ──────────────────────────────────────────
// ════════════════════════════════════════════════════════════════════════════
function nextPoNumber() {
  const ymd = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const prefix = `PO-${ymd}-`;
  const last = db.prepare(
    "SELECT po_number FROM purchase_orders WHERE po_number LIKE ? ORDER BY id DESC LIMIT 1"
  ).get(prefix + '%');
  let seq = 1;
  if (last && last.po_number) {
    const m = last.po_number.match(/-(\d+)$/);
    if (m) seq = parseInt(m[1], 10) + 1;
  }
  return prefix + String(seq).padStart(4, '0');
}

function recomputePoTotal(poId) {
  const sum = db.prepare(
    'SELECT COALESCE(SUM(line_total),0) AS t FROM purchase_order_items WHERE po_id=?'
  ).get(poId);
  db.prepare('UPDATE purchase_orders SET total_amount=?, updated_at=? WHERE id=?')
    .run(sum.t || 0, Date.now(), poId);
  return sum.t || 0;
}

function poItemsFor(poId) {
  return db.prepare(`
    SELECT poi.*, i.name_ko, i.name_ar, i.unit, i.cost_per_unit
      FROM purchase_order_items poi
      JOIN ingredients i ON i.id = poi.ingredient_id
     WHERE poi.po_id = ?
     ORDER BY poi.id
  `).all(poId);
}

function poReceiptsFor(poId) {
  const receipts = db.prepare(`
    SELECT * FROM goods_receipts WHERE po_id=? ORDER BY received_at DESC
  `).all(poId);
  for (const r of receipts) {
    r.items = db.prepare(`
      SELECT gri.*, i.name_ko, i.unit
        FROM goods_receipt_items gri
        JOIN ingredients i ON i.id = gri.ingredient_id
       WHERE gri.receipt_id = ?
       ORDER BY gri.id
    `).all(r.id);
  }
  return receipts;
}

app.get('/api/po', requireAuth, (req, res) => {
  const { status, supplier_id } = req.query;
  let sql = `SELECT po.*, s.name AS supplier_name
               FROM purchase_orders po
               LEFT JOIN suppliers s ON s.id = po.supplier_id`;
  const where = [];
  const params = [];
  if (status) { where.push('po.status = ?'); params.push(status); }
  if (supplier_id) { where.push('po.supplier_id = ?'); params.push(parseInt(supplier_id, 10)); }
  if (where.length) sql += ' WHERE ' + where.join(' AND ');
  sql += ' ORDER BY po.created_at DESC LIMIT 500';
  res.json(db.prepare(sql).all(...params));
});

app.get('/api/po/:id', requireAuth, (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'invalid id' });
  const po = db.prepare(`
    SELECT po.*, s.name AS supplier_name, s.phone AS supplier_phone, s.whatsapp AS supplier_whatsapp
      FROM purchase_orders po
      LEFT JOIN suppliers s ON s.id = po.supplier_id
     WHERE po.id = ?`).get(id);
  if (!po) return res.status(404).json({ error: 'PO not found' });
  po.items = poItemsFor(id);
  po.receipts = poReceiptsFor(id);
  res.json(po);
});

app.post('/api/po', requireAuth, (req, res) => {
  const { supplier_id, notes, expected_date, items, created_by } = req.body || {};
  if (!Array.isArray(items) || items.length === 0)
    return res.status(400).json({ error: 'items required' });
  for (const it of items) {
    const q = Number(it.ordered_qty);
    const c = Number(it.unit_cost);
    if (!Number.isInteger(it.ingredient_id) || it.ingredient_id <= 0)
      return res.status(400).json({ error: 'ingredient_id invalid' });
    if (!Number.isFinite(q) || q <= 0) return res.status(400).json({ error: 'ordered_qty must be > 0' });
    if (!Number.isFinite(c) || c < 0) return res.status(400).json({ error: 'unit_cost must be >= 0' });
  }
  try {
    const out = db.transaction(() => {
      const poNumber = nextPoNumber();
      const info = db.prepare(`
        INSERT INTO purchase_orders (po_number, supplier_id, status, notes, expected_date, created_by, total_amount)
        VALUES (?,?,?,?,?,?,0)
      `).run(
        poNumber,
        supplier_id ? parseInt(supplier_id, 10) : null,
        'draft',
        notes || null,
        expected_date || null,
        created_by || null
      );
      const poId = info.lastInsertRowid;
      const ins = db.prepare(`
        INSERT INTO purchase_order_items (po_id, ingredient_id, ordered_qty, received_qty, unit_cost, line_total)
        VALUES (?,?,?,0,?,?)
      `);
      for (const it of items) {
        const lt = Number(it.ordered_qty) * Number(it.unit_cost);
        ins.run(poId, it.ingredient_id, Number(it.ordered_qty), Number(it.unit_cost), lt);
      }
      recomputePoTotal(poId);
      return poId;
    })();
    const created = db.prepare('SELECT * FROM purchase_orders WHERE id=?').get(out);
    created.items = poItemsFor(out);
    res.json({ success: true, po: created });
  } catch (e) {
    console.error('PO create error:', e);
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/po/:id', requireAuth, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const po = db.prepare('SELECT * FROM purchase_orders WHERE id=?').get(id);
  if (!po) return res.status(404).json({ error: 'PO not found' });
  if (po.status !== 'draft') return res.status(400).json({ error: 'only draft PO can be edited' });
  const { supplier_id, notes, expected_date, items } = req.body || {};
  if (!Array.isArray(items) || items.length === 0)
    return res.status(400).json({ error: 'items required' });
  try {
    db.transaction(() => {
      db.prepare(`UPDATE purchase_orders SET supplier_id=?, notes=?, expected_date=?, updated_at=? WHERE id=?`)
        .run(supplier_id ? parseInt(supplier_id, 10) : null, notes || null, expected_date || null, Date.now(), id);
      db.prepare('DELETE FROM purchase_order_items WHERE po_id=?').run(id);
      const ins = db.prepare(`
        INSERT INTO purchase_order_items (po_id, ingredient_id, ordered_qty, received_qty, unit_cost, line_total)
        VALUES (?,?,?,0,?,?)
      `);
      for (const it of items) {
        const q = Number(it.ordered_qty); const c = Number(it.unit_cost);
        if (!Number.isFinite(q) || q <= 0 || !Number.isFinite(c) || c < 0)
          throw new Error('invalid item');
        ins.run(id, it.ingredient_id, q, c, q * c);
      }
      recomputePoTotal(id);
    })();
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.post('/api/po/:id/submit', requireAuth, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const po = db.prepare('SELECT * FROM purchase_orders WHERE id=?').get(id);
  if (!po) return res.status(404).json({ error: 'PO not found' });
  if (po.status !== 'draft') return res.status(400).json({ error: 'only draft PO can be submitted' });
  db.prepare(`UPDATE purchase_orders SET status='pending_approval', submitted_at=?, updated_at=? WHERE id=?`)
    .run(Date.now(), Date.now(), id);
  res.json({ success: true });
});

app.post('/api/po/:id/approve', requireAuth, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const po = db.prepare('SELECT * FROM purchase_orders WHERE id=?').get(id);
  if (!po) return res.status(404).json({ error: 'PO not found' });
  if (po.status !== 'pending_approval')
    return res.status(400).json({ error: 'PO not in pending_approval' });
  const approvedBy = (req.body && req.body.approved_by) || 'admin';
  db.prepare(`UPDATE purchase_orders SET status='approved', approved_by=?, approved_at=?, updated_at=? WHERE id=?`)
    .run(approvedBy, Date.now(), Date.now(), id);
  res.json({ success: true });
});

app.post('/api/po/:id/cancel', requireAuth, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const po = db.prepare('SELECT * FROM purchase_orders WHERE id=?').get(id);
  if (!po) return res.status(404).json({ error: 'PO not found' });
  if (po.status === 'received' || po.status === 'cancelled')
    return res.status(400).json({ error: 'cannot cancel PO in current state' });
  db.prepare(`UPDATE purchase_orders SET status='cancelled', cancelled_at=?, updated_at=? WHERE id=?`)
    .run(Date.now(), Date.now(), id);
  res.json({ success: true });
});

app.delete('/api/po/:id', requireAuth, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const po = db.prepare('SELECT * FROM purchase_orders WHERE id=?').get(id);
  if (!po) return res.status(404).json({ error: 'PO not found' });
  if (po.status !== 'draft' && po.status !== 'cancelled')
    return res.status(400).json({ error: 'only draft or cancelled PO can be deleted' });
  db.prepare('DELETE FROM purchase_orders WHERE id=?').run(id);
  res.json({ success: true });
});

// 부분/전체 입고 — items: [{ po_item_id, qty, location_code }]
app.post('/api/po/:id/receive', requireAuth, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const po = db.prepare('SELECT * FROM purchase_orders WHERE id=?').get(id);
  if (!po) return res.status(404).json({ error: 'PO not found' });
  if (!['approved', 'partially_received'].includes(po.status))
    return res.status(400).json({ error: 'PO must be approved or partially_received' });
  const { items, notes, received_by } = req.body || {};
  if (!Array.isArray(items) || items.length === 0)
    return res.status(400).json({ error: 'items required' });

  try {
    const result = db.transaction(() => {
      const recInfo = db.prepare(`
        INSERT INTO goods_receipts (po_id, received_by, notes) VALUES (?,?,?)
      `).run(id, received_by || null, notes || null);
      const receiptId = recInfo.lastInsertRowid;
      const insGri = db.prepare(`
        INSERT INTO goods_receipt_items (receipt_id, po_item_id, ingredient_id, qty, location_code)
        VALUES (?,?,?,?,?)
      `);
      const updPoi = db.prepare(`
        UPDATE purchase_order_items SET received_qty = received_qty + ? WHERE id=?
      `);

      for (const it of items) {
        const poiId = parseInt(it.po_item_id, 10);
        const qty = Number(it.qty);
        if (!Number.isInteger(poiId) || poiId <= 0) throw new Error('po_item_id invalid');
        if (!Number.isFinite(qty) || qty <= 0) throw new Error('qty must be > 0');
        const poi = db.prepare('SELECT * FROM purchase_order_items WHERE id=? AND po_id=?').get(poiId, id);
        if (!poi) throw new Error('po_item not in this PO');
        const remaining = poi.ordered_qty - poi.received_qty;
        if (qty > remaining + 1e-9)
          throw new Error(`qty ${qty} exceeds remaining ${remaining} for item ${poiId}`);
        let locCode = it.location_code ? String(it.location_code).trim().toUpperCase() : 'UNSET';
        if (locCode !== 'UNSET' && !LOC_CODE_RE.test(locCode))
          throw new Error(`invalid location_code ${locCode}`);

        // 1) 입고 라인 기록
        insGri.run(receiptId, poiId, poi.ingredient_id, qty, locCode);
        // 2) PO 라인 received_qty 업데이트
        updPoi.run(qty, poiId);

        // 3) 실제 재고 반영 (위치별)
        const locRow = db.prepare(
          'SELECT id, qty FROM ingredient_locations WHERE ingredient_id=? AND location_code=?'
        ).get(poi.ingredient_id, locCode);
        if (locRow) {
          db.prepare('UPDATE ingredient_locations SET qty = qty + ? WHERE id=?').run(qty, locRow.id);
        } else {
          db.prepare(
            'INSERT INTO ingredient_locations (ingredient_id, location_code, qty) VALUES (?,?,?)'
          ).run(poi.ingredient_id, locCode, qty);
        }
        recalcIngredientQty(poi.ingredient_id);

        // 4) inventory_history 기록
        const ing = db.prepare('SELECT name_ko FROM ingredients WHERE id=?').get(poi.ingredient_id);
        db.prepare(
          'INSERT INTO inventory_history (ingredient_id, ingredient_name, change_type, quantity, reason) VALUES (?,?,?,?,?)'
        ).run(poi.ingredient_id, ing ? ing.name_ko : '', 'in', qty, `PO ${po.po_number} @${locCode}`);

        // 5) 단가 변동 이력 (입고 시 unit_cost 가 다르면 기록)
        if (Math.abs(poi.unit_cost - 0) > 1e-9) {
          db.prepare(
            'INSERT INTO ingredient_cost_history (ingredient_id, cost_per_unit) VALUES (?,?)'
          ).run(poi.ingredient_id, poi.unit_cost);
        }
      }

      // PO 상태 갱신
      const allItems = db.prepare('SELECT ordered_qty, received_qty FROM purchase_order_items WHERE po_id=?').all(id);
      const fullyReceived = allItems.every(r => r.received_qty + 1e-9 >= r.ordered_qty);
      const newStatus = fullyReceived ? 'received' : 'partially_received';
      db.prepare('UPDATE purchase_orders SET status=?, updated_at=? WHERE id=?')
        .run(newStatus, Date.now(), id);

      return { receiptId, newStatus };
    })();
    res.json({ success: true, receipt_id: result.receiptId, status: result.newStatus });
  } catch (e) {
    console.error('PO receive error:', e);
    res.status(400).json({ error: e.message });
  }
});

// ════════════════════════════════════════════════════════════════════════════
// ─── STOCK COUNTS (PHYSICAL INVENTORY) ──────────────────────────────────────
// ════════════════════════════════════════════════════════════════════════════
function computeUnitNormalizedCost(ing) {
  // Recipe deduction divides by capacity_ml when set; align variance valuation.
  if (ing.capacity_ml && ing.capacity_ml > 0) return ing.cost_per_unit / ing.capacity_ml;
  return ing.cost_per_unit;
}

app.get('/api/stock-counts', requireAuth, (req, res) => {
  const rows = db.prepare(`
    SELECT sc.*, COUNT(sci.id) AS item_count
      FROM stock_counts sc
      LEFT JOIN stock_count_items sci ON sci.count_id = sc.id
     GROUP BY sc.id
     ORDER BY sc.created_at DESC LIMIT 200
  `).all();
  res.json(rows);
});

app.get('/api/stock-counts/:id', requireAuth, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const sc = db.prepare('SELECT * FROM stock_counts WHERE id=?').get(id);
  if (!sc) return res.status(404).json({ error: 'count not found' });
  sc.items = db.prepare(`
    SELECT sci.*, i.name_ko, i.name_ar, i.unit, i.category, i.cost_per_unit, i.capacity_ml
      FROM stock_count_items sci
      JOIN ingredients i ON i.id = sci.ingredient_id
     WHERE sci.count_id = ?
     ORDER BY i.category, i.name_ko
  `).all(id);
  res.json(sc);
});

// 새 실사 시작: 현재 ingredient 스냅샷 생성
app.post('/api/stock-counts', requireAuth, (req, res) => {
  const { count_name, notes, started_by, category } = req.body || {};
  if (!count_name || !String(count_name).trim())
    return res.status(400).json({ error: 'count_name required' });
  try {
    const out = db.transaction(() => {
      const info = db.prepare(`
        INSERT INTO stock_counts (count_name, status, notes, started_by) VALUES (?, 'open', ?, ?)
      `).run(String(count_name).trim(), notes || null, started_by || null);
      const countId = info.lastInsertRowid;
      let ings;
      if (category && String(category).trim()) {
        ings = db.prepare('SELECT * FROM ingredients WHERE category=? ORDER BY name_ko').all(category);
      } else {
        ings = db.prepare('SELECT * FROM ingredients ORDER BY category, name_ko').all();
      }
      const insSci = db.prepare(`
        INSERT INTO stock_count_items (count_id, ingredient_id, expected_qty)
        VALUES (?,?,?)
      `);
      for (const ing of ings) insSci.run(countId, ing.id, ing.current_qty || 0);
      return countId;
    })();
    res.json({ success: true, id: out });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 실사 항목 카운트 입력 (batch)
app.put('/api/stock-counts/:id/items', requireAuth, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const sc = db.prepare('SELECT * FROM stock_counts WHERE id=?').get(id);
  if (!sc) return res.status(404).json({ error: 'count not found' });
  if (sc.status !== 'open') return res.status(400).json({ error: 'count not editable' });
  const { items } = req.body || {};
  if (!Array.isArray(items)) return res.status(400).json({ error: 'items required' });
  try {
    db.transaction(() => {
      const upd = db.prepare(`
        UPDATE stock_count_items
           SET counted_qty=?, notes=?
         WHERE count_id=? AND ingredient_id=?
      `);
      for (const it of items) {
        const q = it.counted_qty == null ? null : Number(it.counted_qty);
        if (q != null && (!Number.isFinite(q) || q < 0))
          throw new Error('counted_qty invalid');
        upd.run(q, it.notes || null, id, it.ingredient_id);
      }
    })();
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// 제출: variance 계산 (재고 변경은 reconcile에서)
app.post('/api/stock-counts/:id/submit', requireAuth, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const sc = db.prepare('SELECT * FROM stock_counts WHERE id=?').get(id);
  if (!sc) return res.status(404).json({ error: 'count not found' });
  if (sc.status !== 'open') return res.status(400).json({ error: 'only open counts can be submitted' });

  try {
    const totalVar = db.transaction(() => {
      const items = db.prepare(`
        SELECT sci.*, i.cost_per_unit, i.capacity_ml
          FROM stock_count_items sci
          JOIN ingredients i ON i.id = sci.ingredient_id
         WHERE sci.count_id=?
      `).all(id);
      const upd = db.prepare(`
        UPDATE stock_count_items SET variance_qty=?, variance_value=? WHERE id=?
      `);
      let total = 0;
      for (const it of items) {
        if (it.counted_qty == null) continue; // 미카운트는 건너뜀
        const vQty = it.counted_qty - it.expected_qty;
        const unitCost = computeUnitNormalizedCost({ cost_per_unit: it.cost_per_unit, capacity_ml: it.capacity_ml });
        const vVal = vQty * unitCost;
        upd.run(vQty, vVal, it.id);
        total += vVal;
      }
      db.prepare(`UPDATE stock_counts SET status='submitted', submitted_at=?, total_variance_value=? WHERE id=?`)
        .run(Date.now(), total, id);
      return total;
    })();
    res.json({ success: true, total_variance_value: totalVar });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 정산: 실사 결과를 실제 재고에 반영(자동 보정 + history 기록)
app.post('/api/stock-counts/:id/reconcile', requireAuth, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const sc = db.prepare('SELECT * FROM stock_counts WHERE id=?').get(id);
  if (!sc) return res.status(404).json({ error: 'count not found' });
  if (sc.status !== 'submitted')
    return res.status(400).json({ error: 'only submitted counts can be reconciled' });
  const reconciledBy = (req.body && req.body.reconciled_by) || 'admin';
  try {
    db.transaction(() => {
      const items = db.prepare(`
        SELECT sci.*, i.name_ko
          FROM stock_count_items sci
          JOIN ingredients i ON i.id = sci.ingredient_id
         WHERE sci.count_id=? AND sci.counted_qty IS NOT NULL
      `).all(id);
      for (const it of items) {
        const delta = (it.counted_qty || 0) - (it.expected_qty || 0);
        if (Math.abs(delta) < 1e-9) continue;
        applyStockDelta(it.ingredient_id, delta);
        db.prepare(
          'INSERT INTO inventory_history (ingredient_id, ingredient_name, change_type, quantity, reason) VALUES (?,?,?,?,?)'
        ).run(
          it.ingredient_id,
          it.name_ko,
          delta >= 0 ? 'in' : 'out',
          Math.abs(delta),
          `STOCK_COUNT #${id} variance ${delta >= 0 ? '+' : ''}${delta.toFixed(3)}`
        );
      }
      db.prepare(`UPDATE stock_counts SET status='reconciled', reconciled_by=?, reconciled_at=? WHERE id=?`)
        .run(reconciledBy, Date.now(), id);
    })();
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/stock-counts/:id/cancel', requireAuth, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const sc = db.prepare('SELECT * FROM stock_counts WHERE id=?').get(id);
  if (!sc) return res.status(404).json({ error: 'count not found' });
  if (sc.status === 'reconciled')
    return res.status(400).json({ error: 'cannot cancel reconciled count' });
  db.prepare(`UPDATE stock_counts SET status='cancelled' WHERE id=?`).run(id);
  res.json({ success: true });
});

app.delete('/api/stock-counts/:id', requireAuth, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const sc = db.prepare('SELECT * FROM stock_counts WHERE id=?').get(id);
  if (!sc) return res.status(404).json({ error: 'count not found' });
  if (sc.status !== 'open' && sc.status !== 'cancelled')
    return res.status(400).json({ error: 'only open/cancelled counts can be deleted' });
  db.prepare('DELETE FROM stock_counts WHERE id=?').run(id);
  res.json({ success: true });
});

// ════════════════════════════════════════════════════════════════════════════
// ─── PROFITABILITY DASHBOARD (ADVANCED) ─────────────────────────────────────
// ════════════════════════════════════════════════════════════════════════════
function periodToRange(period) {
  const days = period === 'day' ? 1
    : period === 'week' ? 7
      : period === '3month' ? 90
        : period === 'year' ? 365
          : 30; // default month
  const now = new Date();
  const todayBgd = new Date(now.getTime() + 3 * 60 * 60 * 1000);
  const todayStr = todayBgd.toISOString().slice(0, 10);
  const start = new Date(todayBgd);
  start.setDate(start.getDate() - (days - 1));
  return { startStr: start.toISOString().slice(0, 10), endStr: todayStr, days };
}

function computeMenuCostMap() {
  // menu_item -> { cost: total_recipe_cost, ingredients: [...] }
  const rows = db.prepare(`
    SELECT r.menu_item, r.quantity, i.id AS ingredient_id, i.name_ko, i.cost_per_unit, i.capacity_ml
      FROM recipes r
      JOIN ingredients i ON i.id = r.ingredient_id
  `).all();
  const map = new Map();
  for (const r of rows) {
    const unitCost = r.capacity_ml > 0 ? r.cost_per_unit / r.capacity_ml : r.cost_per_unit;
    const lineCost = r.quantity * unitCost;
    if (!map.has(r.menu_item)) map.set(r.menu_item, { cost: 0, ingredients: [] });
    const e = map.get(r.menu_item);
    e.cost += lineCost;
    e.ingredients.push({ ingredient_id: r.ingredient_id, name_ko: r.name_ko, line_cost: lineCost, qty: r.quantity });
  }
  return map;
}

function computeMenuSalesInRange(startStr, endStr) {
  // menu_item -> { qty, revenue } from completed orders minus refunds
  const orders = db.prepare(`
    SELECT items, total
      FROM orders
     WHERE status != 'cancelled'
       AND date(datetime(timestamp/1000, 'unixepoch', '+3 hours')) BETWEEN ? AND ?
  `).all(startStr, endStr);
  const refunds = db.prepare(`
    SELECT r.lines, r.amount
      FROM refunds r
      JOIN orders o ON o.id = r.order_id
     WHERE o.status != 'cancelled'
       AND date(datetime(o.timestamp/1000, 'unixepoch', '+3 hours')) BETWEEN ? AND ?
  `).all(startStr, endStr);
  const map = new Map();
  for (const o of orders) {
    let items = []; try { items = JSON.parse(o.items || '[]'); } catch (e) { console.warn('[profit] order.items JSON parse failed, order_id=', o.id, e.message); }
    for (const it of (items || [])) {
      const nm = it && it.name; if (!nm) continue;
      const q = Number(it.qty ?? it.quantity) || 0;
      const p = Number(it.price) || 0;
      if (!map.has(nm)) map.set(nm, { qty: 0, revenue: 0 });
      const e = map.get(nm);
      e.qty += q;
      e.revenue += q * p;
    }
  }
  for (const r of refunds) {
    let lines = []; try { lines = JSON.parse(r.lines || '[]'); } catch (e) { console.warn('[profit] refund.lines JSON parse failed, refund_id=', r.id, e.message); }
    for (const ln of (lines || [])) {
      const nm = ln && ln.name; if (!nm || !map.has(nm)) continue;
      const q = Number(ln.qty ?? ln.quantity) || 0;
      const p = Number(ln.price) || 0;
      const e = map.get(nm);
      e.qty -= q;
      e.revenue -= q * p;
      if (e.qty <= 0 && e.revenue <= 0) map.delete(nm);
    }
  }
  return map;
}

// 메인 수익성 요약
app.get('/api/profitability/summary', requireAuth, (req, res) => {
  const { period } = req.query;
  const { startStr, endStr } = periodToRange(period);
  const costMap = computeMenuCostMap();
  const salesMap = computeMenuSalesInRange(startStr, endStr);
  const prices = db.prepare('SELECT menu_item, selling_price FROM menu_prices').all();
  const priceMap = new Map(prices.map(p => [p.menu_item, p.selling_price]));

  const allMenus = new Set([...costMap.keys(), ...salesMap.keys(), ...priceMap.keys()]);
  const rows = [];
  let totalRevenue = 0, totalCost = 0, totalQty = 0;
  for (const menu of allMenus) {
    const cost = costMap.get(menu)?.cost || 0;
    const price = priceMap.get(menu) || 0;
    const sale = salesMap.get(menu) || { qty: 0, revenue: 0 };
    const margin = price - cost;
    const marginRate = price > 0 ? (margin / price) * 100 : 0;
    const grossProfit = sale.qty * margin;
    totalRevenue += sale.revenue;
    totalCost += sale.qty * cost;
    totalQty += sale.qty;
    rows.push({
      menu_item: menu,
      cost: Math.round(cost),
      selling_price: Math.round(price),
      margin: Math.round(margin),
      margin_rate: Math.round(marginRate * 10) / 10,
      qty_sold: sale.qty,
      revenue: Math.round(sale.revenue),
      gross_profit: Math.round(grossProfit),
    });
  }
  rows.sort((a, b) => b.gross_profit - a.gross_profit);
  const totalProfit = totalRevenue - totalCost;
  res.json({
    period: { startStr, endStr },
    rows,
    totals: {
      revenue: Math.round(totalRevenue),
      cost: Math.round(totalCost),
      gross_profit: Math.round(totalProfit),
      margin_rate: totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 1000) / 10 : 0,
      qty_sold: totalQty,
    },
  });
});

// ABC 분석: 매출 누적 비중으로 A(80%)/B(95%)/C(나머지) 분류
app.get('/api/profitability/abc', requireAuth, (req, res) => {
  const { period } = req.query;
  const { startStr, endStr } = periodToRange(period);
  const costMap = computeMenuCostMap();
  const salesMap = computeMenuSalesInRange(startStr, endStr);
  const arr = [];
  for (const [menu, s] of salesMap.entries()) {
    const cost = costMap.get(menu)?.cost || 0;
    arr.push({ menu_item: menu, qty: s.qty, revenue: s.revenue, profit: s.revenue - cost * s.qty });
  }
  arr.sort((a, b) => b.revenue - a.revenue);
  const total = arr.reduce((s, r) => s + r.revenue, 0) || 1;
  let acc = 0;
  for (const r of arr) {
    acc += r.revenue;
    const ratio = acc / total;
    r.cumulative_ratio = Math.round(ratio * 1000) / 10;
    r.abc_class = ratio <= 0.8 ? 'A' : ratio <= 0.95 ? 'B' : 'C';
    r.revenue = Math.round(r.revenue);
    r.profit = Math.round(r.profit);
  }
  res.json({ period: { startStr, endStr }, total_revenue: Math.round(total), rows: arr });
});

// 메뉴별 시계열: 일별 판매 + 마진
app.get('/api/profitability/menu/:menu', requireAuth, (req, res) => {
  const menu = req.params.menu;
  const { period } = req.query;
  const { startStr, endStr } = periodToRange(period);
  const costMap = computeMenuCostMap();
  const cost = costMap.get(menu)?.cost || 0;
  const priceRow = db.prepare('SELECT selling_price FROM menu_prices WHERE menu_item=?').get(menu);
  const price = priceRow?.selling_price || 0;

  const orders = db.prepare(`
    SELECT date(datetime(timestamp/1000, 'unixepoch', '+3 hours')) AS day, items
      FROM orders
     WHERE status != 'cancelled'
       AND date(datetime(timestamp/1000, 'unixepoch', '+3 hours')) BETWEEN ? AND ?
  `).all(startStr, endStr);
  const dayMap = new Map();
  for (const o of orders) {
    let items = []; try { items = JSON.parse(o.items || '[]'); } catch (e) { console.warn('[profit-trend] order.items JSON parse failed', e.message); }
    for (const it of (items || [])) {
      if (!it || it.name !== menu) continue;
      const q = Number(it.qty ?? it.quantity) || 0;
      const p = Number(it.price) || price;
      if (!dayMap.has(o.day)) dayMap.set(o.day, { qty: 0, revenue: 0 });
      const e = dayMap.get(o.day);
      e.qty += q;
      e.revenue += q * p;
    }
  }
  const series = Array.from(dayMap.entries())
    .sort((a, b) => a[0] < b[0] ? -1 : 1)
    .map(([day, v]) => ({
      day,
      qty: v.qty,
      revenue: Math.round(v.revenue),
      cost: Math.round(v.qty * cost),
      profit: Math.round(v.revenue - v.qty * cost),
    }));
  res.json({
    menu_item: menu,
    cost: Math.round(cost),
    selling_price: Math.round(price),
    margin: Math.round(price - cost),
    margin_rate: price > 0 ? Math.round(((price - cost) / price) * 1000) / 10 : 0,
    series,
  });
});

// 가격 시뮬레이터: 새 가격에서 손익 변화 + 손익분기 판매수량
app.get('/api/profitability/simulate', requireAuth, (req, res) => {
  const menu = req.query.menu_item;
  const newPrice = Number(req.query.new_price);
  const fixedCostBudget = Number(req.query.fixed_cost) || 0;
  if (!menu || !Number.isFinite(newPrice) || newPrice < 0)
    return res.status(400).json({ error: 'menu_item and new_price required' });
  const costMap = computeMenuCostMap();
  const cost = costMap.get(menu)?.cost || 0;
  const priceRow = db.prepare('SELECT selling_price FROM menu_prices WHERE menu_item=?').get(menu);
  const oldPrice = priceRow?.selling_price || 0;
  const oldMargin = oldPrice - cost;
  const newMargin = newPrice - cost;
  const breakEvenQty = newMargin > 0 ? Math.ceil(fixedCostBudget / newMargin) : null;
  res.json({
    menu_item: menu,
    cost: Math.round(cost),
    old_price: Math.round(oldPrice),
    new_price: Math.round(newPrice),
    old_margin: Math.round(oldMargin),
    new_margin: Math.round(newMargin),
    margin_delta: Math.round(newMargin - oldMargin),
    new_margin_rate: newPrice > 0 ? Math.round((newMargin / newPrice) * 1000) / 10 : 0,
    break_even_qty: breakEvenQty,
  });
});

// 재료가 메뉴 마진에 미치는 영향
app.get('/api/profitability/ingredient-impact', requireAuth, (req, res) => {
  const menu = req.query.menu_item;
  if (!menu) return res.status(400).json({ error: 'menu_item required' });
  const priceRow = db.prepare('SELECT selling_price FROM menu_prices WHERE menu_item=?').get(menu);
  const price = priceRow?.selling_price || 0;
  const costMap = computeMenuCostMap();
  const entry = costMap.get(menu);
  if (!entry) return res.json({ menu_item: menu, selling_price: price, items: [] });
  const totalCost = entry.cost;
  const items = entry.ingredients.map(i => ({
    ingredient_id: i.ingredient_id,
    name_ko: i.name_ko,
    line_cost: Math.round(i.line_cost),
    cost_share: totalCost > 0 ? Math.round((i.line_cost / totalCost) * 1000) / 10 : 0,
    margin_share: price > 0 ? Math.round((i.line_cost / price) * 1000) / 10 : 0,
  })).sort((a, b) => b.line_cost - a.line_cost);
  res.json({
    menu_item: menu,
    selling_price: Math.round(price),
    total_cost: Math.round(totalCost),
    margin: Math.round(price - totalCost),
    items,
  });
});

// 재료 단가 변동 추이
app.get('/api/profitability/cost-trend', requireAuth, (req, res) => {
  const ingId = parseInt(req.query.ingredient_id, 10);
  if (!Number.isInteger(ingId) || ingId <= 0)
    return res.status(400).json({ error: 'ingredient_id required' });
  const days = parseInt(req.query.days, 10) || 90;
  const cutoff = Date.now() - days * 24 * 3600 * 1000;
  const rows = db.prepare(`
    SELECT cost_per_unit, recorded_at
      FROM ingredient_cost_history
     WHERE ingredient_id=? AND recorded_at >= ?
     ORDER BY recorded_at ASC
  `).all(ingId, cutoff);
  res.json({ ingredient_id: ingId, rows });
});

// 실효 마진(폐기/환불 차감 후)
app.get('/api/profitability/effective-margin', requireAuth, (req, res) => {
  const { period } = req.query;
  const { startStr, endStr } = periodToRange(period);
  const startMs = new Date(startStr + 'T00:00:00+03:00').getTime();
  const endMs = new Date(endStr + 'T23:59:59+03:00').getTime();
  const costMap = computeMenuCostMap();
  const salesMap = computeMenuSalesInRange(startStr, endStr);

  let revenue = 0, cogs = 0;
  for (const [menu, s] of salesMap.entries()) {
    revenue += s.revenue;
    cogs += (costMap.get(menu)?.cost || 0) * s.qty;
  }

  // 환불 손실 (취소 주문 외 추가 환불)
  const refundSum = db.prepare(`
    SELECT COALESCE(SUM(amount),0) AS t FROM refunds
     WHERE created_at BETWEEN ? AND ?
  `).get(startMs, endMs);

  // 폐기/실사 차이로 인한 비용 (history reason 기반 추정)
  const wasteSum = db.prepare(`
    SELECT COALESCE(SUM(quantity * COALESCE(i.cost_per_unit / NULLIF(i.capacity_ml,0), i.cost_per_unit)), 0) AS t
      FROM inventory_history h
      LEFT JOIN ingredients i ON i.id = h.ingredient_id
     WHERE h.change_type='out'
       AND (h.reason LIKE 'STOCK_COUNT%' OR h.reason LIKE '%waste%' OR h.reason LIKE '%spoil%')
       AND h.created_at BETWEEN datetime(?, 'unixepoch') AND datetime(?, 'unixepoch')
  `).get(Math.floor(startMs / 1000), Math.floor(endMs / 1000));

  const grossProfit = revenue - cogs;
  const effectiveProfit = grossProfit - (refundSum.t || 0) - (wasteSum.t || 0);
  res.json({
    period: { startStr, endStr },
    revenue: Math.round(revenue),
    cogs: Math.round(cogs),
    gross_profit: Math.round(grossProfit),
    refunds: Math.round(refundSum.t || 0),
    waste_estimate: Math.round(wasteSum.t || 0),
    effective_profit: Math.round(effectiveProfit),
    effective_margin_rate: revenue > 0 ? Math.round((effectiveProfit / revenue) * 1000) / 10 : 0,
  });
});

// 메뉴 가격 이력
app.get('/api/profitability/price-history/:menu', requireAuth, (req, res) => {
  const menu = req.params.menu;
  const days = parseInt(req.query.days, 10) || 365;
  const cutoff = Date.now() - days * 24 * 3600 * 1000;
  const rows = db.prepare(`
    SELECT selling_price, recorded_at FROM menu_price_history
     WHERE menu_item=? AND recorded_at >= ?
     ORDER BY recorded_at ASC
  `).all(menu, cutoff);
  res.json({ menu_item: menu, rows });
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
