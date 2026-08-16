import { test } from './fixtures/fixtures';
import * as assertions from './assertions';
import * as testData from './testData';

test(
  '[CH-01] Adding chapters assigns auto-incrementing positions',
  { tag: ['@chapters', '@smoke'] },
  async ({ chaptersApi, coursesSteps, adminAccessToken, trackCourseForCleanup }) => {
    const course = await test.step('create a course', () => coursesSteps.createCourse());
    trackCourseForCleanup(course.id);

    const firstPayload = testData.createChapterPayload();
    await test.step('add the first chapter', async () => {
      const response = await chaptersApi.create(adminAccessToken, course.id, firstPayload);
      await assertions.assertChapterCreated(response, firstPayload, {
        courseId: course.id,
        position: 1,
      });
    });

    const secondPayload = testData.createChapterPayload();
    await test.step('add a second chapter', async () => {
      const response = await chaptersApi.create(adminAccessToken, course.id, secondPayload);
      await assertions.assertChapterCreated(response, secondPayload, {
        courseId: course.id,
        position: 2,
      });
    });
  },
);

test(
  "[CH-02] Updating a chapter's content fields",
  { tag: ['@chapters'] },
  async ({ chaptersApi, coursesSteps, adminAccessToken, trackCourseForCleanup }) => {
    const course = await test.step('create a course', () => coursesSteps.createCourse());
    trackCourseForCleanup(course.id);

    const chapter = await test.step('add a chapter', async () => {
      const payload = testData.createChapterPayload();
      const response = await chaptersApi.create(adminAccessToken, course.id, payload);
      return assertions.assertChapterCreated(response, payload, {
        courseId: course.id,
        position: 1,
      });
    });

    const updatePayload = testData.createChapterUpdatePayload();

    const response = await test.step('update the chapter content fields', () =>
      chaptersApi.update(adminAccessToken, course.id, chapter.id, updatePayload),
    );

    await test.step('verify the response reflects the new content', () =>
      assertions.assertChapterUpdated(response, updatePayload),
    );
  },
);

test(
  '[CH-03] Marking a chapter as free and published',
  { tag: ['@chapters'] },
  async ({ chaptersApi, coursesSteps, adminAccessToken, trackCourseForCleanup }) => {
    const course = await test.step('create a course', () => coursesSteps.createCourse());
    trackCourseForCleanup(course.id);

    const chapter = await test.step('add a chapter', async () => {
      const payload = testData.createChapterPayload();
      const response = await chaptersApi.create(adminAccessToken, course.id, payload);
      return assertions.assertChapterCreated(response, payload, {
        courseId: course.id,
        position: 1,
      });
    });

    const updatePayload = { isFree: true, isPublished: true };

    const response = await test.step('mark the chapter as free and published', () =>
      chaptersApi.update(adminAccessToken, course.id, chapter.id, updatePayload),
    );

    await test.step('verify the flags were updated', () =>
      assertions.assertChapterUpdated(response, updatePayload),
    );
  },
);

test(
  '[CH-04] Reordering swaps two chapter positions',
  { tag: ['@chapters'] },
  async ({ coursesApi, chaptersApi, coursesSteps, adminAccessToken, trackCourseForCleanup }) => {
    const { course, chapters } = await test.step('create a course with two chapters', () =>
      coursesSteps.createCourseWithChapters(2),
    );
    trackCourseForCleanup(course.id);

    const response = await test.step("swap the two chapters' positions", () =>
      chaptersApi.reorder(adminAccessToken, course.id, [
        { id: chapters[0].id, position: 2 },
        { id: chapters[1].id, position: 1 },
      ]),
    );

    await test.step('verify the reorder succeeded', () =>
      assertions.assertChaptersReordered(response),
    );

    await test.step('verify the course now lists the chapters in swapped order', async () => {
      const getResponse = await coursesApi.get(course.id, adminAccessToken);
      await assertions.assertCourseDetails(getResponse, {
        id: course.id,
        title: course.title,
        chapterTitles: [chapters[1].title, chapters[0].title],
      });
    });
  },
);

test(
  '[CH-05] Deleted chapter no longer appears in the course',
  { tag: ['@chapters'] },
  async ({ coursesApi, chaptersApi, coursesSteps, adminAccessToken, trackCourseForCleanup }) => {
    const course = await test.step('create a course', () => coursesSteps.createCourse());
    trackCourseForCleanup(course.id);

    const chapter = await test.step('add a chapter', async () => {
      const payload = testData.createChapterPayload();
      const response = await chaptersApi.create(adminAccessToken, course.id, payload);
      return assertions.assertChapterCreated(response, payload, {
        courseId: course.id,
        position: 1,
      });
    });

    const response = await test.step('delete the chapter', () =>
      chaptersApi.remove(adminAccessToken, course.id, chapter.id),
    );

    await test.step('verify the deletion succeeded', () =>
      assertions.assertChapterDeleted(response),
    );

    await test.step('verify the course no longer lists the deleted chapter', async () => {
      const getResponse = await coursesApi.get(course.id, adminAccessToken);
      await assertions.assertCourseDetails(getResponse, {
        id: course.id,
        title: course.title,
        chapterTitles: [],
      });
    });
  },
);

test(
  '[CH-06] Deleting the only published chapter unpublishes the course',
  { tag: ['@chapters'] },
  async ({ coursesApi, chaptersApi, coursesSteps, adminAccessToken, trackCourseForCleanup }) => {
    const { course, chapterId } = await test.step('create and fully publish a course', () =>
      coursesSteps.createPublishedCourse(),
    );
    trackCourseForCleanup(course.id);

    const response = await test.step('delete the only published chapter', () =>
      chaptersApi.remove(adminAccessToken, course.id, chapterId),
    );

    await test.step('verify the deletion succeeded', () =>
      assertions.assertChapterDeleted(response),
    );

    await test.step('verify the course was automatically unpublished', async () => {
      const getResponse = await coursesApi.get(course.id, adminAccessToken);
      await assertions.assertCoursePublishState(getResponse, false);
    });
  },
);
