import { test } from './fixtures';
import * as assertions from './assertions';
import * as testData from './testData';

test('register with a unique email creates a new user and returns its profile', async ({
  authApi,
  trackUserForCleanup,
}) => {
  const payload = testData.createRegisterPayload();

  const response = await test.step('register the user', () => authApi.register(payload));

  const user = await test.step('verify the created profile matches the request', () =>
    assertions.assertRegisteredUser(response, payload),
  );

  trackUserForCleanup(user.id);
});
