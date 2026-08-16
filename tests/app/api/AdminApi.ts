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

  async deactivateUser(accessToken: string, userId: string, options?: RequestOptions) {
    return this.updateUser(accessToken, userId, { isActive: false }, options);
  }
}
