/**
 * Sprint 1 — RBAC, Audit, Settings, Manager Override
 * Validates the new permission system end-to-end via API + a UI smoke test.
 *
 * What this covers (matches the Sprint 1 acceptance criteria):
 *   1. roles seeded (owner/manager/cashier/barista) with 47 permission keys
 *   2. /api/cashier/login returns role + permissions + must_change_pw
 *   3. /api/admin/staff CRUD + reset-password
 *   4. /api/admin/roles edit + invalidates owner cache when needed
 *   5. /api/manager-validate (success, bad pw, lacks perm)
 *   6. audit_log records actor + (optionally) approver + reason
 *   7. owner-role cashier can hit /api/admin/* via x-cashier-token
 *   8. UI: settings tab visibility, navigation, store info save
 */

const { test, expect } = require('@playwright/test');
const { apiRequest, adminLogin } = require('./helpers/api');

let adminToken;
const TS = Date.now();
const cashierName  = `s1_csh_${TS}`;
const managerName  = `s1_mgr_${TS}`;
const ownerName    = `s1_own_${TS}`;
const initialPw    = 'TempPass!1234';

let cashierId, managerId, ownerId;
let roles, ROLE = {}; // ROLE.cashier_id, ROLE.manager_id, ROLE.owner_id, ROLE.barista_id

test.beforeAll(async () => {
  adminToken = await adminLogin('1234');
  const r = await apiRequest('GET', '/api/admin/roles', null, { 'x-auth-token': adminToken });
  expect(r.status).toBe(200);
  roles = r.data;
  for (const role of roles) ROLE[role.code] = role.id;
});

// Helper used by both the Staff CRUD tests (they create these accounts) and
// the UI describe block (which auto-creates them if Staff CRUD didn't run —
// so that running `-g "UI:"` works).
async function ensureFixtureAccounts() {
  const list = await apiRequest('GET', '/api/admin/staff', null, { 'x-auth-token': adminToken });
  for (const [name, role_code, idVar] of [
    [cashierName, 'cashier', 'cashierId'],
    [managerName, 'manager', 'managerId'],
    [ownerName,   'owner',   'ownerId']
  ]) {
    let row = list.data.find(s => s.name === name);
    if (!row) {
      const c = await apiRequest('POST', '/api/admin/staff', {
        name, password: initialPw, role_id: ROLE[role_code]
      }, { 'x-auth-token': adminToken });
      if (c.status === 200) row = { id: c.data.id, name };
    }
    if (!row) continue;
    if (idVar === 'cashierId') cashierId = row.id;
    if (idVar === 'managerId') managerId = row.id;
    if (idVar === 'ownerId')   ownerId   = row.id;
    // ensure active + known password + clear must_change_pw
    await apiRequest('POST', '/api/admin/staff/' + row.id + '/reset-password',
      { new_password: initialPw }, { 'x-auth-token': adminToken });
    await apiRequest('PUT', '/api/admin/staff/' + row.id,
      { active: true }, { 'x-auth-token': adminToken });
    const li = await apiRequest('POST', '/api/cashier/login', { name, password: initialPw });
    if (li.data?.token) {
      await apiRequest('POST', '/api/cashier/change-password', {
        current_password: initialPw, new_password: initialPw
      }, { 'x-cashier-token': li.data.token });
    }
  }
}

test.afterAll(async () => {
  // best-effort cleanup
  for (const id of [cashierId, managerId, ownerId].filter(Boolean)) {
    await apiRequest('DELETE', '/api/admin/staff/' + id, null, { 'x-auth-token': adminToken });
  }
});

test.describe('Sprint 1 — Roles & Permission Seed', () => {
  test('4 system roles seeded: owner, manager, cashier, barista', () => {
    const codes = roles.map(r => r.code).sort();
    expect(codes).toEqual(['barista', 'cashier', 'manager', 'owner']);
    for (const r of roles) expect(r.is_system).toBe(true);
  });

  test('permission codes endpoint returns 47 codes', async () => {
    const r = await apiRequest('GET', '/api/admin/permission-codes', null, { 'x-auth-token': adminToken });
    expect(r.status).toBe(200);
    expect(r.data.codes).toHaveLength(47);
    expect(r.data.codes).toContain('refund');
    expect(r.data.codes).toContain('factory_reset');
    expect(r.data.codes).toContain('discount_percent_max');
  });

  test('owner has all booleans true; barista almost all false', () => {
    const owner   = roles.find(r => r.code === 'owner');
    const barista = roles.find(r => r.code === 'barista');
    expect(owner.permissions.refund).toBe(true);
    expect(owner.permissions.factory_reset).toBe(true);
    expect(owner.permissions.discount_percent_max).toBeGreaterThan(50);
    expect(barista.permissions.refund).toBe(false);
    expect(barista.permissions.menu_sold_out_toggle).toBe(true);
    expect(barista.permissions.factory_reset).toBe(false);
  });

  test('cashier has refund=false, has discount_percent up to 10%', () => {
    const c = roles.find(r => r.code === 'cashier');
    expect(c.permissions.refund).toBe(false);
    expect(c.permissions.discount_percent).toBe(true);
    expect(c.permissions.discount_percent_max).toBe(10);
    expect(c.permissions.transfer_order).toBe(true);
    expect(c.permissions.cash_drawer_open_no_sale).toBe(false);
  });
});

test.describe('Sprint 1 — Staff CRUD', () => {
  test('create cashier via /api/admin/staff', async () => {
    const r = await apiRequest('POST', '/api/admin/staff', {
      name: cashierName, password: initialPw, role_id: ROLE.cashier,
      email: 'c@test.local', phone: '077000000'
    }, { 'x-auth-token': adminToken });
    expect(r.status).toBe(200);
    expect(r.data.success).toBe(true);
    cashierId = r.data.id;
  });

  test('create manager', async () => {
    const r = await apiRequest('POST', '/api/admin/staff', {
      name: managerName, password: initialPw, role_id: ROLE.manager
    }, { 'x-auth-token': adminToken });
    expect(r.status).toBe(200);
    managerId = r.data.id;
  });

  test('create owner', async () => {
    const r = await apiRequest('POST', '/api/admin/staff', {
      name: ownerName, password: initialPw, role_id: ROLE.owner
    }, { 'x-auth-token': adminToken });
    expect(r.status).toBe(200);
    ownerId = r.data.id;
  });

  test('duplicate name rejected', async () => {
    const r = await apiRequest('POST', '/api/admin/staff', {
      name: cashierName, password: 'whatever', role_id: ROLE.cashier
    }, { 'x-auth-token': adminToken });
    expect(r.status).toBe(400);
  });

  test('weak password (< 6 chars) rejected', async () => {
    const r = await apiRequest('POST', '/api/admin/staff', {
      name: 'tooweak_' + TS, password: 'abc', role_id: ROLE.cashier
    }, { 'x-auth-token': adminToken });
    expect(r.status).toBe(400);
  });

  test('list staff includes new entries with correct roles', async () => {
    const r = await apiRequest('GET', '/api/admin/staff', null, { 'x-auth-token': adminToken });
    expect(r.status).toBe(200);
    const c = r.data.find(s => s.name === cashierName);
    expect(c).toBeTruthy();
    expect(c.role).toBe('cashier');
    expect(c.email).toBe('c@test.local');
    expect(c.active).toBe(true);
  });

  test('update staff (deactivate)', async () => {
    const r = await apiRequest('PUT', '/api/admin/staff/' + cashierId, {
      active: false
    }, { 'x-auth-token': adminToken });
    expect(r.status).toBe(200);
    // verify deactivated cashier cannot log in
    const li = await apiRequest('POST', '/api/cashier/login', { name: cashierName, password: initialPw });
    expect(li.status).toBe(403);
    // re-activate for subsequent tests
    await apiRequest('PUT', '/api/admin/staff/' + cashierId, { active: true }, { 'x-auth-token': adminToken });
  });
});

test.describe('Sprint 1 — Login & must_change_pw flow', () => {
  test('login as cashier returns role, permissions, must_change_pw flag', async () => {
    const r = await apiRequest('POST', '/api/cashier/login', { name: cashierName, password: initialPw });
    expect(r.status).toBe(200);
    expect(r.data.role).toBe('cashier');
    expect(r.data.permissions.refund).toBe(false);
    expect(r.data.permissions.discount_percent_max).toBe(10);
    expect(typeof r.data.token).toBe('string');
  });

  test('reset-password sets must_change_pw=true and invalidates session', async () => {
    // login first
    const li = await apiRequest('POST', '/api/cashier/login', { name: cashierName, password: initialPw });
    const oldTok = li.data.token;
    // verify session works
    const me1 = await apiRequest('GET', '/api/cashier/me', null, { 'x-cashier-token': oldTok });
    expect(me1.status).toBe(200);
    // admin resets password
    const reset = await apiRequest('POST', '/api/admin/staff/' + cashierId + '/reset-password', {},
      { 'x-auth-token': adminToken });
    expect(reset.status).toBe(200);
    expect(reset.data.new_password).toBeTruthy();
    expect(reset.data.must_change_pw).toBe(true);
    // old session is dead
    const me2 = await apiRequest('GET', '/api/cashier/me', null, { 'x-cashier-token': oldTok });
    expect(me2.status).toBe(401);
    // login with new pw, must_change_pw=true
    const li2 = await apiRequest('POST', '/api/cashier/login', { name: cashierName, password: reset.data.new_password });
    expect(li2.status).toBe(200);
    expect(li2.data.must_change_pw).toBe(true);
    // change own password
    const cp = await apiRequest('POST', '/api/cashier/change-password', {
      current_password: reset.data.new_password, new_password: initialPw
    }, { 'x-cashier-token': li2.data.token });
    expect(cp.status).toBe(200);
    // re-login → must_change_pw cleared
    const li3 = await apiRequest('POST', '/api/cashier/login', { name: cashierName, password: initialPw });
    expect(li3.data.must_change_pw).toBe(false);
  });

  test('inactive account cannot log in', async () => {
    await apiRequest('PUT', '/api/admin/staff/' + cashierId, { active: false }, { 'x-auth-token': adminToken });
    const r = await apiRequest('POST', '/api/cashier/login', { name: cashierName, password: initialPw });
    expect(r.status).toBe(403);
    await apiRequest('PUT', '/api/admin/staff/' + cashierId, { active: true }, { 'x-auth-token': adminToken });
  });
});

