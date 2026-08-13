import { faker } from '@faker-js/faker';
import type { RegisterPayload } from '../api/AuthApi';
import type { OAuthClientPayload } from '../api/OAuthApi';

export function createRegisterPayload(overrides?: Partial<RegisterPayload>): RegisterPayload {
  return {
    name: overrides?.name ?? faker.person.fullName(),
    // Keep the @dojo.api domain (not faker's own) so generated addresses stay
    // obviously fake and can never collide with a real registered user.
    email: overrides?.email ?? `test-${faker.string.alphanumeric(10).toLowerCase()}@dojo.api`,
    // Fixed, not faker-generated: must satisfy registerSchema's password rules
    // (min 8 chars, ≥1 uppercase, ≥1 digit) on every run without risking a
    // validation-shaped "flaky" failure.
    password: overrides?.password ?? 'Password1',
  };
}

export function createOAuthClientPayload(
  overrides?: Partial<OAuthClientPayload>,
): OAuthClientPayload {
  return {
    name: overrides?.name ?? `Playwright Client ${faker.string.alphanumeric(8)}`,
    grants: overrides?.grants ?? ['client_credentials'],
    scopes: overrides?.scopes ?? ['read', 'write'],
  };
}
