import { expect, type APIRequestContext } from '@playwright/test';

export const ADMIN_EMAIL = 'admin@dojo.api';
export const ADMIN_PASSWORD = 'Password1';

export async function login(
  request: APIRequestContext,
  email: string,
  password: string,
  scope?: string,
) {
  const response = await request.post('/api/oauth/token', {
    data: {
      grant_type: 'password',
      email,
      password,
      ...(scope ? { scope } : {}),
    },
  });

  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.access_token).toBeTruthy();

  return body;
}

export async function getAdminToken(request: APIRequestContext) {
  const body = await login(request, ADMIN_EMAIL, ADMIN_PASSWORD);
  return body.access_token as string;
}
