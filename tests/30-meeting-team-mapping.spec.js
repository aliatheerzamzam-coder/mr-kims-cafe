import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

async function apiRequest(method, path, body = null, headers = {}) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE_URL}${path}`, opts);
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function getWorkforceToken() {
  const password = process.env.WORKFORCE_INITIAL_PASSWORD || 'Zoom1788!';
  const { status, data } = await apiRequest('POST', '/api/workforce/auth/login', { password });
  if (status !== 200 || !data.token) {
    throw new Error(`Workforce login failed: ${JSON.stringify(data)}`);
  }
  return data.token;
}

test.describe('[H1] Meeting Team Mapping', () => {
  test('AGENTS.team_id matches WORKFORCE_AGENTS.team_id from server', async () => {
    const token = await getWorkforceToken();
    const { status, data } = await apiRequest('GET', '/api/workforce/agents', null, {
      'x-workforce-token': token
    });

    expect(status).toBe(200);
    expect(data.agents).toBeDefined();
    expect(Array.isArray(data.agents)).toBeTruthy();

    // server.js WORKFORCE_AGENTS 기준값 (source of truth)
    const expectedTeamIdMap = {
      'ceo': 'ceo',
      'cfo': 'cfo',
      'cpo': 'coo',
      'pm-1': 'coo',
      'pm-2': 'coo',
      'cto': 'developer',
      'eng-1': 'developer',
      'eng-2': 'developer',
      'eng-3': 'developer',
      'eng-4': 'developer',
      'des-1': 'marketing',
      'des-2': 'marketing',
      'cmo': 'marketing',
      'mkt-1': 'marketing',
      'mkt-2': 'marketing',
      'mkt-3': 'marketing',
      'cro': 'coo',
      'sls-1': 'coo',
      'sls-2': 'coo',
      'fin-1': 'cfo',
      'fin-2': 'cfo',
      'clo': 'legal',
      'lgl-1': 'legal',
    };

    // 각 에이전트가 올바른 team_id를 가지고 있는지 검증
    for (const agent of data.agents) {
      const expectedTeamId = expectedTeamIdMap[agent.id];
      expect(
        agent.team_id === expectedTeamId,
        `Agent ${agent.id} should have team_id=${expectedTeamId}, got ${agent.team_id}`
      ).toBe(true);
    }
  });

  test('All agent team_ids are valid (ceo, cfo, coo, developer, marketing, legal)', async () => {
    const token = await getWorkforceToken();
    const { status, data } = await apiRequest('GET', '/api/workforce/agents', null, {
      'x-workforce-token': token
    });

    expect(status).toBe(200);
    expect(data.agents).toBeDefined();

    const validTeamIds = new Set(['ceo', 'cfo', 'coo', 'developer', 'marketing', 'legal']);

    for (const agent of data.agents) {
      expect(validTeamIds.has(agent.team_id), `Agent ${agent.id} has invalid team_id: ${agent.team_id}`).toBe(true);
    }
  });
});
