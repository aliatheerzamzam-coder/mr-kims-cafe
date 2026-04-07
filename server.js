const express = require('express');
const Database = require('better-sqlite3');
const crypto = require('crypto');
const path = require('path');

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
    items          TEXT NOT NULL,
    total          REAL NOT NULL,
    created_at     DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS order_counter (
    id    INTEGER PRIMARY KEY CHECK (id = 1),
    value INTEGER NOT NULL DEFAULT 1
  );
`);

// 기본 데이터
if (!db.prepare("SELECT value FROM settings WHERE key='admin_pw'").get()) {
  const hash = crypto.createHash('sha256').update('1234').digest('hex');
  db.prepare("INSERT INTO settings (key, value) VALUES ('admin_pw', ?)").run(hash);
}
if (!db.prepare("SELECT id FROM order_counter WHERE id=1").get()) {
  db.prepare("INSERT INTO order_counter (id, value) VALUES (1, 1)").run();
}

// ─── 세션 (메모리) ─────────────────────────────────────────────────────────────
const sessions = new Map();

// ─── SSE 클라이언트 목록 (캐셔 실시간 알림용) ───────────────────────────────────
const sseClients = new Set();

function broadcastSSE(data) {
  const msg = `data: ${JSON.stringify(data)}\n\n`;
  sseClients.forEach(res => { try { res.write(msg); } catch (_) {} });
}

// ─── 미들웨어 ──────────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.static(path.join(__dirname)));

function requireAuth(req, res, next) {
  const token = req.headers['x-auth-token'];
  if (!token || !sessions.has(token)) {
    return res.status(401).json({ error: '관리자 로그인이 필요합니다' });
  }
  next();
}

// ─── AUTH ─────────────────────────────────────────────────────────────────────
app.post('/api/auth/login', (req, res) => {
  const hash = crypto.createHash('sha256').update(req.body.password || '').digest('hex');
  const stored = db.prepare("SELECT value FROM settings WHERE key='admin_pw'").get();
  if (stored?.value === hash) {
    const token = crypto.randomBytes(32).toString('hex');
    sessions.set(token, Date.now());
    res.json({ success: true, token });
  } else {
    res.status(401).json({ success: false, error: '비밀번호가 틀렸습니다' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  sessions.delete(req.headers['x-auth-token']);
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

// ─── ORDERS ───────────────────────────────────────────────────────────────────

// 주문 생성 (웹사이트 → 서버)
app.post('/api/orders', (req, res) => {
  const { type, tableNum, customerName, customerPhone, items, total } = req.body;
  if (!type || !items?.length || total == null)
    return res.status(400).json({ error: '주문 데이터가 올바르지 않습니다' });

  const counter = db.prepare("SELECT value FROM order_counter WHERE id=1").get();
  const num = counter.value;
  db.prepare("UPDATE order_counter SET value=value+1 WHERE id=1").run();

  const id = Date.now().toString() + Math.random().toString(36).slice(2, 6);
  db.prepare(`
    INSERT INTO orders (id, num, timestamp, status, type, table_num, customer_name, customer_phone, items, total)
    VALUES (?,?,?,?,?,?,?,?,?,?)
  `).run(id, num, Date.now(), 'new', type,
    tableNum || null, customerName || null, customerPhone || null,
    JSON.stringify(items), total);

  const order = db.prepare("SELECT * FROM orders WHERE id=?").get(id);
  const parsed = parseOrder(order);

  // SSE로 캐셔에 실시간 알림
  broadcastSSE({ type: 'new_order', order: parsed });

  res.json({ success: true, order: parsed });
});

// 주문 목록 조회
app.get('/api/orders', (req, res) => {
  const { date, status } = req.query;
  let sql = 'SELECT * FROM orders';
  const params = [];
  const conditions = [];

  if (date) {
    conditions.push("date(created_at) = ?");
    params.push(date);
  }
  if (status) {
    conditions.push("status = ?");
    params.push(status);
  }
  if (conditions.length) sql += ' WHERE ' + conditions.join(' AND ');
  sql += ' ORDER BY timestamp DESC';

  const rows = db.prepare(sql).all(...params);
  res.json(rows.map(parseOrder));
});

// 주문 상태 변경 (캐셔 → 서버)
app.put('/api/orders/:id/status', (req, res) => {
  const { status } = req.body;
  if (!['new', 'making', 'done', 'cancelled'].includes(status))
    return res.status(400).json({ error: '유효하지 않은 상태' });
  db.prepare("UPDATE orders SET status=? WHERE id=?").run(status, req.params.id);
  const order = db.prepare("SELECT * FROM orders WHERE id=?").get(req.params.id);
  if (!order) return res.status(404).json({ error: '주문 없음' });
  const parsed = parseOrder(order);
  broadcastSSE({ type: 'order_updated', order: parsed });
  res.json({ success: true, order: parsed });
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
  res.json({ success: true, warnings: errors });
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
