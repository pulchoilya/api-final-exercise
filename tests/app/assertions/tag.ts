import { expect, type APIResponse } from '@playwright/test';
import { assertValidSchema } from '../schemas/assertValidSchema';
import { tagSchema, tagsListSchema, type Tag } from '../schemas/tag.schema';
import type { CreateTagPayload } from '../api/TagsApi';
import { assertJsonContentType } from './shared';

export async function assertTagCreated(response: APIResponse, payload: CreateTagPayload) {
  expect.soft(response.status(), 'status code').toBe(201);
  assertJsonContentType(response);
  const body = await response.json();
  assertValidSchema(tagSchema, body);
  expect(body.name).toBe(payload.name);
  expect(body.slug).toMatch(/^[a-z0-9-]+$/);
  return body as Tag;
}

export async function assertTagDeleted(response: APIResponse) {
  expect.soft(response.status(), 'status code').toBe(200);
  assertJsonContentType(response);
  const body = await response.json();
  expect(body.success).toBe(true);
}

export async function assertTagsList(response: APIResponse) {
  expect.soft(response.status(), 'status code').toBe(200);
  assertJsonContentType(response);
  const body = await response.json();
  assertValidSchema(tagsListSchema, body);
  return body as Tag[];
}

export function assertTagsListContains(list: Tag[], expected: { id: string; name?: string }) {
  const entry = list.find((tag) => tag.id === expected.id);
  expect(entry, `tag ${expected.id} should appear in the list`).toBeTruthy();
  if (expected.name !== undefined) {
    expect(entry?.name).toBe(expected.name);
  }
}

export function assertTagsListExcludes(list: Tag[], tagId: string) {
  expect(list.some((tag) => tag.id === tagId)).toBe(false);
}
