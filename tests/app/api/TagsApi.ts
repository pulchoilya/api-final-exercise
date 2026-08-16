import { BaseApiClient } from './BaseApiClient';

export type CreateTagPayload = {
  name: string;
};

type RequestOptions = { failOnStatusCode?: boolean };

function authHeaders(accessToken: string) {
  return { Authorization: `Bearer ${accessToken}` };
}

// GET /api/tags returns a raw array (no pagination envelope, unlike Courses).
export class TagsApi extends BaseApiClient {
  private tagsEndpoint = '/api/tags';

  async list(options?: RequestOptions) {
    return this.request.get(this.tagsEndpoint, {
      failOnStatusCode: options?.failOnStatusCode ?? false,
    });
  }

  async create(accessToken: string, payload: CreateTagPayload, options?: RequestOptions) {
    return this.request.post(this.tagsEndpoint, {
      headers: authHeaders(accessToken),
      data: payload,
      failOnStatusCode: options?.failOnStatusCode ?? false,
    });
  }

  async remove(accessToken: string, tagId: string, options?: RequestOptions) {
    return this.request.delete(`${this.tagsEndpoint}/${tagId}`, {
      headers: authHeaders(accessToken),
      failOnStatusCode: options?.failOnStatusCode ?? false,
    });
  }
}
