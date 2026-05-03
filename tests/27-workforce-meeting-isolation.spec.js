const { test, expect } = require('@playwright/test');
const { workforceLogin: apiWorkforceLogin } = require('./helpers/api');

const BASE_URL = 'http://localhost:3000';

async function apiRequest(token = null, method, path, body = null) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };

  if (token) {
    opts.headers['x-workforce-token'] = token;
  }

  if (body) {
    opts.body = JSON.stringify(body);
  }

  const res = await fetch(`${BASE_URL}${path}`, opts);
  const data = await res.json().catch(() => ({}));

  return { status: res.status, body: data };
}

async function workforceLogin() {
  // Use the api.js helper which uses native fetch
  return apiWorkforceLogin('Zoom1788!');
}

test.describe('C1: Workforce Meeting Permission Isolation (created_by_token)', () => {

  test('RED: User A cannot access meeting created by User B (should return 404)', async () => {
    // Scenario: Two workforce users with different tokens
    // User A creates a meeting, User B tries to access it
    // Expected: User B gets 404 (not 403 to avoid information leak)

    const tokenA = await workforceLogin();
    const tokenB = await workforceLogin();

    // Step 1: User A creates a meeting
    const createRes = await apiRequest(
      tokenA,
      'POST',
      '/api/workforce/meeting/start',
      {
        agent_ids: ['ceo', 'cfo'],
        topic: 'Test meeting for isolation',
      }
    );

    expect(createRes.status).toBe(200);
    expect(createRes.body).toHaveProperty('meeting_id');
    const meetingId = createRes.body.meeting_id;

    // Step 2: User A retrieves their meetings (should see it)
    const listA = await apiRequest(tokenA, 'GET', '/api/workforce/meetings');
    expect(listA.status).toBe(200);
    expect(listA.body).toHaveProperty('meetings');
    expect(Array.isArray(listA.body.meetings)).toBe(true);
    const meetingInA = listA.body.meetings.find((m) => m.id === meetingId);
    expect(meetingInA).toBeDefined();
    expect(meetingInA.created_by_token).toBe(tokenA);

    // Step 3: User B retrieves their meetings (should NOT see User A's meeting)
    const listB = await apiRequest(tokenB, 'GET', '/api/workforce/meetings');
    expect(listB.status).toBe(200);
    expect(listB.body).toHaveProperty('meetings');
    expect(Array.isArray(listB.body.meetings)).toBe(true);
    const meetingInB = listB.body.meetings.find((m) => m.id === meetingId);
    expect(meetingInB).toBeUndefined();

    // Step 4: User B tries direct access to User A's meeting (should return 404)
    const directAccessRes = await apiRequest(
      tokenB,
      'GET',
      `/api/workforce/meeting/${meetingId}`
    );
    expect(directAccessRes.status).toBe(404);
  });

  test('RED: List meetings endpoint filters by created_by_token', async () => {
    const tokenA = await workforceLogin();
    const tokenB = await workforceLogin();

    // Create two meetings with different tokens
    const meetingA = await apiRequest(
      tokenA,
      'POST',
      '/api/workforce/meeting/start',
      {
        agent_ids: ['ceo', 'cfo'],
        topic: 'Meeting test A',
      }
    );

    const meetingB = await apiRequest(
      tokenB,
      'POST',
      '/api/workforce/meeting/start',
      {
        agent_ids: ['cto', 'cmo'],
        topic: 'Meeting test B',
      }
    );

    expect(meetingA.status).toBe(200);
    expect(meetingB.status).toBe(200);

    const meetingIdA = meetingA.body.meeting_id;
    const meetingIdB = meetingB.body.meeting_id;

    // User A retrieves their meetings (should only see their own)
    const listA = await apiRequest(
      tokenA,
      'GET',
      '/api/workforce/meetings'
    );
    expect(listA.status).toBe(200);
    expect(listA.body).toHaveProperty('meetings');
    expect(Array.isArray(listA.body.meetings)).toBe(true);

    // Verify User A's meeting is in their list but not User B's
    const userASeesOwnMeeting = listA.body.meetings.some((m) =>
      m.id === meetingIdA ? true : false
    );
    const userASeesOtherMeeting = listA.body.meetings.some((m) =>
      m.id === meetingIdB ? true : false
    );

    expect(userASeesOwnMeeting).toBe(true);
    expect(userASeesOtherMeeting).toBe(false);

    // User B retrieves their meetings (should only see their own)
    const listB = await apiRequest(
      tokenB,
      'GET',
      '/api/workforce/meetings'
    );
    expect(listB.status).toBe(200);
    expect(listB.body).toHaveProperty('meetings');
    expect(Array.isArray(listB.body.meetings)).toBe(true);

    const userBSeesOwnMeeting = listB.body.meetings.some((m) =>
      m.id === meetingIdB ? true : false
    );
    const userBSeesOtherMeeting = listB.body.meetings.some((m) =>
      m.id === meetingIdA ? true : false
    );

    expect(userBSeesOwnMeeting).toBe(true);
    expect(userBSeesOtherMeeting).toBe(false);
  });
});
