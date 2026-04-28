import { test, expect } from '@playwright/test';

test('OAuth lifecycle: create client, get token, create entity, cleanup', async ({
  request,
}) => {
  // 1. Get admin token via password grant
  const tokenRes = await request.post('/api/oauth/token', {
    data: {
      grant_type: 'password',
      email: 'admin@dojo.api',
      password: 'Password1',
    },
  });
  expect(tokenRes.status()).toBe(200);
  const { access_token: adminToken } = await tokenRes.json();

  // 2. Create a new OAuth client
  const clientRes = await request.post('/api/oauth/clients', {
    headers: { Authorization: `Bearer ${adminToken}` },
    data: {
      name: 'Playwright Test Client',
      grants: ['client_credentials'],
      scopes: ['read', 'write', 'admin'],
    },
  });
  expect(clientRes.status()).toBe(201);
  const { clientId, clientSecret } = await clientRes.json();

  // 3. Get token using the new client
  const newTokenRes = await request.post('/api/oauth/token', {
    data: {
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    },
  });
  expect(newTokenRes.status()).toBe(200);
  const { access_token: newClientToken } = await newTokenRes.json();

  // 4. Use the new client's token to access a protected endpoint
  const userinfoRes = await request.get('/api/oauth/userinfo', {
    headers: { Authorization: `Bearer ${newClientToken}` },
  });
  expect(userinfoRes.status()).toBe(200);
  const userinfo = await userinfoRes.json();
  expect(userinfo.sub).toBe(clientId);
  expect(userinfo.type).toBe('client');

  // 5. Create a category using the admin token
  const name = `PW Test Category ${Date.now()}`;
  const categoryRes = await request.post('/api/categories', {
    headers: { Authorization: `Bearer ${adminToken}` },
    data: { name },
  });
  expect(categoryRes.status()).toBe(201);
  const category = await categoryRes.json();
  expect(category.name).toBe(name);
  expect(category.slug).toBeTruthy();
});