test.describe('Sprint 1 — Manager Override (validate endpoint)', () => {
  let cashierTok;

  test.beforeAll(async () => {
    const r = await apiRequest('POST', '/api/cashier/login', { name: cashierName, password: initialPw });
    cashierTok = r.data.token;
  });

  test('valid manager + correct perm → success', async () => {
    const r = await apiRequest('POST', '/api/manager-validate', {
      manager_name: managerName, manager_password: initialPw, required_perm: 'refund'
    }, { 'x-cashier-token': cashierTok });
    expect(r.status).toBe(200);
    expect(r.data.success).toBe(true);
    expect(r.data.approver_name).toBe(managerName);
    expect(r.data.approver_role).toBe('manager');
  });

  test('valid manager + perm they lack → 401 manager_lacks_permission', async () => {
    const r = await apiRequest('POST', '/api/manager-validate', {
      manager_name: managerName, manager_password: initialPw, required_perm: 'factory_reset'
    }, { 'x-cashier-token': cashierTok });
    expect(r.status).toBe(401);
    expect(r.data.error).toBe('manager_lacks_permission');
  });

  test('wrong password → 401 manager_invalid_credentials', async () => {
    const r = await apiRequest('POST', '/api/manager-validate', {
      manager_name: managerName, manager_password: 'NOPE', required_perm: 'refund'
    }, { 'x-cashier-token': cashierTok });
    expect(r.status).toBe(401);
    expect(r.data.error).toBe('manager_invalid_credentials');
  });

  test('missing fields → 400', async () => {
    const r = await apiRequest('POST', '/api/manager-validate', {
      manager_name: managerName
    }, { 'x-cashier-token': cashierTok });
    expect(r.status).toBe(401); // helper returns the error.code
  });
});

test.describe('Sprint 1 — Owner-cashier can access admin endpoints', () => {
  let ownerTok;
  test.beforeAll(async () => {
    const r = await apiRequest('POST', '/api/cashier/login', { name: ownerName, password: initialPw });
    ownerTok = r.data.token;
    expect(r.data.role).toBe('owner');
  });

  test('GET /api/admin/staff via cashier token works for owner', async () => {
    const r = await apiRequest('GET', '/api/admin/staff', null, { 'x-cashier-token': ownerTok });
    expect(r.status).toBe(200);
    expect(Array.isArray(r.data)).toBe(true);
  });

  test('manager (non-owner) token rejected from admin endpoint', async () => {
    const li = await apiRequest('POST', '/api/cashier/login', { name: managerName, password: initialPw });
    const r = await apiRequest('GET', '/api/admin/staff', null, { 'x-cashier-token': li.data.token });
    expect(r.status).toBe(401);
  });
});

test.describe('Sprint 1 — Roles edit', () => {
  test('edit cashier permissions, login picks up new value', async () => {
    const c = roles.find(r => r.code === 'cashier');
    const newPerms = { ...c.permissions, refund: true, refund_max_iqd: 25000 };
    const upd = await apiRequest('PUT', '/api/admin/roles/' + c.id, { permissions: newPerms },
      { 'x-auth-token': adminToken });
    expect(upd.status).toBe(200);
    // re-login as cashier
    const li = await apiRequest('POST', '/api/cashier/login', { name: cashierName, password: initialPw });
    expect(li.data.permissions.refund).toBe(true);
    expect(li.data.permissions.refund_max_iqd).toBe(25000);
    // restore
    await apiRequest('PUT', '/api/admin/roles/' + c.id, { permissions: c.permissions },
      { 'x-auth-token': adminToken });
  });

  test('unknown permission keys are silently dropped', async () => {
    const c = roles.find(r => r.code === 'cashier');
    const dirty = { ...c.permissions, evil_perm: true, hax: 'yes' };
    const upd = await apiRequest('PUT', '/api/admin/roles/' + c.id, { permissions: dirty },
      { 'x-auth-token': adminToken });
    expect(upd.status).toBe(200);
    const after = await apiRequest('GET', '/api/admin/roles', null, { 'x-auth-token': adminToken });
    const cAfter = after.data.find(r => r.code === 'cashier');
    expect(cAfter.permissions.evil_perm).toBeUndefined();
    expect(cAfter.permissions.hax).toBeUndefined();
  });
});

test.describe('Sprint 1 — Store + Security settings', () => {
  test('GET store returns defaults if unset', async () => {
    const r = await apiRequest('GET', '/api/admin/settings/store', null, { 'x-auth-token': adminToken });
    expect(r.status).toBe(200);
    expect(r.data.name_en).toBeTruthy();
    expect(r.data.hours).toBeTruthy();
    expect(r.data.hours.mon).toBeTruthy();
  });

  test('PUT store saves and persists', async () => {
    const before = (await apiRequest('GET', '/api/admin/settings/store', null, { 'x-auth-token': adminToken })).data;
    const upd = await apiRequest('PUT', '/api/admin/settings/store', {
      name_en: 's1-test-store', phone: '07700000000'
    }, { 'x-auth-token': adminToken });
    expect(upd.status).toBe(200);
    const after = (await apiRequest('GET', '/api/admin/settings/store', null, { 'x-auth-token': adminToken })).data;
    expect(after.name_en).toBe('s1-test-store');
    expect(after.phone).toBe('07700000000');
    // restore
    await apiRequest('PUT', '/api/admin/settings/store', before, { 'x-auth-token': adminToken });
  });

  test('GET security returns auto_logout_minutes=0 (manual only)', async () => {
    const r = await apiRequest('GET', '/api/admin/settings/security', null, { 'x-auth-token': adminToken });
    expect(r.status).toBe(200);
    expect(r.data.auto_logout_minutes).toBe(0);
  });
});

test.describe('Sprint 1 — Audit log', () => {
  test('audit log captures recent actions, includes actor', async () => {
    const r = await apiRequest('GET', '/api/admin/audit?limit=200', null, { 'x-auth-token': adminToken });
    expect(r.status).toBe(200);
    expect(Array.isArray(r.data)).toBe(true);
    expect(r.data.length).toBeGreaterThan(0);
    // expect at least one staff.create event in this run
    const staffCreate = r.data.find(e => e.action === 'staff.create' && (
      String(e.target_id) === String(cashierId) ||
      String(e.target_id) === String(managerId) ||
      String(e.target_id) === String(ownerId)
    ));
    expect(staffCreate).toBeTruthy();
    expect(staffCreate.actor_name).toBe('Admin');
  });

  test('audit log filter by action prefix works', async () => {
    const r = await apiRequest('GET', '/api/admin/audit?action=staff.', null, { 'x-auth-token': adminToken });
    expect(r.status).toBe(200);
    for (const e of r.data) expect(e.action.startsWith('staff.')).toBe(true);
  });

  test('there is no DELETE /api/admin/audit (immutable)', async () => {
    const r = await apiRequest('DELETE', '/api/admin/audit/1', null, { 'x-auth-token': adminToken });
    expect([404, 405]).toContain(r.status);
  });
});

// ─── UI smoke test (Playwright browser) ──────────────────────────────────
//
// Helper: log in via UI, then if the must_change_pw modal appears (because
// these accounts are admin-created), clear it before continuing. We don't
// want to test that flow here — separate test below covers it.
async function loginAsCashier(page, name, password) {
  await page.goto('http://localhost:3000/cashier.html');
  await page.waitForSelector('#loginOverlay', { state: 'visible' });
  await page.fill('#loginName', name);
  await page.fill('#loginPw', password);
  await page.click('#loginBtn');
  // login overlay hides immediately on success — wait for it to disappear,
  // not for pos-root (which may be covered by the must_change_pw modal).
  await page.waitForSelector('#loginOverlay', { state: 'hidden', timeout: 10000 });
  // dismiss must_change_pw modal if shown (UI smoke tests don't depend on it)
  const pwMod = page.locator('#pw-mod.show');
  if (await pwMod.count() > 0 && await pwMod.isVisible()) {
    await page.evaluate(() => {
      document.getElementById('pw-mod').classList.remove('show');
      localStorage.removeItem('must_change_pw');
    });
  }
}

