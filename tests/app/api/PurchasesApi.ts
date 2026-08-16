import { BaseApiClient } from './BaseApiClient';

type RequestOptions = { failOnStatusCode?: boolean };

export class PurchasesApi extends BaseApiClient {
  private purchasesEndpoint = '/api/purchases';

  async list(accessToken: string, options?: RequestOptions) {
    return this.request.get(this.purchasesEndpoint, {
      headers: { Authorization: `Bearer ${accessToken}` },
      failOnStatusCode: options?.failOnStatusCode ?? false,
    });
  }
}
