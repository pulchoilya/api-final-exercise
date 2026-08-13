import { BaseApiClient } from './BaseApiClient';

export type UpdateUserPayload = Partial<{
  name: string;
  email: string;
  isActive: boolean;
}>;

type RequestOptions = { failOnStatusCode?: boolean };

export class AdminApi extends BaseApiClient {
  private usersEndpoint = '/api/admin/users';

  async updateUser(
    accessToken: string,
    userId: string,
    payload: UpdateUserPayload,
    options?: RequestOptions,
  ) {
    return this.request.patch(`${this.usersEndpoint}/${userId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: payload,
      failOnStatusCode: options?.failOnStatusCode ?? false,
    });
  }

  // The API has no hard-delete for a user — deactivating is the closest thing
  // to cleanup available for a throwaway test account.
  async deactivateUser(accessToken: string, userId: string, options?: RequestOptions) {
    return this.updateUser(accessToken, userId, { isActive: false }, options);
  }
}
