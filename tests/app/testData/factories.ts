import { faker } from '@faker-js/faker';
import type { RegisterPayload } from '../api/AuthApi';
import type { OAuthClientPayload } from '../api/OAuthApi';
import type { CreateCoursePayload, UpdateCoursePayload } from '../api/CoursesApi';
import type { CreateChapterPayload, UpdateChapterPayload } from '../api/ChaptersApi';
import type { CreateTagPayload } from '../api/TagsApi';
import type { CreatePostPayload, UpdatePostPayload } from '../api/PostsApi';
import type { CreatePromoCodePayload } from '../api/PromoCodesApi';
import type { CreateLearningPathPayload } from '../api/LearningPathsApi';

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

export function createCoursePayload(overrides?: Partial<CreateCoursePayload>): CreateCoursePayload {
  return {
    // faker.commerce.productName() is reliably longer than the API's 3-char
    // minimum, unlike faker.lorem.word() which can be as short as 1 char.
    title: overrides?.title ?? `Playwright Course ${faker.commerce.productName()}`,
  };
}

export function createCourseUpdatePayload(
  overrides?: Partial<UpdateCoursePayload>,
): UpdateCoursePayload {
  return {
    description: overrides?.description ?? faker.lorem.paragraph(),
    imageUrl: overrides?.imageUrl ?? faker.image.url(),
    price: overrides?.price ?? faker.number.float({ min: 10, max: 500, fractionDigits: 2 }),
    outcomes: overrides?.outcomes ?? [faker.lorem.sentence(), faker.lorem.sentence()],
    requirements: overrides?.requirements ?? [faker.lorem.sentence()],
    authorName: overrides?.authorName ?? faker.person.fullName(),
    authorRole: overrides?.authorRole ?? faker.person.jobTitle(),
    ...(overrides?.categoryIds ? { categoryIds: overrides.categoryIds } : {}),
    ...(overrides?.title ? { title: overrides.title } : {}),
  };
}

export function createChapterPayload(
  overrides?: Partial<CreateChapterPayload>,
): CreateChapterPayload {
  return {
    title: overrides?.title ?? `Playwright Chapter ${faker.lorem.words(3)}`,
  };
}

// isFree/isPublished are deliberately left out here — they're the state a
// test is asserting on, so each test sets them explicitly rather than
// getting a randomized value from the factory.
export function createChapterUpdatePayload(
  overrides?: Partial<UpdateChapterPayload>,
): UpdateChapterPayload {
  return {
    description: overrides?.description ?? faker.lorem.paragraph(),
    videoUrl: overrides?.videoUrl ?? faker.internet.url(),
    timecodes: overrides?.timecodes ?? faker.lorem.sentence(),
    notes: overrides?.notes ?? faker.lorem.paragraph(),
    homework: overrides?.homework ?? faker.lorem.sentence(),
    ...(overrides?.title ? { title: overrides.title } : {}),
    ...(overrides?.isPublished !== undefined ? { isPublished: overrides.isPublished } : {}),
    ...(overrides?.isFree !== undefined ? { isFree: overrides.isFree } : {}),
    ...(overrides?.position !== undefined ? { position: overrides.position } : {}),
  };
}

// Unlike Course/Post titles, Tag name/slug have no auto-dedup on collision —
// a repeat gets a hard 409 — so the name needs a real random suffix, not
// just varied wording.
export function createTagPayload(overrides?: Partial<CreateTagPayload>): CreateTagPayload {
  return {
    name: overrides?.name ?? `Playwright Tag ${faker.word.noun()} ${faker.string.alphanumeric(6)}`,
  };
}

export function createPostPayload(overrides?: Partial<CreatePostPayload>): CreatePostPayload {
  return {
    // faker.lorem.sentence() is reliably longer than the API's 3-char
    // minimum, unlike faker.lorem.word() which can be as short as 1 char.
    title: overrides?.title ?? `Playwright Post ${faker.lorem.sentence(4)}`,
    excerpt: overrides?.excerpt ?? faker.lorem.sentence(),
    content: overrides?.content ?? faker.lorem.paragraphs(2),
    imageUrl: overrides?.imageUrl ?? faker.image.url(),
    ...(overrides?.tagIds ? { tagIds: overrides.tagIds } : {}),
    ...(overrides?.isPublished !== undefined ? { isPublished: overrides.isPublished } : {}),
  };
}

export function createPostUpdatePayload(
  overrides?: Partial<UpdatePostPayload>,
): UpdatePostPayload {
  return {
    excerpt: overrides?.excerpt ?? faker.lorem.sentence(),
    content: overrides?.content ?? faker.lorem.paragraphs(2),
    imageUrl: overrides?.imageUrl ?? faker.image.url(),
    ...(overrides?.title ? { title: overrides.title } : {}),
    ...(overrides?.tagIds ? { tagIds: overrides.tagIds } : {}),
    ...(overrides?.isPublished !== undefined ? { isPublished: overrides.isPublished } : {}),
  };
}

// Code has no auto-dedup on collision (like Tags) — a repeat is a hard
// 409 — so it needs a real random suffix. discountPercent/maxUses are left
// as the caller's explicit choice by default since promo-code tests are
// usually verifying a specific calculation, not just "some discount".
export function createPromoCodePayload(
  overrides?: Partial<CreatePromoCodePayload>,
): CreatePromoCodePayload {
  return {
    code: overrides?.code ?? `PROMO-${faker.string.alphanumeric(6).toUpperCase()}`,
    discountPercent: overrides?.discountPercent ?? faker.number.int({ min: 10, max: 90 }),
    expiresAt: overrides?.expiresAt ?? faker.date.future({ years: 1 }).toISOString(),
    ...(overrides?.maxUses !== undefined ? { maxUses: overrides.maxUses } : {}),
  };
}

// A rich payload exercising every optional nested entity (modules, video,
// certificate) — pair with createMinimalLearningPathPayload for the
// title+instructor-only case, since overriding a field to `undefined` here
// wouldn't omit it (nullish coalescing would just fall back to the default).
export function createLearningPathPayload(
  overrides?: Partial<CreateLearningPathPayload>,
): CreateLearningPathPayload {
  return {
    title: overrides?.title ?? `Playwright Learning Path ${faker.commerce.productName()}`,
    description: overrides?.description ?? faker.lorem.paragraph(),
    modules: overrides?.modules ?? [
      { title: faker.lorem.words(3) },
      { title: faker.lorem.words(3) },
    ],
    video: overrides?.video ?? {
      title: faker.lorem.words(3),
      videoId: faker.string.alphanumeric(11),
    },
    certificate: overrides?.certificate ?? {
      name: `${faker.commerce.productName()} Certificate`,
    },
    instructor: overrides?.instructor ?? {
      name: faker.person.fullName(),
      bio: faker.lorem.sentence(),
    },
    ...(overrides?.categoryIds ? { categoryIds: overrides.categoryIds } : {}),
  };
}

export function createMinimalLearningPathPayload(
  overrides?: Partial<Pick<CreateLearningPathPayload, 'title' | 'instructor'>>,
): CreateLearningPathPayload {
  return {
    title: overrides?.title ?? `Playwright Learning Path ${faker.commerce.productName()}`,
    instructor: overrides?.instructor ?? { name: faker.person.fullName() },
  };
}
