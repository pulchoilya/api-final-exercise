import { BaseApiClient } from './BaseApiClient';

export type CreateCoursePayload = {
  title: string;
};

export type UpdateCoursePayload = Partial<{
  title: string;
  description: string;
  imageUrl: string;
  price: number;
  categoryIds: string[];
  outcomes: string[];
  requirements: string[];
  authorName: string;
  authorRole: string;
}>;

export type ListCoursesParams = {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
};

type RequestOptions = { failOnStatusCode?: boolean };

function authHeaders(accessToken?: string) {
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined;
}

export class CoursesApi extends BaseApiClient {
  private coursesEndpoint = '/api/courses';

  async list(params?: ListCoursesParams, accessToken?: string, options?: RequestOptions) {
    return this.request.get(this.coursesEndpoint, {
      params,
      headers: authHeaders(accessToken),
      failOnStatusCode: options?.failOnStatusCode ?? false,
    });
  }

  async get(courseId: string, accessToken?: string, options?: RequestOptions) {
    return this.request.get(`${this.coursesEndpoint}/${courseId}`, {
      headers: authHeaders(accessToken),
      failOnStatusCode: options?.failOnStatusCode ?? false,
    });
  }

  async create(accessToken: string, payload: CreateCoursePayload, options?: RequestOptions) {
    return this.request.post(this.coursesEndpoint, {
      headers: authHeaders(accessToken),
      data: payload,
      failOnStatusCode: options?.failOnStatusCode ?? false,
    });
  }

  async update(
    accessToken: string,
    courseId: string,
    payload: UpdateCoursePayload,
    options?: RequestOptions,
  ) {
    return this.request.patch(`${this.coursesEndpoint}/${courseId}`, {
      headers: authHeaders(accessToken),
      data: payload,
      failOnStatusCode: options?.failOnStatusCode ?? false,
    });
  }

  async remove(accessToken: string, courseId: string, options?: RequestOptions) {
    return this.request.delete(`${this.coursesEndpoint}/${courseId}`, {
      headers: authHeaders(accessToken),
      failOnStatusCode: options?.failOnStatusCode ?? false,
    });
  }

  async publish(accessToken: string, courseId: string, options?: RequestOptions) {
    return this.request.patch(`${this.coursesEndpoint}/${courseId}/publish`, {
      headers: authHeaders(accessToken),
      failOnStatusCode: options?.failOnStatusCode ?? false,
    });
  }

  // Both require a real signed-in user (requireAuth), not admin specifically.
  async validatePromo(accessToken: string, courseId: string, code: string, options?: RequestOptions) {
    return this.request.post(`${this.coursesEndpoint}/${courseId}/validate-promo`, {
      headers: authHeaders(accessToken),
      data: { code },
      failOnStatusCode: options?.failOnStatusCode ?? false,
    });
  }

  async purchase(
    accessToken: string,
    courseId: string,
    promoCode?: string,
    options?: RequestOptions,
  ) {
    return this.request.post(`${this.coursesEndpoint}/${courseId}/purchase`, {
      headers: authHeaders(accessToken),
      data: promoCode ? { promoCode } : {},
      failOnStatusCode: options?.failOnStatusCode ?? false,
    });
  }
}
