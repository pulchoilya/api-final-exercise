import { test } from './fixtures';
import * as assertions from './assertions';
import * as testData from './testData';

// Only POST /api/learning-paths exists in this API — no list, get-by-id,
// update, or delete — so coverage is necessarily limited to creation
// scenarios. There is also no way to clean up what these tests create:
// the LearningPath (and the Instructor/modules/video/certificate created
// alongside it) has no delete endpoint at all. This is a real, disclosed
// limitation, not an oversight — every LearningPath created below is
// permanent test data, same reasoning as the Purchases suite's note about
// endpoints with no teardown path.

test(
  '[LP-01] Creating a fully-configured learning path',
  { tag: ['@learningPaths', '@smoke'] },
  async ({ learningPathsApi, coursesSteps, adminAccessToken }) => {
    const categoryId = await test.step('look up the seeded "web-development" category id', () =>
      coursesSteps.getCategoryIdBySlug('web-development'),
    );

    const payload = testData.createLearningPathPayload({ categoryIds: [categoryId] });

    const response = await test.step('create the learning path', () =>
      learningPathsApi.create(adminAccessToken, payload),
    );

    const learningPath = await test.step('verify the created learning path', () =>
      assertions.assertLearningPathCreated(response, payload),
    );

    await test.step('verify the nested modules, video, certificate, and category', () => {
      assertions.assertLearningPathModules(
        learningPath,
        payload.modules!.map((m) => m.title),
      );
      assertions.assertLearningPathHasVideo(learningPath, payload.video!);
      assertions.assertLearningPathHasCertificate(learningPath, payload.certificate!);
      assertions.assertLearningPathHasCategory(learningPath, categoryId);
    });
  },
);

test(
  '[LP-02] Creating a learning path with only a title and an instructor',
  { tag: ['@learningPaths'] },
  async ({ learningPathsApi, adminAccessToken }) => {
    const payload = testData.createMinimalLearningPathPayload();

    const response = await test.step('create the learning path', () =>
      learningPathsApi.create(adminAccessToken, payload),
    );

    const learningPath = await test.step('verify the created learning path', () =>
      assertions.assertLearningPathCreated(response, payload),
    );

    await test.step('verify every optional relation was left out', () =>
      assertions.assertLearningPathMinimal(learningPath),
    );
  },
);

test(
  '[LP-03] Duplicate title gets a deduplicated slug',
  { tag: ['@learningPaths'] },
  async ({ learningPathsApi, adminAccessToken }) => {
    const { title } = testData.createMinimalLearningPathPayload();

    const first = await test.step('create the first learning path', async () => {
      const payload = testData.createMinimalLearningPathPayload({ title });
      const response = await learningPathsApi.create(adminAccessToken, payload);
      return assertions.assertLearningPathCreated(response, payload);
    });

    const second = await test.step('create a second learning path with the same title', async () => {
      const payload = testData.createMinimalLearningPathPayload({ title });
      const response = await learningPathsApi.create(adminAccessToken, payload);
      return assertions.assertLearningPathCreated(response, payload);
    });

    await test.step('verify the second learning path got a deduplicated slug', () =>
      assertions.assertLearningPathSlugDeduplicated(second, first),
    );
  },
);
