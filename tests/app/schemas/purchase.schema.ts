import { z } from 'zod';

// amount is a Prisma Decimal, which serializes to a string (e.g. "29.99"),
// same as Course.price.
export const purchaseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  courseId: z.string(),
  amount: z.string(),
  promoCode: z.string().nullable(),
  createdAt: z.string(),
});
export type Purchase = z.infer<typeof purchaseSchema>;

// GET /api/purchases includes a nested course summary; POST .../purchase
// (the create response) does not.
export const purchaseWithCourseSchema = purchaseSchema.extend({
  course: z.object({
    id: z.string(),
    title: z.string(),
    slug: z.string(),
    imageUrl: z.string().nullable(),
  }),
});
export type PurchaseWithCourse = z.infer<typeof purchaseWithCourseSchema>;

export const purchasesListSchema = z.array(purchaseWithCourseSchema);