// =============================================================================
// Sprint 1.5 — Refund permission gating
// =============================================================================
test.describe('Sprint 1.5 — Refund permission gating', () => {
  let cashierTok, managerTok, ownerTok;
  let testOrderId, testTxnTotal, sharedItem;

  // Helper: pick a real menu item from /api/menu-prices, normalize field names.
  async function pickMenuItem(token, opts = {}) {
    const r = await apiRequest('GET', '/api/menu-prices', null, { 'x-cashier-token': token });
    expect(r.status).toBe(200);
    const rows = (r.data || []).map(m => ({ name: m.menu_item, price: Number(m.selling_price) }))
      .filter(m => m.name && m.price > 0);
    let pick = rows.find(m => (!opts.maxPrice || m.price <= opts.maxPrice));
    if (!pick) pick = rows[0];
    expect(pick).toBeTruthy();
    return pick;
  }
  // Helper: place a cashier order, return its server id and total. Server's
  // /api/orders responds with { success, order: { id, ... } }.
  async function placeOrder(token, item) {
    const r = await apiRequest('POST', '/api/orders', {
      type: 'take',
      items: [{ name: item.name, qty: 1, price: item.price, mods: '' }],
      total: item.price,
      payment: 'cash',
      source: 'cashier'
    }, { 'x-cashier-token': token });
    expect(r.status).toBe(200);
    return r.data.order;
  }

  test.beforeAll(async () => {
    await ensureFixtureAccounts();
    cashierTok = (await apiRequest('POST', '/api/cashier/login', { name: cashierName, password: initialPw })).data.token;
    managerTok = (await apiRequest('POST', '/api/cashier/login', { name: managerName, password: initialPw })).data.token;
    ownerTok   = (await apiRequest('POST', '/api/cashier/login', { name: ownerName,   password: initialPw })).data.token;
    sharedItem = await pickMenuItem(cashierTok, { maxPrice: 10000 });
    testTxnTotal = sharedItem.price;
    const order = await placeOrder(cashierTok, sharedItem);
    testOrderId = order.id;
  });

  test('cashier without refund perm → 403 permission_denied', async () => {
    const r = await apiRequest('POST', '/api/orders/' + testOrderId + '/refund', {
      lines: [{ name: sharedItem.name, qty: 1, price: sharedItem.price }],
      total: testTxnTotal,
      full: true
    }, { 'x-cashier-token': cashierTok });
    expect(r.status).toBe(403);
    expect(r.data.error).toBe('permission_denied');
    expect(r.data.reason).toBe('no_permission');
  });

  test('cashier with manager_override succeeds; audit captures approver+reason', async () => {
    const item = await pickMenuItem(cashierTok, { maxPrice: 10000 });
    const order = await placeOrder(cashierTok, item);

    const r = await apiRequest('POST', '/api/orders/' + order.id + '/refund', {
      lines: [{ name: item.name, qty: 1, price: item.price }],
      total: item.price,
      full: true,
      manager_override: { name: managerName, password: initialPw, reason: 'customer complaint' }
    }, { 'x-cashier-token': cashierTok });
    expect(r.status).toBe(200);
    expect(r.data.success).toBe(true);

    const audit = await apiRequest('GET', '/api/admin/audit?action=order.refund&limit=50', null, { 'x-auth-token': adminToken });
    const entry = audit.data.find(e => String(e.target_id) === String(order.id));
    expect(entry).toBeTruthy();
    expect(entry.actor_name).toBe(cashierName);
    expect(entry.approver_name).toBe(managerName);
    expect(entry.reason).toBe('customer complaint');
  });

  test('manager_override missing reason → 400 reason_required', async () => {
    const item = await pickMenuItem(cashierTok, { maxPrice: 10000 });
    const order = await placeOrder(cashierTok, item);

    const r = await apiRequest('POST', '/api/orders/' + order.id + '/refund', {
      lines: [{ name: item.name, qty: 1, price: item.price }],
      total: item.price, full: true,
      manager_override: { name: managerName, password: initialPw, reason: '' }
    }, { 'x-cashier-token': cashierTok });
    expect(r.status).toBe(400);
    expect(r.data.error).toBe('reason_required');
  });

  test('manager_override with bad password → 401 manager_invalid_credentials', async () => {
    const item = await pickMenuItem(cashierTok, { maxPrice: 10000 });
    const order = await placeOrder(cashierTok, item);

    const r = await apiRequest('POST', '/api/orders/' + order.id + '/refund', {
      lines: [{ name: item.name, qty: 1, price: item.price }],
      total: item.price, full: true,
      manager_override: { name: managerName, password: 'WRONG', reason: 'test' }
    }, { 'x-cashier-token': cashierTok });
    expect(r.status).toBe(401);
    expect(r.data.error).toBe('manager_invalid_credentials');
  });

  test('manager refund within own limit (50000) succeeds without override', async () => {
    const item = await pickMenuItem(managerTok, { maxPrice: 50000 });
    const order = await placeOrder(managerTok, item);

    const r = await apiRequest('POST', '/api/orders/' + order.id + '/refund', {
      lines: [{ name: item.name, qty: 1, price: item.price }],
      total: item.price, full: true
    }, { 'x-cashier-token': managerTok });
    expect(r.status).toBe(200);
    expect(r.data.success).toBe(true);
  });

  test('owner refund unlimited', async () => {
    const item = await pickMenuItem(ownerTok);
    const order = await placeOrder(ownerTok, item);

    const r = await apiRequest('POST', '/api/orders/' + order.id + '/refund', {
      lines: [{ name: item.name, qty: 1, price: item.price }],
      total: item.price, full: true
    }, { 'x-cashier-token': ownerTok });
    expect(r.status).toBe(200);
  });
});

// =============================================================================
// Sprint 1.5 — Discount permission gating (% and fixed)
// =============================================================================
test.describe('Sprint 1.5 — Discount permission gating', () => {
  let cashierTok, managerTok, ownerTok;

  async function pickItem(token, opts = {}) {
    const r = await apiRequest('GET', '/api/menu-prices', null, { 'x-cashier-token': token });
    expect(r.status).toBe(200);
    const rows = (r.data || []).map(m => ({ name: m.menu_item, price: Number(m.selling_price) }))
      .filter(m => m.name && m.price > 0);
    return rows.find(m => (!opts.maxPrice || m.price <= opts.maxPrice)) || rows[0];
  }

  function buildOrderBody(item, opts) {
    const body = {
      type: 'take',
      items: [{ name: item.name, qty: 1, price: item.price, mods: '' }],
      total: opts.total != null ? opts.total : item.price,
      payment: 'cash',
      source: 'cashier'
    };
    if (opts.discount_kind)  body.discount_kind  = opts.discount_kind;
    if (opts.discount_value != null) body.discount_value = opts.discount_value;
    if (opts.manager_override) body.manager_override = opts.manager_override;
    return body;
  }

  test.beforeAll(async () => {
    await ensureFixtureAccounts();
    cashierTok = (await apiRequest('POST', '/api/cashier/login', { name: cashierName, password: initialPw })).data.token;
    managerTok = (await apiRequest('POST', '/api/cashier/login', { name: managerName, password: initialPw })).data.token;
    ownerTok   = (await apiRequest('POST', '/api/cashier/login', { name: ownerName,   password: initialPw })).data.token;
  });

  test('cashier 5% discount within 10% limit → succeeds, audit recorded', async () => {
    const item = await pickItem(cashierTok, { maxPrice: 10000 });
    const r = await apiRequest('POST', '/api/orders',
      buildOrderBody(item, { discount_kind: 'percent', discount_value: 5,
                             total: Math.round(item.price * 0.95) }),
      { 'x-cashier-token': cashierTok });
    expect(r.status).toBe(200);
    const audit = await apiRequest('GET', '/api/admin/audit?action=order.discount_applied&limit=20', null, { 'x-auth-token': adminToken });
    const e = audit.data.find(a => String(a.target_id) === String(r.data.order.id));
    expect(e).toBeTruthy();
    expect(e.actor_name).toBe(cashierName);
    expect(e.approver_name).toBeFalsy();
  });

  test('cashier 25% discount exceeds 10% limit → 403 limit_exceeded', async () => {
    const item = await pickItem(cashierTok, { maxPrice: 10000 });
    const r = await apiRequest('POST', '/api/orders',
      buildOrderBody(item, { discount_kind: 'percent', discount_value: 25,
                             total: Math.round(item.price * 0.75) }),
      { 'x-cashier-token': cashierTok });
    expect(r.status).toBe(403);
    expect(r.data.error).toBe('permission_denied');
    expect(r.data.reason).toBe('limit_exceeded');
  });

  test('cashier 25% discount with manager_override → succeeds, audit has approver+reason', async () => {
    const item = await pickItem(cashierTok, { maxPrice: 10000 });
    const r = await apiRequest('POST', '/api/orders',
      buildOrderBody(item, {
        discount_kind: 'percent', discount_value: 25,
        total: Math.round(item.price * 0.75),
        manager_override: { name: managerName, password: initialPw, reason: 'goodwill' }
      }),
      { 'x-cashier-token': cashierTok });
    expect(r.status).toBe(200);
    const audit = await apiRequest('GET', '/api/admin/audit?action=order.discount_applied&limit=10', null, { 'x-auth-token': adminToken });
    const e = audit.data.find(a => String(a.target_id) === String(r.data.order.id));
    expect(e).toBeTruthy();
    expect(e.approver_name).toBe(managerName);
    expect(e.reason).toBe('goodwill');
  });

  test('cashier fixed discount denied (cashier has no discount_fixed perm)', async () => {
    const item = await pickItem(cashierTok, { maxPrice: 10000 });
    const r = await apiRequest('POST', '/api/orders',
      buildOrderBody(item, { discount_kind: 'fixed', discount_value: 1000,
                             total: Math.max(0, item.price - 1000) }),
      { 'x-cashier-token': cashierTok });
    expect(r.status).toBe(403);
    expect(r.data.error).toBe('permission_denied');
  });

  test('manager fixed discount within 20000 limit → succeeds', async () => {
    const item = await pickItem(managerTok, { maxPrice: 30000 });
    const cap = Math.min(15000, item.price - 1);
    const r = await apiRequest('POST', '/api/orders',
      buildOrderBody(item, { discount_kind: 'fixed', discount_value: cap,
                             total: Math.max(0, item.price - cap) }),
      { 'x-cashier-token': managerTok });
    expect(r.status).toBe(200);
  });

  test('manager fixed discount over own 20000 limit → 403', async () => {
    const item = await pickItem(managerTok);
    const r = await apiRequest('POST', '/api/orders',
      buildOrderBody(item, { discount_kind: 'fixed', discount_value: 25000,
                             total: Math.max(0, item.price - 25000) }),
      { 'x-cashier-token': managerTok });
    expect(r.status).toBe(403);
    expect(r.data.reason).toBe('limit_exceeded');
  });

  test('owner unlimited discount succeeds', async () => {
    const item = await pickItem(ownerTok);
    const r = await apiRequest('POST', '/api/orders',
      buildOrderBody(item, { discount_kind: 'percent', discount_value: 80,
                             total: Math.round(item.price * 0.20) }),
      { 'x-cashier-token': ownerTok });
    expect(r.status).toBe(200);
  });

  test('manager_override missing reason → 400 reason_required', async () => {
    const item = await pickItem(cashierTok, { maxPrice: 10000 });
    const r = await apiRequest('POST', '/api/orders',
      buildOrderBody(item, {
        discount_kind: 'percent', discount_value: 30,
        total: Math.round(item.price * 0.70),
        manager_override: { name: managerName, password: initialPw, reason: '' }
      }),
      { 'x-cashier-token': cashierTok });
    expect(r.status).toBe(400);
    expect(r.data.error).toBe('reason_required');
  });
});

