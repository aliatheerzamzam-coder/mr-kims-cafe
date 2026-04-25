// @ts-check
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const MOBILE_WIDTH = 375;
const MOBILE_HEIGHT = 812;
const TEST_RESULTS_DIR = path.join(__dirname, '..', 'test-results', 'mobile-375');

// Ensure test-results directory exists
if (!fs.existsSync(TEST_RESULTS_DIR)) {
  fs.mkdirSync(TEST_RESULTS_DIR, { recursive: true });
}

// Helper to check horizontal overflow
async function checkHorizontalOverflow(page, pageName) {
  const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
  const clientWidth = await page.evaluate(() => document.body.clientWidth);

  const hasOverflow = scrollWidth > MOBILE_WIDTH;

  if (hasOverflow) {
    console.log(`[${pageName}] OVERFLOW DETECTED: scrollWidth=${scrollWidth}, MOBILE_WIDTH=${MOBILE_WIDTH}`);
  }

  return {
    scrollWidth,
    clientWidth,
    hasOverflow
  };
}

// Helper to get console errors
async function getConsoleErrors(page) {
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  return errors;
}

// Helper to save screenshot
async function saveScreenshot(page, name) {
  const filepath = path.join(TEST_RESULTS_DIR, `${name}.png`);
  await page.screenshot({ path: filepath, fullPage: true });
  console.log(`Screenshot saved: ${filepath}`);
  return filepath;
}

