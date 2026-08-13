import { expect } from '@playwright/test';
import type { z } from 'zod';

export function assertValidSchema<T extends z.ZodTypeAny>(schema: T, data: unknown) {
  const result = schema.safeParse(data);
  expect(result.success, { message: result.error?.message ?? '' }).toBeTruthy();
}
