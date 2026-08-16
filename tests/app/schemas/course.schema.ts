import { z } from 'zod';

export const categorySchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
});
export type Category = z.infer<typeof categorySchema>;

export const chapterSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  videoUrl: z.string().nullable(),
  timecodes: z.string().nullable(),
  notes: z.string().nullable(),
  homework: z.string().nullable(),
  position: z.number(),
  isPublished: z.boolean(),
  isFree: z.boolean(),
  courseId: z.string(),
  createdAt: z.string(),
});
export type Chapter = z.infer<typeof chapterSchema>;

// price is a Prisma Decimal, which serializes to a string (e.g. "29.99") in
// the JSON response rather than a number.
//
// categories/chapters are only present when the route explicitly includes
// them (only GET /api/courses/{id} does) — create/update/publish return the
// plain Prisma record with just scalar fields, so both are optional here.
export const courseSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  imageUrl: z.string().nullable(),
  price: z.string().nullable(),
  isPublished: z.boolean(),
  isListed: z.boolean(),
  isFeatured: z.boolean(),
  featuredOrder: z.number(),
  outcomes: z.string().nullable(),
  requirements: z.string().nullable(),
  authorName: z.string().nullable(),
  authorRole: z.string().nullable(),
  categories: z.array(categorySchema).optional(),
  chapters: z.array(chapterSchema).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type CourseResponse = z.infer<typeof courseSchema>;

export const courseListItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  imageUrl: z.string().nullable(),
  price: z.string().nullable(),
  isPublished: z.boolean(),
  categories: z.array(categorySchema),
  _count: z.object({
    chapters: z.number(),
    purchases: z.number(),
  }),
  createdAt: z.string(),
});
export type CourseListItem = z.infer<typeof courseListItemSchema>;

export const coursesListResponseSchema = z.object({
  data: z.array(courseListItemSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
});
export type CoursesListResponse = z.infer<typeof coursesListResponseSchema>;