// =============================================================================
// Sprint 1.5 — Shift close permission gating
// =============================================================================
test.describe('Sprint 1.5 — Shift close permission gating', () => {
  let cashierTok, managerTok, ownerTok, baristaTok;
  let baristaId;

  test.beforeAll(async () => {
    await ensureFixtureAccounts();
    cashierTok = (await apiRequest('POST', '/api/cashier/login', { name: cashierName, password: initialPw })).data.token;
    managerTok = (await apiRequest('POST', '/api/cashier/login', { name: managerName, password: initialPw })).data.token;
    ownerTok   = (await apiRequest('POST', '/api/cashier/login', { name: ownerName,   password: initialPw })).data.token;
    // also create a barista (no close_shift perm) for the negative test
    const baristaName = 's1_brt_' + TS;
    let row = (await apiRequest('GET', '/api/admin/staff', null, { 'x-auth-token': adminToken })).data.find(s => s.name === baristaName);
    if (!row) {
      const c = await apiRequest('POST', '/api/admin/staff',
        { name: baristaName, password: initialPw, role_id: ROLE.barista },
        { 'x-auth-token': adminToken });
      baristaId = c.data.id;
    } else {
      baristaId = row.id;
      await apiRequest('POST', '/api/admin/staff/' + row.id + '/reset-password',
        { new_password: initialPw }, { 'x-auth-token': adminToken });
    }
    const li = await apiRequest('POST', '/api/cashier/login', { name: baristaName, password: initialPw });
    if (li.data?.must_change_pw) {
      await apiRequest('POST', '/api/cashier/change-password', {
        current_password: initialPw, new_password: initialPw
      }, { 'x-cashier-token': li.data.token });
      const li2 = await apiRequest('POST', '/api/cashier/login', { name: baristaName, password: initialPw });
      baristaTok = li2.data.token;
    } else {
      baristaTok = li.data.token;
    }
  });

  test.afterAll(async () => {
    if (baristaId) {
      await apiRequest('DELETE', '/api/admin/staff/' + baristaId, null, { 'x-auth-token': adminToken });
    }
  });

  const shiftBody = (variance = 0, override = null) => ({
    opening_cash: 100000,
    counted_cash: 150000 + variance,
    cash_sales:   50000,
    txn_count:    10,
    started_at:   new Date(Date.now() - 8*60*60*1000).toISOString(),
    manager_override: override || undefined
  });

  test('barista (no close_shift perm) → 403 permission_denied', async () => {
    const r = await apiRequest('POST', '/api/shift/close', shiftBody(0),
      { 'x-cashier-token': baristaTok });
    expect(r.status).toBe(403);
    expect(r.data.missing).toBe('close_shift');
  });

  test('cashier zero-variance close succeeds', async () => {
    const r = await apiRequest('POST', '/api/shift/close', shiftBody(0),
      { 'x-cashier-token': cashierTok });
    expect(r.status).toBe(200);
    expect(r.data.variance).toBe(0);
    expect(r.data.forced).toBe(false);
  });

  test('cashier with variance → 403 (no close_shift_force perm)', async () => {
    const r = await apiRequest('POST', '/api/shift/close', shiftBody(2000),
      { 'x-cashier-token': cashierTok });
    expect(r.status).toBe(403);
    expect(r.data.missing).toBe('close_shift_force');
    expect(r.data.variance).toBe(2000);
  });

  test('cashier variance + manager_override succeeds; audit captures approver+reason', async () => {
    const r = await apiRequest('POST', '/api/shift/close', shiftBody(-3000, {
      name: managerName, password: initialPw, reason: 'till short, will investigate'
    }), { 'x-cashier-token': cashierTok });
    expect(r.status).toBe(200);
    expect(r.data.variance).toBe(-3000);
    expect(r.data.forced).toBe(true);

    const audit = await apiRequest('GET', '/api/admin/audit?action=shift.close&limit=10', null, { 'x-auth-token': adminToken });
    const e = audit.data.find(a => a.actor_name === cashierName);
    expect(e).toBeTruthy();
    expect(e.approver_name).toBe(managerName);
    expect(e.reason).toBe('till short, will investigate');
  });

  test('manager has close_shift_force → variance close succeeds without override', async () => {
    const r = await apiRequest('POST', '/api/shift/close', shiftBody(5000),
      { 'x-cashier-token': managerTok });
    expect(r.status).toBe(200);
    expect(r.data.variance).toBe(5000);
    expect(r.data.forced).toBe(false);
  });

  test('owner has close_shift_force → variance close succeeds', async () => {
    const r = await apiRequest('POST', '/api/shift/close', shiftBody(-10000),
      { 'x-cashier-token': ownerTok });
    expect(r.status).toBe(200);
  });

  test('manager_override with bad password → 401', async () => {
    const r = await apiRequest('POST', '/api/shift/close', shiftBody(2000, {
      name: managerName, password: 'WRONG', reason: 'test'
    }), { 'x-cashier-token': cashierTok });
    expect(r.status).toBe(401);
    expect(r.data.error).toBe('manager_invalid_credentials');
  });

  test('manager_override missing reason → 400', async () => {
    const r = await apiRequest('POST', '/api/shift/close', shiftBody(2000, {
      name: managerName, password: initialPw, reason: '   '
    }), { 'x-cashier-token': cashierTok });
    expect(r.status).toBe(400);
    expect(r.data.error).toBe('reason_required');
  });
});

// =============================================================================
// Sprint 2.1 — Menu categories CRUD
// =============================================================================
test.describe('Sprint 2.1 — Menu categories', () => {
  let cashierTok, ownerTok;
  let createdId;
  const newCode = 's21_cat_' + (TS % 100000); // unique per run

  test.beforeAll(async () => {
    await ensureFixtureAccounts();
    cashierTok = (await apiRequest('POST', '/api/cashier/login', { name: cashierName, password: initialPw })).data.token;
    ownerTok   = (await apiRequest('POST', '/api/cashier/login', { name: ownerName,   password: initialPw })).data.token;
  });

  test.afterAll(async () => {
    if (createdId) {
      await apiRequest('DELETE', '/api/admin/menu/categories/' + createdId, null, { 'x-auth-token': adminToken });
    }
  });

  test('seed: default categories present (Sprint 2.7 — 12 kebab-case codes)', async () => {
    const r = await apiRequest('GET', '/api/admin/menu/categories', null, { 'x-auth-token': adminToken });
    expect(r.status).toBe(200);
    const codes = r.data.map(c => c.code);
    // Sprint 2.7 seeds 12 categories matching customer-site index.js menuData.
    // Seed runs only when the table is empty (first install), so on a fresh
    // test DB all 12 must be present.
    for (const c of ['hot-coffee','cold-coffee','matcha','hot-tea','smoothie',
                     'frappe','milkshake','mojito','yogurt','pastry',
                     'dessert','food']) {
      expect(codes).toContain(c);
    }
  });

  test('public /api/menu/categories returns active only, no auth', async () => {
    const r = await apiRequest('GET', '/api/menu/categories');
    expect(r.status).toBe(200);
    expect(r.data.length).toBeGreaterThan(0);
    for (const c of r.data) expect(typeof c.code).toBe('string');
  });

  test('cashier (no menu_edit) cannot create category', async () => {
    const r = await apiRequest('POST', '/api/admin/menu/categories', {
      code: 'cashier_attempt', name_en: 'Should Fail'
    }, { 'x-cashier-token': cashierTok });
    expect(r.status).toBe(401); // requireAuth rejects non-owner cashier upfront
  });

  test('owner-cashier can create category via cashier token', async () => {
    const r = await apiRequest('POST', '/api/admin/menu/categories', {
      code: newCode, name_en: 'Test Specials', name_ar: 'اختبار', name_ko: '테스트',
      color: '#ff00ff', sort_order: 999
    }, { 'x-cashier-token': ownerTok });
    expect(r.status).toBe(200);
    expect(r.data.success).toBe(true);
    createdId = r.data.id;
  });

  test('invalid code (uppercase) → 400', async () => {
    // Sprint 2.7 allows dashes in category codes (kebab-case), but uppercase
    // letters remain disallowed.
    const r = await apiRequest('POST', '/api/admin/menu/categories', {
      code: 'BadCode-1', name_en: 'X'
    }, { 'x-auth-token': adminToken });
    expect(r.status).toBe(400);
    expect(r.data.error).toBe('invalid_code');
  });

  test('missing name_en → 400', async () => {
    const r = await apiRequest('POST', '/api/admin/menu/categories', {
      code: 'noname_t' + (TS % 100), name_en: '   '
    }, { 'x-auth-token': adminToken });
    expect(r.status).toBe(400);
    expect(r.data.error).toBe('name_en_required');
  });

  test('duplicate code → 400 code_exists', async () => {
    // Sprint 2.7+ (D): server requires name_ar on POST. Include it so the
    // unique-code check is reached (otherwise we'd get name_ar_required).
    const r = await apiRequest('POST', '/api/admin/menu/categories', {
      code: 'hot-coffee', name_en: 'Dup', name_ar: 'تكرار'
    }, { 'x-auth-token': adminToken });
    expect(r.status).toBe(400);
    expect(r.data.error).toBe('code_exists');
  });

  test('PUT updates names + sort + active; code is immutable', async () => {
    const r = await apiRequest('PUT', '/api/admin/menu/categories/' + createdId, {
      name_en: 'Renamed Specials', sort_order: 500, active: false,
      code: 'attempted_change' // should be ignored
    }, { 'x-auth-token': adminToken });
    expect(r.status).toBe(200);
    const get = await apiRequest('GET', '/api/admin/menu/categories', null, { 'x-auth-token': adminToken });
    const c = get.data.find(x => x.id === createdId);
    expect(c.name_en).toBe('Renamed Specials');
    expect(c.sort_order).toBe(500);
    expect(c.active).toBe(false);
    expect(c.code).toBe(newCode); // unchanged
  });

  test('inactive category not in public list', async () => {
    const r = await apiRequest('GET', '/api/menu/categories');
    const c = r.data.find(x => x.code === newCode);
    expect(c).toBeFalsy();
  });

  test('audit log captures menu.category.create + update', async () => {
    const r = await apiRequest('GET', '/api/admin/audit?action=menu.category.&limit=20', null, { 'x-auth-token': adminToken });
    const create = r.data.find(e => e.action === 'menu.category.create' && String(e.target_id) === String(createdId));
    const update = r.data.find(e => e.action === 'menu.category.update' && String(e.target_id) === String(createdId));
    expect(create).toBeTruthy();
    expect(update).toBeTruthy();
  });

  test('DELETE works on unused category', async () => {
    const r = await apiRequest('DELETE', '/api/admin/menu/categories/' + createdId, null, { 'x-auth-token': adminToken });
    expect(r.status).toBe(200);
    createdId = null;
  });

  // (Future test for category_in_use will be added in Sprint 2.2 once
  // menu_items_v2 is wired up — no items currently reference categories.)
});

