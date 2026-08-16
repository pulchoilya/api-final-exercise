import { BaseApiClient } from './BaseApiClient';

export type CreateLearningPathPayload = {
  title: string;
  description?: string;
  modules?: Array<{ title: string; description?: string; position?: number }>;
  categoryIds?: string[];
  video?: { title: string; videoId: string };
  certificate?: { name: string; description?: string; templateUrl?: string };
  instructor: { name: string; bio?: string; avatarUrl?: string };
};

type RequestOptions = { failOnStatusCode?: boolean };

// Only POST exists for this resource — no list, get-by-id, update, or
// delete endpoint at all (despite the feature being described as "CRUD" in
// its introducing commit).
export class LearningPathsApi extends BaseApiClient {
  private learningPathsEndpoint = '/api/learning-paths';

  async create(
    accessToken: string,
    payload: CreateLearningPathPayload,
    options?: RequestOptions,
  ) {
    return this.request.post(this.learningPathsEndpoint, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: payload,
      failOnStatusCode: options?.failOnStatusCode ?? false,
    });
  }
}
