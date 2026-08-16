import { z } from 'zod';

export const tagSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
});
export type Tag = z.infer<typeof tagSchema>;

// GET /api/tags returns a raw array, no pagination envelope.
export const tagsListSchema = z.array(tagSchema);
