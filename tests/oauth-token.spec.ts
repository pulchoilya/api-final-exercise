import { test, expect, type APIRequestContext } from '@playwright/test';
import { ADMIN_EMAIL, ADMIN_PASSWORD, getAdminToken } from './support/auth';

async function createOAuthClient(request: APIRequestContext, adminToken: string) {
  const response = await request.post('/api/oauth/clients', {
    headers: { Authorization: `Bearer ${adminToken}` },
    data: {
      name: 'Playwright Token Grant Client',
      grants: ['client_credentials'],
      scopes: ['read', 'write'],
    },
  });

  expect(response.status()).toBe(201);
  return response.json();
}

test.describe('POST /api/oauth/token', () => {
  test('password grant returns access token plus refresh token', async ({ request }) => {
    const response = await request.post('/api/oauth/token', {
      data: {
        grant_type: 'password',
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        scope: 'read write',
      },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();

    expect(body.access_token).toBeTruthy();
    expect(body.token_type).toBe('Bearer');
    expect(body.expires_in).toBe(900);
    expect(body.refresh_token).toBeTruthy();
    expect(body.scope).toBe('read write');
  });

  test('password grant with invalid credentials returns invalid_grant', async ({ request }) => {
    const response = await request.post('/api/oauth/token', {
      data: {
        grant_type: 'password',
        email: 'admin@dojo.api',
        password: 'WrongPassword1',
      },
    });

    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body.error).toBe('invalid_grant');
    expect(body.error_description).toBe('Invalid email or password');
  });

  test('password grant with missing fields returns invalid_request', async ({ request }) => {
    const response = await request.post('/api/oauth/token', {
      data: {
        grant_type: 'password',
        email: ADMIN_EMAIL,
      },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toBe('invalid_request');
    // expect(body.error_description).toContain('password');
  });

  test('client_credentials grant returns an access token', async ({ request }) => {
    const adminToken = await getAdminToken(request);
    const { clientId, clientSecret } = await createOAuthClient(request, adminToken);

    const tokenResponse = await request.post('/api/oauth/token', {
      data: {
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
      },
    });

    expect(tokenResponse.status()).toBe(200);
    const body = await tokenResponse.json();

    expect(body.access_token).toBeTruthy();
    expect(body.token_type).toBe('Bearer');
    expect(body.expires_in).toBe(900);
    expect(body.scope).toBe('read write');
    expect(body.refresh_token).toBeUndefined();
  });

  test('client_credentials grant with invalid secret returns invalid_client', async ({
    request,
  }) => {
    const adminToken = await getAdminToken(request);
    const { clientId } = await createOAuthClient(request, adminToken);

    const response = await request.post('/api/oauth/token', {
      data: {
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: 'wrong-secret',
      },
    });

    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body.error).toBe('invalid_client');
    expect(body.error_description).toBe('Invalid client credentials');
  });

  test('refresh_token grant rotates refresh token and returns new tokens', async ({ request }) => {
    const passwordResponse = await request.post('/api/oauth/token', {
      data: {
        grant_type: 'password',
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
      },
    });

    expect(passwordResponse.status()).toBe(200);
    const passwordBody = await passwordResponse.json();
    expect(passwordBody.refresh_token).toBeTruthy();

    const refreshResponse = await request.post('/api/oauth/token', {
      data: {
        grant_type: 'refresh_token',
        refresh_token: passwordBody.refresh_token,
      },
    });

    expect(refreshResponse.status()).toBe(200);
    const refreshBody = await refreshResponse.json();

    expect(refreshBody.access_token).toBeTruthy();
    expect(refreshBody.refresh_token).toBeTruthy();
    expect(refreshBody.refresh_token).not.toBe(passwordBody.refresh_token);
    expect(refreshBody.token_type).toBe('Bearer');
    expect(refreshBody.expires_in).toBe(900);

    const retryResponse = await request.post('/api/oauth/token', {
      data: {
        grant_type: 'refresh_token',
        refresh_token: passwordBody.refresh_token,
      },
    });

    expect(retryResponse.status()).toBe(401);
    const retryBody = await retryResponse.json();
    expect(retryBody.error).toBe('invalid_grant');
  });

  test('refresh_token grant with unknown token returns invalid_grant', async ({ request }) => {
    const response = await request.post('/api/oauth/token', {
      data: {
        grant_type: 'refresh_token',
        refresh_token: 'nonexistent-token',
      },
    });

    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body.error).toBe('invalid_grant');
    expect(body.error_description).toBe('Invalid refresh token');
  });
});
