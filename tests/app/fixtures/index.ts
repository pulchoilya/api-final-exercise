import { test as base } from '@playwright/test';
import { AuthApi } from '../api/AuthApi';
import { OAuthApi } from '../api/OAuthApi';
import { AdminApi } from '../api/AdminApi';
import { seedAdmin } from '../testData/seedUsers';
import { assertStatus } from '../assertions';

type AppFixtures = {
  authApi: AuthApi;
  oauthApi: OAuthApi;
  adminApi: AdminApi;
  adminAccessToken: string;
  trackUserForCleanup: (userId: string) => void;
  trackRefreshTokenForCleanup: (refreshToken: string) => void;
  trackOAuthClientForCleanup: (clientId: string) => void;
};

export const test = base.extend<AppFixtures>({
  authApi: async ({ request }, use) => {
    await use(new AuthApi(request));
  },

  oauthApi: async ({ request }, use) => {
    await use(new OAuthApi(request));
  },

  adminApi: async ({ request }, use) => {
    await use(new AdminApi(request));
  },

  adminAccessToken: async ({ oauthApi }, use) => {
    const response = await oauthApi.getToken({
      grant_type: 'password',
      email: seedAdmin.email,
      password: seedAdmin.password,
    });

    assertStatus(response, 200);
    const body = await response.json();
    await use(body.access_token as string);
  },

  // Auto-fixture cleanup queues: a test calls track*ForCleanup(id) as soon as it
  // creates something, and teardown below still runs even if a later assertion
  // in the test throws (unlike cleanup written at the end of the test body).

  trackUserForCleanup: async ({ adminApi, adminAccessToken }, use) => {
    const userIds: string[] = [];
    await use((userId) => {
      userIds.push(userId);
    });
    for (const userId of userIds) {
      const response = await adminApi.deactivateUser(adminAccessToken, userId);
      assertStatus(response, 200);
    }
  },

  trackRefreshTokenForCleanup: async ({ oauthApi, adminAccessToken }, use) => {
    const refreshTokens: string[] = [];
    await use((refreshToken) => {
      refreshTokens.push(refreshToken);
    });
    for (const refreshToken of refreshTokens) {
      // Any authenticated token can revoke — the route has no ownership check.
      const response = await oauthApi.revokeToken(adminAccessToken, refreshToken);
      assertStatus(response, 200);
    }
  },

  trackOAuthClientForCleanup: async ({ oauthApi, adminAccessToken }, use) => {
    const clientIds: string[] = [];
    await use((clientId) => {
      clientIds.push(clientId);
    });
    for (const clientId of clientIds) {
      const response = await oauthApi.deactivateClient(adminAccessToken, clientId);
      assertStatus(response, 200);
    }
  },
});

export { expect } from '@playwright/test';
