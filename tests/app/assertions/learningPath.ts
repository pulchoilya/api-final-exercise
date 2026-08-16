import { expect, type APIResponse } from '@playwright/test';
import { assertValidSchema } from '../schemas/assertValidSchema';
import { learningPathSchema, type LearningPathResponse } from '../schemas/learningPath.schema';
import type { CreateLearningPathPayload } from '../api/LearningPathsApi';
import { assertJsonContentType } from './shared';

export async function assertLearningPathCreated(
  response: APIResponse,
  payload: CreateLearningPathPayload,
) {
  expect.soft(response.status(), 'status code').toBe(201);
  assertJsonContentType(response);
  const body = await response.json();
  assertValidSchema(learningPathSchema, body);
  expect(body.title).toBe(payload.title);
  expect(body.slug).toMatch(/^[a-z0-9-]+$/);
  expect(body.isPublished).toBe(false);
  expect(body.instructor.name).toBe(payload.instructor.name);
  return body as LearningPathResponse;
}

export function assertLearningPathModules(
  learningPath: LearningPathResponse,
  expectedTitles: string[],
) {
  expect(learningPath.modules.map((m) => m.title)).toEqual(expectedTitles);
  expect(learningPath.modules.map((m) => m.position)).toEqual(
    expectedTitles.map((_, index) => index),
  );
}

export function assertLearningPathHasVideo(
  learningPath: LearningPathResponse,
  expected: { title: string; videoId: string },
) {
  expect(learningPath.video?.title).toBe(expected.title);
  expect(learningPath.video?.videoId).toBe(expected.videoId);
  expect(learningPath.video?.isPublished).toBe(true);
}

export function assertLearningPathHasCertificate(
  learningPath: LearningPathResponse,
  expected: { name: string },
) {
  expect(learningPath.certificate?.name).toBe(expected.name);
}

export function assertLearningPathHasCategory(
  learningPath: LearningPathResponse,
  categoryId: string,
) {
  expect(learningPath.categories.some((category) => category.id === categoryId)).toBe(true);
}

export function assertLearningPathMinimal(learningPath: LearningPathResponse) {
  expect(learningPath.modules).toEqual([]);
  expect(learningPath.categories).toEqual([]);
  expect(learningPath.video).toBeNull();
  expect(learningPath.certificate).toBeNull();
}

export function assertLearningPathSlugDeduplicated(
  duplicate: LearningPathResponse,
  original: LearningPathResponse,
) {
  expect(duplicate.slug).not.toBe(original.slug);
  expect(duplicate.slug.startsWith(original.slug)).toBe(true);
}
