// Customer journey audit — pretends to be a real customer
// Reports: blockers, friction, missing affordances, JS errors, broken links
const { test, expect } = require('@playwright/test');

const BASE = process.env.BASE_URL || 'http://localhost:3000';
const findings = [];
const log = (sev, area, msg) => findings.push({ sev, area, msg });

test.describe.configure({ mode: 'serial' });

test.afterAll(async () => {
  console.log('\n\n========== CUSTOMER AUDIT REPORT ==========');
  const groups = { BLOCK: [], HIGH: [], MED: [], LOW: [], INFO: [] };
  for (const f of findings) (groups[f.sev] || (groups[f.sev]=[])).push(f);
  for (const sev of ['BLOCK','HIGH','MED','LOW','INFO']) {
    if (!groups[sev].length) continue;
    console.log(`\n[${sev}] (${groups[sev].length})`);
    for (const f of groups[sev]) console.log(`  • [${f.area}] ${f.msg}`);
  }
  console.log('\n===========================================\n');
});

async function attachConsole(page, area) {
  page.on('console', msg => {
    if (msg.type() === 'error') log('HIGH', area, `Console error: ${msg.text().slice(0,200)}`);
  });
  page.on('pageerror', err => log('BLOCK', area, `JS exception: ${err.message.slice(0,200)}`));
  page.on('response', resp => {
    if (resp.status() >= 400 && !resp.url().includes('favicon'))
      log('HIGH', area, `${resp.status()} ${resp.url().replace(BASE,'')}`);
  });
}

test('1. First load + hero', async ({ page }) => {
  await attachConsole(page, 'load');
  const t0 = Date.now();
  await page.goto(BASE + '/index.html', { waitUntil: 'networkidle', timeout: 30000 });
  const loadMs = Date.now() - t0;
  if (loadMs > 4000) log('MED','perf',`Initial load slow: ${loadMs}ms`);
  await expect(page.locator('h1.hero-title')).toBeVisible();
  // Language: page is RTL Arabic by default. Check toggle works.
  await page.click('#btn-en');
  await page.waitForTimeout(300);
  const dir = await page.locator('#html-root').getAttribute('dir');
  if (dir !== 'ltr') log('HIGH','i18n',`EN toggle did not switch dir to ltr (got ${dir})`);
});

test('2. Navigation works', async ({ page }) => {
  await attachConsole(page,'nav');
  await page.goto(BASE + '/index.html');
  const sections = ['menu','order','reserve','meeting','about','contact'];
  for (const s of sections) {
    const exists = await page.locator(`#${s}`).count();
    if (!exists) log('HIGH','nav',`Section #${s} missing`);
  }
  // Hamburger on mobile?
  await page.setViewportSize({ width: 375, height: 800 });
  const hamb = await page.locator('#hamburger').isVisible();
  if (!hamb) log('MED','mobile','Hamburger menu not visible at 375px');
});

test('3. Menu browsing as customer', async ({ page }) => {
  await attachConsole(page,'menu');
  await page.goto(BASE + '/index.html');
  await page.locator('#menu').scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);
  const cats = await page.locator('#cat-grid > *').count();
  if (cats === 0) log('BLOCK','menu','No categories rendered');
  // Click first category
  const firstCat = page.locator('#cat-grid > *').first();
  if (await firstCat.count()) {
    await firstCat.click();
    await page.waitForTimeout(500);
    const items = await page.locator('#menu-grid > *').count();
    if (items === 0) log('BLOCK','menu','Category clicked but no items shown');
    else log('INFO','menu',`Category 1 → ${items} items`);
  }
});

test('4. Add to cart + checkout intent', async ({ page }) => {
  await attachConsole(page,'cart');
  await page.goto(BASE + '/index.html');
  await page.locator('#menu').scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);
  await page.locator('#cat-grid > *').first().click().catch(()=>{});
  await page.waitForTimeout(400);
  const addBtns = page.locator('#menu-grid button').filter({ hasText: /\+|add|اضف|أضف/i });
  const n = await addBtns.count();
  if (n === 0) {
    // try any button on a card
    const cardBtns = await page.locator('#menu-grid button').count();
    if (cardBtns === 0) log('BLOCK','cart','No add-to-cart buttons on menu items');
    else log('INFO','cart',`Found ${cardBtns} buttons on menu cards (no +/add label)`);
  }
  // Try clicking first add-to-cart button on a menu card
  const anyBtn = page.locator('#menu-grid button.btn-add').first();
  if (await anyBtn.count()) {
    await anyBtn.click().catch(()=>{});
    await page.waitForTimeout(400);
    // Handle size picker overlay (opens for drinks)
    const overlayOpen = await page.locator('#size-overlay.open').count();
    if (overlayOpen) {
      await page.locator('button.size-btn').filter({ hasText: 'M' }).first().click().catch(()=>{});
      const confirm = page.locator('#size-overlay button').filter({ hasText: /confirm|ok|✓|اضف|أضف|add/i });
      if (await confirm.count()) {
        await confirm.first().click().catch(()=>{});
      }
      await page.waitForTimeout(400);
    }
    const badge = await page.locator('#cart-badge').textContent();
    log('INFO','cart',`Cart badge after click: "${badge}"`);
    if (badge === '0') log('HIGH','cart','Clicked add button but cart badge stayed at 0');
  }
});

