import { BaseApiClient } from './BaseApiClient';

export type CreateChapterPayload = {
  title: string;
};

export type UpdateChapterPayload = Partial<{
  title: string;
  description: string;
  videoUrl: string;
  timecodes: string;
  notes: string;
  homework: string;
  isPublished: boolean;
  isFree: boolean;
  position: number;
}>;

export type ReorderChapterEntry = {
  id: string;
  position: number;
};

type RequestOptions = { failOnStatusCode?: boolean };

export class ChaptersApi extends BaseApiClient {
  private chaptersPath(courseId: string) {
    return `/api/courses/${courseId}/chapters`;
  }

  async create(
    accessToken: string,
    courseId: string,
    payload: CreateChapterPayload,
    options?: RequestOptions,
  ) {
    return this.request.post(this.chaptersPath(courseId), {
      headers: this.authHeaders(accessToken),
      data: payload,
      failOnStatusCode: options?.failOnStatusCode ?? false,
    });
  }

  async update(
    accessToken: string,
    courseId: string,
    chapterId: string,
    payload: UpdateChapterPayload,
    options?: RequestOptions,
  ) {
    return this.request.patch(`${this.chaptersPath(courseId)}/${chapterId}`, {
      headers: this.authHeaders(accessToken),
      data: payload,
      failOnStatusCode: options?.failOnStatusCode ?? false,
    });
  }

  async remove(
    accessToken: string,
    courseId: string,
    chapterId: string,
    options?: RequestOptions,
  ) {
    return this.request.delete(`${this.chaptersPath(courseId)}/${chapterId}`, {
      headers: this.authHeaders(accessToken),
      failOnStatusCode: options?.failOnStatusCode ?? false,
    });
  }

  async reorder(
    accessToken: string,
    courseId: string,
    list: ReorderChapterEntry[],
    options?: RequestOptions,
  ) {
    return this.request.put(this.chaptersPath(courseId), {
      headers: this.authHeaders(accessToken),
      data: { list },
      failOnStatusCode: options?.failOnStatusCode ?? false,
    });
  }
}