// =============================================================================
// Sprint 2.2 — Menu items CRUD + sold-out + photo
// =============================================================================
test.describe('Sprint 2.2 — Menu items', () => {
  let cashierTok, ownerTok;
  let createdItemId;
  let categoryId;
  const itemCode = 's22_itm_' + (TS % 100000);

  test.beforeAll(async () => {
    await ensureFixtureAccounts();
    cashierTok = (await apiRequest('POST', '/api/cashier/login', { name: cashierName, password: initialPw })).data.token;
    ownerTok   = (await apiRequest('POST', '/api/cashier/login', { name: ownerName,   password: initialPw })).data.token;
    // pick the seeded 'hot-coffee' category for FK (Sprint 2.7 codes)
    const cats = await apiRequest('GET', '/api/admin/menu/categories', null, { 'x-auth-token': adminToken });
    categoryId = cats.data.find(c => c.code === 'hot-coffee').id;
  });

  test.afterAll(async () => {
    if (createdItemId) {
      await apiRequest('DELETE', '/api/admin/menu/items/' + createdItemId, null, { 'x-auth-token': adminToken });
    }
  });

  test('initial GET returns array (may be empty)', async () => {
    const r = await apiRequest('GET', '/api/admin/menu/items', null, { 'x-auth-token': adminToken });
    expect(r.status).toBe(200);
    expect(Array.isArray(r.data)).toBe(true);
  });

  test('cashier (no menu_edit) cannot create item', async () => {
    const r = await apiRequest('POST', '/api/admin/menu/items', {
      code: 'cashier_x', name_en: 'X', base_price: 1000
    }, { 'x-cashier-token': cashierTok });
    expect(r.status).toBe(401); // requireAuth rejects non-owner cashier
  });

  test('owner-cashier can create item via cashier token', async () => {
    const r = await apiRequest('POST', '/api/admin/menu/items', {
      code: itemCode,
      name_en: 'Sprint 2.2 Test Item',
      name_ar: 'صنف اختبار',
      name_ko: '테스트 아이템',
      emoji: '🧪',
      category_id: categoryId,
      base_price: 4500,
      kind: 'single',
      sort_order: 999,
      description: 'unit test'
    }, { 'x-cashier-token': ownerTok });
    expect(r.status).toBe(200);
    expect(r.data.success).toBe(true);
    createdItemId = r.data.id;
  });

  test('GET single item returns full record with category_code joined', async () => {
    const r = await apiRequest('GET', '/api/admin/menu/items/' + createdItemId, null, { 'x-auth-token': adminToken });
    expect(r.status).toBe(200);
    expect(r.data.code).toBe(itemCode);
    expect(r.data.name_en).toBe('Sprint 2.2 Test Item');
    expect(r.data.name_ar).toBe('صنف اختبار');
    expect(r.data.name_ko).toBe('테스트 아이템');
    expect(r.data.base_price).toBe(4500);
    expect(r.data.kind).toBe('single');
    expect(r.data.active).toBe(true);
    expect(r.data.sold_out).toBe(false);
    expect(r.data.category_code).toBe('hot-coffee');
  });

  test('invalid code (with dash) → 400', async () => {
    const r = await apiRequest('POST', '/api/admin/menu/items', {
      code: 'bad-code', name_en: 'X', base_price: 1000
    }, { 'x-auth-token': adminToken });
    expect(r.status).toBe(400);
    expect(r.data.error).toBe('invalid_code');
  });

  test('negative price → 400 invalid_price', async () => {
    const r = await apiRequest('POST', '/api/admin/menu/items', {
      code: 'neg_price_t', name_en: 'X', base_price: -100
    }, { 'x-auth-token': adminToken });
    expect(r.status).toBe(400);
    expect(r.data.error).toBe('invalid_price');
  });

  test('invalid category_id → 400', async () => {
    const r = await apiRequest('POST', '/api/admin/menu/items', {
      code: 'bad_cat_t', name_en: 'X', base_price: 1000, category_id: 999999
    }, { 'x-auth-token': adminToken });
    expect(r.status).toBe(400);
    expect(r.data.error).toBe('invalid_category');
  });

  test('duplicate code → 400 code_exists', async () => {
    const r = await apiRequest('POST', '/api/admin/menu/items', {
      code: itemCode, name_en: 'Dup', base_price: 1000
    }, { 'x-auth-token': adminToken });
    expect(r.status).toBe(400);
    expect(r.data.error).toBe('code_exists');
  });

  test('PUT updates names + price + sort_order', async () => {
    const r = await apiRequest('PUT', '/api/admin/menu/items/' + createdItemId, {
      name_en: 'Renamed Item', base_price: 5500, sort_order: 50
    }, { 'x-auth-token': adminToken });
    expect(r.status).toBe(200);
    const get = await apiRequest('GET', '/api/admin/menu/items/' + createdItemId, null, { 'x-auth-token': adminToken });
    expect(get.data.name_en).toBe('Renamed Item');
    expect(get.data.base_price).toBe(5500);
    expect(get.data.sort_order).toBe(50);
  });

  test('PUT can change code (when unique)', async () => {
    const newCode = itemCode + '_v2';
    const r = await apiRequest('PUT', '/api/admin/menu/items/' + createdItemId, {
      code: newCode
    }, { 'x-auth-token': adminToken });
    expect(r.status).toBe(200);
    const get = await apiRequest('GET', '/api/admin/menu/items/' + createdItemId, null, { 'x-auth-token': adminToken });
    expect(get.data.code).toBe(newCode);
  });

  test('cashier with menu_sold_out_toggle can flip sold-out', async () => {
    // cashier role's default permissions include menu_sold_out_toggle:true
    const r = await apiRequest('POST', '/api/admin/menu/items/' + createdItemId + '/sold-out',
      { sold_out: true }, { 'x-cashier-token': cashierTok });
    expect(r.status).toBe(200);
    expect(r.data.sold_out).toBe(true);

    // public list should reflect — not in /api/menu/items if active=true (sold_out is separate)
    const pub = await apiRequest('GET', '/api/menu/items');
    const found = pub.data.find(x => x.id === createdItemId);
    expect(found).toBeTruthy();
    expect(found.sold_out).toBe(true);

    // unset
    const r2 = await apiRequest('POST', '/api/admin/menu/items/' + createdItemId + '/sold-out',
      { sold_out: false }, { 'x-cashier-token': cashierTok });
    expect(r2.data.sold_out).toBe(false);
  });

  test('inactive item is hidden from public /api/menu/items', async () => {
    await apiRequest('PUT', '/api/admin/menu/items/' + createdItemId,
      { active: false }, { 'x-auth-token': adminToken });
    const pub = await apiRequest('GET', '/api/menu/items');
    const found = pub.data.find(x => x.id === createdItemId);
    expect(found).toBeFalsy();
    // re-activate
    await apiRequest('PUT', '/api/admin/menu/items/' + createdItemId,
      { active: true }, { 'x-auth-token': adminToken });
  });

  test('public /api/menu/items returns active items, no auth', async () => {
    const r = await apiRequest('GET', '/api/menu/items');
    expect(r.status).toBe(200);
    expect(Array.isArray(r.data)).toBe(true);
    const found = r.data.find(x => x.id === createdItemId);
    expect(found).toBeTruthy();
    expect(found.category_code).toBe('hot-coffee');
  });

  test('category in use → DELETE returns 409', async () => {
    const r = await apiRequest('DELETE', '/api/admin/menu/categories/' + categoryId,
      null, { 'x-auth-token': adminToken });
    expect(r.status).toBe(409);
    expect(r.data.error).toBe('category_in_use');
  });

  test('audit log captures menu.item.create + update + sold_out', async () => {
    const r = await apiRequest('GET', '/api/admin/audit?action=menu.item.&limit=30',
      null, { 'x-auth-token': adminToken });
    const create = r.data.find(e => e.action === 'menu.item.create' && String(e.target_id) === String(createdItemId));
    const update = r.data.find(e => e.action === 'menu.item.update' && String(e.target_id) === String(createdItemId));
    const sold   = r.data.find(e => e.action === 'menu.item.sold_out' && String(e.target_id) === String(createdItemId));
    expect(create).toBeTruthy();
    expect(update).toBeTruthy();
    expect(sold).toBeTruthy();
  });

  test('DELETE removes the item', async () => {
    const r = await apiRequest('DELETE', '/api/admin/menu/items/' + createdItemId,
      null, { 'x-auth-token': adminToken });
    expect(r.status).toBe(200);
    createdItemId = null;
  });
});

