import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one digit'),
});

export const tokenRequestSchema = z.discriminatedUnion('grant_type', [
  z.object({
    grant_type: z.literal('password'),
    email: z.string().email(),
    password: z.string().min(1),
    scope: z.string().optional(),
  }),
  z.object({
    grant_type: z.literal('client_credentials'),
    client_id: z.string().min(1),
    client_secret: z.string().min(1),
    scope: z.string().optional(),
  }),
  z.object({
    grant_type: z.literal('refresh_token'),
    refresh_token: z.string().min(1),
  }),
]);

export type RegisterInput = z.infer<typeof registerSchema>;
export type TokenRequestInput = z.infer<typeof tokenRequestSchema>;
