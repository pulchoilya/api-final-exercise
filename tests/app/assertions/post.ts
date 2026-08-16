import { expect, type APIResponse } from '@playwright/test';
import { assertValidSchema } from '../schemas/assertValidSchema';
import { postSchema, postsListSchema, type PostResponse } from '../schemas/post.schema';
import type { CreatePostPayload, UpdatePostPayload } from '../api/PostsApi';
import { assertJsonContentType } from './shared';

export async function assertPostCreated(response: APIResponse, payload: CreatePostPayload) {
  expect.soft(response.status(), 'status code').toBe(201);
  assertJsonContentType(response);
  const body = await response.json();
  assertValidSchema(postSchema, body);
  expect(body.title).toBe(payload.title);
  expect(body.slug).toMatch(/^[a-z0-9-]+$/);
  expect(body.isPublished).toBe(payload.isPublished ?? false);
  if (payload.isPublished) {
    expect(body.publishedAt).not.toBeNull();
  } else {
    expect(body.publishedAt).toBeNull();
  }
  if (payload.tagIds !== undefined) {
    expect(body.tags.map((tag: { id: string }) => tag.id).sort()).toEqual(
      [...payload.tagIds].sort(),
    );
  }
  return body as PostResponse;
}

export async function assertPostUpdated(response: APIResponse, payload: UpdatePostPayload) {
  expect.soft(response.status(), 'status code').toBe(200);
  assertJsonContentType(response);
  const body = await response.json();
  assertValidSchema(postSchema, body);
  if (payload.title !== undefined) expect(body.title).toBe(payload.title);
  if (payload.excerpt !== undefined) expect(body.excerpt).toBe(payload.excerpt);
  if (payload.content !== undefined) expect(body.content).toBe(payload.content);
  if (payload.imageUrl !== undefined) expect(body.imageUrl).toBe(payload.imageUrl);
  if (payload.tagIds !== undefined) {
    expect(body.tags.map((tag: { id: string }) => tag.id).sort()).toEqual(
      [...payload.tagIds].sort(),
    );
  }
  return body as PostResponse;
}

export async function assertPostDeleted(response: APIResponse) {
  expect.soft(response.status(), 'status code').toBe(200);
  assertJsonContentType(response);
  const body = await response.json();
  expect(body.success).toBe(true);
}

export async function assertPostsList(response: APIResponse) {
  expect.soft(response.status(), 'status code').toBe(200);
  assertJsonContentType(response);
  const body = await response.json();
  assertValidSchema(postsListSchema, body);
  return body as PostResponse[];
}

export function assertPostsListContains(list: PostResponse[], expected: { id: string }) {
  expect(list.some((post) => post.id === expected.id)).toBe(true);
}

export function assertPostsListExcludes(list: PostResponse[], postId: string) {
  expect(list.some((post) => post.id === postId)).toBe(false);
}

export function assertAllPostsPublished(list: PostResponse[]) {
  expect(list.every((post) => post.isPublished)).toBe(true);
}
