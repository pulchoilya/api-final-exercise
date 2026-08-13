import { expect, type APIResponse } from '@playwright/test';
import { assertValidSchema } from '../schemas/assertValidSchema';
import { tokenResponseSchema } from '../schemas/token.schema';
import { assertJsonContentType } from './shared';

export async function assertTokenResponse(response: APIResponse, expectedExpiresIn = 900) {
  expect.soft(response.status(), 'status code').toBe(200);
  assertJsonContentType(response);
  const body = await response.json();
  assertValidSchema(tokenResponseSchema, body);
  expect(body.expires_in).toBe(expectedExpiresIn);
  return body as {
    access_token: string;
    refresh_token?: string;
    token_type: string;
    expires_in: number;
    scope?: string;
  };
}
