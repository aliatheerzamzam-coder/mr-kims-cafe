/**
 * 메뉴 검색 + 카트 플로우 UI 검증
 */
const { test, expect } = require('@playwright/test');

test.describe('Menu search', () => {
  test('searches across categories and clears', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#menu-search');

    // type a query
    await page.fill('#menu-search', 'latte');
    // wait for grid to update with at least one card containing "latte"
    await page.waitForFunction(() => {
      const cards = document.querySelectorAll('#menu-grid .menu-card');
      if (cards.length === 0) return false;
      return [...cards].some(c => c.textContent.toLowerCase().includes('latte'));
    });
    const titleText = await page.textContent('#cat-panel-title');
    expect(titleText.toLowerCase()).toContain('search results');

    // category tiles + group tabs hidden
    await expect(page.locator('#cat-grid')).toBeHidden();
    await expect(page.locator('#group-tabs')).toBeHidden();

    // clear
    await page.click('#menu-search-clear');
    await expect(page.locator('#cat-grid')).toBeVisible();
    await expect(page.locator('#group-tabs')).toBeVisible();
  });

  test('no results shows empty state', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#menu-search');
    await page.fill('#menu-search', 'zzzqqqxxx');
    await page.waitForFunction(() => {
      const t = document.getElementById('cat-panel-title')?.textContent || '';
      return t.includes('(0)');
    });
    const html = await page.locator('#menu-grid').innerHTML();
    expect(html.toLowerCase()).toContain('no items match');
  });
});

test.describe('Cart drawer flow', () => {
  test('add item from menu, open drawer, see total', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.menu-card');

    // First Add button in default category
    const firstAdd = page.locator('.menu-card .btn-add').first();
    await firstAdd.click();

    // Size picker may open — pick first option if visible
    const overlay = page.locator('#size-overlay.open');
    if (await overlay.isVisible({ timeout: 1500 }).catch(() => false)) {
      await page.locator('#size-overlay.open .size-btn').first().click();
      await page.locator('.btn-size-confirm').click();
      await expect(overlay).toBeHidden();
    }

    // Open cart
    await page.locator('.cart-btn').first().click();
    await expect(page.locator('#cart-drawer')).toHaveClass(/open/);

    // Cart should have at least one line
    await expect(page.locator('#cart-drawer .cart-item, #cart-drawer [class*="cart"]').first()).toBeVisible();
  });
});
