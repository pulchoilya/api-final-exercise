import { test } from './fixtures';
import * as assertions from './assertions';
import * as testData from './testData';

test(
  '[COURSES-01] Admin course list includes unpublished and published courses',
  { tag: ['@courses'] },
  async ({ coursesApi, coursesSteps, adminAccessToken, trackCourseForCleanup }) => {
    const unpublished = await test.step('create a course (unpublished by default)', () =>
      coursesSteps.createCourse(),
    );
    trackCourseForCleanup(unpublished.id);

    const { course: published } = await test.step('create and fully publish a second course', () =>
      coursesSteps.createPublishedCourse(),
    );
    trackCourseForCleanup(published.id);

    const response = await test.step('list courses as an admin', () =>
      coursesApi.list(undefined, adminAccessToken),
    );

    await test.step('verify both courses appear with their correct publish state', async () => {
      const list = await assertions.assertCoursesList(response);
      assertions.assertCourseListContains(list, { id: unpublished.id, isPublished: false });
      assertions.assertCourseListContains(list, { id: published.id, isPublished: true });
    });
  },
);

test(
  '[COURSES-02] Anonymous course list excludes unpublished and deleted courses',
  { tag: ['@courses'] },
  async ({ coursesApi, coursesSteps, trackCourseForCleanup }) => {
    const unpublished = await test.step('create a course that stays unpublished', () =>
      coursesSteps.createCourse(),
    );
    trackCourseForCleanup(unpublished.id);

    const { course: published } = await test.step('create and fully publish a course', () =>
      coursesSteps.createPublishedCourse(),
    );
    trackCourseForCleanup(published.id);

    const deleted = await test.step('create a course and immediately delete it', () =>
      coursesSteps.createDeletedCourse(),
    );

    const response = await test.step('list courses with no access token', () => coursesApi.list());

    await test.step('verify only the published course is visible', async () => {
      const list = await assertions.assertCoursesList(response);
      assertions.assertAllCoursesPublished(list);
      assertions.assertCourseListContains(list, { id: published.id });
      assertions.assertCourseListExcludes(list, unpublished.id);
      assertions.assertCourseListExcludes(list, deleted.id);
    });
  },
);

test(
  '[COURSES-03] Course list supports category and search filters',
  { tag: ['@courses'] },
  async ({ coursesApi, coursesSteps, adminAccessToken, trackCourseForCleanup }) => {
    await test.step('filtering by category returns only courses in that category', async () => {
      const response = await coursesApi.list({ category: 'web-development' }, adminAccessToken);
      const list = await assertions.assertCoursesList(response);
      assertions.assertAllCoursesInCategory(list, 'web-development');
    });

    await test.step('filtering by search term matches the course title', async () => {
      const created = await coursesSteps.createCourse();
      trackCourseForCleanup(created.id);

      const response = await coursesApi.list({ search: created.title }, adminAccessToken);
      const list = await assertions.assertCoursesList(response);
      assertions.assertCourseListContains(list, { id: created.id });
    });
  },
);

test(
  '[COURSES-04] Course details include nested chapters in position order',
  { tag: ['@courses'] },
  async ({ coursesApi, coursesSteps, adminAccessToken, trackCourseForCleanup }) => {
    const { course, chapters } = await test.step('create a course with four chapters', () =>
      coursesSteps.createCourseWithChapters(4),
    );
    trackCourseForCleanup(course.id);

    const response = await test.step('fetch the course by id', () =>
      coursesApi.get(course.id, adminAccessToken),
    );

    await test.step('verify the returned details include all chapters in position order', () =>
      assertions.assertCourseDetails(response, {
        id: course.id,
        title: course.title,
        chapterTitles: chapters.map((chapter) => chapter.title),
      }),
    );
  },
);

test(
  '[COURSES-05] Creating a course with only a title applies sane defaults',
  { tag: ['@courses', '@smoke'] },
  async ({ coursesSteps, trackCourseForCleanup }) => {
    const course = await test.step('create a course with only a title', () =>
      coursesSteps.createCourse(),
    );

    trackCourseForCleanup(course.id);
  },
);

test(
  '[COURSES-06] Updating a course reflects the new values',
  { tag: ['@courses'] },
  async ({ coursesApi, coursesSteps, adminAccessToken, trackCourseForCleanup }) => {
    const created = await test.step('create a course', () => coursesSteps.createCourse());
    trackCourseForCleanup(created.id);

    const webDevCategoryId = await test.step('look up the seeded "web-development" category id', () =>
      coursesSteps.getCategoryIdBySlug('web-development'),
    );

    const updatePayload = testData.createCourseUpdatePayload({ categoryIds: [webDevCategoryId] });

    const response = await test.step('update the course', () =>
      coursesApi.update(adminAccessToken, created.id, updatePayload),
    );

    await test.step('verify the update response reflects the new scalar values', () =>
      assertions.assertCourseUpdated(response, updatePayload),
    );

    await test.step(
      'verify the category assignment via a follow-up fetch (the update response itself omits relations)',
      async () => {
        const getResponse = await coursesApi.get(created.id, adminAccessToken);
        await assertions.assertCourseCategoryAssigned(getResponse, webDevCategoryId);
      },
    );
  },
);

test(
  '[COURSES-07] Deleted course no longer exists',
  { tag: ['@courses'] },
  async ({ coursesApi, coursesSteps, adminAccessToken }) => {
    const created = await test.step('create a course', () => coursesSteps.createCourse());

    const response = await test.step('delete the course', () =>
      coursesApi.remove(adminAccessToken, created.id),
    );

    await test.step('verify the deletion succeeded', () => assertions.assertCourseDeleted(response));

    await test.step('verify the course is actually gone, not just a happy response', async () => {
      const getResponse = await coursesApi.get(created.id, adminAccessToken);
      await assertions.assertCourseNotFound(getResponse);
    });
  },
);

test(
  '[COURSES-08] Publishing then unpublishing a course toggles its state',
  { tag: ['@courses'] },
  async ({ coursesApi, coursesSteps, adminAccessToken, trackCourseForCleanup }) => {
    const { course } = await test.step('create and fully publish a course', () =>
      coursesSteps.createPublishedCourse(),
    );
    trackCourseForCleanup(course.id);

    await test.step('toggle publish again to unpublish the course', async () => {
      const response = await coursesApi.publish(adminAccessToken, course.id);
      await assertions.assertCoursePublishState(response, false);
    });
  },
);