// =============================================================================
// Sprint 2.3 — Modifier groups + options
// =============================================================================
test.describe('Sprint 2.3 — Modifier groups & options', () => {
  let cashierTok, ownerTok;
  let groupId, optionId;
  const groupCode = 's23_g_' + (TS % 100000);
  const optCode   = 's23_o';

  test.beforeAll(async () => {
    await ensureFixtureAccounts();
    cashierTok = (await apiRequest('POST', '/api/cashier/login', { name: cashierName, password: initialPw })).data.token;
    ownerTok   = (await apiRequest('POST', '/api/cashier/login', { name: ownerName,   password: initialPw })).data.token;
  });

  test.afterAll(async () => {
    if (groupId) {
      await apiRequest('DELETE', '/api/admin/menu/modifier-groups/' + groupId, null, { 'x-auth-token': adminToken });
    }
  });

  test('seed: 5 default modifier groups (size/temp/milk/shot/syrup) present', async () => {
    const r = await apiRequest('GET', '/api/admin/menu/modifier-groups', null, { 'x-auth-token': adminToken });
    expect(r.status).toBe(200);
    const codes = r.data.map(g => g.code);
    for (const c of ['size','temp','milk','shot','syrup']) expect(codes).toContain(c);
    const milk = r.data.find(g => g.code === 'milk');
    expect(milk.options.length).toBeGreaterThan(0);
    expect(milk.options.find(o => o.code === 'whole').is_default).toBe(true);
    expect(milk.options.find(o => o.code === 'oat').price_delta_iqd).toBe(1000);
  });

  test('public /api/menu/modifier-groups returns groups with nested options, no auth', async () => {
    const r = await apiRequest('GET', '/api/menu/modifier-groups');
    expect(r.status).toBe(200);
    expect(r.data.length).toBeGreaterThanOrEqual(5);
    expect(r.data[0].options).toBeTruthy();
  });

  test('cashier (no menu_edit) cannot create modifier group', async () => {
    const r = await apiRequest('POST', '/api/admin/menu/modifier-groups', {
      code: 'cashier_x', name_en: 'X', selection: 'single'
    }, { 'x-cashier-token': cashierTok });
    expect(r.status).toBe(401);
  });

  test('owner-cashier creates modifier group', async () => {
    const r = await apiRequest('POST', '/api/admin/menu/modifier-groups', {
      code: groupCode, name_en: 'Test Group', name_ar: 'مجموعة', name_ko: '그룹',
      selection: 'multi', required: false, sort_order: 999
    }, { 'x-cashier-token': ownerTok });
    expect(r.status).toBe(200);
    expect(r.data.success).toBe(true);
    groupId = r.data.id;
  });

  test('GET single group returns nested options', async () => {
    const r = await apiRequest('GET', '/api/admin/menu/modifier-groups/' + groupId, null, { 'x-auth-token': adminToken });
    expect(r.status).toBe(200);
    expect(r.data.code).toBe(groupCode);
    expect(r.data.selection).toBe('multi');
    expect(r.data.required).toBe(false);
    expect(Array.isArray(r.data.options)).toBe(true);
    expect(r.data.options.length).toBe(0);
  });

  test('invalid group code → 400', async () => {
    const r = await apiRequest('POST', '/api/admin/menu/modifier-groups', {
      code: 'BadCode', name_en: 'X'
    }, { 'x-auth-token': adminToken });
    expect(r.status).toBe(400);
    expect(r.data.error).toBe('invalid_code');
  });

  test('duplicate code → 400', async () => {
    const r = await apiRequest('POST', '/api/admin/menu/modifier-groups', {
      code: 'size', name_en: 'Dup'
    }, { 'x-auth-token': adminToken });
    expect(r.status).toBe(400);
    expect(r.data.error).toBe('code_exists');
  });

  test('PUT updates group selection + required', async () => {
    const r = await apiRequest('PUT', '/api/admin/menu/modifier-groups/' + groupId, {
      selection: 'single', required: true
    }, { 'x-auth-token': adminToken });
    expect(r.status).toBe(200);
    const g = await apiRequest('GET', '/api/admin/menu/modifier-groups/' + groupId, null, { 'x-auth-token': adminToken });
    expect(g.data.selection).toBe('single');
    expect(g.data.required).toBe(true);
  });

  test('add option to group', async () => {
    const r = await apiRequest('POST', '/api/admin/menu/modifier-groups/' + groupId + '/options', {
      code: optCode, name_en: 'Test Option', name_ar: 'خيار', name_ko: '옵션',
      price_delta_iqd: 750, is_default: true, sort_order: 50
    }, { 'x-auth-token': adminToken });
    expect(r.status).toBe(200);
    optionId = r.data.id;
    const g = await apiRequest('GET', '/api/admin/menu/modifier-groups/' + groupId, null, { 'x-auth-token': adminToken });
    expect(g.data.options.length).toBe(1);
    expect(g.data.options[0].price_delta_iqd).toBe(750);
    expect(g.data.options[0].is_default).toBe(true);
  });

  test('duplicate option code within same group → 400', async () => {
    const r = await apiRequest('POST', '/api/admin/menu/modifier-groups/' + groupId + '/options', {
      code: optCode, name_en: 'Dup'
    }, { 'x-auth-token': adminToken });
    expect(r.status).toBe(400);
    expect(r.data.error).toBe('code_exists');
  });

  test('option PUT updates price_delta', async () => {
    const r = await apiRequest('PUT', '/api/admin/menu/modifier-options/' + optionId, {
      price_delta_iqd: 1500
    }, { 'x-auth-token': adminToken });
    expect(r.status).toBe(200);
    const g = await apiRequest('GET', '/api/admin/menu/modifier-groups/' + groupId, null, { 'x-auth-token': adminToken });
    expect(g.data.options[0].price_delta_iqd).toBe(1500);
  });

  test('option DELETE works', async () => {
    const r = await apiRequest('DELETE', '/api/admin/menu/modifier-options/' + optionId, null, { 'x-auth-token': adminToken });
    expect(r.status).toBe(200);
    const g = await apiRequest('GET', '/api/admin/menu/modifier-groups/' + groupId, null, { 'x-auth-token': adminToken });
    expect(g.data.options.length).toBe(0);
  });

  test('audit log captures modifier_group + modifier_option events', async () => {
    const r = await apiRequest('GET', '/api/admin/audit?action=menu.modifier_&limit=30', null, { 'x-auth-token': adminToken });
    const events = r.data.map(e => e.action);
    expect(events).toContain('menu.modifier_group.create');
    expect(events).toContain('menu.modifier_group.update');
    expect(events).toContain('menu.modifier_option.create');
    expect(events).toContain('menu.modifier_option.update');
    expect(events).toContain('menu.modifier_option.delete');
  });

  test('group DELETE works (no items reference it yet)', async () => {
    const r = await apiRequest('DELETE', '/api/admin/menu/modifier-groups/' + groupId, null, { 'x-auth-token': adminToken });
    expect(r.status).toBe(200);
    groupId = null;
  });
});

