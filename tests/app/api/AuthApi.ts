import { BaseApiClient } from './BaseApiClient';

export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
};

export class AuthApi extends BaseApiClient {
  private registerEndpoint = '/api/auth/register';

  async register(payload: RegisterPayload, options?: { failOnStatusCode?: boolean }) {
    return this.request.post(this.registerEndpoint, {
      data: payload,
      failOnStatusCode: options?.failOnStatusCode ?? false,
    });
  }
}
