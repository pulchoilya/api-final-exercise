import type { APIRequestContext } from '@playwright/test';
import { CoursesApi } from './CoursesApi';
import { ChaptersApi } from './ChaptersApi';
import * as assertions from '../assertions';
import * as testData from '../testData';
import type { CourseResponse } from '../schemas/course.schema';

// Composite, multi-call setup flows built on top of CoursesApi + ChaptersApi.
// Each method bundles several endpoint calls — plus the assertions needed to
// safely chain their results (e.g. reading an id out of a create response
// before the next call can use it) — into one reusable "Arrange" step, so
// spec files call one thing instead of repeating the same multi-call
// sequence.
export class CoursesSteps {
  constructor(
    private readonly coursesApi: CoursesApi,
    private readonly chaptersApi: ChaptersApi,
    private readonly request: APIRequestContext,
    private readonly accessToken: string,
  ) {}

  async createCourse(): Promise<CourseResponse> {
    const payload = testData.createCoursePayload();
    const response = await this.coursesApi.create(this.accessToken, payload);
    return assertions.assertCourseCreated(response, payload);
  }

  async createCourseWithChapters(chapterCount: number) {
    const course = await this.createCourse();
    const chapterTitles = Array.from({ length: chapterCount }, (_, i) => `Chapter ${i + 1}`);
    const chapters: Array<{ id: string; title: string }> = [];

    for (const title of chapterTitles) {
      const response = await this.chaptersApi.create(this.accessToken, course.id, { title });
      const chapter = await assertions.assertChapterCreated(response, { title }, {
        courseId: course.id,
        position: chapters.length + 1,
      });
      chapters.push({ id: chapter.id, title: chapter.title });
    }

    return { course, chapters };
  }

  // Publishing requires: description/imageUrl/price filled in, plus at
  // least one published chapter — this walks through all of it and returns
  // the course in its final, published state, plus the chapter that made it
  // publishable (needed by tests that then delete that chapter).
  async createPublishedCourse(): Promise<{ course: CourseResponse; chapterId: string }> {
    const course = await this.createCourse();

    const updateResponse = await this.coursesApi.update(
      this.accessToken,
      course.id,
      testData.createCourseUpdatePayload(),
    );
    assertions.assertStatus(updateResponse, 200);

    const chapterResponse = await this.chaptersApi.create(this.accessToken, course.id, {
      title: 'Chapter 1',
    });
    assertions.assertStatus(chapterResponse, 201);
    const chapter = await chapterResponse.json();

    const publishChapterResponse = await this.chaptersApi.update(
      this.accessToken,
      course.id,
      chapter.id,
      { isPublished: true },
    );
    assertions.assertStatus(publishChapterResponse, 200);

    const publishResponse = await this.coursesApi.publish(this.accessToken, course.id);
    const published = await assertions.assertCoursePublishState(publishResponse, true);
    return { course: published, chapterId: chapter.id as string };
  }

  async createDeletedCourse(): Promise<CourseResponse> {
    const course = await this.createCourse();
    const deleteResponse = await this.coursesApi.remove(this.accessToken, course.id);
    await assertions.assertCourseDeleted(deleteResponse);
    return course;
  }

  async getCategoryIdBySlug(slug: string): Promise<string> {
    const response = await this.request.get('/api/categories');
    assertions.assertStatus(response, 200);
    const categories = (await response.json()) as Array<{ id: string; slug: string }>;
    const category = categories.find((c) => c.slug === slug);
    if (!category) throw new Error(`Seeded category with slug "${slug}" was not found`);
    return category.id;
  }
}
