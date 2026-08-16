import { expect, type APIResponse } from '@playwright/test';
import { assertValidSchema } from '../schemas/assertValidSchema';
import {
  promoCodeSchema,
  promoCodesListSchema,
  validPromoResultSchema,
  invalidPromoResultSchema,
  type PromoCode,
  type PromoCodeWithUsageCount,
  type ValidPromoResult,
} from '../schemas/promoCode.schema';
import type { CreatePromoCodePayload } from '../api/PromoCodesApi';
import { assertJsonContentType } from './shared';

export async function assertPromoCodeCreated(
  response: APIResponse,
  payload: CreatePromoCodePayload,
) {
  expect.soft(response.status(), 'status code').toBe(201);
  assertJsonContentType(response);
  const body = await response.json();
  assertValidSchema(promoCodeSchema, body);
  expect(body.code).toBe(payload.code);
  expect(body.discountPercent).toBe(payload.discountPercent);
  expect(body.isActive).toBe(true);
  expect(body.currentUses).toBe(0);
  return body as PromoCode;
}

export async function assertPromoCodesList(response: APIResponse) {
  expect.soft(response.status(), 'status code').toBe(200);
  assertJsonContentType(response);
  const body = await response.json();
  assertValidSchema(promoCodesListSchema, body);
  return body as PromoCodeWithUsageCount[];
}

export function assertPromoCodesListContains(
  list: PromoCodeWithUsageCount[],
  expected: { id: string },
) {
  expect(list.some((promoCode) => promoCode.id === expected.id)).toBe(true);
}

export function assertPromoCodesListExcludes(list: PromoCodeWithUsageCount[], promoCodeId: string) {
  expect(list.some((promoCode) => promoCode.id === promoCodeId)).toBe(false);
}

export async function assertPromoCodeToggled(response: APIResponse, expectedIsActive: boolean) {
  expect.soft(response.status(), 'status code').toBe(200);
  assertJsonContentType(response);
  const body = await response.json();
  assertValidSchema(promoCodeSchema, body);
  expect(body.isActive).toBe(expectedIsActive);
  return body as PromoCode;
}

export async function assertPromoCodeDeleted(response: APIResponse) {
  expect.soft(response.status(), 'status code').toBe(200);
  assertJsonContentType(response);
  const body = await response.json();
  expect(body.success).toBe(true);
}

export async function assertPromoValid(
  response: APIResponse,
  expected: { discountPercent: number; originalPrice: number; finalPrice: number },
) {
  expect.soft(response.status(), 'status code').toBe(200);
  assertJsonContentType(response);
  const body = await response.json();
  assertValidSchema(validPromoResultSchema, body);
  expect(body.discountPercent).toBe(expected.discountPercent);
  expect(body.originalPrice).toBe(expected.originalPrice);
  expect(body.finalPrice).toBe(expected.finalPrice);
  return body as ValidPromoResult;
}

export async function assertPromoInvalid(
  response: APIResponse,
  expectedStatus: number,
  expectedError: string,
) {
  expect.soft(response.status(), 'status code').toBe(expectedStatus);
  assertJsonContentType(response);
  const body = await response.json();
  assertValidSchema(invalidPromoResultSchema, body);
  expect(body.error).toBe(expectedError);
}
