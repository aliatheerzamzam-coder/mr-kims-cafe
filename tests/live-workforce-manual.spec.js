const { test, expect } = require('@playwright/test');

// 테스터가 수동으로 환경변수로 설정: WORKFORCE_EMAIL, WORKFORCE_PASSWORD
const WORKFORCE_URL = 'https://mrkimscafe.com/workforce/meetings';
const EMAIL = process.env.WORKFORCE_EMAIL || 'test@example.local';
const PASSWORD = process.env.WORKFORCE_PASSWORD || '';

// Live-site checks. Skipped unless LIVE_SITE_TESTS=1 — see live-workforce-qa.
test.describe('Workforce Meetings — 라이브 사이트 접근성 검수', () => {
  test.beforeEach(() => {
    test.skip(!process.env.LIVE_SITE_TESTS, 'set LIVE_SITE_TESTS=1 to run live-site checks');
  });

  test('1. 로그인 페이지 로드 및 UI 요소 확인', async ({ page }) => {
    // 콘솔 에러 추적
    const consoleLogs = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleLogs.push(`[ERROR] ${msg.text()}`);
      }
    });

    // 네트워크 에러 추적
    const networkErrors = [];
    page.on('response', response => {
      if (response.status() >= 400) {
        networkErrors.push(`${response.status()} ${response.url().split('?')[0]}`);
      }
    });

    await page.goto(WORKFORCE_URL);
    await page.waitForLoadState('networkidle');

    // 로그인 폼 요소 확인
    const emailInput = await page.locator('input[type="email"]').isVisible().catch(() => false);
    const passwordInput = await page.locator('input[type="password"]').isVisible().catch(() => false);
    const submitBtn = await page.locator('button[type="submit"]').isVisible().catch(() => false);

    console.log(`[Login Form] Email input visible: ${emailInput}, Password: ${passwordInput}, Submit: ${submitBtn}`);
    
    // Placeholder 텍스트 확인
    const emailPlaceholder = await page.locator('input[type="email"]').getAttribute('placeholder').catch(() => '');
    console.log(`[Placeholder] Email: "${emailPlaceholder}"`);
    
    // 한국어 검사
    if (/[가-힣]/.test(emailPlaceholder || '')) {
      console.warn('[ISSUE] Placeholder contains Korean');
    }

    if (consoleLogs.length > 0) {
      console.log(`[Console] Errors found: ${consoleLogs.join(', ')}`);
    }
    if (networkErrors.length > 0) {
      console.log(`[Network] Errors: ${networkErrors.slice(0, 3).join(', ')}`);
    }

    await page.screenshot({ path: 'test-results/01-login-page.png' });
    expect(emailInput).toBeTruthy();
  });

  test('2. 잘못된 비번으로 로그인 시도', async ({ page }) => {
    await page.goto(WORKFORCE_URL);
    await page.waitForLoadState('networkidle');

    await page.locator('input[type="email"]').fill('test@mrkims.local');
    await page.locator('input[type="password"]').fill('WrongPassword123');
    
    await page.locator('button[type="submit"]').click();
    
    // 에러 메시지 대기
    await page.waitForTimeout(2000);

    const errorMsg = await page.locator('[role="alert"], .error, [class*="error"]').first().textContent().catch(() => null);
    console.log(`[Error Message] "${errorMsg}"`);
    
    // 한국어 확인
    if (errorMsg && /[가-힣]/.test(errorMsg)) {
      console.warn('[ISSUE] Error message contains Korean');
    }

    await page.screenshot({ path: 'test-results/02-login-error.png' });
  });

  test('3. 올바른 비번 로그인 (PASSWORD 환경변수 필요)', async ({ page }) => {
    if (!PASSWORD) {
      console.log('[SKIP] WORKFORCE_PASSWORD not set');
      return;
    }

    await page.goto(WORKFORCE_URL);
    await page.waitForLoadState('networkidle');

    // 이메일이 없으면 first user 패턴으로 가정
    const emailInputExists = await page.locator('input[type="email"]').isVisible().catch(() => false);
    
    if (emailInputExists) {
      await page.locator('input[type="email"]').fill(EMAIL);
    }
    
    await page.locator('input[type="password"]').fill(PASSWORD);
    await page.locator('button[type="submit"]').click();

    // 리다이렉트 대기 (최대 10초)
    const redirected = await page.waitForURL(new RegExp(`${WORKFORCE_URL}|/workforce`), { timeout: 10000 }).catch(() => false);
    
    if (!redirected) {
      console.warn('[ISSUE] Login did not redirect');
      await page.screenshot({ path: 'test-results/03-login-fail.png' });
      return;
    }

    console.log(`[Login] Success - redirected to ${page.url()}`);

    // Hub 페이지 요소 확인
    await page.waitForLoadState('networkidle');
    
    // textarea 찾기 (Topic 입력)
    const textareaVisible = await page.locator('textarea').isVisible().catch(() => false);
    console.log(`[Hub] Textarea visible: ${textareaVisible}`);

    // 참석자 칩 찾기
    const chips = await page.locator('[data-testid="participant-chip"], button:has-text("CEO"), button:has-text("CFO")').count();
    console.log(`[Hub] Participant chips/buttons found: ${chips}`);

    await page.screenshot({ path: 'test-results/03-hub-page.png' });
    expect(textareaVisible || chips > 0).toBeTruthy();
  });

  test('4. 페이지 반응형 — 375px 모바일', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 667 },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X)',
    });
    const page = await context.newPage();

    await page.goto(WORKFORCE_URL);
    await page.waitForLoadState('networkidle');

    // 오버플로우 검사
    const htmlWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const viewportWidth = 375;

    if (htmlWidth > viewportWidth) {
      console.warn(`[ISSUE] Horizontal overflow on 375px: ${htmlWidth}px`);
    } else {
      console.log(`[Mobile 375] No overflow detected (${htmlWidth}px)`);
    }

    await page.screenshot({ path: 'test-results/04-mobile-375.png' });
    await context.close();
  });

  test('5. 페이지 반응형 — 768px 태블릿', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 768, height: 1024 },
    });
    const page = await context.newPage();

    await page.goto(WORKFORCE_URL);
    await page.waitForLoadState('networkidle');

    const htmlWidth = await page.evaluate(() => document.documentElement.scrollWidth);

    if (htmlWidth > 768) {
      console.warn(`[ISSUE] Horizontal overflow on 768px: ${htmlWidth}px`);
    }

    await page.screenshot({ path: 'test-results/05-mobile-768.png' });
    await context.close();
  });

  test('6. 접근성 — Tab 키 네비게이션', async ({ page }) => {
    await page.goto(WORKFORCE_URL);
    await page.waitForLoadState('networkidle');

    // 초기 포커스
    let focused = await page.evaluate(() => document.activeElement.tagName);
    console.log(`[A11y] Initial focus: ${focused}`);

    // Tab 이동
    await page.keyboard.press('Tab');
    let focusedTag = await page.evaluate(() => document.activeElement.tagName);
    let focusedType = await page.evaluate(() => document.activeElement.type);
    console.log(`[A11y] After Tab 1: ${focusedTag} (${focusedType})`);

    await page.keyboard.press('Tab');
    focusedTag = await page.evaluate(() => document.activeElement.tagName);
    focusedType = await page.evaluate(() => document.activeElement.type);
    console.log(`[A11y] After Tab 2: ${focusedTag} (${focusedType})`);
  });

  test('7. 네트워크 요청 모니터링', async ({ page }) => {
    const requests = [];
    page.on('request', req => {
      if (req.url().includes('/api/workforce')) {
        requests.push({
          method: req.method(),
          path: req.url().split('/api/workforce')[1],
          time: Date.now(),
        });
      }
    });

    await page.goto(WORKFORCE_URL);
    await page.waitForLoadState('networkidle');

    console.log(`[Network] API requests during page load: ${requests.length}`);
    requests.slice(0, 5).forEach(r => {
      console.log(`  - ${r.method} /api/workforce${r.path}`);
    });
  });

  test('8. 다국어 UI 확인 — 텍스트 스캔', async ({ page }) => {
    await page.goto(WORKFORCE_URL);
    await page.waitForLoadState('networkidle');

    // 페이지 모든 텍스트 수집
    const textContent = await page.textContent('body');
    
    // 한국어 문자 탐지
    const koreanMatches = (textContent || '').match(/[가-힣]/g) || [];
    
    if (koreanMatches.length > 0) {
      console.warn(`[LANGUAGE ISSUE] Korean text found: ${koreanMatches.length} characters`);
      
      // 한국어를 포함한 엘리먼트 찾기
      const elements = await page.locator('*').all();
      let foundKorean = false;
      
      for (const el of elements.slice(0, 100)) {
        const text = await el.textContent().catch(() => '');
        if (/[가-힣]/.test(text)) {
          const html = await el.evaluate(e => e.outerHTML).catch(() => '');
          if (html.length < 200) {
            console.log(`  Found: "${text.substring(0, 50)}"`);
            foundKorean = true;
            break;
          }
        }
      }
    } else {
      console.log('[Language OK] No Korean text detected');
    }
  });

  test('9. 콘솔 및 네트워크 에러 최종 검사', async ({ page }) => {
    const errors = {
      console: [],
      network: [],
    };

    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.console.push(msg.text());
      }
    });

    page.on('response', res => {
      if (res.status() >= 400) {
        errors.network.push(`${res.status()} ${res.url().split('?')[0]}`);
      }
    });

    await page.goto(WORKFORCE_URL);
    await page.waitForLoadState('networkidle');

    console.log(`[Final Check] Console errors: ${errors.console.length}`);
    if (errors.console.length > 0) {
      errors.console.slice(0, 3).forEach(e => console.log(`  - ${e}`));
    }

    console.log(`[Final Check] Network errors: ${errors.network.length}`);
    if (errors.network.length > 0) {
      errors.network.slice(0, 3).forEach(e => console.log(`  - ${e}`));
    }
  });
});
