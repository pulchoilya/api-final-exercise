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

test(
  '[OAUTH-07] Password grant with the wrong password is rejected',
  { tag: ['@oauth'] },
  async ({ oauthApi }) => {
    const response = await test.step('request a token with an invalid password', () =>
      oauthApi.getToken({
        grant_type: 'password',
        email: testData.seedAdmin.email,
        password: 'WrongPassword1',
      }),
    );

    await test.step('verify it is rejected as invalid_grant', () =>
      assertions.assertTokenError(response, 401, 'invalid_grant', 'Invalid email or password'),
    );
  },
);

test(
  '[OAUTH-08] Password grant with a missing field is rejected',
  { tag: ['@oauth'] },
  async ({ oauthApi }) => {
    const response = await test.step('request a token without a password', () =>
      // @ts-expect-error deliberately omitting a required field
      oauthApi.getToken({
        grant_type: 'password',
        email: testData.seedAdmin.email,
      }),
    );

    await test.step('verify it is rejected as invalid_request', () =>
      assertions.assertTokenError(response, 400, 'invalid_request'),
    );
  },
);

test(
  '[OAUTH-09] Client_credentials grant issues an access token with no refresh token',
  { tag: ['@oauth'] },
  async ({ oauthApi, adminAccessToken, trackOAuthClientForCleanup }) => {
    const client = await test.step('register a client_credentials client', async () => {
      const payload = testData.createOAuthClientPayload();
      const response = await oauthApi.registerClient(adminAccessToken, payload);
      return assertions.assertOAuthClientCreated(response, payload);
    });
    trackOAuthClientForCleanup(client.clientId);

    const response = await test.step('request a token via client_credentials grant', () =>
      oauthApi.getToken({
        grant_type: 'client_credentials',
        client_id: client.clientId,
        client_secret: client.clientSecret,
      }),
    );

    await test.step('verify the token response has no refresh token', async () => {
      const body = await assertions.assertTokenResponse(response);
      expect(body.refresh_token).toBeUndefined();
    });
  },
);

test(
  '[OAUTH-10] Client_credentials grant with the wrong secret is rejected',
  { tag: ['@oauth'] },
  async ({ oauthApi, adminAccessToken, trackOAuthClientForCleanup }) => {
    const client = await test.step('register a client_credentials client', async () => {
      const payload = testData.createOAuthClientPayload();
      const response = await oauthApi.registerClient(adminAccessToken, payload);
      return assertions.assertOAuthClientCreated(response, payload);
    });
    trackOAuthClientForCleanup(client.clientId);

    const response = await test.step('request a token with the wrong client secret', () =>
      oauthApi.getToken({
        grant_type: 'client_credentials',
        client_id: client.clientId,
        client_secret: 'wrong-secret',
      }),
    );

    await test.step('verify it is rejected as invalid_client', () =>
      assertions.assertTokenError(response, 401, 'invalid_client', 'Invalid client credentials'),
    );
  },
);

test(
  '[OAUTH-11] Refreshing a token rotates the refresh token and invalidates the old one',
  { tag: ['@oauth'] },
  async ({ oauthApi, trackRefreshTokenForCleanup }) => {
    const original = await test.step('request a token via password grant', async () => {
      const response = await oauthApi.getToken({
        grant_type: 'password',
        email: testData.seedAdmin.email,
        password: testData.seedAdmin.password,
      });
      return assertions.assertTokenResponse(response);
    });

    const rotated = await test.step('exchange the refresh token for a new pair', async () => {
      const response = await oauthApi.getToken({
        grant_type: 'refresh_token',
        refresh_token: original.refresh_token!,
      });
      return assertions.assertTokenResponse(response);
    });
    trackRefreshTokenForCleanup(rotated.refresh_token!);

    await test.step('verify the refresh token actually rotated', () => {
      expect(rotated.refresh_token).not.toBe(original.refresh_token);
    });

    const reuseResponse = await test.step('verify the old refresh token is now rejected', () =>
      oauthApi.getToken({
        grant_type: 'refresh_token',
        refresh_token: original.refresh_token!,
      }),
    );
    await assertions.assertTokenError(reuseResponse, 401, 'invalid_grant');
  },
);

test(
  '[OAUTH-12] Refreshing with an unknown token is rejected',
  { tag: ['@oauth'] },
  async ({ oauthApi }) => {
    const response = await test.step('request a token with an unknown refresh token', () =>
      oauthApi.getToken({
        grant_type: 'refresh_token',
        refresh_token: 'nonexistent-token',
      }),
    );

    await test.step('verify it is rejected as invalid_grant', () =>
      assertions.assertTokenError(response, 401, 'invalid_grant', 'Invalid refresh token'),
    );
  },
);

test(
  "[OAUTH-13] A client_credentials token's userinfo reflects the client, not a user",
  { tag: ['@oauth'] },
  async ({ oauthApi, adminAccessToken, trackOAuthClientForCleanup }) => {
    const client = await test.step('register a client_credentials client', async () => {
      const payload = testData.createOAuthClientPayload();
      const response = await oauthApi.registerClient(adminAccessToken, payload);
      return assertions.assertOAuthClientCreated(response, payload);
    });
    trackOAuthClientForCleanup(client.clientId);

    const accessToken = await test.step('request a token via client_credentials grant', async () => {
      const response = await oauthApi.getToken({
        grant_type: 'client_credentials',
        client_id: client.clientId,
        client_secret: client.clientSecret,
      });
      const body = await assertions.assertTokenResponse(response);
      return body.access_token;
    });

    const response = await test.step('fetch userinfo with the client token', () =>
      oauthApi.getUserInfo(accessToken),
    );

    await test.step('verify userinfo reflects the client, not a user', () =>
      assertions.assertClientUserInfo(response, client.clientId),
    );
  },
);
