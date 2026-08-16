import { test } from './fixtures';
import * as assertions from './assertions';
import * as testData from './testData';

// Positive/happy-path coverage only, same rule as the other suites — valid
// input from an admin (or public, where the endpoint needs no auth),
// successful responses only. Negative cases are a deliberately separate
// pass.
//
// Note: GET /api/posts has no tag-filter query param at all (confirmed by
// reading the route handler, which takes no arguments) — the instructor's
// "filter posts by tags" requirement has nothing to test against, so it's
// intentionally not covered here. That's a product gap, not a test gap.

test(
  '[POSTS-01] Public post list excludes unpublished posts',
  { tag: ['@posts'] },
  async ({ postsApi, adminAccessToken, trackPostForCleanup }) => {
    const unpublished = await test.step('create a post that stays unpublished', async () => {
      const payload = testData.createPostPayload();
      const response = await postsApi.create(adminAccessToken, payload);
      return assertions.assertPostCreated(response, payload);
    });
    trackPostForCleanup(unpublished.id);

    const published = await test.step('create a published post', async () => {
      const payload = testData.createPostPayload({ isPublished: true });
      const response = await postsApi.create(adminAccessToken, payload);
      return assertions.assertPostCreated(response, payload);
    });
    trackPostForCleanup(published.id);

    const response = await test.step('list posts with no access token', () => postsApi.list());

    await test.step('verify only the published post is visible', async () => {
      const list = await assertions.assertPostsList(response);
      assertions.assertAllPostsPublished(list);
      assertions.assertPostsListContains(list, { id: published.id });
      assertions.assertPostsListExcludes(list, unpublished.id);
    });
  },
);

test(
  '[POSTS-02] Creating a post with tags, and publishing sets publishedAt',
  { tag: ['@posts', '@smoke'] },
  async ({ postsApi, tagsApi, adminAccessToken, trackPostForCleanup, trackTagForCleanup }) => {
    const tag = await test.step('create a tag to attach', async () => {
      const payload = testData.createTagPayload();
      const response = await tagsApi.create(adminAccessToken, payload);
      return assertions.assertTagCreated(response, payload);
    });
    trackTagForCleanup(tag.id);

    await test.step('creating a post with tags attaches them and defaults to unpublished', async () => {
      const payload = testData.createPostPayload({ tagIds: [tag.id] });
      const response = await postsApi.create(adminAccessToken, payload);
      const post = await assertions.assertPostCreated(response, payload);
      trackPostForCleanup(post.id);
    });

    await test.step('creating a post with isPublished:true also sets publishedAt', async () => {
      const payload = testData.createPostPayload({ isPublished: true });
      const response = await postsApi.create(adminAccessToken, payload);
      const post = await assertions.assertPostCreated(response, payload);
      trackPostForCleanup(post.id);
    });
  },
);

test(
  '[POSTS-03] Updating a post fully replaces its tags',
  { tag: ['@posts'] },
  async ({ postsApi, tagsApi, adminAccessToken, trackPostForCleanup, trackTagForCleanup }) => {
    const [tagA, tagB] = await test.step('create two tags', async () => {
      const payloadA = testData.createTagPayload();
      const payloadB = testData.createTagPayload();
      const [responseA, responseB] = await Promise.all([
        tagsApi.create(adminAccessToken, payloadA),
        tagsApi.create(adminAccessToken, payloadB),
      ]);
      const [createdA, createdB] = await Promise.all([
        assertions.assertTagCreated(responseA, payloadA),
        assertions.assertTagCreated(responseB, payloadB),
      ]);
      trackTagForCleanup(createdA.id);
      trackTagForCleanup(createdB.id);
      return [createdA, createdB];
    });

    const post = await test.step('create a post tagged with the first tag', async () => {
      const payload = testData.createPostPayload({ tagIds: [tagA.id] });
      const response = await postsApi.create(adminAccessToken, payload);
      return assertions.assertPostCreated(response, payload);
    });
    trackPostForCleanup(post.id);

    const updatePayload = testData.createPostUpdatePayload({ tagIds: [tagB.id] });

    const response = await test.step('update the post to replace its tags', () =>
      postsApi.update(adminAccessToken, post.id, updatePayload),
    );

    await test.step('verify only the second tag remains', () =>
      assertions.assertPostUpdated(response, updatePayload),
    );
  },
);

test(
  '[POSTS-04] Deleted post no longer appears in the list',
  { tag: ['@posts'] },
  async ({ postsApi, adminAccessToken }) => {
    const created = await test.step('create a published post', async () => {
      const payload = testData.createPostPayload({ isPublished: true });
      const response = await postsApi.create(adminAccessToken, payload);
      return assertions.assertPostCreated(response, payload);
    });

    const response = await test.step('delete the post', () =>
      postsApi.remove(adminAccessToken, created.id),
    );

    await test.step('verify the deletion succeeded', () => assertions.assertPostDeleted(response));

    await test.step('verify the post no longer appears in the list', async () => {
      const listResponse = await postsApi.list();
      const list = await assertions.assertPostsList(listResponse);
      assertions.assertPostsListExcludes(list, created.id);
    });
  },
);
