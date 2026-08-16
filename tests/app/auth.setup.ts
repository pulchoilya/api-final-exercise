import { test as setup } from '@playwright/test';
import { OAuthApi } from './api/OAuthApi';
import { seedAdmin } from './testData/seedUsers';
import { writeCachedAdminToken } from '../support/adminTokenCache';

setup('authenticate as the seeded admin and cache the token to a file', async ({ request }) => {
  const oauthApi = new OAuthApi(request);

  const response = await oauthApi.getToken({
    grant_type: 'password',
    email: seedAdmin.email,
    password: seedAdmin.password,
  });

  const body = await response.json();
  writeCachedAdminToken(body.access_token, body.expires_in);
});