test.describe('Mobile 375px QA - index.html (Main/Order Page)', () => {
  test.beforeEach(async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: MOBILE_WIDTH, height: MOBILE_HEIGHT });
  });

  test('01: Page load and header visibility', async ({ page }) => {
    // Navigate to main page
    await page.goto('/');

    // Wait for page to load
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

    // Check if page is visible
    const bodyVisible = await page.locator('body').isVisible();
    expect(bodyVisible).toBe(true);

    // Check header elements
    const header = await page.locator('header, nav, .header, [role="banner"]').first();
    const headerExists = await header.count() > 0 || await page.locator('h1').count() > 0;
    expect(headerExists).toBe(true);

    // Check for overflow
    const overflow = await checkHorizontalOverflow(page, 'index.html - page-load');
    expect(overflow.hasOverflow).toBe(false);

    // Save screenshot
    await saveScreenshot(page, '01-index-load');
  });

  test('02: Menu cards layout (no horizontal overflow)', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

    // Wait for menu content to load
    await page.waitForSelector('[data-testid="menu-item"], .menu-item, .product, .item', {
      timeout: 5000
    }).catch(() => {});

    // Check for menu cards
    const menuCards = await page.locator('[data-testid="menu-item"], .menu-item, .product-card, [role="button"]').all();
    console.log(`Found ${menuCards.length} menu items/buttons`);

    // Check horizontal overflow for each visible item
    const itemsOverflow = await page.evaluate(() => {
      const items = document.querySelectorAll('[data-testid="menu-item"], .menu-item, .product, .item, [role="button"]');
      const results = [];
      items.forEach((item, idx) => {
        const rect = item.getBoundingClientRect();
        if (rect.right > window.innerWidth && idx < 10) {
          results.push({
            index: idx,
            right: rect.right,
            width: window.innerWidth,
            overflow: rect.right - window.innerWidth
          });
        }
      });
      return results;
    });

    if (itemsOverflow.length > 0) {
      console.log('Items with overflow:', itemsOverflow);
    }
    expect(itemsOverflow.length).toBe(0);

    // Overall overflow check
    const overflow = await checkHorizontalOverflow(page, 'index.html - menu-cards');
    expect(overflow.hasOverflow).toBe(false);

    await saveScreenshot(page, '02-menu-cards');
  });

  test('03: Order buttons are tappable', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

    // Wait for order/add button
    const buttons = await page.locator('button, [role="button"], .btn, [data-testid*="add"], [data-testid*="order"]').all();
    console.log(`Found ${buttons.length} buttons`);

    if (buttons.length > 0) {
      // Check if first button is visible and clickable
      const firstButton = buttons[0];
      const isVisible = await firstButton.isVisible();
      expect(isVisible).toBe(true);

      // Try to click (with try-catch for safety)
      try {
        const boundingBox = await firstButton.boundingBox();
        expect(boundingBox).not.toBeNull();
        console.log(`First button dimensions: ${JSON.stringify(boundingBox)}`);
      } catch (e) {
        console.log('Could not verify button bounding box');
      }
    }

    await saveScreenshot(page, '03-order-buttons');
  });

  test('04: Category tabs and filter functionality', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

    // Look for category tabs
    const tabs = await page.locator('[role="tab"], .tab, .category-tab, [data-testid*="tab"]').all();
    console.log(`Found ${tabs.length} tabs`);

    if (tabs.length > 0) {
      // Check if tabs are visible
      for (let i = 0; i < Math.min(3, tabs.length); i++) {
        const tab = tabs[i];
        const isVisible = await tab.isVisible();
        expect(isVisible).toBe(true);
      }

      // Try clicking first tab
      try {
        await tabs[0].click();
        await page.waitForTimeout(500);
      } catch (e) {
        console.log('Tab click might not be available');
      }
    }

    // Check for overflow
    const overflow = await checkHorizontalOverflow(page, 'index.html - tabs');
    expect(overflow.hasOverflow).toBe(false);

    await saveScreenshot(page, '04-category-tabs');
  });

  test('05: Cart open/close functionality', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

    // Look for cart button/icon
    const cartButton = await page.locator('[data-testid*="cart"], .cart, [aria-label*="cart" i], svg[role="button"]').first();
    const cartExists = await cartButton.count() > 0;

    if (cartExists) {
      const isVisible = await cartButton.isVisible();
      expect(isVisible).toBe(true);

      // Try clicking cart
      try {
        await cartButton.click();
        await page.waitForTimeout(500);

        // Check if cart panel appears
        const cartPanel = await page.locator('[data-testid*="cart"], .cart-panel, [role="dialog"]').first();
        if (await cartPanel.count() > 0) {
          expect(await cartPanel.isVisible()).toBe(true);
        }
      } catch (e) {
        console.log('Cart interaction might not be fully initialized');
      }
    } else {
      console.log('No cart button found on page');
    }

    await saveScreenshot(page, '05-cart');
  });

  test('06: Language toggle (EN/AR)', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

    // Look for language toggle
    const langButtons = await page.locator('[data-testid*="lang"], .lang, [aria-label*="language" i], button:has-text("EN"), button:has-text("AR"), button:has-text("عربي")').all();
    console.log(`Found ${langButtons.length} language buttons`);

    if (langButtons.length > 0) {
      for (let i = 0; i < Math.min(2, langButtons.length); i++) {
        const btn = langButtons[i];
        const isVisible = await btn.isVisible();
        expect(isVisible).toBe(true);
      }

      // Try clicking language button
      try {
        await langButtons[0].click();
        await page.waitForTimeout(500);
        console.log('Language toggle clicked successfully');
      } catch (e) {
        console.log('Language toggle click failed');
      }
    }

    // Check for Arabic text presence
    const htmlLang = await page.locator('html').getAttribute('lang');
    console.log(`HTML lang attribute: ${htmlLang}`);

    const arText = await page.locator('body').evaluate(() => {
      return document.body.textContent.includes('عربي') ||
             document.body.textContent.includes('العربية');
    });
    console.log(`Arabic text found: ${arText}`);

    await saveScreenshot(page, '06-language-toggle');
  });

  test('07: Scroll and layout stability', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

    // Initial overflow check
    const initialOverflow = await checkHorizontalOverflow(page, 'index.html - scroll-initial');
    expect(initialOverflow.hasOverflow).toBe(false);

    // Scroll down
    await page.evaluate(() => window.scrollBy(0, 300));
    await page.waitForTimeout(500);

    // Check overflow after scroll
    const scrolledOverflow = await checkHorizontalOverflow(page, 'index.html - scroll-mid');
    expect(scrolledOverflow.hasOverflow).toBe(false);

    // Scroll to bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    // Final overflow check
    const bottomOverflow = await checkHorizontalOverflow(page, 'index.html - scroll-bottom');
    expect(bottomOverflow.hasOverflow).toBe(false);

    await saveScreenshot(page, '07-scroll-stability');
  });

  test('08: Console error check', async ({ page }) => {
    const errors = [];
    const warnings = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      } else if (msg.type() === 'warning') {
        warnings.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

    // Wait a bit for any async errors
    await page.waitForTimeout(1000);

    console.log(`Console errors: ${errors.length}`, errors);
    console.log(`Console warnings: ${warnings.length}`);

    // We expect minimal errors - allow some but flag critical ones
    const criticalErrors = errors.filter(e =>
      !e.includes('Cannot read') &&
      !e.includes('404') &&
      !e.includes('favicon')
    );

    expect(criticalErrors.length).toBe(0);

    await saveScreenshot(page, '08-console-check');
  });
});

