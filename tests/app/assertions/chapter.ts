import { expect, type APIResponse } from '@playwright/test';
import { assertValidSchema } from '../schemas/assertValidSchema';
import { chapterSchema, type Chapter } from '../schemas/course.schema';
import type { CreateChapterPayload, UpdateChapterPayload } from '../api/ChaptersApi';
import { assertJsonContentType } from './shared';

export async function assertChapterCreated(
  response: APIResponse,
  payload: CreateChapterPayload,
  expected: { courseId: string; position: number },
) {
  expect.soft(response.status(), 'status code').toBe(201);
  assertJsonContentType(response);
  const body = await response.json();
  assertValidSchema(chapterSchema, body);
  expect(body.title).toBe(payload.title);
  expect(body.courseId).toBe(expected.courseId);
  expect(body.position).toBe(expected.position);
  expect(body.isPublished).toBe(false);
  expect(body.isFree).toBe(false);
  return body as Chapter;
}

export async function assertChapterUpdated(response: APIResponse, payload: UpdateChapterPayload) {
  expect.soft(response.status(), 'status code').toBe(200);
  assertJsonContentType(response);
  const body = await response.json();
  assertValidSchema(chapterSchema, body);
  if (payload.title !== undefined) expect(body.title).toBe(payload.title);
  if (payload.description !== undefined) expect(body.description).toBe(payload.description);
  if (payload.videoUrl !== undefined) expect(body.videoUrl).toBe(payload.videoUrl);
  if (payload.timecodes !== undefined) expect(body.timecodes).toBe(payload.timecodes);
  if (payload.notes !== undefined) expect(body.notes).toBe(payload.notes);
  if (payload.homework !== undefined) expect(body.homework).toBe(payload.homework);
  if (payload.isPublished !== undefined) expect(body.isPublished).toBe(payload.isPublished);
  if (payload.isFree !== undefined) expect(body.isFree).toBe(payload.isFree);
  if (payload.position !== undefined) expect(body.position).toBe(payload.position);
  return body as Chapter;
}

export async function assertChapterDeleted(response: APIResponse) {
  expect.soft(response.status(), 'status code').toBe(200);
  assertJsonContentType(response);
  const body = await response.json();
  expect(body.success).toBe(true);
}

export async function assertChaptersReordered(response: APIResponse) {
  expect.soft(response.status(), 'status code').toBe(200);
  assertJsonContentType(response);
  const body = await response.json();
  expect(body.success).toBe(true);
}
