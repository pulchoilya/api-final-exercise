import { z } from 'zod';
import { tagSchema } from './tag.schema';

export const postSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  excerpt: z.string().nullable(),
  content: z.string().nullable(),
  imageUrl: z.string().nullable(),
  isPublished: z.boolean(),
  publishedAt: z.string().nullable(),
  tags: z.array(tagSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type PostResponse = z.infer<typeof postSchema>;

// GET /api/posts returns a raw array, no pagination envelope.
export const postsListSchema = z.array(postSchema);
