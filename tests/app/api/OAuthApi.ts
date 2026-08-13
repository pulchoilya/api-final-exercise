import { BaseApiClient } from './BaseApiClient';

export type PasswordGrantPayload = {
  grant_type: 'password';
  email: string;
  password: string;
  scope?: string;
};

export type RefreshTokenGrantPayload = {
  grant_type: 'refresh_token';
  refresh_token: string;
};

export type ClientCredentialsGrantPayload = {
  grant_type: 'client_credentials';
  client_id: string;
  client_secret: string;
  scope?: string;
};

export type TokenGrantPayload =
  | PasswordGrantPayload
  | RefreshTokenGrantPayload
  | ClientCredentialsGrantPayload;

export type OAuthClientPayload = {
  name: string;
  grants?: string[];
  scopes?: string[];
};

type RequestOptions = { failOnStatusCode?: boolean };

export class OAuthApi extends BaseApiClient {
  private tokenEndpoint = '/api/oauth/token';
  private revokeEndpoint = '/api/oauth/revoke';
  private userinfoEndpoint = '/api/oauth/userinfo';
  private clientsEndpoint = '/api/oauth/clients';

  async getToken(payload: TokenGrantPayload, options?: RequestOptions) {
    return this.request.post(this.tokenEndpoint, {
      data: payload,
      failOnStatusCode: options?.failOnStatusCode ?? false,
    });
  }

  async revokeToken(
    accessToken: string,
    refreshToken: string,
    options?: RequestOptions,
  ) {
    return this.request.post(this.revokeEndpoint, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { token: refreshToken },
      failOnStatusCode: options?.failOnStatusCode ?? false,
    });
  }

  async getUserInfo(accessToken?: string, options?: RequestOptions) {
    return this.request.get(this.userinfoEndpoint, {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
      failOnStatusCode: options?.failOnStatusCode ?? false,
    });
  }

  async listClients(accessToken: string, options?: RequestOptions) {
    return this.request.get(this.clientsEndpoint, {
      headers: { Authorization: `Bearer ${accessToken}` },
      failOnStatusCode: options?.failOnStatusCode ?? false,
    });
  }

  async registerClient(
    accessToken: string,
    payload: OAuthClientPayload,
    options?: RequestOptions,
  ) {
    return this.request.post(this.clientsEndpoint, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: payload,
      failOnStatusCode: options?.failOnStatusCode ?? false,
    });
  }

  async deactivateClient(
    accessToken: string,
    clientId: string,
    options?: RequestOptions,
  ) {
    return this.request.delete(`${this.clientsEndpoint}/${clientId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      failOnStatusCode: options?.failOnStatusCode ?? false,
    });
  }
}
