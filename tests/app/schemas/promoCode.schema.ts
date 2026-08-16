import { z } from 'zod';

export const promoCodeSchema = z.object({
  id: z.string(),
  code: z.string(),
  courseId: z.string(),
  discountPercent: z.number(),
  maxUses: z.number().nullable(),
  currentUses: z.number(),
  expiresAt: z.string(),
  isActive: z.boolean(),
  createdAt: z.string(),
});
export type PromoCode = z.infer<typeof promoCodeSchema>;

export const promoCodeWithUsageCountSchema = promoCodeSchema.extend({
  _count: z.object({ usages: z.number() }),
});
export type PromoCodeWithUsageCount = z.infer<typeof promoCodeWithUsageCountSchema>;

export const promoCodesListSchema = z.array(promoCodeWithUsageCountSchema);

export const validPromoResultSchema = z.object({
  valid: z.literal(true),
  discountPercent: z.number(),
  originalPrice: z.number(),
  finalPrice: z.number(),
});
export type ValidPromoResult = z.infer<typeof validPromoResultSchema>;

export const invalidPromoResultSchema = z.object({
  valid: z.literal(false),
  error: z.string(),
});
export type InvalidPromoResult = z.infer<typeof invalidPromoResultSchema>;

export const promoValidationResultSchema = z.union([
  validPromoResultSchema,
  invalidPromoResultSchema,
]);
