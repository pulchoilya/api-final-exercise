import type { APIRequestContext } from '@playwright/test';

export class BaseApiClient {
  constructor(protected readonly request: APIRequestContext) {}
}
