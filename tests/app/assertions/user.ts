import { expect, type APIResponse } from '@playwright/test';
import { assertValidSchema } from '../schemas/assertValidSchema';
import { registeredUserSchema, currentUserSchema } from '../schemas/user.schema';
import type { RegisterPayload } from '../api/AuthApi';
import { assertJsonContentType } from './shared';

export async function assertRegisteredUser(response: APIResponse, payload: RegisterPayload) {
  expect.soft(response.status(), 'status code').toBe(201);
  assertJsonContentType(response);
  const body = await response.json();
  assertValidSchema(registeredUserSchema, body);
  expect(body.name).toBe(payload.name);
  expect(body.email).toBe(payload.email);
  expect(body.role).toBe('USER');
  return body as { id: string; name: string; email: string; role: string; createdAt: string };
}

export async function assertCurrentUser(response: APIResponse, payload: { email: string }) {
  expect.soft(response.status(), 'status code').toBe(200);
  assertJsonContentType(response);
  const body = await response.json();
  assertValidSchema(currentUserSchema, body);
  expect(body.email).toBe(payload.email);
  expect(body.role).toBe('USER');
  expect(body.isActive).toBe(true);
}

export async function assertAdminUserUpdated(
  response: APIResponse,
  expected: Partial<{ name: string; email: string; isActive: boolean }>,
) {
  expect.soft(response.status(), 'status code').toBe(200);
  assertJsonContentType(response);
  const body = await response.json();
  assertValidSchema(currentUserSchema, body);
  if (expected.name !== undefined) expect(body.name).toBe(expected.name);
  if (expected.email !== undefined) expect(body.email).toBe(expected.email);
  if (expected.isActive !== undefined) expect(body.isActive).toBe(expected.isActive);
  return body as { id: string; name: string; email: string; role: string; isActive: boolean; createdAt: string };
}
