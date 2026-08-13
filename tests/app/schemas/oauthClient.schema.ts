import { z } from 'zod';

const oauthClientBaseSchema = z.object({
  id: z.string(),
  clientId: z.string(),
  name: z.string(),
  grants: z.array(z.string()),
  scopes: z.array(z.string()),
  createdAt: z.string(),
});

export const oauthClientCreatedSchema = oauthClientBaseSchema.extend({
  clientSecret: z.string(),
});
export type OAuthClientCreated = z.infer<typeof oauthClientCreatedSchema>;

export const oauthClientListItemSchema = oauthClientBaseSchema.extend({
  isActive: z.boolean(),
});
export type OAuthClientListItem = z.infer<typeof oauthClientListItemSchema>;

export const oauthClientsListSchema = z.array(oauthClientListItemSchema);
