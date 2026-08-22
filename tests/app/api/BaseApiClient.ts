import type { APIRequestContext } from '@playwright/test';

export class BaseApiClient {
  constructor(protected readonly request: APIRequestContext) {}

  protected authHeaders(accessToken?: string) {
    return accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined;
  }
}
