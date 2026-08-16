import { z } from 'zod';

export const purchaseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  courseId: z.string(),
  amount: z.string(),
  promoCode: z.string().nullable(),
  createdAt: z.string(),
});
export type Purchase = z.infer<typeof purchaseSchema>;

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