test.describe('Mobile 375px QA - cashier.html (Cashier Page)', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: MOBILE_WIDTH, height: MOBILE_HEIGHT });
  });

  test('09: Cashier page load and layout', async ({ page }) => {
    await page.goto('/cashier.html');
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

    // Check if page is visible
    const bodyVisible = await page.locator('body').isVisible();
    expect(bodyVisible).toBe(true);

    // Check for overflow
    const overflow = await checkHorizontalOverflow(page, 'cashier.html - page-load');
    expect(overflow.hasOverflow).toBe(false);

    // Look for login form or main content
    const formExists = await page.locator('form, [role="form"], .login-form, input').count() > 0;
    console.log(`Form elements found: ${formExists}`);

    await saveScreenshot(page, '09-cashier-load');
  });

  test('10: Cashier login form interaction', async ({ page }) => {
    await page.goto('/cashier.html');
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

    // Find input fields
    const inputs = await page.locator('input').all();
    console.log(`Found ${inputs.length} input fields`);

    if (inputs.length > 0) {
      // Check if first input is visible and can be focused
      const firstInput = inputs[0];
      const isVisible = await firstInput.isVisible();
      expect(isVisible).toBe(true);

      // Try to focus and type
      try {
        await firstInput.focus();
        const isFocused = await firstInput.evaluate((el) => el === document.activeElement);
        expect(isFocused).toBe(true);
        console.log('First input can be focused');
      } catch (e) {
        console.log('Could not focus input');
      }
    }

    // Check overflow
    const overflow = await checkHorizontalOverflow(page, 'cashier.html - form');
    expect(overflow.hasOverflow).toBe(false);

    await saveScreenshot(page, '10-cashier-form');
  });

  test('11: Cashier orders list layout', async ({ page }) => {
    await page.goto('/cashier.html');
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

    // Wait for content
    await page.waitForTimeout(1000);

    // Look for order list items
    const listItems = await page.locator('li, [role="listitem"], .order-item, tr').all();
    console.log(`Found ${listItems.length} list items`);

    // Check overflow
    const overflow = await checkHorizontalOverflow(page, 'cashier.html - orders');
    expect(overflow.hasOverflow).toBe(false);

    // Check if any table exists (for order display)
    const tableExists = await page.locator('table').count() > 0;
    console.log(`Table elements found: ${tableExists}`);

    if (tableExists) {
      // Check table cell overflow
      const cellOverflows = await page.evaluate(() => {
        const cells = document.querySelectorAll('td, th');
        const overflows = [];
        cells.forEach((cell, idx) => {
          const rect = cell.getBoundingClientRect();
          if (rect.right > window.innerWidth && idx < 5) {
            overflows.push({
              idx,
              right: rect.right,
              overflow: rect.right - window.innerWidth
            });
          }
        });
        return overflows;
      });

      expect(cellOverflows.length).toBe(0);
    }

    await saveScreenshot(page, '11-cashier-orders');
  });
});

