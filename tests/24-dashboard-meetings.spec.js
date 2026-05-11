/**
 * 테스트 24: /admin 대시보드 회의 기능 (1:1 ask, 다자 multi, 주제별 report, 이어쓰기)
 *
 * 실행 전 사전 조건:
 *   CLAUDE_MOCK=1 npm start
 *
 * CLAUDE_MOCK=1로 서버를 띄우면 scripts/lib/anthropic-sdk.js가 실제 API 호출 없이
 * stub 응답을 반환한다. 실제 Anthropic API 호출 검증은 수동 확인으로 진행.
 *
 * 회의 + team-reports 엔드포인트는 admin 토큰(x-auth-token) 전용으로 강화됨.
 */

const { test, expect } = require('@playwright/test');
const { apiRequest, adminLogin, cashierLogin } = require('./helpers/api');

const ADMIN_HDR = (token) => ({ 'x-auth-token': token });

async function pollUntilDone(meetingId, token, timeoutMs = 8000) {
  const deadline = Date.now() + timeoutMs;
  let last = null;
  while (Date.now() < deadline) {
    const { status, data } = await apiRequest('GET', `/api/meetings/${meetingId}`, null, ADMIN_HDR(token));
    if (status !== 200) throw new Error(`GET 실패 ${status}: ${JSON.stringify(data)}`);
    last = data;
    if (data.status !== 'running') return data;
    await new Promise(r => setTimeout(r, 200));
  }
  throw new Error(`회의 ${meetingId}가 ${timeoutMs}ms 안에 끝나지 않음. last=${JSON.stringify(last)}`);
}

