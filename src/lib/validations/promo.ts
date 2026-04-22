import { z } from 'zod';

export const createPromoCodeSchema = z.object({
  code: z
    .string()
    .min(3, 'Code must be at least 3 characters')
    .max(20, 'Code must be at most 20 characters')
    .regex(
      /^[A-Z0-9-]+$/,
      'Code may only contain uppercase letters, digits, and hyphens',
    )
    .transform((val) => val.toUpperCase()),
  discountPercent: z.coerce
    .number()
    .int()
    .min(1, 'Discount must be at least 1%')
    .max(100, 'Discount cannot exceed 100%'),
  maxUses: z.coerce.number().int().positive().nullable().optional(),
  expiresAt: z.coerce.date().refine((date) => date > new Date(), {
    message: 'Expiration date must be in the future',
  }),
});

export const applyPromoCodeSchema = z.object({
  code: z
    .string()
    .min(1, 'Enter a promo code')
    .transform((val) => val.toUpperCase()),
});

export type CreatePromoCodeInput = z.infer<typeof createPromoCodeSchema>;
export type ApplyPromoCodeInput = z.infer<typeof applyPromoCodeSchema>;
