// Deep customer audit — full flows, language, checkout, mobile UX
const { test, expect } = require('@playwright/test');
const BASE = 'http://localhost:3000';
const findings = [];
const log = (sev, area, msg) => findings.push({ sev, area, msg });

test.describe.configure({ mode: 'serial' });

test.afterAll(() => {
  console.log('\n========== DEEP AUDIT ==========');
  const groups = {};
  for (const f of findings) (groups[f.sev] ||= []).push(f);
  for (const sev of ['BLOCK','HIGH','MED','LOW','INFO']) {
    if (!groups[sev]) continue;
    console.log(`\n[${sev}]`);
    for (const f of groups[sev]) console.log(`  • [${f.area}] ${f.msg}`);
  }
  console.log('\n================================\n');
});

test('A. Full add-to-cart with size picker', async ({ page }) => {
  await page.goto(BASE + '/index.html');
  await page.locator('#menu').scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);
  await page.locator('#cat-grid > *').first().click();
  await page.waitForTimeout(400);
  const addBtn = page.locator('#menu-grid button.btn-add').first();
  await addBtn.click();
  await page.waitForTimeout(400);
  // size overlay opens for drinks
  const overlayOpen = await page.locator('#size-overlay.open').count();
  if (overlayOpen) {
    log('INFO','cart','Size picker opened (drink) — confirming M');
    await page.locator('button.size-btn').filter({ hasText: 'M' }).first().click();
    // Confirm button
    const confirm = page.locator('#size-overlay button').filter({ hasText: /confirm|ok|✓|اضف|أضف|add/i });
    if (await confirm.count()) {
      await confirm.first().click();
    } else {
      // Fallback: look for any non-cancel button
      await page.evaluate(() => window.confirmSize && window.confirmSize());
    }
    await page.waitForTimeout(500);
  }
  const badge = await page.locator('#cart-badge').textContent();
  if (badge === '0') log('HIGH','cart',`Cart still 0 after full size-pick flow`);
  else log('INFO','cart',`Cart badge after full add: ${badge}`);
});

test('B. Language switch — full coverage', async ({ page }) => {
  await page.goto(BASE + '/index.html');
  // Snapshot Arabic strings
  const arSampleBefore = await page.locator('h1.hero-title').innerText();
  await page.click('#btn-en');
  await page.waitForTimeout(500);
  const enSample = await page.locator('h1.hero-title').innerText();
  if (enSample === arSampleBefore) log('HIGH','i18n','Hero title did not change after EN click');
  // Check menu category labels translate
  await page.locator('#menu').scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  const catText = await page.locator('#cat-grid').innerText();
  const hasArabic = /[\u0600-\u06FF]/.test(catText);
  const hasLatin = /[A-Za-z]/.test(catText);
  if (hasArabic && !hasLatin) log('MED','i18n','Menu categories still pure Arabic in EN mode');
  // Switch back
  await page.click('#btn-ar');
  await page.waitForTimeout(300);
  const dir = await page.locator('#html-root').getAttribute('dir');
  if (dir !== 'rtl') log('HIGH','i18n',`AR did not restore RTL (got ${dir})`);
});

test('C. Reservation full submit', async ({ page }) => {
  await page.goto(BASE + '/index.html');
  await page.locator('#reserve').scrollIntoViewIfNeeded();
  const tomorrow = new Date(Date.now()+86400000).toISOString().slice(0,10);
  await page.locator('#res-date').fill(tomorrow);
  await page.waitForTimeout(1200);
  const slots = page.locator('#res-slots > *');
  const n = await slots.count();
  if (n === 0) { log('HIGH','reserve','No slots to pick'); return; }
  await slots.first().click();
  await page.waitForTimeout(200);
  await page.locator('#res-name').fill('Test Customer');
  await page.locator('#res-phone').fill('07700000000');
  await page.locator('#btn-reserve').click();
  await page.waitForTimeout(1500);
  const successVisible = await page.locator('#reserve-success').isVisible();
  const errText = (await page.locator('#res-error').textContent()) || '';
  if (!successVisible && !errText.trim())
    log('HIGH','reserve','Submit yielded neither success nor visible error');
  else if (successVisible) log('INFO','reserve','Reservation submitted OK');
  else log('INFO','reserve',`Reservation rejected: "${errText.trim()}"`);
});