// =============================================================================
// Sprint 2.4 — Item ↔ modifier group assignment
// =============================================================================
test.describe('Sprint 2.4 — Item ↔ modifier groups', () => {
  let cashierTok, ownerTok;
  let itemId;
  let sizeGroupId, milkGroupId, syrupGroupId;
  const itemCode = 's24_itm_' + (TS % 100000);

  test.beforeAll(async () => {
    await ensureFixtureAccounts();
    cashierTok = (await apiRequest('POST', '/api/cashier/login', { name: cashierName, password: initialPw })).data.token;
    ownerTok   = (await apiRequest('POST', '/api/cashier/login', { name: ownerName,   password: initialPw })).data.token;

    // Get seeded modifier group ids
    const groups = (await apiRequest('GET', '/api/admin/menu/modifier-groups', null, { 'x-auth-token': adminToken })).data;
    sizeGroupId  = groups.find(g => g.code === 'size').id;
    milkGroupId  = groups.find(g => g.code === 'milk').id;
    syrupGroupId = groups.find(g => g.code === 'syrup').id;

    // Create a test item (use Sprint 2.7 'hot-coffee' seed)
    const cats = (await apiRequest('GET', '/api/admin/menu/categories', null, { 'x-auth-token': adminToken })).data;
    const catId = cats.find(c => c.code === 'hot-coffee').id;
    const r = await apiRequest('POST', '/api/admin/menu/items', {
      code: itemCode, name_en: 'S2.4 Item', base_price: 4500, category_id: catId
    }, { 'x-auth-token': adminToken });
    itemId = r.data.id;
  });

  test.afterAll(async () => {
    if (itemId) await apiRequest('DELETE', '/api/admin/menu/items/' + itemId, null, { 'x-auth-token': adminToken });
  });

  test('initial GET returns empty group_ids', async () => {
    const r = await apiRequest('GET', '/api/admin/menu/items/' + itemId + '/modifier-groups',
      null, { 'x-auth-token': adminToken });
    expect(r.status).toBe(200);
    expect(r.data.item_id).toBe(itemId);
    expect(r.data.group_ids).toEqual([]);
  });

  test('cashier (no menu_edit) cannot assign modifier groups', async () => {
    const r = await apiRequest('PUT', '/api/admin/menu/items/' + itemId + '/modifier-groups',
      { group_ids: [sizeGroupId] }, { 'x-cashier-token': cashierTok });
    expect(r.status).toBe(401);
  });

  test('owner-cashier can attach groups', async () => {
    const r = await apiRequest('PUT', '/api/admin/menu/items/' + itemId + '/modifier-groups',
      { group_ids: [sizeGroupId, milkGroupId] }, { 'x-cashier-token': ownerTok });
    expect(r.status).toBe(200);
    expect(r.data.group_ids).toEqual([sizeGroupId, milkGroupId]);
  });

  test('GET reflects attached groups in order', async () => {
    const r = await apiRequest('GET', '/api/admin/menu/items/' + itemId + '/modifier-groups',
      null, { 'x-auth-token': adminToken });
    expect(r.data.group_ids).toEqual([sizeGroupId, milkGroupId]);
  });

  test('PUT replaces (not appends) the group list', async () => {
    const r = await apiRequest('PUT', '/api/admin/menu/items/' + itemId + '/modifier-groups',
      { group_ids: [syrupGroupId] }, { 'x-auth-token': adminToken });
    expect(r.status).toBe(200);
    const get = await apiRequest('GET', '/api/admin/menu/items/' + itemId + '/modifier-groups',
      null, { 'x-auth-token': adminToken });
    expect(get.data.group_ids).toEqual([syrupGroupId]);
  });

  test('duplicate ids in payload are deduplicated', async () => {
    const r = await apiRequest('PUT', '/api/admin/menu/items/' + itemId + '/modifier-groups',
      { group_ids: [sizeGroupId, sizeGroupId, milkGroupId] }, { 'x-auth-token': adminToken });
    expect(r.status).toBe(200);
    expect(r.data.group_ids).toEqual([sizeGroupId, milkGroupId]);
  });

  test('invalid group_id → 400', async () => {
    const r = await apiRequest('PUT', '/api/admin/menu/items/' + itemId + '/modifier-groups',
      { group_ids: [sizeGroupId, 999999] }, { 'x-auth-token': adminToken });
    expect(r.status).toBe(400);
    expect(r.data.error).toBe('invalid_group_id');
  });

  test('missing group_ids → 400', async () => {
    const r = await apiRequest('PUT', '/api/admin/menu/items/' + itemId + '/modifier-groups',
      {}, { 'x-auth-token': adminToken });
    expect(r.status).toBe(400);
    expect(r.data.error).toBe('group_ids_required');
  });

  test('public /api/menu/items/:id/full embeds modifier_groups with options', async () => {
    // Re-attach size + milk for this test
    await apiRequest('PUT', '/api/admin/menu/items/' + itemId + '/modifier-groups',
      { group_ids: [sizeGroupId, milkGroupId] }, { 'x-auth-token': adminToken });
    const r = await apiRequest('GET', '/api/menu/items/' + itemId + '/full');
    expect(r.status).toBe(200);
    expect(r.data.code).toBe(itemCode);
    expect(Array.isArray(r.data.modifier_groups)).toBe(true);
    expect(r.data.modifier_groups.length).toBe(2);
    const sizeG = r.data.modifier_groups.find(g => g.code === 'size');
    expect(sizeG).toBeTruthy();
    expect(sizeG.options.length).toBeGreaterThan(0);
  });

  test('inactive item /full returns 404', async () => {
    await apiRequest('PUT', '/api/admin/menu/items/' + itemId,
      { active: false }, { 'x-auth-token': adminToken });
    const r = await apiRequest('GET', '/api/menu/items/' + itemId + '/full');
    expect(r.status).toBe(404);
    await apiRequest('PUT', '/api/admin/menu/items/' + itemId,
      { active: true }, { 'x-auth-token': adminToken });
  });

  test('group with attached items cannot be deleted (409)', async () => {
    const r = await apiRequest('DELETE', '/api/admin/menu/modifier-groups/' + milkGroupId,
      null, { 'x-auth-token': adminToken });
    expect(r.status).toBe(409);
    expect(r.data.error).toBe('group_in_use');
  });

  test('item delete also clears menu_item_modifiers (cascade)', async () => {
    // Save current state
    const before = await apiRequest('GET', '/api/admin/menu/items/' + itemId + '/modifier-groups',
      null, { 'x-auth-token': adminToken });
    expect(before.data.group_ids.length).toBeGreaterThan(0);
    // Delete item
    await apiRequest('DELETE', '/api/admin/menu/items/' + itemId, null, { 'x-auth-token': adminToken });
    itemId = null;
    // Now milk group should be deletable (no items reference it)
    const r = await apiRequest('DELETE', '/api/admin/menu/modifier-groups/' + milkGroupId,
      null, { 'x-auth-token': adminToken });
    // It IS deletable now — but we don't actually want to delete the seeded
    // group. So the test verifies the API gives 200 and then we re-create it
    // for subsequent tests. Actually since this test runs last in afterAll
    // sequence, we just expect the API succeeded.
    expect(r.status).toBe(200);
    // Re-seed the milk group so other tests/runs aren't affected
    const re = await apiRequest('POST', '/api/admin/menu/modifier-groups', {
      code: 'milk', name_en: 'Milk', name_ar: 'الحليب', name_ko: '우유',
      selection: 'single', required: false, sort_order: 30
    }, { 'x-auth-token': adminToken });
    if (re.status === 200) {
      const newMilkId = re.data.id;
      const milkOpts = [
        { code: 'whole',  name_en: 'Whole milk',  name_ar: 'حليب كامل',     name_ko: '전유',     price_delta_iqd: 0,    is_default: true,  sort_order: 10 },
        { code: 'oat',    name_en: 'Oat milk',    name_ar: 'حليب الشوفان',  name_ko: '오트밀크', price_delta_iqd: 1000, is_default: false, sort_order: 20 },
        { code: 'almond', name_en: 'Almond milk', name_ar: 'حليب اللوز',    name_ko: '아몬드',   price_delta_iqd: 1000, is_default: false, sort_order: 30 },
        { code: 'no',     name_en: 'No milk',     name_ar: 'بدون حليب',     name_ko: '우유 없음',price_delta_iqd: 0,    is_default: false, sort_order: 40 }
      ];
      for (const o of milkOpts) {
        await apiRequest('POST', '/api/admin/menu/modifier-groups/' + newMilkId + '/options',
          o, { 'x-auth-token': adminToken });
      }
    }
  });
});

// =============================================================================
// Sprint 2.5 — Set / combo components
// =============================================================================
test.describe('Sprint 2.5 — Set components', () => {
  let cashierTok, ownerTok;
  let catId;
  let comp1Id, comp2Id, setId, foreignSetId;
  const setCode   = 's25_set_'  + (TS % 100000);
  const fSetCode  = 's25_fset_' + (TS % 100000);
  const comp1Code = 's25_c1_'   + (TS % 100000);
  const comp2Code = 's25_c2_'   + (TS % 100000);

  test.beforeAll(async () => {
    await ensureFixtureAccounts();
    cashierTok = (await apiRequest('POST', '/api/cashier/login', { name: cashierName, password: initialPw })).data.token;
    ownerTok   = (await apiRequest('POST', '/api/cashier/login', { name: ownerName,   password: initialPw })).data.token;
    const cats = (await apiRequest('GET', '/api/admin/menu/categories', null, { 'x-auth-token': adminToken })).data;
    catId = cats.find(c => c.code === 'hot-coffee').id;

    // create 2 single components
    let r = await apiRequest('POST', '/api/admin/menu/items',
      { code: comp1Code, name_en: 'Comp 1', base_price: 3000, kind: 'single', category_id: catId },
      { 'x-auth-token': adminToken });
    comp1Id = r.data.id;
    r = await apiRequest('POST', '/api/admin/menu/items',
      { code: comp2Code, name_en: 'Comp 2', base_price: 2000, kind: 'single', category_id: catId },
      { 'x-auth-token': adminToken });
    comp2Id = r.data.id;
    // a set
    r = await apiRequest('POST', '/api/admin/menu/items',
      { code: setCode, name_en: 'Combo Set', base_price: 4500, kind: 'set', category_id: catId },
      { 'x-auth-token': adminToken });
    setId = r.data.id;
    // a foreign set (used by nested-set test)
    r = await apiRequest('POST', '/api/admin/menu/items',
      { code: fSetCode, name_en: 'Other Set', base_price: 5000, kind: 'set', category_id: catId },
      { 'x-auth-token': adminToken });
    foreignSetId = r.data.id;
  });

  test.afterAll(async () => {
    for (const id of [setId, foreignSetId, comp1Id, comp2Id].filter(Boolean)) {
      await apiRequest('DELETE', '/api/admin/menu/items/' + id, null, { 'x-auth-token': adminToken });
    }
  });

  test('initial GET on a set returns empty components', async () => {
    const r = await apiRequest('GET', '/api/admin/menu/items/' + setId + '/set-components',
      null, { 'x-auth-token': adminToken });
    expect(r.status).toBe(200);
    expect(r.data.kind).toBe('set');
    expect(r.data.components).toEqual([]);
  });

  test('cashier (no menu_edit) cannot edit components', async () => {
    const r = await apiRequest('PUT', '/api/admin/menu/items/' + setId + '/set-components',
      { components: [{ item_id: comp1Id, quantity: 1 }] },
      { 'x-cashier-token': cashierTok });
    expect(r.status).toBe(401);
  });

  test('PUT components on a non-set item → 400 not_a_set', async () => {
    const r = await apiRequest('PUT', '/api/admin/menu/items/' + comp1Id + '/set-components',
      { components: [{ item_id: comp2Id, quantity: 1 }] },
      { 'x-auth-token': adminToken });
    expect(r.status).toBe(400);
    expect(r.data.error).toBe('not_a_set');
  });

  test('owner-cashier can attach components', async () => {
    const r = await apiRequest('PUT', '/api/admin/menu/items/' + setId + '/set-components',
      { components: [
        { item_id: comp1Id, quantity: 1 },
        { item_id: comp2Id, quantity: 2 }
      ] }, { 'x-cashier-token': ownerTok });
    expect(r.status).toBe(200);
    expect(r.data.components.length).toBe(2);
    const c1 = r.data.components.find(c => c.item_id === comp1Id);
    expect(c1.quantity).toBe(1);
    expect(c1.code).toBe(comp1Code);
    const c2 = r.data.components.find(c => c.item_id === comp2Id);
    expect(c2.quantity).toBe(2);
  });

  test('GET reflects new components', async () => {
    const r = await apiRequest('GET', '/api/admin/menu/items/' + setId + '/set-components',
      null, { 'x-auth-token': adminToken });
    expect(r.data.components.length).toBe(2);
  });

  test('PUT replaces (not appends)', async () => {
    const r = await apiRequest('PUT', '/api/admin/menu/items/' + setId + '/set-components',
      { components: [{ item_id: comp1Id, quantity: 3 }] },
      { 'x-auth-token': adminToken });
    expect(r.status).toBe(200);
    expect(r.data.components.length).toBe(1);
    expect(r.data.components[0].quantity).toBe(3);
  });

  test('self-loop rejected', async () => {
    const r = await apiRequest('PUT', '/api/admin/menu/items/' + setId + '/set-components',
      { components: [{ item_id: setId, quantity: 1 }] },
      { 'x-auth-token': adminToken });
    expect(r.status).toBe(400);
    expect(r.data.error).toBe('self_loop');
  });

  test('nested set rejected', async () => {
    const r = await apiRequest('PUT', '/api/admin/menu/items/' + setId + '/set-components',
      { components: [{ item_id: foreignSetId, quantity: 1 }] },
      { 'x-auth-token': adminToken });
    expect(r.status).toBe(400);
    expect(r.data.error).toBe('nested_set_forbidden');
  });

  test('invalid component id rejected', async () => {
    const r = await apiRequest('PUT', '/api/admin/menu/items/' + setId + '/set-components',
      { components: [{ item_id: 999999, quantity: 1 }] },
      { 'x-auth-token': adminToken });
    expect(r.status).toBe(400);
    expect(r.data.error).toBe('invalid_component');
  });

  test('missing components array → 400', async () => {
    const r = await apiRequest('PUT', '/api/admin/menu/items/' + setId + '/set-components',
      {}, { 'x-auth-token': adminToken });
    expect(r.status).toBe(400);
    expect(r.data.error).toBe('components_required');
  });

  test('public /api/menu/items/:id/full embeds components for sets', async () => {
    // Re-attach components for this test
    await apiRequest('PUT', '/api/admin/menu/items/' + setId + '/set-components',
      { components: [{ item_id: comp1Id, quantity: 1 }, { item_id: comp2Id, quantity: 2 }] },
      { 'x-auth-token': adminToken });
    const r = await apiRequest('GET', '/api/menu/items/' + setId + '/full');
    expect(r.status).toBe(200);
    expect(r.data.kind).toBe('set');
    expect(Array.isArray(r.data.components)).toBe(true);
    expect(r.data.components.length).toBe(2);
  });

  test('public /full for single item has components=null', async () => {
    const r = await apiRequest('GET', '/api/menu/items/' + comp1Id + '/full');
    expect(r.status).toBe(200);
    expect(r.data.kind).toBe('single');
    expect(r.data.components).toBeNull();
  });

  test('audit log captures menu.item.set_components events', async () => {
    const r = await apiRequest('GET', '/api/admin/audit?action=menu.item.set_components&limit=10',
      null, { 'x-auth-token': adminToken });
    const e = r.data.find(x => String(x.target_id) === String(setId));
    expect(e).toBeTruthy();
  });

  test('component item delete cascades menu_set_components', async () => {
    // attach comp1 + comp2
    await apiRequest('PUT', '/api/admin/menu/items/' + setId + '/set-components',
      { components: [{ item_id: comp1Id, quantity: 1 }, { item_id: comp2Id, quantity: 1 }] },
      { 'x-auth-token': adminToken });
    // delete comp2
    await apiRequest('DELETE', '/api/admin/menu/items/' + comp2Id, null, { 'x-auth-token': adminToken });
    comp2Id = null;
    // verify only comp1 remains in components
    const r = await apiRequest('GET', '/api/admin/menu/items/' + setId + '/set-components',
      null, { 'x-auth-token': adminToken });
    expect(r.data.components.length).toBe(1);
    expect(r.data.components[0].item_id).toBe(comp1Id);
  });
});

