import { test } from './fixtures';
import * as assertions from './assertions';
import * as testData from './testData';

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