test('D. CSP / network errors per page section', async ({ page }) => {
  const errs = [];
  page.on('console', m => { if (m.type()==='error') errs.push(m.text()); });
  await page.goto(BASE + '/index.html', { waitUntil: 'networkidle' });
  // Scroll to bottom to trigger maps/contact
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(1500);
  const cspErrs = errs.filter(e => /Content Security Policy|CSP|blocked/.test(e));
  if (cspErrs.length) log('HIGH','csp',`${cspErrs.length} CSP violations — Maps/iframe blocked`);
  // Check for failed fetches
  const otherErrs = errs.filter(e => !/CSP|Content Security/.test(e));
  if (otherErrs.length) log('HIGH','console',`${otherErrs.length} other console errors: ${otherErrs[0].slice(0,100)}`);
});

test('E. Mobile small tap targets — identify them', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto(BASE + '/index.html');
  await page.waitForTimeout(800);
  const small = await page.evaluate(() => {
    const out = [];
    document.querySelectorAll('button, a').forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;
      if (r.height < 36 || r.width < 36) {
        out.push({ tag: el.tagName, text: (el.innerText||el.title||el.getAttribute('aria-label')||'').slice(0,30), w: Math.round(r.width), h: Math.round(r.height) });
      }
    });
    return out.slice(0, 15);
  });
  for (const s of small) log('MED','mobile-tap',`${s.tag} ${s.w}×${s.h}px "${s.text}"`);
});

test('F. Order section direct usage', async ({ page }) => {
  await page.goto(BASE + '/index.html');
  await page.locator('#order').scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  const html = await page.locator('#order').innerHTML();
  if (html.length < 100) log('HIGH','order','Order section nearly empty');
  // QR code? Or call/whatsapp links?
  const wa = await page.locator('a[href*="wa.me"], a[href*="whatsapp"]').count();
  const tel = await page.locator('a[href^="tel:"]').count();
  log('INFO','order',`whatsapp links=${wa} tel links=${tel}`);
  if (!wa && !tel) log('MED','order','No quick-contact (WA/tel) for order');
});

test('G. Cart drawer / checkout UI', async ({ page }) => {
  await page.goto(BASE + '/index.html');
  await page.locator('#menu').scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await page.locator('#cat-grid > *').first().click();
  await page.waitForTimeout(300);
  // Force-add via JS to bypass size picker
  await page.evaluate(() => {
    if (typeof addToCartFinal === 'function' && typeof menuData !== 'undefined' && menuData) {
      addToCartFinal(Object.keys(menuData)[0], 0, null);
    }
  });
  await page.waitForTimeout(300);
  const badge = await page.locator('#cart-badge').textContent();
  log('INFO','cart-jsdrive',`Forced add → badge=${badge}`);
  // Open cart
  const cartBtn = page.locator('.cart-btn, #cart-btn, [class*="cart"]').filter({ has: page.locator('#cart-badge') }).first();
  if (await cartBtn.count()) {
    await cartBtn.click().catch(()=>{});
    await page.waitForTimeout(400);
    const drawerOpen = await page.locator('[class*="drawer"], [class*="cart-panel"], .modal').first().isVisible().catch(()=>false);
    if (!drawerOpen) log('HIGH','cart','Cart icon click did not open drawer/modal');
  }
});

test('H. Reservation past-date guard', async ({ page }) => {
  await page.goto(BASE + '/index.html');
  await page.locator('#reserve').scrollIntoViewIfNeeded();
  const minAttr = await page.locator('#res-date').getAttribute('min');
  if (!minAttr) log('MED','reserve','Date input has no min attribute — past dates selectable');
  else log('INFO','reserve',`Date min=${minAttr}`);
});

test('I. Performance — assets and weight', async ({ page }) => {
  let total = 0, count = 0;
  page.on('response', async resp => {
    try { const len = +(resp.headers()['content-length']||0); if (len) { total += len; count++; } } catch {}
  });
  await page.goto(BASE + '/index.html', { waitUntil: 'networkidle' });
  log('INFO','perf',`Total bytes (with content-length) ≈ ${(total/1024).toFixed(0)}KB across ${count} responses`);
  if (total > 1.5*1024*1024) log('MED','perf',`Page weight > 1.5MB — heavy for landing`);
});
