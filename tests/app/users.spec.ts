import { test } from './fixtures';
import * as assertions from './assertions';
import * as testData from './testData';

// Positive/happy-path coverage only, same rule as the other suites.
//
// Note: there is no self-service "update my own profile" endpoint in this
// API (no /api/users/me or equivalent) — the instructor's "update user
// data" item is tested here against the only route that updates a user's
// data at all, PATCH /api/admin/users/{userId}. That route is admin-only
// and has no self/other ownership check (any admin can update any user by
// id) — a materially different feature from self-service, tested as-is per
// an explicit decision with the user.

test(
  "[USERS-01] Admin updates a user's name and email",
  { tag: ['@users', '@smoke'] },
  async ({ authApi, adminApi, adminAccessToken, trackUserForCleanup }) => {
    const user = await test.step('register a throwaway user', async () => {
      const payload = testData.createRegisterPayload();
      const response = await authApi.register(payload);
      return assertions.assertRegisteredUser(response, payload);
    });
    trackUserForCleanup(user.id);

    const { name, email } = testData.createRegisterPayload();

    const response = await test.step("update the user's name and email", () =>
      adminApi.updateUser(adminAccessToken, user.id, { name, email }),
    );

    await test.step('verify the response reflects the new values', () =>
      assertions.assertAdminUserUpdated(response, { name, email }),
    );
  },
);

test(
  "[USERS-02] Admin deactivates a user's account",
  { tag: ['@users'] },
  async ({ authApi, adminApi, adminAccessToken, trackUserForCleanup }) => {
    const user = await test.step('register a throwaway user', async () => {
      const payload = testData.createRegisterPayload();
      const response = await authApi.register(payload);
      return assertions.assertRegisteredUser(response, payload);
    });
    trackUserForCleanup(user.id);

    const response = await test.step('deactivate the user', () =>
      adminApi.deactivateUser(adminAccessToken, user.id),
    );

    await test.step('verify the account is now inactive', () =>
      assertions.assertAdminUserUpdated(response, { isActive: false }),
    );
  },
);
