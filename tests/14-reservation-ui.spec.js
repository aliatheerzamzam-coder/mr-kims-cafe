/**
 * Test 14: Reservation UI flows
 * - Success screen shows after reservation on index.html
 * - Cashier page shows reservation flash popup via SSE
 */

const { test, expect } = require('@playwright/test');

function getFutureDate(offsetDays = 30) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
}

test.describe('Reservation success screen (index.html)', () => {
  test('success screen shows after submitting reservation form', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.locator('#reserve').scrollIntoViewIfNeeded();

    // Fill date, then call loadReserveSlots() directly
    const date = getFutureDate(31);
    await page.locator('#res-date').fill(date);
    await page.evaluate(() => loadReserveSlots());

    // Wait for slots to appear
    await page.waitForSelector('#res-slots-wrap', { state: 'visible', timeout: 8000 });

    // Click first available time slot
    const firstSlot = page.locator('.reserve-time-btn:not([disabled])').first();
    await expect(firstSlot).toBeVisible({ timeout: 5000 });
    await firstSlot.click();

    // Fill name and phone — use unique phone per run to avoid stale-state
    // collisions in the local DB across repeated test invocations.
    const uniqPhone = `0770${String(Date.now()).slice(-7)}`;
    await page.locator('#res-name').fill('Test Customer');
    await page.locator('#res-phone').fill(uniqPhone);

    // Pick an area — the form validates this client-side too.
    await page.locator('.reserve-area-btn[data-area="floor_1"]').click();

    // Submit the reservation
    await page.locator('#btn-reserve').click();

    // Success div must appear and form must hide
    await expect(page.locator('#reserve-success')).toBeVisible({ timeout: 8000 });
    await expect(page.locator('#reserve-form-wrap')).toBeHidden();

    // Success message must contain the customer name
    const msg = await page.locator('#reserve-success-msg').innerText();
    expect(msg).toContain('Test Customer');

    // No fatal JS errors
    const fatalErrors = errors.filter(e =>
      !e.includes('ResizeObserver') &&
      !e.includes('non-passive') &&
      !e.includes('AudioContext')
    );
    if (fatalErrors.length > 0) console.log('JS errors:', fatalErrors);
    expect(fatalErrors.length).toBe(0);
  });

  test('validation error shown when time slot not selected', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.locator('#reserve').scrollIntoViewIfNeeded();

    const date = getFutureDate(32);
    await page.locator('#res-date').fill(date);
    await page.evaluate(() => loadReserveSlots());
    await page.waitForSelector('#res-slots-wrap', { state: 'visible', timeout: 8000 });

    // Fill name and phone but do NOT select a slot
    await page.locator('#res-name').fill('Test Customer');
    await page.locator('#res-phone').fill('07700000002');

    await page.locator('#btn-reserve').click();

    // Validation error must appear; success must NOT appear
    await expect(page.locator('#res-error')).not.toBeEmpty({ timeout: 3000 });
    await expect(page.locator('#reserve-success')).not.toBeVisible();
  });
});

test.describe('Cashier reservation flash popup (cashier.html)', () => {
  test('reservation flash shows when new reservation arrives via SSE', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    // Open cashier page (SSE keeps networkidle from resolving — use domcontentloaded)
    await page.goto('/cashier.html');
    await page.waitForLoadState('domcontentloaded');

    // Login overlay uses #loginName / #loginPw / doCashierLogin.
    // Match the QA helper credentials (qa_tester / 1234) — owner role, kept
    // separate from real operator accounts so password rotation in prod
    // doesn't break tests.
    await expect(page.locator('#loginOverlay')).toBeVisible({ timeout: 5000 });
    await page.locator('#loginName').fill(process.env.QA_CASHIER_NAME || 'qa_tester');
    await page.locator('#loginPw').fill(process.env.QA_CASHIER_PASSWORD || '1234');
    await page.locator('#loginBtn').click();

    // After login, overlay must hide
    await expect(page.locator('#loginOverlay')).toBeHidden({ timeout: 5000 });

    // Give SSE connection time to establish
    await page.waitForTimeout(1500);

    // Make a new reservation via API (simulates a customer submitting the form)
    const date = getFutureDate(33);

    // Find an available slot to avoid 409 from repeated test runs
    const avail = await page.request.get(`/api/reservations/availability?date=${date}`);
    const { slots } = await avail.json();
    const freeSlot = slots.find(s => s.count < 4);
    expect(freeSlot).toBeTruthy(); // if all slots full, DB needs clearing

    const resp = await page.request.post('/api/reservations', {
      headers: { 'Content-Type': 'application/json' },
      data: JSON.stringify({
        date,
        time: freeSlot.time,
        party_size: 2,
        name: 'Flash Test User',
        phone: `0779${String(Date.now()).slice(-7)}`,
        table_num: 'floor_1',
      })
    });
    expect(resp.status()).toBe(200);

    // Flash popup must appear with class 'show' within 6s
    await expect(page.locator('#res-flash')).toHaveClass(/show/, { timeout: 6000 });

    // Flash must contain correct info
    await expect(page.locator('#res-flash-name')).toContainText('Flash Test User');
    await expect(page.locator('#res-flash-datetime')).toContainText(date);

    // No fatal JS errors
    const fatalErrors = errors.filter(e =>
      !e.includes('ResizeObserver') &&
      !e.includes('non-passive') &&
      !e.includes('AudioContext')
    );
    if (fatalErrors.length > 0) console.log('Cashier JS errors:', fatalErrors);
    expect(fatalErrors.length).toBe(0);
  });
});