test.describe('/admin 에이전트 회의 (CLAUDE_MOCK=1 필요)', () => {
  let token;

  test.beforeAll(async () => {
    token = await adminLogin();
  });

  test('GET /admin이 dashboard.html을 서빙한다', async ({ request }) => {
    const r = await request.get('http://localhost:3000/admin');
    expect(r.status()).toBe(200);
    const html = await r.text();
    expect(html).toContain('Mr. Kim');
    expect(html).toContain('Admin 로그인');
  });

  test('teams/list가 본사 8팀을 반환한다', async () => {
    const { status, data } = await apiRequest('GET', '/api/meetings/teams/list', null, ADMIN_HDR(token));
    expect(status).toBe(200);
    expect(Array.isArray(data.teams)).toBe(true);
    expect(data.teams.length).toBe(8);
    const ids = data.teams.map(t => t.id).sort();
    expect(ids).toEqual(['ceo', 'cfo', 'coo', 'developer', 'hr', 'legal', 'marketing', 'tax']);
  });

  test('인증 없이는 401', async () => {
    const { status } = await apiRequest('POST', '/api/meetings/ask', { team_id: 'marketing', prompt: 'hi' });
    expect([401, 403]).toContain(status);
  });

  test('cashier 토큰만으로는 거부된다 (admin 전용)', async () => {
    // The default QA cashier (qa_tester) is intentionally an owner so it can
    // run most tests — create a true cashier-role account for this admin gate.
    const cashierName = `qa_meetings_cashier_${Date.now().toString().slice(-6)}`;
    const cashierPass = 'cashier-pass-1';
    await apiRequest('POST', '/api/cashiers',
      { name: cashierName, password: cashierPass, role: 'cashier' },
      { 'x-auth-token': token });
    const loginRes = await apiRequest('POST', '/api/cashier/login',
      { name: cashierName, password: cashierPass });
    const cashierToken = loginRes.data && loginRes.data.token;
    expect(cashierToken).toBeTruthy();

    const { status } = await apiRequest('POST', '/api/meetings/ask',
      { team_id: 'marketing', prompt: 'hi' },
      { 'x-cashier-token': cashierToken });
    expect([401, 403]).toContain(status);
  });

  test('1:1 ask: 회의 생성 → 폴링으로 done → agent 메시지 존재', async () => {
    const create = await apiRequest('POST', '/api/meetings/ask',
      { team_id: 'marketing', prompt: '신메뉴 마케팅 아이디어 알려줘' },
      ADMIN_HDR(token));
    expect(create.status).toBe(200);
    expect(create.data.meeting_id).toMatch(/^m_/);

    const final = await pollUntilDone(create.data.meeting_id, token);
    expect(final.status).toBe('done');
    expect(final.type).toBe('ask');
    expect(final.team_ids).toEqual(['marketing']);
    expect(final.messages.length).toBeGreaterThanOrEqual(2);
    expect(final.messages[0].role).toBe('user');
    const agentMsg = final.messages.find(m => m.role === 'agent');
    expect(agentMsg).toBeDefined();
    expect(agentMsg.team_id).toBe('marketing');
    expect(agentMsg.content.length).toBeGreaterThan(20);
  });

  test('1:1 이어쓰기: follow-up 후 메시지 4개 (user2 + agent2)', async () => {
    const create = await apiRequest('POST', '/api/meetings/ask',
      { team_id: 'cfo', prompt: '5월 현금흐름 어때?' },
      ADMIN_HDR(token));
    await pollUntilDone(create.data.meeting_id, token);

    const followup = await apiRequest('POST', `/api/meetings/${create.data.meeting_id}/message`,
      { prompt: '구체적 숫자 예시 1개만' },
      ADMIN_HDR(token));
    expect(followup.status).toBe(200);

    const second = await pollUntilDone(create.data.meeting_id, token);
    expect(second.status).toBe('done');
    expect(second.messages.filter(m => m.role === 'user').length).toBe(2);
    expect(second.messages.filter(m => m.role === 'agent').length).toBe(2);
  });

  test('다자 회의: 3팀 동시 호출 시 각 팀 답변 1개씩', async () => {
    const create = await apiRequest('POST', '/api/meetings/multi',
      { team_ids: ['ceo', 'cfo', 'marketing'], topic: '신메뉴 가격 정책' },
      ADMIN_HDR(token));
    expect(create.status).toBe(200);

    const final = await pollUntilDone(create.data.meeting_id, token, 12000);
    expect(final.status).toBe('done');
    expect(final.type).toBe('multi');
    expect(final.team_ids.length).toBe(3);
    const agents = final.messages.filter(m => m.role === 'agent');
    expect(agents.length).toBe(3);
    const teamSet = new Set(agents.map(a => a.team_id));
    expect(teamSet.has('ceo')).toBe(true);
    expect(teamSet.has('cfo')).toBe(true);
    expect(teamSet.has('marketing')).toBe(true);
  });

  test('주제별 보고서: report 타입 단발 호출', async () => {
    const create = await apiRequest('POST', '/api/meetings/report',
      { team_id: 'hr', topic: '바리스타 추가 채용 ROI' },
      ADMIN_HDR(token));
    expect(create.status).toBe(200);
    const final = await pollUntilDone(create.data.meeting_id, token);
    expect(final.status).toBe('done');
    expect(final.type).toBe('report');
    expect(final.messages.filter(m => m.role === 'agent').length).toBe(1);
  });

  test('잘못된 입력은 400', async () => {
    const r1 = await apiRequest('POST', '/api/meetings/ask', { team_id: 'unknown', prompt: 'x' }, ADMIN_HDR(token));
    expect(r1.status).toBe(400);
    const r2 = await apiRequest('POST', '/api/meetings/ask', { team_id: 'ceo', prompt: '' }, ADMIN_HDR(token));
    expect(r2.status).toBe(400);
    const r3 = await apiRequest('POST', '/api/meetings/multi', { team_ids: ['ceo'], topic: 'x' }, ADMIN_HDR(token));
    expect(r3.status).toBe(400);
    const r4 = await apiRequest('POST', '/api/meetings/multi', { team_ids: ['ceo', 'fakeTeam'], topic: 'x' }, ADMIN_HDR(token));
    expect(r4.status).toBe(400);
  });

  test('히스토리 조회: 위 회의들이 목록에 나온다', async () => {
    const { status, data } = await apiRequest('GET', '/api/meetings?limit=10', null, ADMIN_HDR(token));
    expect(status).toBe(200);
    expect(Array.isArray(data.meetings)).toBe(true);
    expect(data.meetings.length).toBeGreaterThan(0);
    const types = new Set(data.meetings.map(m => m.type));
    expect(types.has('ask')).toBe(true);
    expect(types.has('multi')).toBe(true);
    expect(types.has('report')).toBe(true);
  });

  test('존재하지 않는 회의 조회는 404', async () => {
    const { status } = await apiRequest('GET', '/api/meetings/m_nonexistent', null, ADMIN_HDR(token));
    expect(status).toBe(404);
  });
});
