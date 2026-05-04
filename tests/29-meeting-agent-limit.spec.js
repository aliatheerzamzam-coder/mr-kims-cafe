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

test.describe('[C4] Meeting Agent Limit', () => {
  test('should reject meeting with more than 6 agents (7 agents)', async () => {
    const token = await getWorkforceToken();
    const { status, data } = await apiRequest(
      'POST',
      '/api/workforce/meeting/start',
      {
        agent_ids: ['ceo', 'cfo', 'cpo', 'pm-1', 'pm-2', 'cto', 'eng-1'], // 7명
        topic: 'Test discussion'
      },
      { 'x-workforce-token': token }
    );

    expect(status).toBe(400);
    expect(data.error || data.message).toContain('max 6');
  });

  test('should reject meeting with 8 agents', async () => {
    const token = await getWorkforceToken();
    const { status, data } = await apiRequest(
      'POST',
      '/api/workforce/meeting/start',
      {
        agent_ids: ['ceo', 'cfo', 'cpo', 'pm-1', 'pm-2', 'cto', 'eng-1', 'eng-2'], // 8명
        topic: 'Test discussion'
      },
      { 'x-workforce-token': token }
    );

    expect(status).toBe(400);
    expect(data.error || data.message).toContain('max 6');
  });

  test('should accept meeting with exactly 6 agents', async () => {
    const token = await getWorkforceToken();
    const { status, data } = await apiRequest(
      'POST',
      '/api/workforce/meeting/start',
      {
        agent_ids: ['ceo', 'cfo', 'cpo', 'pm-1', 'cto', 'eng-1'], // 6명
        topic: 'Test discussion'
      },
      { 'x-workforce-token': token }
    );

    expect([200, 201]).toContain(status);
    expect(data.meeting_id).toBeDefined();
  });

  test('should accept meeting with fewer than 6 agents', async () => {
    const token = await getWorkforceToken();
    const { status, data } = await apiRequest(
      'POST',
      '/api/workforce/meeting/start',
      {
        agent_ids: ['ceo', 'cfo', 'pm-1'], // 3명
        topic: 'Test discussion'
      },
      { 'x-workforce-token': token }
    );

    expect([200, 201]).toContain(status);
    expect(data.meeting_id).toBeDefined();
  });
});
