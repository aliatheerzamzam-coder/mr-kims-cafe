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

test.describe('[M8] 5xx Error Message Genericization', () => {
  test('should return generic 500 error without file paths', async () => {
    // Call a non-existent endpoint to trigger potential 500 error path
    const { status, data } = await apiRequest('GET', '/api/nonexistent');

    // Should get 404 or 500, but no file paths in response
    const errorMsg = data.error || data.message || '';
    expect(errorMsg).not.toMatch(/\.js(\:|\/|\\)/); // No .js file references
    expect(errorMsg).not.toMatch(/\/Users\//); // No absolute paths
    expect(errorMsg).not.toMatch(/\\[A-Z]:/); // No Windows paths
    expect(errorMsg).not.toMatch(/at [A-Za-z]/); // No stack trace "at function"
  });

  test('should return generic error for invalid JSON POST', async () => {
    const opts = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{invalid json}',
    };
    const res = await fetch(`${BASE_URL}/api/workforce/auth/login`, opts);
    const data = await res.json().catch(() => ({ error: 'Invalid JSON' }));

    const errorMsg = JSON.stringify(data);
    expect(errorMsg).not.toMatch(/SyntaxError/);
    expect(errorMsg).not.toMatch(/at /); // No stack traces
    expect(errorMsg).not.toMatch(/[0-9]{3}:[0-9]{2}/); // No line:col references
  });

  test('should not leak database errors to client', async () => {
    // Try to access a database operation with invalid parameters
    const { status, data } = await apiRequest('POST', '/api/workforce/meeting/start', {
      agent_ids: 'invalid-not-array',
      topic: 'Test'
    }, {
      'x-workforce-token': 'invalid-token'
    });

    const errorMsg = JSON.stringify(data);
    expect(errorMsg).not.toMatch(/sqlite/i);
    expect(errorMsg).not.toMatch(/SQL/i);
    expect(errorMsg).not.toMatch(/table/i); // Should not leak table names
  });

  test('should return generic error for server-side exceptions', async () => {
    // This is a defensive test - should never leak system info
    const { status, data } = await apiRequest('GET', '/api/ingredients/99999999');

    const errorMsg = JSON.stringify(data).toLowerCase();
    expect(errorMsg).not.toMatch(/process\./);
    expect(errorMsg).not.toMatch(/require\(/);
    expect(errorMsg).not.toMatch(/env/);
  });
});