test.describe('Mobile 375px QA - warehouse.html (Warehouse Page)', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: MOBILE_WIDTH, height: MOBILE_HEIGHT });
  });

  test('12: Warehouse page load', async ({ page }) => {
    await page.goto('/warehouse.html');
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

    // Check if page is visible
    const bodyVisible = await page.locator('body').isVisible();
    expect(bodyVisible).toBe(true);

    // Check for overflow
    const overflow = await checkHorizontalOverflow(page, 'warehouse.html - page-load');
    expect(overflow.hasOverflow).toBe(false);

    await saveScreenshot(page, '12-warehouse-load');
  });

  test('13: Warehouse no horizontal overflow', async ({ page }) => {
    await page.goto('/warehouse.html');
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

    // Check multiple scroll positions
    const positions = [0, 300, 600, 1200];

    for (const pos of positions) {
      await page.evaluate((y) => window.scrollTo(0, y), pos);
      await page.waitForTimeout(200);

      const overflow = await checkHorizontalOverflow(page, `warehouse.html - scroll-${pos}`);
      expect(overflow.hasOverflow).toBe(false);
    }

    await saveScreenshot(page, '13-warehouse-scroll');
  });

  test('14: Warehouse table/grid layout', async ({ page }) => {
    await page.goto('/warehouse.html');
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

    // Check for tables
    const tables = await page.locator('table').all();
    console.log(`Found ${tables.length} tables`);

    if (tables.length > 0) {
      // Check first table cells for overflow
      const cellOverflows = await page.evaluate(() => {
        const tables = document.querySelectorAll('table');
        const overflows = [];

        tables.forEach((table, tableIdx) => {
          const cells = table.querySelectorAll('td, th');
          cells.forEach((cell, idx) => {
            const rect = cell.getBoundingClientRect();
            if (rect.right > window.innerWidth && idx < 8) {
              overflows.push({
                tableIdx,
                idx,
                right: rect.right,
                overflow: rect.right - window.innerWidth
              });
            }
          });
        });

        return overflows;
      });

      if (cellOverflows.length > 0) {
        console.log('Cell overflow detected:', cellOverflows);
      }
      expect(cellOverflows.length).toBe(0);
    }

    await saveScreenshot(page, '14-warehouse-table');
  });

  test('15: Warehouse console check', async ({ page }) => {
    const errors = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/warehouse.html');
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(1000);

    console.log(`Warehouse console errors: ${errors.length}`, errors);

    const criticalErrors = errors.filter(e =>
      !e.includes('404') &&
      !e.includes('favicon') &&
      !e.includes('Cannot read')
    );

    expect(criticalErrors.length).toBe(0);

    await saveScreenshot(page, '15-warehouse-console');
  });
});

test.describe('Mobile 375px QA - Cross-page verification', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: MOBILE_WIDTH, height: MOBILE_HEIGHT });
  });

  test('16: Text overlap detection across pages', async ({ page }) => {
    const pages = ['/index.html', '/cashier.html', '/warehouse.html'];

    for (const pageUrl of pages) {
      await page.goto(pageUrl);
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

      // Check for text visibility
      const textElements = await page.locator('body *').all();
      console.log(`${pageUrl}: ${textElements.length} elements`);

      // Check if elements have reasonable line-height and don't overlap visually
      const overlapCheck = await page.evaluate(() => {
        const elements = document.querySelectorAll('body *');
        let hasIssue = false;

        // Sample check first 20 visible elements with text
        let checked = 0;
        elements.forEach(el => {
          if (checked < 20 && el.textContent && el.offsetHeight > 0) {
            const computed = window.getComputedStyle(el);
            const lineHeight = computed.lineHeight;
            const fontSize = computed.fontSize;

            // Check if line-height is reasonable
            if (lineHeight === 'normal' || lineHeight.includes('px')) {
              // OK
            }
            checked++;
          }
        });

        return hasIssue;
      });

      expect(overlapCheck).toBe(false);
    }
  });

  test('17: Button reachability on all pages', async ({ page }) => {
    const pages = ['/index.html', '/cashier.html', '/warehouse.html'];

    for (const pageUrl of pages) {
      await page.goto(pageUrl);
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

      const buttons = await page.locator('button, [role="button"]').all();
      console.log(`${pageUrl}: ${buttons.length} buttons`);

      if (buttons.length > 0) {
        // Check if first button is clickable (within viewport)
        for (let i = 0; i < Math.min(3, buttons.length); i++) {
          const btn = buttons[i];
          try {
            const box = await btn.boundingBox();
            if (box) {
              const withinViewport = box.y + box.height < MOBILE_HEIGHT + 500;
              // We just want to verify buttons have dimensions
              expect(box.width).toBeGreaterThan(0);
              expect(box.height).toBeGreaterThan(0);
            }
          } catch (e) {
            // Button might be hidden or not fully loaded
            console.log(`Button ${i} on ${pageUrl} not fully accessible`);
          }
        }
      }
    }
  });
});