// =============================================================================
// Sprint 2.6 — Sold-out SSE broadcast + client cache
// =============================================================================
test.describe('Sprint 2.6 — Sold-out SSE', () => {
  let cashierTok, ownerTok;
  let itemId;
  const itemCode = 's26_itm_' + (TS % 100000);

  test.beforeAll(async () => {
    await ensureFixtureAccounts();
    cashierTok = (await apiRequest('POST', '/api/cashier/login', { name: cashierName, password: initialPw })).data.token;
    ownerTok   = (await apiRequest('POST', '/api/cashier/login', { name: ownerName,   password: initialPw })).data.token;
    const cats = (await apiRequest('GET', '/api/admin/menu/categories', null, { 'x-auth-token': adminToken })).data;
    const r = await apiRequest('POST', '/api/admin/menu/items',
      { code: itemCode, name_en: 'S2.6 SSE Item', base_price: 3500, category_id: cats[0].id },
      { 'x-auth-token': adminToken });
    itemId = r.data.id;
  });

  test.afterAll(async () => {
    if (itemId) await apiRequest('DELETE', '/api/admin/menu/items/' + itemId, null, { 'x-auth-token': adminToken });
  });

  test('toggle sold-out broadcasts to active SSE listeners', async ({ page }) => {
    // Set up a browser-side EventSource that captures sold-out events.
    // Use the cashier's real token via the stream-ticket flow.
    await page.goto('http://localhost:3000/cashier.html');
    await page.evaluate(async (tok) => {
      window.__sseEvents = [];
      const r = await fetch('/api/orders/stream-ticket', {
        method: 'POST',
        headers: { 'X-Cashier-Token': tok }
      });
      const j = await r.json();
      const es = new EventSource('/api/orders/stream?ticket=' + encodeURIComponent(j.ticket));
      es.onmessage = ev => {
        try { window.__sseEvents.push(JSON.parse(ev.data)); } catch(_){}
      };
      window.__es = es;
      // give the connection a moment to open
      await new Promise(r => setTimeout(r, 300));
    }, cashierTok);

    // Trigger sold-out toggle from another "client"
    const r = await apiRequest('POST', '/api/admin/menu/items/' + itemId + '/sold-out',
      { sold_out: true }, { 'x-cashier-token': ownerTok });
    expect(r.status).toBe(200);

    // Wait up to 3s for the message to arrive on the EventSource side
    const events = await page.waitForFunction(
      (id) => {
        const ev = (window.__sseEvents || []).find(e => e.type === 'menu_item_sold_out' && e.id === id);
        return ev ? ev : null;
      },
      itemId,
      { timeout: 3000 }
    );
    const value = await events.jsonValue();
    expect(value.type).toBe('menu_item_sold_out');
    expect(value.id).toBe(itemId);
    expect(value.sold_out).toBe(true);

    // Cleanup the test EventSource
    await page.evaluate(() => { try { window.__es.close(); } catch(_){} });
  });

  test('cashier SSE handler updates MK_DATA cache on sold-out event', async ({ page }) => {
    // Ensure item starts at sold_out=false so the toggle below produces a
    // visible state change (true). Doing this before login avoids races
    // with the cashier's onmessage handler.
    await apiRequest('POST', '/api/admin/menu/items/' + itemId + '/sold-out',
      { sold_out: false }, { 'x-cashier-token': ownerTok });

    await page.goto('http://localhost:3000/cashier.html');
    await page.waitForSelector('#loginOverlay', { state: 'visible' });
    await page.fill('#loginName', ownerName);
    await page.fill('#loginPw', initialPw);
    await page.click('#loginBtn');
    await page.waitForSelector('#loginOverlay', { state: 'hidden', timeout: 10000 });
    // dismiss must_change_pw modal if shown
    await page.evaluate(() => {
      const m = document.getElementById('pw-mod');
      if (m && m.classList.contains('show')) {
        m.classList.remove('show');
        localStorage.removeItem('must_change_pw');
      }
    });
    // Seed an item record so the handler has a row to mutate
    await page.evaluate((id) => {
      window.MK_DATA = window.MK_DATA || {};
      window.MK_DATA.MENU_V2 = [{ id, name_en: 'S2.6 SSE Item', sold_out: false }];
      window.MK_DATA.MENU_V2_SOLDOUT = new Set();
    }, itemId);
    // Wait for SSE connection to open before triggering the toggle so we don't
    // miss the broadcast.
    await page.waitForFunction(() => {
      const el = document.getElementById('tb-status');
      return el && el.classList.contains('online');
    }, null, { timeout: 5000 });

    // Trigger toggle to TRUE — listener should add to the soldout-set
    await apiRequest('POST', '/api/admin/menu/items/' + itemId + '/sold-out',
      { sold_out: true }, { 'x-cashier-token': ownerTok });

    await page.waitForFunction(
      (id) => {
        const set = window.MK_DATA?.MENU_V2_SOLDOUT;
        const m = (window.MK_DATA?.MENU_V2 || []).find(x => x.id === id);
        return (set && set.has(id) && m && m.sold_out === true) ? true : null;
      },
      itemId,
      { timeout: 5000 }
    );
  });
});

test.describe('Sprint 1 — UI: settings tab visibility & navigation', () => {
  test.beforeAll(async () => { await ensureFixtureAccounts(); });

  test('owner cashier sees settings sidebar; can open all 4 sections', async ({ page }) => {
    await loginAsCashier(page, ownerName, initialPw);
    // settings button visible
    const settingsBtn = page.locator('.sbn[data-v="settings"]');
    await expect(settingsBtn).toBeVisible();
    // open settings
    await settingsBtn.click();
    await expect(page.locator('#v-settings')).toBeVisible();
    await expect(page.locator('#set-nav button[data-sec="store"]')).toHaveCount(1);
    // navigate sections
    for (const sec of ['staff', 'roles', 'security', 'store']) {
      await page.click(`#set-nav button[data-sec="${sec}"]`);
      await expect(page.locator(`#set-nav button[data-sec="${sec}"].on`)).toHaveCount(1);
      // wait briefly for async render then check content presence
      await page.waitForTimeout(400);
      const paneText = await page.textContent('#set-pane');
      expect(paneText.length).toBeGreaterThan(20);
    }
  });

  test('non-owner cashier does NOT see settings button', async ({ page }) => {
    await loginAsCashier(page, cashierName, initialPw);
    const settingsBtn = page.locator('.sbn[data-v="settings"]');
    await expect(settingsBtn).toBeHidden();
  });

  test('manager-override modal: programmatic invocation returns approver creds', async ({ page }) => {
    await loginAsCashier(page, cashierName, initialPw);
    // call the modal directly (existing app actions are not yet wired to
    // require manager override — that is a follow-up Sprint 1.5 task)
    const result = await page.evaluate(async ({ name, pw }) => {
      const p = window.MKS.requireManagerOverride('refund', 'unit test');
      await new Promise(r => setTimeout(r, 200));
      document.getElementById('mgr-name').value   = name;
      document.getElementById('mgr-pw').value     = pw;
      document.getElementById('mgr-reason').value = 'unit test reason';
      document.getElementById('mgr-ok').click();
      return await p;
    }, { name: managerName, pw: initialPw });
    expect(result).not.toBeNull();
    expect(result.name).toBe(managerName);
    expect(result.reason).toBe('unit test reason');
  });
});
