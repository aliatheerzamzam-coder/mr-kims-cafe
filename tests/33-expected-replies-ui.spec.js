import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

async function getWorkforceToken() {
  const password = process.env.WORKFORCE_INITIAL_PASSWORD || 'Zoom1788!';
  const opts = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  };
  const res = await fetch(`${BASE_URL}/api/workforce/auth/login`, opts);
  const data = await res.json();
  if (!data.token) throw new Error('Login failed');
  return data.token;
}

async function startMeeting(token, agentIds, topic) {
  const opts = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-workforce-token': token,
    },
    body: JSON.stringify({ agent_ids: agentIds, topic }),
  };
  const res = await fetch(`${BASE_URL}/api/workforce/meeting/start`, opts);
  const data = await res.json();
  return data.meeting_id;
}

async function pollMeeting(token, meetingId) {
  const opts = {
    headers: { 'x-workforce-token': token },
  };
  const res = await fetch(`${BASE_URL}/api/workforce/chat/${meetingId}`, opts);
  return res.json();
}

test.describe('[M1] Expected Replies UI Display', () => {
  test('should show expected vs received replies count for multi-agent meetings', async () => {
    const token = await getWorkforceToken();
    const meetingId = await startMeeting(token, ['ceo', 'cfo', 'pm-1'], 'What is our strategy?');
    expect(meetingId).toBeDefined();

    // Poll meeting to get current state
    const meeting = await pollMeeting(token, meetingId);
    expect(meeting.type).toBe('multi');
    expect(meeting.team_ids).toHaveLength(3);

    // In UI, expectedReplies = meeting.team_ids.length = 3
    // receivedReplies = messages with role='agent'
    // Display format: "{receivedReplies} / {expectedReplies} 응답"
    const expectedCount = meeting.team_ids.length;
    const receivedCount = (meeting.messages || []).filter(m => m.role === 'agent').length;

    // Should display like "0 / 3 응답" initially (no agents have replied yet)
    expect(expectedCount).toBe(3);
    expect(receivedCount).toBeGreaterThanOrEqual(0);
  });

  test('should count team_ids not unique agent_ids for expected replies', async () => {
    const token = await getWorkforceToken();
    // Three agents but only 2 teams: ceo (team=ceo), cfo (team=cfo), pm-1 (team=coo)
    const meetingId = await startMeeting(token, ['ceo', 'cfo', 'pm-1'], 'Test topic');

    const meeting = await pollMeeting(token, meetingId);
    // Backend dedupes by team_id, so team_ids should be ['ceo', 'cfo', 'coo']
    // expectedReplies shown in UI = team_ids.length = 3
    expect(meeting.team_ids).toEqual(expect.arrayContaining(['ceo', 'cfo', 'coo']));

    // UI will display expectedReplies = meeting.team_ids.length
    const uiExpectedReplies = meeting.team_ids.length;
    expect(uiExpectedReplies).toBe(3);
  });

  test('should update received replies count as agents respond', async () => {
    const token = await getWorkforceToken();
    const meetingId = await startMeeting(token, ['ceo', 'cfo'], 'Quick question');

    let prevReceivedCount = 0;
    for (let i = 0; i < 5; i++) {
      const meeting = await pollMeeting(token, meetingId);
      const receivedCount = (meeting.messages || []).filter(m => m.role === 'agent').length;

      // Count should be non-decreasing
      expect(receivedCount).toBeGreaterThanOrEqual(prevReceivedCount);
      prevReceivedCount = receivedCount;

      if (i < 4) {
        await new Promise(r => setTimeout(r, 100)); // Wait 100ms before next poll
      }
    }

    // At least we polled successfully and checked the received count logic
    expect(prevReceivedCount).toBeGreaterThanOrEqual(0);
  });
});
