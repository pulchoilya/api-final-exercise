import { expect, type APIResponse } from '@playwright/test';

export function assertJsonContentType(response: APIResponse) {
  expect
    .soft(response.headers()['content-type'], 'content-type header')
    .toContain('application/json');
}

export function assertStatus(response: APIResponse, expectedStatus: number) {
  expect(response.status(), 'status code').toBe(expectedStatus);
}

export async function assertSuccessResponse(response: APIResponse, expectedStatus: number) {
  expect.soft(response.status(), 'status code').toBe(expectedStatus);
  assertJsonContentType(response);
  const body = await response.json();
  expect(body.success).toBe(true);
}
