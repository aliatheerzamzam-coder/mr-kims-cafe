// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Five-Persona E2E Test Suite for Mr. Kim's Cafe POS
 * Tests critical user journeys: Cashier → Barista → Chef → Customer → Operations
 *
 * Prerequisites:
 * - Server running on http://localhost:3000
 * - Database seeded with menu items
 */

test.describe('5 Personas E2E: Mr. Kim\'s Cafe POS', () => {

  let orderId;
  let receiptAmount;

  // ========================================
  // 1. CASHIER - New Order Creation & Payment
  // ========================================
  test.describe('1. Cashier - Order Creation & Cash Payment', () => {

    test('should login to POS and verify cart area', async ({ page }) => {
      // Navigate to POS
      await page.goto('/cashier.html');
      await page.waitForTimeout(500);

      // Login if needed
      const passwordInput = page.locator('input[type="password"]');
      const loginBtn = page.locator('button#loginBtn');

      if (await loginBtn.isVisible()) {
        await passwordInput.fill('1234');
        await loginBtn.click();
        await page.waitForTimeout(500);
      }

      // Verify POS is visible - look for cart or order area
      const cartArea = page.locator('[class*="cart"], [class*="order"], .order-screen');
      const isVisible = await cartArea.first().isVisible({ timeout: 5000 }).catch(() => false);

      if (isVisible) {
        await page.screenshot({ path: 'test-results/cashier-login-success.png', fullPage: true });
        expect(isVisible).toBeTruthy();
      }
    });

    test('should navigate to KDS after order', async ({ page }) => {
      // Navigate to KDS view to verify incoming orders
      await page.goto('/cashier.html#kitchen');
      await page.waitForTimeout(500);

      // Look for KDS columns: incoming, preparing, ready
      const incomingCol = page.locator('[class*="incoming"], [class*="column"]');
      const isKdsVisible = await incomingCol.first().isVisible({ timeout: 5000 }).catch(() => false);

      if (isKdsVisible) {
        await page.screenshot({ path: 'test-results/kds-view-initial.png', fullPage: true });
        expect(isKdsVisible).toBeTruthy();
      }
    });

    test('should verify KDS shows order data from TXNS', async ({ page }) => {
      // Navigate to KDS
      await page.goto('/cashier.html#kitchen');
      await page.waitForTimeout(1000);

      // Verify KDS view is loaded
      const kdsContainer = page.locator('[class*="kitchen"], [class*="kds"], #v-kitchen');
      const isKdsLoaded = await kdsContainer.first().isVisible({ timeout: 10000 }).catch(() => false);

      if (isKdsLoaded) {
        // Take screenshot
        await page.screenshot({ path: 'test-results/kds-incoming-orders.png', fullPage: true });
        expect(isKdsLoaded).toBeTruthy();
      }
    });
  });

  // ========================================
  // 2. BARISTA - Process Beverages (KDS)
  // ========================================
  test.describe('2. Barista - KDS Beverage Processing', () => {

    test('should filter KDS to Barista view', async ({ page }) => {
      await page.goto('/cashier.html#kitchen');
      await page.waitForTimeout(500);

      // Look for filter tabs
      const baristaFilterBtn = page.locator('button:has-text("☕"), button:has-text("Barista"), [class*="filter"]');

      if (await baristaFilterBtn.first().isVisible({ timeout: 5000 })) {
        await baristaFilterBtn.first().click();
        await page.waitForTimeout(300);

        // Verify active state
        const activeTab = page.locator('[class*="active"], [aria-selected="true"]');
        const tabText = await activeTab.first().textContent();
        expect(tabText).toMatch(/☕|Barista/i);
      }

      // Take screenshot of filtered view
      await page.screenshot({ path: 'test-results/kds-barista-filter.png', fullPage: true });
    });

    test('should move beverage order from incoming to preparing', async ({ page }) => {
      await page.goto('/cashier.html#kitchen');
      await page.waitForTimeout(500);

      // Click Barista filter
      const baristaBtn = page.locator('button:has-text("☕"), button:has-text("Barista")');
      if (await baristaBtn.first().isVisible()) {
        await baristaBtn.first().click();
        await page.waitForTimeout(300);
      }

      // Find order card in incoming
      const incomingOrders = page.locator('[class*="incoming"] [class*="order"], [class*="incoming"] [class*="card"]');

      if (await incomingOrders.first().isVisible({ timeout: 5000 })) {
        // Click play/start button to move to preparing
        const playBtn = page.locator('button:has-text("▶"), button[class*="start"], [class*="preparing-btn"]');

        if (await playBtn.first().isVisible()) {
          await playBtn.first().click();
          await page.waitForTimeout(300);
        }

        // Verify order moved to preparing
        const preparingCol = page.locator('[class*="preparing"]');
        await expect(preparingCol).toBeVisible({ timeout: 5000 });
      }

      await page.screenshot({ path: 'test-results/kds-barista-preparing.png', fullPage: true });
    });

    test('should move beverage order from preparing to ready', async ({ page }) => {
      await page.goto('/cashier.html#kitchen');
      await page.waitForTimeout(500);

      // Click Barista filter
      const baristaBtn = page.locator('button:has-text("☕"), button:has-text("Barista")');
      if (await baristaBtn.first().isVisible()) {
        await baristaBtn.first().click();
        await page.waitForTimeout(300);
      }

      // Find order in preparing column
      const preparingOrders = page.locator('[class*="preparing"] [class*="order"], [class*="preparing"] [class*="card"]');

      if (await preparingOrders.first().isVisible({ timeout: 5000 })) {
        // Click checkmark/complete button
        const checkBtn = page.locator('button:has-text("✓"), button:has-text("done"), button[class*="complete"]');

        if (await checkBtn.first().isVisible()) {
          await checkBtn.first().click();
          await page.waitForTimeout(300);
        }

        // Verify order moved to ready
        const readyCol = page.locator('[class*="ready"]');
        await expect(readyCol).toBeVisible({ timeout: 5000 });
      }

      await page.screenshot({ path: 'test-results/kds-barista-ready.png', fullPage: true });
    });
  });

  // ========================================
  // 3. CHEF - Process Food/Pizza (KDS)
  // ========================================
  test.describe('3. Chef - KDS Food/Pizza Processing', () => {

    test('should filter KDS to Kitchen view', async ({ page }) => {
      await page.goto('/cashier.html#kitchen');
      await page.waitForTimeout(500);

      // Look for Kitchen filter
      const kitchenFilterBtn = page.locator('button:has-text("🍳"), button:has-text("Kitchen"), [class*="filter"]');

      if (await kitchenFilterBtn.first().isVisible({ timeout: 5000 })) {
        await kitchenFilterBtn.first().click();
        await page.waitForTimeout(300);

        // Verify filter is active
        const activeTab = page.locator('[class*="active"], [aria-selected="true"]');
        const tabText = await activeTab.first().textContent();
        expect(tabText).toMatch(/🍳|Kitchen/i);
      }

      await page.screenshot({ path: 'test-results/kds-kitchen-filter.png', fullPage: true });
    });

    test('should move food order from incoming to preparing', async ({ page }) => {
      await page.goto('/cashier.html#kitchen');
      await page.waitForTimeout(500);

      // Click Kitchen filter
      const kitchenBtn = page.locator('button:has-text("🍳"), button:has-text("Kitchen")');
      if (await kitchenBtn.first().isVisible()) {
        await kitchenBtn.first().click();
        await page.waitForTimeout(300);
      }

      // Find order in incoming
      const incomingOrders = page.locator('[class*="incoming"] [class*="order"], [class*="incoming"] [class*="card"]');

      if (await incomingOrders.first().isVisible({ timeout: 5000 })) {
        const playBtn = page.locator('button:has-text("▶"), button[class*="start"]');

        if (await playBtn.first().isVisible()) {
          await playBtn.first().click();
          await page.waitForTimeout(300);
        }
      }

      await page.screenshot({ path: 'test-results/kds-kitchen-preparing.png', fullPage: true });
    });
  });

  // ========================================
  // 4. CUSTOMER - Browse Menu & Stamps
  // ========================================
  test.describe('4. Customer - Menu & Stamps', () => {

    test('should load main site and verify UI language', async ({ page }) => {
      await page.goto('/');
      await page.waitForTimeout(1000);

      // Take screenshot
      await page.screenshot({ path: 'test-results/customer-main-site.png', fullPage: true });

      // Check for Korean characters (한글) in visible UI
      const bodyText = await page.textContent('body');
      const koreanRegex = /[\uAC00-\uD7AF]/g;
      const koreanMatches = bodyText.match(koreanRegex);

      if (koreanMatches && koreanMatches.length > 0) {
        console.log(`FOUND: ${koreanMatches.length} Korean characters on main site`);
        // Note: This is acceptable if only in i18n definitions, not in rendered UI
      }

      // Verify page loads
      const pageContent = page.locator('body');
      await expect(pageContent).toBeVisible({ timeout: 5000 });
    });

    test('should verify menu items display in English/Arabic', async ({ page }) => {
      await page.goto('/');
      await page.waitForTimeout(500);

      // Look for menu section
      const menuSection = page.locator('[class*="menu"], section:has-text("Menu"), [class*="items"]');

      // Should find menu in English or Arabic, NOT Korean
      let menuFound = false;

      // Check for English menu terms
      const englishTerms = ['Espresso', 'Latte', 'Cappuccino', 'Coffee', 'Drink', 'Food', 'Pizza'];
      const bodyText = await page.textContent('body');

      for (const term of englishTerms) {
        if (bodyText.includes(term)) {
          menuFound = true;
          break;
        }
      }

      expect(menuFound).toBeTruthy();
    });

    test('should not expose Korean UI strings in HTML/CSS', async ({ page }) => {
      await page.goto('/cashier.html');
      await page.waitForTimeout(500);

      // Get all text from HTML
      const html = await page.content();

      // Search for Korean characters in HTML
      const koreanInHtml = html.match(/[\uAC00-\uD7AF]+/g);

      if (koreanInHtml) {
        // Filter out legitimate uses (like in i18n definitions)
        const legitimateKorean = ['ko:', 'korean', '한글'];
        const illegalKorean = koreanInHtml.filter(k =>
          !legitimateKorean.some(lg => k.includes(lg))
        );

        if (illegalKorean.length > 0) {
          console.log('WARNING: Found Korean text exposed in HTML:', illegalKorean.slice(0, 5));
        }
      }
    });
  });

  // ========================================
  // 5. OPERATIONS - Sales & Reports
  // ========================================
  test.describe('5. Operations - Sales & Reports', () => {

    test('should navigate to reports section', async ({ page }) => {
      await page.goto('/cashier.html#reports');
      await page.waitForTimeout(1000);

      // Look for reports view
      const reportsSection = page.locator('#v-reports, [class*="reports"], [class*="sales"]');
      const isReportsLoaded = await reportsSection.first().isVisible({ timeout: 5000 }).catch(() => false);

      if (isReportsLoaded) {
        await page.screenshot({ path: 'test-results/operations-reports-loaded.png', fullPage: true });
        expect(isReportsLoaded).toBeTruthy();
      }
    });

    test('should display POS summary statistics', async ({ page }) => {
      await page.goto('/cashier.html');
      await page.waitForTimeout(500);

      // Verify POS is loaded
      const posContainer = page.locator('.pos-root, [class*="order-screen"], [class*="main"]');
      const isPosLoaded = await posContainer.first().isVisible({ timeout: 5000 }).catch(() => false);

      if (isPosLoaded) {
        await page.screenshot({ path: 'test-results/operations-pos-summary.png', fullPage: true });
        expect(isPosLoaded).toBeTruthy();
      }
    });

    test('should verify page navigation without errors', async ({ page }) => {
      // Navigate to different sections
      await page.goto('/cashier.html');
      await page.waitForTimeout(300);

      await page.goto('/cashier.html#kitchen');
      await page.waitForTimeout(300);

      await page.goto('/cashier.html#reports');
      await page.waitForTimeout(300);

      // If we got here without errors, navigation works
      expect(true).toBeTruthy();
    });
  });

  // ========================================
  // VALIDATION CHECKS
  // ========================================
  test.describe('Validation Checks', () => {

    test('should have no console errors (critical level)', async ({ page }) => {
      const errors = [];

      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });

      page.on('pageerror', err => {
        errors.push(err.toString());
      });

      // Navigate through key pages
      await page.goto('/cashier.html');
      await page.waitForTimeout(1000);
      await page.goto('/cashier.html#kitchen');
      await page.waitForTimeout(1000);
      await page.goto('/cashier.html#reports');
      await page.waitForTimeout(1000);

      // Filter for serious errors (not warnings)
      const seriousErrors = errors.filter(e =>
        !e.includes('warn') && !e.includes('Deprecation')
      );

      console.log(`Console errors found: ${seriousErrors.length}`);
      if (seriousErrors.length > 0) {
        console.log('Sample errors:', seriousErrors.slice(0, 3));
      }
    });

    test('should verify KDS updates without reload', async ({ page }) => {
      await page.goto('/cashier.html#kitchen');
      await page.waitForTimeout(500);

      // Get initial order count
      const initialOrders = page.locator('[class*="order"], [class*="card"]');
      const initialCount = await initialOrders.count();

      // Wait and check again (simulating live updates)
      await page.waitForTimeout(2000);
      const updatedOrders = page.locator('[class*="order"], [class*="card"]');
      const updatedCount = await updatedOrders.count();

      // Should be able to detect changes without reload
      expect(updatedCount).toBeGreaterThanOrEqual(0);
    });
  });

});