test('5. Reservation form', async ({ page }) => {
  await attachConsole(page,'reserve');
  await page.goto(BASE + '/index.html');
  await page.locator('#reserve').scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  const dateInput = page.locator('#res-date');
  if (!await dateInput.count()) { log('BLOCK','reserve','Date input missing'); return; }
  // Pick tomorrow
  const tomorrow = new Date(Date.now()+86400000).toISOString().slice(0,10);
  await dateInput.fill(tomorrow);
  await page.waitForTimeout(1500);
  const slotsVisible = await page.locator('#res-slots-wrap').isVisible();
  if (!slotsVisible) log('HIGH','reserve','Slots panel did not appear after picking date');
  const slotCount = await page.locator('#res-slots > *').count();
  log('INFO','reserve',`Slots loaded: ${slotCount}`);
  if (slotCount === 0 && slotsVisible) log('HIGH','reserve','Slots panel visible but empty');
  // Try submitting empty
  await page.locator('#btn-reserve').click().catch(()=>{});
  await page.waitForTimeout(300);
  const err = await page.locator('#res-error').textContent();
  if (!err || !err.trim()) log('MED','reserve','No validation error on empty submit');
});

test('6. Meeting room calendar', async ({ page }) => {
  await attachConsole(page,'meeting');
  await page.goto(BASE + '/index.html');
  await page.locator('#meeting').scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);
  const days = await page.locator('#cal-days > *').count();
  if (days === 0) log('HIGH','meeting','Meeting calendar has no days rendered');
  else log('INFO','meeting',`Calendar days: ${days}`);
});

test('7. Auth modal', async ({ page }) => {
  await attachConsole(page,'auth');
  await page.goto(BASE + '/index.html');
  const loginBtn = page.locator('#btn-auth-login');
  if (!await loginBtn.isVisible()) { log('HIGH','auth','Login button not visible'); return; }
  await loginBtn.click();
  await page.waitForTimeout(300);
  const modal = page.locator('.modal, .auth-modal, [class*="modal"]').first();
  const visible = await modal.isVisible().catch(()=>false);
  if (!visible) log('HIGH','auth','Auth modal did not open');
});

test('8. Mobile 375 layout', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await attachConsole(page,'mobile');
  await page.goto(BASE + '/index.html');
  // Detect horizontal overflow
  const overflow = await page.evaluate(() => {
    return document.documentElement.scrollWidth - document.documentElement.clientWidth;
  });
  if (overflow > 2) log('HIGH','mobile',`Horizontal scroll: ${overflow}px overflow`);
  // CTA tap targets
  const small = await page.evaluate(() => {
    const btns = [...document.querySelectorAll('button, a.btn, .nav-links a')];
    return btns.filter(b => {
      const r = b.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && (r.height < 36 || r.width < 36);
    }).length;
  });
  if (small > 5) log('MED','mobile',`${small} interactive elements smaller than 36px tap target`);
});

test('9. Contact / footer links', async ({ page }) => {
  await attachConsole(page,'contact');
  await page.goto(BASE + '/index.html');
  await page.locator('#contact').scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  const tel = await page.locator('a[href^="tel:"]').count();
  const map = await page.locator('a[href*="map"], a[href*="goo.gl"]').count();
  const ig  = await page.locator('a[href*="instagram"]').count();
  if (!tel) log('MED','contact','No tel: link in contact');
  if (!map) log('MED','contact','No map link in contact');
  if (!ig)  log('LOW','contact','No instagram link');
});

test('10. Images loaded + alt text', async ({ page }) => {
  await attachConsole(page,'images');
  await page.goto(BASE + '/index.html', { waitUntil: 'networkidle' });
  const broken = await page.evaluate(() => {
    const imgs = [...document.images];
    return {
      total: imgs.length,
      broken: imgs.filter(i => i.complete && i.naturalWidth === 0).length,
      noAlt:  imgs.filter(i => !i.alt || !i.alt.trim()).length,
    };
  });
  log('INFO','images',`total=${broken.total} broken=${broken.broken} noAlt=${broken.noAlt}`);
  if (broken.broken > 0) log('HIGH','images',`${broken.broken} broken images`);
  if (broken.noAlt > 3)  log('MED','a11y',`${broken.noAlt} images missing alt`);
});
