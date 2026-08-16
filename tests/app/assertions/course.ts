import { expect, type APIResponse } from '@playwright/test';
import { assertValidSchema } from '../schemas/assertValidSchema';
import { courseSchema, coursesListResponseSchema, type CourseResponse } from '../schemas/course.schema';
import type { CreateCoursePayload, UpdateCoursePayload } from '../api/CoursesApi';
import { assertJsonContentType } from './shared';

export async function assertCourseCreated(response: APIResponse, payload: CreateCoursePayload) {
  expect.soft(response.status(), 'status code').toBe(201);
  assertJsonContentType(response);
  const body = await response.json();
  assertValidSchema(courseSchema, body);
  expect(body.title).toBe(payload.title);
  expect(body.slug).toMatch(/^[a-z0-9-]+$/);
  expect(body.isPublished).toBe(false);
  expect(body.isListed).toBe(true);
  expect(body.isFeatured).toBe(false);
  expect(body.featuredOrder).toBe(0);
  return body as CourseResponse;
}

export async function assertCourseDetails(
  response: APIResponse,
  expected: { id: string; title: string; chapterTitles?: string[] },
) {
  expect.soft(response.status(), 'status code').toBe(200);
  assertJsonContentType(response);
  const body = await response.json();
  assertValidSchema(courseSchema, body);
  expect(body.id).toBe(expected.id);
  expect(body.title).toBe(expected.title);
  if (expected.chapterTitles !== undefined) {
    expect(body.chapters?.map((chapter: { title: string }) => chapter.title)).toEqual(
      expected.chapterTitles,
    );
  }
  return body as CourseResponse;
}

export async function assertCourseUpdated(response: APIResponse, payload: UpdateCoursePayload) {
  expect.soft(response.status(), 'status code').toBe(200);
  assertJsonContentType(response);
  const body = await response.json();
  assertValidSchema(courseSchema, body);
  if (payload.description !== undefined) expect(body.description).toBe(payload.description);
  if (payload.imageUrl !== undefined) expect(body.imageUrl).toBe(payload.imageUrl);
  if (payload.price !== undefined) expect(Number(body.price)).toBeCloseTo(payload.price, 2);
  if (payload.outcomes !== undefined)
    expect(JSON.parse(body.outcomes ?? '[]')).toEqual(payload.outcomes);
  if (payload.requirements !== undefined)
    expect(JSON.parse(body.requirements ?? '[]')).toEqual(payload.requirements);
  if (payload.authorName !== undefined) expect(body.authorName).toBe(payload.authorName);
  if (payload.authorRole !== undefined) expect(body.authorRole).toBe(payload.authorRole);
  return body as CourseResponse;
}

export async function assertCourseCategoryAssigned(response: APIResponse, categoryId: string) {
  expect.soft(response.status(), 'status code').toBe(200);
  assertJsonContentType(response);
  const body = await response.json();
  assertValidSchema(courseSchema, body);
  expect(body.categories?.some((category: { id: string }) => category.id === categoryId)).toBe(
    true,
  );
  return body as CourseResponse;
}

export async function assertCoursePublishState(response: APIResponse, expectedIsPublished: boolean) {
  expect.soft(response.status(), 'status code').toBe(200);
  assertJsonContentType(response);
  const body = await response.json();
  assertValidSchema(courseSchema, body);
  expect(body.isPublished).toBe(expectedIsPublished);
  return body as CourseResponse;
}

export async function assertCourseDeleted(response: APIResponse) {
  expect.soft(response.status(), 'status code').toBe(200);
  assertJsonContentType(response);
  const body = await response.json();
  expect(body.success).toBe(true);
}

export async function assertCourseNotFound(response: APIResponse) {
  expect(response.status(), 'status code').toBe(404);
}

type CoursesListBody = {
  data: Array<{ id: string; isPublished: boolean; categories: Array<{ slug: string }> }>;
  pagination: { page: number; limit: number; total: number; totalPages: number };
};

export async function assertCoursesList(response: APIResponse): Promise<CoursesListBody> {
  expect.soft(response.status(), 'status code').toBe(200);
  assertJsonContentType(response);
  const body = await response.json();
  assertValidSchema(coursesListResponseSchema, body);
  return body as CoursesListBody;
}

export function assertCourseListContains(
  list: CoursesListBody,
  expected: { id: string; isPublished?: boolean },
) {
  const entry = list.data.find((course) => course.id === expected.id);
  expect(entry, `course ${expected.id} should appear in the list`).toBeTruthy();
  if (expected.isPublished !== undefined) {
    expect(entry?.isPublished).toBe(expected.isPublished);
  }
}

export function assertCourseListExcludes(list: CoursesListBody, courseId: string) {
  expect(list.data.some((course) => course.id === courseId)).toBe(false);
}

export function assertAllCoursesPublished(list: CoursesListBody) {
  expect(list.data.length).toBeGreaterThan(0);
  expect(list.data.every((course) => course.isPublished)).toBe(true);
}

export function assertAllCoursesInCategory(list: CoursesListBody, categorySlug: string) {
  expect(list.data.length).toBeGreaterThan(0);
  for (const course of list.data) {
    expect(course.categories.some((category) => category.slug === categorySlug)).toBe(true);
  }
}
