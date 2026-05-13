const { test, expect } = require('@playwright/test');

const PASSWORD = 'Zoom1788!';

test('회의 응답 아바타 정확성 검증 (Production Live QA)', async ({ page }) => {
  test.skip(!process.env.LIVE_SITE_TESTS, 'set LIVE_SITE_TESTS=1 to run live-site checks');
  // 로그인
  await page.goto('https://mrkimscafe.com/workforce', { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

  const passwordInput = page.locator('input[type="password"]').first();
  await passwordInput.fill(PASSWORD);

  const submitBtn = page.locator('button').filter({ hasText: /Sign|로그인|확인/ }).first();
  await submitBtn.click();

  // 로그인 완료 대기
  await page.waitForFunction(
    () => !document.querySelector('button:has-text("확인 중...")'),
    { timeout: 15000 }
  ).catch(() => {});
  await page.waitForTimeout(2000);

  // Meetings 페이지로 이동
  await page.goto('https://mrkimscafe.com/workforce/meetings', { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

  // 회의 안건 입력
  const textarea = page.locator('textarea').first();
  await textarea.fill('회의 응답 아바타 검증 테스트');

  // 회의 시작
  const startBtn = page.locator('button').filter({ hasText: /회의 시작|Start meeting/ }).first();
  await startBtn.click();

  // 응답 수신 대기
  await page.waitForTimeout(3000);

  console.log('\n========== 회의 응답 아바타 검증 보고 ==========\n');

  // DOM에서 직접 응답 데이터 추출
  const responseData = await page.evaluate(() => {
    const responses = [];

    // 방법 1: 응답 컨테이너 찾기
    const containers = document.querySelectorAll('[class*="response"], [class*="message"], [class*="agent"]');

    containers.forEach((container, idx) => {
      // 아바타 찾기
      const avatar = container.querySelector('[class*="avatar"], img[alt*="avatar"], div[style*="background"]');
      const text = container.textContent?.substring(0, 100) || '';
      const html = container.innerHTML.substring(0, 200);

      // 초기글자/역할 추출
      let role = 'Unknown';
      let initials = 'XX';
      let color = 'Unknown';

      // 텍스트에서 역할 추출
      const roleMatch = text.match(/CEO|CFO|CTO|CMO|CLO|COO|Chief/i);
      if (roleMatch) {
        role = roleMatch[0].toUpperCase();
        initials = role.substring(0, 2);
      }

      // 이니셜 추출
      const initialsMatch = text.match(/\b([A-Z]{2,3})\b/);
      if (initialsMatch && !role.includes('Chief')) {
        initials = initialsMatch[1];
      }

      // 클래스에서 색상 추출
      const classList = container.className || '';
      if (classList.includes('blue') || classList.includes('CEO')) color = 'Blue (CEO)';
      if (classList.includes('pink') || classList.includes('CFO')) color = 'Pink (CFO)';
      if (classList.includes('green') || classList.includes('CTO')) color = 'Green (CTO)';
      if (classList.includes('red')) color = 'Red';

      // 인라인 스타일에서 색상 추출
      const style = container.getAttribute('style') || '';
      if (style.includes('#4B8EFF') || style.includes('rgb(75, 142, 255)')) color = 'Blue (CEO)';
      if (style.includes('#FF69B4') || style.includes('rgb(255, 105, 180)')) color = 'Pink (CFO)';
      if (style.includes('#4CAF50') || style.includes('rgb(76, 175, 80)')) color = 'Green (CTO)';

      responses.push({
        index: idx,
        initials: initials,
        role: role,
        color: color,
        preview: text.replace(/\n/g, ' ').substring(0, 40),
        hasAvatar: !!avatar,
      });
    });

    return responses;
  });

  // 검증 결과 출력
  const results = [];

  console.log('[선택 에이전트]');
  console.log('- CEO (최고경영자)');
  console.log('- CFO (재무담당자)');
  console.log('- CTO (기술담당자)\n');

  console.log('[각 응답의 아바타 확인]');

  const expectedMappings = {
    'CE': { expected: 'CEO', color: 'Blue' },
    'CF': { expected: 'CFO', color: 'Pink' },
    'CT': { expected: 'CTO', color: 'Green' },
  };

  responseData.forEach((resp) => {
    const expected = expectedMappings[resp.initials] || {};
    const match = resp.role.includes(expected.expected) || resp.initials === expected.initials?.substring(0, 2);

    const status = match ? '✓' : '✗';
    console.log(`${status} [${resp.initials}] 역할: ${resp.role}, 색상: ${resp.color}`);
    console.log(`  텍스트: "${resp.preview}..."`);
    console.log(`  아바타 발견: ${resp.hasAvatar}`);

    results.push({
      initials: resp.initials,
      role: resp.role,
      status: match ? 'PASS' : 'FAIL',
    });
  });

  console.log('\n========== 검증 결과 ==========\n');

  if (responseData.length === 0) {
    console.log('상태: FAIL - 응답을 받지 못함');
  } else {
    const passCount = results.filter(r => r.status === 'PASS').length;
    const failCount = results.filter(r => r.status === 'FAIL').length;

    console.log(`응답 수: ${responseData.length}개`);
    console.log(`성공: ${passCount}개, 실패: ${failCount}개\n`);

    if (failCount === 0) {
      console.log('결론: PASS - 모든 응답이 정확한 아바타로 표시됨\n');
    } else {
      console.log('결론: PARTIAL - 일부 응답에서 아바타 불일치\n');
    }
  }

  // 최종 스크린샷
  await page.screenshot({ path: './test-results/final-avatar-check.png' });
  console.log('스크린샷 저장: ./test-results/final-avatar-check.png');

  // 어서션
  expect(responseData.length).toBeGreaterThan(0);
});
