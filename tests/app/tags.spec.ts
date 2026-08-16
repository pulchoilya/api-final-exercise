import { test } from './fixtures';
import * as assertions from './assertions';
import * as testData from './testData';

test(
  '[TAGS-01] Tag list includes a freshly created tag',
  { tag: ['@tags'] },
  async ({ tagsApi, adminAccessToken, trackTagForCleanup }) => {
    const payload = testData.createTagPayload();

    const created = await test.step('create a tag', async () => {
      const response = await tagsApi.create(adminAccessToken, payload);
      return assertions.assertTagCreated(response, payload);
    });
    trackTagForCleanup(created.id);

    const response = await test.step('list tags with no access token', () => tagsApi.list());

    await test.step('verify the tag appears in the list', async () => {
      const list = await assertions.assertTagsList(response);
      assertions.assertTagsListContains(list, { id: created.id, name: payload.name });
    });
  },
);

test(
  '[TAGS-02] Admin creates a tag with a name',
  { tag: ['@tags', '@smoke'] },
  async ({ tagsApi, adminAccessToken, trackTagForCleanup }) => {
    const payload = testData.createTagPayload();

    const response = await test.step('create the tag', () =>
      tagsApi.create(adminAccessToken, payload),
    );

    const tag = await test.step('verify the created tag', () =>
      assertions.assertTagCreated(response, payload),
    );

    trackTagForCleanup(tag.id);
  },
);

test(
  '[TAGS-03] Deleted tag no longer appears in the list',
  { tag: ['@tags'] },
  async ({ tagsApi, adminAccessToken }) => {
    const created = await test.step('create a tag', async () => {
      const payload = testData.createTagPayload();
      const response = await tagsApi.create(adminAccessToken, payload);
      return assertions.assertTagCreated(response, payload);
    });

    const response = await test.step('delete the tag', () =>
      tagsApi.remove(adminAccessToken, created.id),
    );

    await test.step('verify the deletion succeeded', () => assertions.assertTagDeleted(response));

    await test.step('verify the tag no longer appears in the list', async () => {
      const listResponse = await tagsApi.list();
      const list = await assertions.assertTagsList(listResponse);
      assertions.assertTagsListExcludes(list, created.id);
    });
  },
);
