import { z } from 'zod';
import { categorySchema } from './course.schema';

export const learningPathModuleSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  position: z.number(),
  learningPathId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const youtubeVideoSchema = z.object({
  id: z.string(),
  title: z.string(),
  videoId: z.string(),
  description: z.string().nullable(),
  position: z.number(),
  isPublished: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const certificateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  templateUrl: z.string().nullable(),
  learningPathId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const instructorSchema = z.object({
  id: z.string(),
  name: z.string(),
  bio: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const learningPathSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  isPublished: z.boolean(),
  categories: z.array(categorySchema),
  modules: z.array(learningPathModuleSchema),
  videoId: z.string().nullable(),
  video: youtubeVideoSchema.nullable(),
  certificate: certificateSchema.nullable(),
  instructorId: z.string(),
  instructor: instructorSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type LearningPathResponse = z.infer<typeof learningPathSchema>;
