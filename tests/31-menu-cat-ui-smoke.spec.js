/**
 * 테스트 31: 메뉴 카테고리 관리 UI + Recipe 메뉴 picker (스모크)
 * 브라우저에서 실제 패널/모달이 동작하는지 검증.
 */

const { test, expect } = require('@playwright/test');
const { apiRequest, adminLogin } = require('./helpers/api');

test.describe('메뉴 카테고리 관리 UI 스모크', () => {
  let adminToken;
  const stamp = Date.now();
  const codeUi = `qa_ui_${stamp}`;
  let createdCatId = null;
  let menuItemId = null;
  let ingredientId = null;

  test.beforeAll(async () => {
    adminToken = await adminLogin();
  });

  test.afterAll(async () => {
    const h = { 'x-auth-token': adminToken };
    if (menuItemId) {
      await apiRequest('DELETE', `/api/recipes/by-id/${menuItemId}`, null, h);
      await apiRequest('DELETE', `/api/admin/menu/items/${menuItemId}`, null, h);
    }
    if (createdCatId) await apiRequest('DELETE', `/api/admin/menu/categories/${createdCatId}`, null, h);
    if (ingredientId) await apiRequest('DELETE', `/api/ingredients/${ingredientId}`, null, h);
    await apiRequest('POST', '/api/auth/logout', null, h);
  });

  async function loginAsAdmin(page) {
    // seed token before page scripts run
    await page.addInitScript(([tok]) => {
      sessionStorage.setItem('wh_token', tok);
    }, [adminToken]);
    await page.goto('/warehouse.html');
    await page.waitForLoadState('domcontentloaded');
  }

  test('Menu 탭의 카테고리 관리 패널이 보이고 카테고리 추가 가능', async ({ page }) => {
    await loginAsAdmin(page);
    // 사이드바의 Menu 탭 클릭
    await page.locator('[data-tab="menu"], [onclick*="menu"], a:has-text("Menu"), button:has-text("Menu")').first().click({ timeout: 5000 }).catch(() => {});
    // 패널 제목이 화면에 있는지 확인 (i18n 영문/아랍어 모두 허용)
    const panelTitle = page.locator('[data-i18n="menucat_mgr_title"]');
    await expect(panelTitle).toBeVisible({ timeout: 5000 });

    // 패널 펼치기
    await panelTitle.click();
    await expect(page.locator('#menuCatMgrBody')).not.toHaveClass(/hidden/);

    // 폼 채우기
    await page.locator('#newMenuCatCode').fill(codeUi);
    await page.locator('#newMenuCatNameEn').fill(`UI Cat ${stamp}`);
    await page.locator('#newMenuCatNameAr').fill(`فئة ${stamp}`);
    await page.locator('#newMenuCatIcon').fill('🧪');
    await page.locator('#newMenuCatSort').fill('950');
    await page.locator('#menuCatSubmitBtn').click();

    // 새 카테고리 행이 목록에 나타나는지 (이름 또는 code로 매칭)
    await expect(page.locator(`#menuCatMgrList >> text=UI Cat ${stamp}`)).toBeVisible({ timeout: 5000 });

    // ID를 확보 (cleanup용)
    const list = await apiRequest('GET', '/api/admin/menu/categories', null, { 'x-auth-token': adminToken });
    const cat = list.data.find(c => c.code === codeUi);
    expect(cat).toBeTruthy();
    createdCatId = cat.id;
  });

  test('Recipe 모달: 메뉴 picker로 검색→선택→카테고리 자동 채움', async ({ page }) => {
    // 우선 검색할 메뉴 한 개를 백엔드에 시드
    const h = { 'x-auth-token': adminToken };
    const m = await apiRequest('POST', '/api/admin/menu/items', {
      code: `qa_ui_mi_${stamp}`,
      name_en: `UI Pick ${stamp}`,
      name_ar: `اختيار ${stamp}`,
      category_id: createdCatId,
      base_price: 1500, kind: 'single', active: true,
    }, h);
    expect(m.status).toBe(200);
    menuItemId = m.data.id;

    // 재료 시드
    const ing = await apiRequest('POST', '/api/ingredients', {
      name_ko: `qa_ui_ing_${stamp}`, unit: 'ml',
      current_qty: 1000, min_qty: 0, cost_per_unit: 100,
    }, h);
    ingredientId = ing.data.id;

    await loginAsAdmin(page);
    // Recipes & Cost 탭으로 전환 — 사이드바 버튼 클릭
    await page.locator('button[onclick*="showTab(\'recipes\'"]').first().click({ timeout: 5000 });
    await page.waitForSelector('#tab-recipes:not(.hidden)', { timeout: 5000 }).catch(() => {});

    // "+ Add Recipe" 버튼 클릭
    await page.locator('button[onclick="openRecipeModal()"]').first().click({ timeout: 5000 });

    // 검색창에 메뉴 일부 입력
    const search = page.locator('#recipeMenuName');
    await expect(search).toBeVisible({ timeout: 5000 });
    await search.click();
    await search.fill(`UI Pick ${stamp}`);

    // 드롭다운에 후보가 뜨면 클릭
    const option = page.locator('#recipeMenuDropdown .ing-dropdown-item').filter({ hasText: `UI Pick ${stamp}` }).first();
    await expect(option).toBeVisible({ timeout: 5000 });
    await option.click();

    // hidden id 채워졌는지
    const hiddenId = await page.locator('#recipeMenuItemId').inputValue();
    expect(parseInt(hiddenId, 10)).toBe(menuItemId);

    // 카테고리 자동 채움됐는지
    const catVal = await page.locator('#recipeCategory').inputValue();
    expect(catVal).toContain('UI Cat');
  });

  test('Recipe 저장: menu_item_id가 서버에 정렬되어 들어감', async ({ page }) => {
    await loginAsAdmin(page);
    await page.locator('button[onclick*="showTab(\'recipes\'"]').first().click({ timeout: 5000 });
    await page.waitForSelector('#tab-recipes:not(.hidden)', { timeout: 5000 }).catch(() => {});

    await page.locator('button[onclick="openRecipeModal()"]').first().click({ timeout: 5000 });
    const search = page.locator('#recipeMenuName');
    await expect(search).toBeVisible({ timeout: 5000 });
    await search.click();
    await search.fill(`UI Pick ${stamp}`);
    await page.locator('#recipeMenuDropdown .ing-dropdown-item').filter({ hasText: `UI Pick ${stamp}` }).first().click();

    // 재료 한 줄: 검색 → 선택 → 수량 입력
    const ingSearch = page.locator('#recipeRows .ing-search-input').first();
    await ingSearch.click();
    await ingSearch.fill(`qa_ui_ing_${stamp}`);
    await page.locator('#recipeRows .ing-dropdown-item').first().click();
    await page.locator('#recipeRows .rec-qty').first().fill('100');

    // 저장
    await page.locator('#recipeSaveBtn').click();
    // 저장 성공 시 모달이 닫힘 (hidden 클래스)
    await expect(page.locator('#recipeModal')).toHaveClass(/hidden/, { timeout: 5000 });

    // 서버에서 검증: recipes에 menu_item_id가 들어가 있는지
    const r = await apiRequest('GET', '/api/recipes', null, { 'x-auth-token': adminToken });
    const row = r.data.find(x => x.ingredient_id === ingredientId);
    expect(row).toBeTruthy();
    expect(row.menu_item).toContain('UI Pick');
  });
});
