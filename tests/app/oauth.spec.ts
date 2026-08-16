import { test, expect } from './fixtures';
import * as assertions from './assertions';
import * as testData from './testData';

test(
  '[OAUTH-01] Password grant issues a bearer access token',
  { tag: ['@oauth', '@smoke'] },
  async ({ oauthApi, trackRefreshTokenForCleanup }) => {
    const response = await test.step('request a token via password grant', () =>
      oauthApi.getToken({
        grant_type: 'password',
        email: testData.seedAdmin.email,
        password: testData.seedAdmin.password,
      }),
    );

    const body = await test.step('verify the token response', () =>
      assertions.assertTokenResponse(response),
    );

    if (body.refresh_token) trackRefreshTokenForCleanup(body.refresh_token);
  },
);

test(
  '[OAUTH-02] Revoking a refresh token invalidates it',
  { tag: ['@oauth'] },
  async ({ oauthApi }) => {
    const { access_token, refresh_token } = await test.step(
      'issue a token to revoke',
      async () => {
        const response = await oauthApi.getToken({
          grant_type: 'password',
          email: testData.seedAdmin.email,
          password: testData.seedAdmin.password,
        });
        assertions.assertStatus(response, 200);
        return response.json();
      },
    );

    const response = await test.step('revoke the refresh token', () =>
      oauthApi.revokeToken(access_token, refresh_token),
    );

    await test.step('verify the revocation succeeded', () =>
      assertions.assertSuccessResponse(response, 200),
    );

    await test.step('verify the revoked refresh token can no longer be exchanged', async () => {
      const reuseResponse = await oauthApi.getToken({
        grant_type: 'refresh_token',
        refresh_token,
      });
      assertions.assertStatus(reuseResponse, 401);
    });
  },
);

test(
  '[OAUTH-03] Current-user lookup returns the matching profile',
  { tag: ['@oauth'] },
  async ({ authApi, oauthApi, trackUserForCleanup, trackRefreshTokenForCleanup }) => {
    const payload = testData.createRegisterPayload();

    const { access_token, refresh_token, userId } = await test.step(
      'register and log in a new user',
      async () => {
        const registerResponse = await authApi.register(payload);
        assertions.assertStatus(registerResponse, 201);
        const { id } = await registerResponse.json();

        const tokenResponse = await oauthApi.getToken({
          grant_type: 'password',
          email: payload.email,
          password: payload.password,
        });
        assertions.assertStatus(tokenResponse, 200);
        const { access_token, refresh_token } = await tokenResponse.json();

        return { access_token, refresh_token, userId: id };
      },
    );

    trackUserForCleanup(userId);
    if (refresh_token) trackRefreshTokenForCleanup(refresh_token);

    const response = await test.step('fetch the current user', () =>
      oauthApi.getUserInfo(access_token),
    );

    await test.step('verify the profile', () => assertions.assertCurrentUser(response, payload));
  },
);

test(
  '[OAUTH-04] Admin can list registered OAuth2 clients',
  { tag: ['@oauth'] },
  async ({ oauthApi, adminAccessToken }) => {
    const response = await test.step('list clients', () => oauthApi.listClients(adminAccessToken));

    await test.step('verify the list shape', () => assertions.assertOAuthClientsList(response));
  },
);

test(
  '[OAUTH-05] Admin can register a new OAuth2 client',
  { tag: ['@oauth'] },
  async ({ oauthApi, adminAccessToken, trackOAuthClientForCleanup }) => {
    const payload = testData.createOAuthClientPayload();

    const response = await test.step('register the client', () =>
      oauthApi.registerClient(adminAccessToken, payload),
    );

    const client = await test.step('verify the created client', () =>
      assertions.assertOAuthClientCreated(response, payload),
    );

    trackOAuthClientForCleanup(client.clientId);
  },
);

test(
  '[OAUTH-06] Admin can deactivate an OAuth2 client',
  { tag: ['@oauth'] },
  async ({ oauthApi, adminAccessToken }) => {
    const { clientId } = await test.step('register a client to deactivate', async () => {
      const response = await oauthApi.registerClient(
        adminAccessToken,
        testData.createOAuthClientPayload(),
      );
      assertions.assertStatus(response, 201);
      return response.json();
    });

    const response = await test.step('deactivate the client', () =>
      oauthApi.deactivateClient(adminAccessToken, clientId),
    );

    await test.step('verify the deactivation succeeded', () =>
      assertions.assertSuccessResponse(response, 200),
    );

    await test.step('verify it no longer appears in the active clients list', async () => {
      const listResponse = await oauthApi.listClients(adminAccessToken);
      const clients = await assertions.assertOAuthClientsList(listResponse);
      expect(clients.some((c) => c.clientId === clientId)).toBe(false);
    });
  },
);
