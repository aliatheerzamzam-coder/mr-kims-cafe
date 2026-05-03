/**
 * Bundle 24 — Suppliers API CRUD
 * - POST/GET/PUT/DELETE /api/suppliers
 * - UNIQUE name → 409
 * - ingredient.supplier_id linkage
 */

const { test, expect } = require('@playwright/test');
const { adminLogin, apiRequest } = require('./helpers/api');

test.describe('Bundle 24: Suppliers CRUD', () => {
  let adminToken;
  let createdId;
  const tag = `S${Date.now().toString(36)}`;
  const name = `Test Supplier ${tag}`;

  test.beforeAll(async () => { adminToken = await adminLogin(); });

  test.afterAll(async () => {
    if (createdId) {
      await apiRequest('DELETE', `/api/suppliers/${createdId}`, null, { 'x-auth-token': adminToken });
    }
  });

  test('POST creates supplier with full contact info', async () => {
    const r = await apiRequest('POST', '/api/suppliers', {
      name,
      contact_person: 'Ahmed Ali',
      phone: '07701234567',
      whatsapp: '+9647701234567',
      address: 'Erbil, Kurdistan',
      note: 'pref: morning delivery',
    }, { 'x-auth-token': adminToken });
    expect(r.status).toBe(200);
    expect(r.data.success).toBe(true);
    expect(r.data.id).toBeGreaterThan(0);
    createdId = r.data.id;
  });

  test('POST duplicate name returns 409', async () => {
    const r = await apiRequest('POST', '/api/suppliers', { name }, { 'x-auth-token': adminToken });
    expect(r.status).toBe(409);
  });

  test('GET returns the supplier with all fields', async () => {
    const r = await apiRequest('GET', '/api/suppliers', null, { 'x-auth-token': adminToken });
    expect(r.status).toBe(200);
    const found = r.data.find(s => s.id === createdId);
    expect(found).toBeTruthy();
    expect(found.name).toBe(name);
    expect(found.contact_person).toBe('Ahmed Ali');
    expect(found.whatsapp).toBe('+9647701234567');
  });

  test('PUT updates supplier fields', async () => {
    const r = await apiRequest('PUT', `/api/suppliers/${createdId}`, {
      name,
      contact_person: 'Mohammed Hassan',
      phone: '07709998888',
    }, { 'x-auth-token': adminToken });
    expect(r.status).toBe(200);
    const list = await apiRequest('GET', '/api/suppliers', null, { 'x-auth-token': adminToken });
    const found = list.data.find(s => s.id === createdId);
    expect(found.contact_person).toBe('Mohammed Hassan');
    expect(found.phone).toBe('07709998888');
  });

  test('POST without name returns 400', async () => {
    const r = await apiRequest('POST', '/api/suppliers', { phone: 'x' }, { 'x-auth-token': adminToken });
    expect(r.status).toBe(400);
  });

  test('Unauthenticated request rejected', async () => {
    const r = await apiRequest('GET', '/api/suppliers');
    expect([401, 403]).toContain(r.status);
  });
});
