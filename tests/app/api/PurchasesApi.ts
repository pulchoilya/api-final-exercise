import { BaseApiClient } from './BaseApiClient';

type RequestOptions = { failOnStatusCode?: boolean };

// GET /api/purchases — a signed-in user's own purchase history. Raw array,
// no pagination envelope, same as Tags/Posts.
export class PurchasesApi extends BaseApiClient {
  private purchasesEndpoint = '/api/purchases';

  async list(accessToken: string, options?: RequestOptions) {
    return this.request.get(this.purchasesEndpoint, {
      headers: { Authorization: `Bearer ${accessToken}` },
      failOnStatusCode: options?.failOnStatusCode ?? false,
    });
  }
}
