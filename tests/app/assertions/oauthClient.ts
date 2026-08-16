import { expect, type APIResponse } from '@playwright/test';
import { assertValidSchema } from '../schemas/assertValidSchema';
import {
  oauthClientsListSchema,
  oauthClientCreatedSchema,
  type OAuthClientCreated,
} from '../schemas/oauthClient.schema';
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
  return body as OAuthClientCreated;
}

// /userinfo returns a different shape for a client_credentials-granted token
// (no name/email/role — just sub + type) than assertCurrentUser's user-token
// shape in user.ts.
export async function assertClientUserInfo(response: APIResponse, clientId: string) {
  expect.soft(response.status(), 'status code').toBe(200);
  assertJsonContentType(response);
  const body = await response.json();
  expect(body.sub).toBe(clientId);
  expect(body.type).toBe('client');
}
