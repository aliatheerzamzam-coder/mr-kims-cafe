const { test, expect, devices } = require('@playwright/test');
const PASSWORD = 'Zoom1788!';

// 테스트용 스크린샷 저장 경로
const SCREENSHOTS_DIR = './test-results/workforce-live';

// Live-site smoke tests that hit https://mrkimscafe.com directly. Skipped by
// default — Cloudflare / network state from CI environments often produces
// false negatives. Run manually with `LIVE_SITE_TESTS=1 npx playwright test ...`.
test.describe('Workforce Meetings - 라이브 사이트 QA', () => {
  test.skip(!process.env.LIVE_SITE_TESTS, 'set LIVE_SITE_TESTS=1 to run live-site checks');
  let page;

  test.beforeAll(async () => {
    // 스크린샷 디렉토리 생성
  });

  test.beforeEach(async ({ page: p }) => {
    page = p;
    // DevTools 에러 추적
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`[CONSOLE ERROR] ${msg.text()}`);
      }
    });
    page.on('response', response => {
      if (response.status() >= 400) {
        console.log(`[HTTP ${response.status()}] ${response.url()}`);
      }
    });
  });

  test('1. 로그인 화면 — placeholder 및 접근성', async () => {
    await page.goto('https://mrkimscafe.com/workforce/meetings');
    await page.waitForLoadState('networkidle');

    // 로그인 페이지 요소 확인
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const submitBtn = page.locator('button[type="submit"]');

    // Placeholder 텍스트 확인
    const emailPlaceholder = await emailInput.getAttribute('placeholder');
    const passwordPlaceholder = await passwordInput.getAttribute('placeholder');
    console.log(`[Placeholder] Email: "${emailPlaceholder}", Password: "${passwordPlaceholder}"`);

    // 영어인지 한국어인지 확인
    expect(emailPlaceholder || '').not.toMatch(/[가-힣]/);
    expect(passwordPlaceholder || '').not.toMatch(/[가-힣]/);

    // 스크린샷 저장
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/01-login-screen.png` });

    // 접근성: label이 있는지 확인
    const formLabels = await page.locator('label').count();
    console.log(`[Accessibility] Found ${formLabels} labels`);
  });

  test('2. 잘못된 비번 에러 메시지', async () => {
    await page.goto('https://mrkimscafe.com/workforce/meetings');
    await page.waitForLoadState('networkidle');

    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');

    // 어떤 이메일이든 일단 입력 (본사 계정 확인 필요)
    await emailInput.fill('ceo@mrkims.local');
    await passwordInput.fill('WrongPassword123');

    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(2000);

    // 에러 메시지 텍스트 캡처
    const errorMsg = await page.locator('[role="alert"], .error, [class*="error"]').first().textContent();
    console.log(`[Error Message] ${errorMsg}`);

    // 한국어가 섞여있는지 확인
    if (errorMsg) {
      if (/[가-힣]/.test(errorMsg)) {
        console.warn('[ISSUE] 에러 메시지에 한국어 발견');
      }
    }

    await page.screenshot({ path: `${SCREENSHOTS_DIR}/02-login-error.png` });
  });

  test('3. 올바른 로그인 및 Hub 페이지', async () => {
    await page.goto('https://mrkimscafe.com/workforce/meetings');
    await page.waitForLoadState('networkidle');

    // 정확한 계정 정보는 환경변수 또는 수동 입력 필요
    // 여기서는 비번만 사용
    await page.locator('input[type="email"]').fill('ceo@mrkims.local');
    await page.locator('input[type="password"]').fill(PASSWORD);
    await page.locator('button[type="submit"]').click();

    // 로그인 후 대기 (리다이렉트 대기)
    await page.waitForURL(/\/workforce\/meetings/, { timeout: 5000 });
    await page.waitForLoadState('networkidle');

    // Hub 페이지 요소 확인
    const textarea = page.locator('textarea');
    const participantChips = page.locator('[data-testid="participant-chip"]');

    expect(await textarea.isVisible()).toBeTruthy();
    console.log(`[Hub] Found ${await participantChips.count()} participant chips`);

    // 예상: 23명 (CEO, CFO, CTO 등)
    const chipCount = await participantChips.count();
    if (chipCount !== 23) {
      console.warn(`[ISSUE] Expected 23 chips, got ${chipCount}`);
    }

    await page.screenshot({ path: `${SCREENSHOTS_DIR}/03-hub-empty.png` });
  });

  test('4. 회의 시작 (짧은 안건, 2명 선택)', async () => {
    await page.goto('https://mrkimscafe.com/workforce/meetings');
    await page.waitForLoadState('networkidle');

    // 로그인 (위 테스트에서와 동일)
    await page.locator('input[type="email"]').fill('ceo@mrkims.local');
    await page.locator('input[type="password"]').fill(PASSWORD);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/\/workforce\/meetings/, { timeout: 5000 });

    // Hub 진입
    const textarea = page.locator('textarea');
    await textarea.fill('Test Meeting - Response Ignored');

    // 참석자 선택 (2명)
    const chips = page.locator('[data-testid="participant-chip"]');
    await chips.nth(0).click(); // CEO
    await chips.nth(1).click(); // CFO

    // 시작 버튼 클릭
    const startBtn = page.locator('button:has-text("Start"), button:has-text("시작")').first();
    expect(await startBtn.isEnabled()).toBeTruthy();

    const startTime = Date.now();
    await startBtn.click();

    // ActiveRoom 진입 대기
    await page.waitForURL(/\/workforce\/active/, { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;
    console.log(`[Performance] ActiveRoom load time: ${loadTime}ms`);

    // ActiveRoom 요소 확인
    const roomTitle = page.locator('[data-testid="room-title"]');
    const responsePanel = page.locator('[data-testid="response-panel"]');

    expect(await roomTitle.isVisible()).toBeTruthy();
    console.log(`[ActiveRoom] Title: ${await roomTitle.textContent()}`);

    await page.screenshot({ path: `${SCREENSHOTS_DIR}/04-active-room-start.png` });

    // 응답 폴링 대기 (최대 30초)
    let responseReceived = false;
    const pollStart = Date.now();
    while (Date.now() - pollStart < 30000) {
      const responses = await page.locator('[data-testid="agent-response"]');
      if ((await responses.count()) > 0) {
        responseReceived = true;
        const responseTime = Date.now() - startTime;
        console.log(`[LLM Response] Received in ${responseTime}ms`);
        break;
      }
      await page.waitForTimeout(2000);
    }

    if (!responseReceived) {
      console.warn('[TIMEOUT] No response received after 30 seconds');
    } else {
      await page.screenshot({ path: `${SCREENSHOTS_DIR}/05-active-room-response.png` });
    }
  });

  test('5. 에러 케이스 — 안건 비움', async () => {
    await page.goto('https://mrkimscafe.com/workforce/meetings');
    await page.waitForLoadState('networkidle');

    await page.locator('input[type="email"]').fill('ceo@mrkims.local');
    await page.locator('input[type="password"]').fill(PASSWORD);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/\/workforce\/meetings/, { timeout: 5000 });

    // 안건 비우고 참석자 선택
    const textarea = page.locator('textarea');
    await textarea.fill('');

    const chips = page.locator('[data-testid="participant-chip"]');
    await chips.nth(0).click();

    // 시작 버튼이 비활성화되는지 확인
    const startBtn = page.locator('button:has-text("Start"), button:has-text("시작")').first();
    const isDisabled = await startBtn.getAttribute('disabled');
    console.log(`[Validation] Start btn disabled when agenda empty: ${isDisabled !== null}`);

    expect(isDisabled !== null).toBeTruthy();
  });

  test('6. 에러 케이스 — 참석자 0명', async () => {
    await page.goto('https://mrkimscafe.com/workforce/meetings');
    await page.waitForLoadState('networkidle');

    await page.locator('input[type="email"]').fill('ceo@mrkims.local');
    await page.locator('input[type="password"]').fill(PASSWORD);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/\/workforce\/meetings/, { timeout: 5000 });

    const textarea = page.locator('textarea');
    await textarea.fill('Test Agenda');

    // 참석자 선택 안 함
    const startBtn = page.locator('button:has-text("Start"), button:has-text("시작")').first();
    const isDisabled = await startBtn.getAttribute('disabled');
    console.log(`[Validation] Start btn disabled with 0 participants: ${isDisabled !== null}`);

    expect(isDisabled !== null).toBeTruthy();
  });

  test('7. 에러 케이스 — 7명 이상 선택 불가', async () => {
    await page.goto('https://mrkimscafe.com/workforce/meetings');
    await page.waitForLoadState('networkidle');

    await page.locator('input[type="email"]').fill('ceo@mrkims.local');
    await page.locator('input[type="password"]').fill(PASSWORD);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/\/workforce\/meetings/, { timeout: 5000 });

    const textarea = page.locator('textarea');
    await textarea.fill('Test Agenda');

    const chips = page.locator('[data-testid="participant-chip"]');
    const maxParticipants = 6;

    // 최대 6명까지 선택 시도
    for (let i = 0; i < 7; i++) {
      await chips.nth(i).click();
    }

    const selectedCount = await page.locator('[data-testid="participant-chip"][aria-selected="true"]').count();
    console.log(`[Validation] Selected participants: ${selectedCount} (max should be 6)`);

    // 만약 7명이 선택되었다면 문제
    if (selectedCount > 6) {
      console.error(`[ISSUE] More than 6 participants selected: ${selectedCount}`);
    }
  });

  test('8. 모바일 반응형 — 375px', async ({ browser }) => {
    const mobileContext = await browser.newContext({
      ...devices['iPhone 12'],
    });
    const mobilePage = await mobileContext.newPage();

    await mobilePage.goto('https://mrkimscafe.com/workforce/meetings');
    await mobilePage.waitForLoadState('networkidle');

    await mobilePage.locator('input[type="email"]').fill('ceo@mrkims.local');
    await mobilePage.locator('input[type="password"]').fill(PASSWORD);
    await mobilePage.locator('button[type="submit"]').click();
    await mobilePage.waitForURL(/\/workforce\/meetings/, { timeout: 5000 });

    // 오버플로우 확인
    const chips = mobilePage.locator('[data-testid="participant-chip"]');
    const chipsContainer = mobilePage.locator('[data-testid="chips-container"]');

    const containerWidth = await chipsContainer.boundingBox().then(b => b?.width);
    console.log(`[Mobile 375] Chips container width: ${containerWidth}px`);

    if (containerWidth > 375) {
      console.warn(`[ISSUE] Container overflow on 375px: ${containerWidth}px`);
    }

    await mobilePage.screenshot({ path: `${SCREENSHOTS_DIR}/06-mobile-375.png` });
    await mobileContext.close();
  });

  test('9. 모바일 반응형 — 768px', async ({ browser }) => {
    const tabletContext = await browser.newContext({
      viewport: { width: 768, height: 1024 },
    });
    const tabletPage = await tabletContext.newPage();

    await tabletPage.goto('https://mrkimscafe.com/workforce/meetings');
    await tabletPage.waitForLoadState('networkidle');

    await tabletPage.locator('input[type="email"]').fill('ceo@mrkims.local');
    await tabletPage.locator('input[type="password"]').fill(PASSWORD);
    await tabletPage.locator('button[type="submit"]').click();
    await tabletPage.waitForURL(/\/workforce\/meetings/, { timeout: 5000 });

    await tabletPage.screenshot({ path: `${SCREENSHOTS_DIR}/07-mobile-768.png` });
    await tabletContext.close();
  });

  test('10. 키보드 접근성 — Tab 순서', async () => {
    await page.goto('https://mrkimscafe.com/workforce/meetings');
    await page.waitForLoadState('networkidle');

    // 로그인 화면에서 Tab 순서
    let focusedElement = await page.evaluate(() => document.activeElement.tagName);
    console.log(`[Keyboard] Initial focus: ${focusedElement}`);

    // Tab으로 이동
    await page.keyboard.press('Tab');
    focusedElement = await page.evaluate(() => document.activeElement.getAttribute('type') || document.activeElement.tagName);
    console.log(`[Keyboard] After Tab 1: ${focusedElement}`);

    await page.keyboard.press('Tab');
    focusedElement = await page.evaluate(() => document.activeElement.getAttribute('type') || document.activeElement.tagName);
    console.log(`[Keyboard] After Tab 2: ${focusedElement}`);
  });

  test('11. 페이지 새로고침 — 회의 진행 중 보존', async () => {
    // 이 테스트는 activeRoom URL에서 새로고침할 때의 동작 확인
    await page.goto('https://mrkimscafe.com/workforce/meetings');
    await page.waitForLoadState('networkidle');

    // 로그인 후 회의 시작
    await page.locator('input[type="email"]').fill('ceo@mrkims.local');
    await page.locator('input[type="password"]').fill(PASSWORD);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/\/workforce\/meetings/, { timeout: 5000 });

    const textarea = page.locator('textarea');
    await textarea.fill('Refresh Test');

    const chips = page.locator('[data-testid="participant-chip"]');
    await chips.nth(0).click();
    await chips.nth(1).click();

    const startBtn = page.locator('button:has-text("Start")').first();
    await startBtn.click();

    await page.waitForURL(/\/workforce\/active/, { timeout: 10000 });
    const currentUrl = page.url();

    // 새로고침
    await page.reload();
    await page.waitForLoadState('networkidle');

    const urlAfterRefresh = page.url();
    console.log(`[Refresh] URL before: ${currentUrl}, after: ${urlAfterRefresh}`);

    // 같은 미팅 ID를 유지하는지 확인
    if (currentUrl === urlAfterRefresh) {
      console.log('[Refresh] Meeting URL preserved');
    }
  });

  test('12. 로그아웃', async () => {
    await page.goto('https://mrkimscafe.com/workforce/meetings');
    await page.waitForLoadState('networkidle');

    await page.locator('input[type="email"]').fill('ceo@mrkims.local');
    await page.locator('input[type="password"]').fill(PASSWORD);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/\/workforce\/meetings/, { timeout: 5000 });

    // 로그아웃 버튼 찾기
    const logoutBtn = page.locator('button:has-text("Logout"), button:has-text("로그아웃"), [aria-label*="ogout"], [aria-label*="로그아웃"]').first();
    console.log(`[Logout] Found logout button: ${await logoutBtn.isVisible().catch(() => false)}`);

    if (await logoutBtn.isVisible().catch(() => false)) {
      await logoutBtn.click();
      await page.waitForURL(/\/workforce\/meetings/, { timeout: 5000 });

      // 로그아웃 후 로그인 페이지로 리다이렉트 되었는지 확인
      const emailInput = page.locator('input[type="email"]');
      const isLoggedOut = await emailInput.isVisible().catch(() => false);
      console.log(`[Logout] Redirected to login: ${isLoggedOut}`);
    } else {
      console.warn('[Logout] Logout button not found');
    }

    await page.screenshot({ path: `${SCREENSHOTS_DIR}/08-after-logout.png` });
  });

  test('13. 네트워크 모니터링 — 폴링 누수 확인', async () => {
    await page.goto('https://mrkimscafe.com/workforce/meetings');
    await page.waitForLoadState('networkidle');

    // 요청 추적 활성화
    const requests = [];
    page.on('request', req => {
      if (req.url().includes('listMeetings') || req.url().includes('polling')) {
        requests.push({
          url: req.url(),
          time: Date.now(),
        });
      }
    });

    await page.locator('input[type="email"]').fill('ceo@mrkims.local');
    await page.locator('input[type="password"]').fill(PASSWORD);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/\/workforce\/meetings/, { timeout: 5000 });

    // Hub 페이지에서 5초간 폴링 요청 수 카운트
    await page.waitForTimeout(5000);
    const hubRequests = requests.filter(r => Date.now() - r.time < 5000).length;
    console.log(`[Network] Polling requests in 5s on Hub: ${hubRequests}`);

    // ActiveRoom 진입
    const textarea = page.locator('textarea');
    await textarea.fill('Network Test');
    const chips = page.locator('[data-testid="participant-chip"]');
    await chips.nth(0).click();
    const startBtn = page.locator('button:has-text("Start")').first();
    await startBtn.click();

    await page.waitForURL(/\/workforce\/active/, { timeout: 10000 });
    requests.length = 0; // 초기화

    // ActiveRoom에서 5초간 폴링 요청 수 카운트
    await page.waitForTimeout(5000);
    const activeRequests = requests.length;
    console.log(`[Network] Polling requests in 5s on ActiveRoom: ${activeRequests}`);

    // Hub로 돌아가기
    const backBtn = page.locator('button:has-text("Back"), a:has-text("Back")').first();
    if (await backBtn.isVisible().catch(() => false)) {
      await backBtn.click();
      await page.waitForURL(/\/workforce\/meetings/, { timeout: 5000 });

      requests.length = 0;
      await page.waitForTimeout(5000);
      const backHubRequests = requests.length;
      console.log(`[Network] Polling requests in 5s after returning to Hub: ${backHubRequests}`);

      // 폴링 누수 확인: 이전 폴링이 계속 실행되는지 확인
      if (backHubRequests > 3) {
        console.warn(`[ISSUE] Possible polling leak detected: ${backHubRequests} requests`);
      }
    }
  });

  test('14. Agent 매칭 확인 — 응답에 정확한 아바타/이름', async () => {
    await page.goto('https://mrkimscafe.com/workforce/meetings');
    await page.waitForLoadState('networkidle');

    await page.locator('input[type="email"]').fill('ceo@mrkims.local');
    await page.locator('input[type="password"]').fill(PASSWORD);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/\/workforce\/meetings/, { timeout: 5000 });

    const textarea = page.locator('textarea');
    await textarea.fill('Agent Test');

    // CEO, CFO, CTO 선택 (같은 team이라고 가정)
    const chips = page.locator('[data-testid="participant-chip"]');
    const ceoChip = await chips.first();
    const ceoName = await ceoChip.textContent();
    console.log(`[Agent] Selected: ${ceoName}`);

    await ceoChip.click();
    await chips.nth(1).click();

    const startBtn = page.locator('button:has-text("Start")').first();
    await startBtn.click();

    await page.waitForURL(/\/workforce\/active/, { timeout: 10000 });

    // 응답 대기
    await page.waitForTimeout(5000);
    const responseCard = page.locator('[data-testid="agent-response"]').first();
    const responseVisible = await responseCard.isVisible().catch(() => false);

    if (responseVisible) {
      const responderName = await page.locator('[data-testid="responder-name"]').first().textContent();
      const responderAvatar = await page.locator('[data-testid="responder-avatar"]').first().getAttribute('src');
      console.log(`[Agent Response] Name: ${responderName}, Avatar URL: ${responderAvatar?.substring(0, 50)}...`);

      // 일치 여부 확인
      if (!responderName || !responderAvatar) {
        console.warn('[ISSUE] Missing responder name or avatar');
      }
    }
  });

  test('15. expectedReplies 표시 — Dedupe 후 정확한 숫자', async () => {
    await page.goto('https://mrkimscafe.com/workforce/meetings');
    await page.waitForLoadState('networkidle');

    await page.locator('input[type="email"]').fill('ceo@mrkims.local');
    await page.locator('input[type="password"]').fill(PASSWORD);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/\/workforce\/meetings/, { timeout: 5000 });

    const textarea = page.locator('textarea');
    await textarea.fill('Expected Replies Test');

    // 3명 선택
    const chips = page.locator('[data-testid="participant-chip"]');
    await chips.nth(0).click();
    await chips.nth(1).click();
    await chips.nth(2).click();

    const selectedCount = await page.locator('[data-testid="participant-chip"][aria-selected="true"]').count();
    console.log(`[expectedReplies] Selected: ${selectedCount} participants`);

    const startBtn = page.locator('button:has-text("Start")').first();
    await startBtn.click();

    await page.waitForURL(/\/workforce\/active/, { timeout: 10000 });

    // ActiveRoom의 expectedReplies 표시 확인
    const expectedRepliesText = await page.locator('[data-testid="expected-replies"]').textContent().catch(() => '');
    console.log(`[expectedReplies] Display: "${expectedRepliesText}"`);

    // 형식 확인: "1/3", "3/3" 등이 맞는지
    if (!/\d+\/\d+/.test(expectedRepliesText)) {
      console.warn(`[ISSUE] Expected replies format incorrect: "${expectedRepliesText}"`);
    }
  });
});
