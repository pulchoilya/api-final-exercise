import { expect, type APIResponse } from '@playwright/test';
import { assertValidSchema } from '../schemas/assertValidSchema';
import {
  purchaseSchema,
  purchasesListSchema,
  type Purchase,
  type PurchaseWithCourse,
} from '../schemas/purchase.schema';
import { assertJsonContentType } from './shared';

export async function assertPurchaseCreated(
  response: APIResponse,
  expected: { courseId: string; promoCode?: string | null; amountCloseTo?: number },
) {
  expect.soft(response.status(), 'status code').toBe(201);
  assertJsonContentType(response);
  const body = await response.json();
  assertValidSchema(purchaseSchema, body);
  expect(body.courseId).toBe(expected.courseId);
  if (expected.promoCode !== undefined) expect(body.promoCode).toBe(expected.promoCode);
  if (expected.amountCloseTo !== undefined) {
    expect(Number(body.amount)).toBeCloseTo(expected.amountCloseTo, 2);
  }
  return body as Purchase;
}

export async function assertPurchasesList(response: APIResponse) {
  expect.soft(response.status(), 'status code').toBe(200);
  assertJsonContentType(response);
  const body = await response.json();
  assertValidSchema(purchasesListSchema, body);
  return body as PurchaseWithCourse[];
}

export function assertPurchasesListContains(
  list: PurchaseWithCourse[],
  expected: { courseId: string },
) {
  expect(list.some((purchase) => purchase.courseId === expected.courseId)).toBe(true);
}
