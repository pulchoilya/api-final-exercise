import { expect, type APIResponse } from '@playwright/test';
import { assertValidSchema } from '../schemas/assertValidSchema';
import { oauthClientsListSchema, oauthClientCreatedSchema } from '../schemas/oauthClient.schema';
import type { OAuthClientPayload } from '../api/OAuthApi';
import { assertJsonContentType } from './shared';

export async function assertOAuthClientsList(response: APIResponse) {
  expect.soft(response.status(), 'status code').toBe(200);
  assertJsonContentType(response);
  const body = await response.json();
  assertValidSchema(oauthClientsListSchema, body);
  return body as Array<{ clientId: string }>;
}

export async function assertOAuthClientCreated(
  response: APIResponse,
  payload: OAuthClientPayload,
) {
  expect.soft(response.status(), 'status code').toBe(201);
  assertJsonContentType(response);
  const body = await response.json();
  assertValidSchema(oauthClientCreatedSchema, body);
  expect(body.name).toBe(payload.name);
  return body as { clientId: string };
}
