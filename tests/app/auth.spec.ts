import { test } from './fixtures';
import * as assertions from './assertions';
import * as testData from './testData';

test(
  '[AUTH-01] Registering with a unique email creates a new user',
  { tag: ['@auth', '@smoke'] },
  async ({ authApi, trackUserForCleanup }) => {
    const payload = testData.createRegisterPayload();

    const response = await test.step('register the user', () => authApi.register(payload));

    const user = await test.step('verify the created profile matches the request', () =>
      assertions.assertRegisteredUser(response, payload),
    );

    trackUserForCleanup(user.id);
  },
);
