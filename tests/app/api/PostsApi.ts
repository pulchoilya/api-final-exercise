import { BaseApiClient } from './BaseApiClient';

export type CreatePostPayload = {
  title: string;
  excerpt?: string;
  content?: string;
  imageUrl?: string;
  tagIds?: string[];
  isPublished?: boolean;
};

export type UpdatePostPayload = Partial<CreatePostPayload>;

type RequestOptions = { failOnStatusCode?: boolean };

function authHeaders(accessToken: string) {
  return { Authorization: `Bearer ${accessToken}` };
}

// GET /api/posts returns a raw array (no pagination envelope, unlike
// Courses), always scoped to isPublished:true — there is no way to ask for
// unpublished posts and no query params of any kind (no tag filter either).
export class PostsApi extends BaseApiClient {
  private postsEndpoint = '/api/posts';

  async list(options?: RequestOptions) {
    return this.request.get(this.postsEndpoint, {
      failOnStatusCode: options?.failOnStatusCode ?? false,
    });
  }

  async create(accessToken: string, payload: CreatePostPayload, options?: RequestOptions) {
    return this.request.post(this.postsEndpoint, {
      headers: authHeaders(accessToken),
      data: payload,
      failOnStatusCode: options?.failOnStatusCode ?? false,
    });
  }

  async update(
    accessToken: string,
    postId: string,
    payload: UpdatePostPayload,
    options?: RequestOptions,
  ) {
    return this.request.patch(`${this.postsEndpoint}/${postId}`, {
      headers: authHeaders(accessToken),
      data: payload,
      failOnStatusCode: options?.failOnStatusCode ?? false,
    });
  }

  async remove(accessToken: string, postId: string, options?: RequestOptions) {
    return this.request.delete(`${this.postsEndpoint}/${postId}`, {
      headers: authHeaders(accessToken),
      failOnStatusCode: options?.failOnStatusCode ?? false,
    });
  }
}