test.describe('Web-orders reservation flash dismiss (web-orders.html)', () => {
  test('X button immediately closes reservation flash', async ({ page }) => {
    await page.goto('/web-orders.html');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('#loginOverlay')).toBeVisible({ timeout: 5000 });
    await page.locator('#loginName').fill(process.env.QA_CASHIER_NAME || 'qa_tester');
    await page.locator('#loginPw').fill(process.env.QA_CASHIER_PASSWORD || '1234');
    await page.locator('#loginBtn').click();
    await expect(page.locator('#loginOverlay')).toBeHidden({ timeout: 5000 });
    await page.waitForTimeout(800);

    // Trigger a real reservation via API so the SSE path drives the flash.
    const date = getFutureDate(34);
    const avail = await page.request.get(`/api/reservations/availability?date=${date}`);
    const { slots } = await avail.json();
    const freeSlot = slots.find(s => s.count < 4);
    expect(freeSlot).toBeTruthy();
    const resp = await page.request.post('/api/reservations', {
      headers: { 'Content-Type': 'application/json' },
      data: JSON.stringify({
        date,
        time: freeSlot.time,
        party_size: 3,
        name: 'XBtn Test',
        phone: `0778${String(Date.now()).slice(-7)}`,
        table_num: 'floor_1',
      })
    });
    expect(resp.status()).toBe(200);

    await expect(page.locator('#res-flash')).toHaveClass(/show/, { timeout: 6000 });
    await expect(page.locator('#res-flash-close')).toBeVisible();
    await page.locator('#res-flash-close').click();
    await expect(page.locator('#res-flash')).not.toHaveClass(/show/, { timeout: 1000 });
  });

  test('reservation flash auto-dismisses within 11 seconds', async ({ page }) => {
    await page.goto('/web-orders.html');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('#loginOverlay')).toBeVisible({ timeout: 5000 });
    await page.locator('#loginName').fill(process.env.QA_CASHIER_NAME || 'qa_tester');
    await page.locator('#loginPw').fill(process.env.QA_CASHIER_PASSWORD || '1234');
    await page.locator('#loginBtn').click();
    await expect(page.locator('#loginOverlay')).toBeHidden({ timeout: 5000 });
    await page.waitForTimeout(800);

    const date = getFutureDate(35);
    const avail = await page.request.get(`/api/reservations/availability?date=${date}`);
    const { slots } = await avail.json();
    const freeSlot = slots.find(s => s.count < 4);
    expect(freeSlot).toBeTruthy();
    const resp = await page.request.post('/api/reservations', {
      headers: { 'Content-Type': 'application/json' },
      data: JSON.stringify({
        date,
        time: freeSlot.time,
        party_size: 2,
        name: 'Auto Dismiss Test',
        phone: `0779${String(Date.now()).slice(-7)}`,
        table_num: 'floor_2',
      })
    });
    expect(resp.status()).toBe(200);

    await expect(page.locator('#res-flash')).toHaveClass(/show/, { timeout: 6000 });
    // 10초 자동 dismiss + 약간의 여유 → 11초 안에 .show 가 사라져야 함
    await expect(page.locator('#res-flash')).not.toHaveClass(/show/, { timeout: 11000 });
  });
});
