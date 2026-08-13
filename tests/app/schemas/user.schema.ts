import { z } from 'zod';

export const registeredUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  role: z.enum(['USER', 'ADMIN']),
  createdAt: z.string(),
});
export type RegisteredUser = z.infer<typeof registeredUserSchema>;

export const currentUserSchema = registeredUserSchema.extend({
  isActive: z.boolean(),
});
export type CurrentUser = z.infer<typeof currentUserSchema>;
