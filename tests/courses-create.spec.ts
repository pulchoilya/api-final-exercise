import { test, expect } from '@playwright/test';

test('POST /api/courses: create a new course with admin token', async ({
  request,
}) => {
  // 1. Get admin token via password grant
  const tokenResponse = await request.post('/api/oauth/token', {
    data: {
      grant_type: 'password',
      email: 'admin@dojo.api',
      password: 'Password1',
    },
  });
  
  expect(tokenResponse.status()).toBe(200);
  const { access_token: adminToken } = await tokenResponse.json();

  // 2. Create a new course
  const courseRes = await request.post('/api/courses', {
    headers: { Authorization: `Bearer ${adminToken}` },
    data: {
      title: 'Advanced TypeScript',
    },
  });

  expect(courseRes.status()).toBe(201);

  expect(courseRes.status()).toBe(201);
  const course = await courseRes.json();
  expect(course.title).toBe('Advanced TypeScript');
  expect(course.id).toBeTruthy();

  // 3. Update course with required fields for publishing
  const updateRes = await request.patch(`/api/courses/${course.id}`, {
    headers: { Authorization: `Bearer ${adminToken}` },
    data: {
      description: 'Master advanced TypeScript concepts',
      imageUrl: 'https://example.com/image.jpg',
      price: 99.99,
    },
  });

  expect(updateRes.status()).toBe(200);

  // 4. Create a chapter
  const chapterRes = await request.post(`/api/courses/${course.id}/chapters`, {
    headers: { Authorization: `Bearer ${adminToken}` },
    data: {
      title: 'Chapter 1: Generics',
    },
  });

  expect(chapterRes.status()).toBe(201);
  const chapter = await chapterRes.json();

  // 5. Publish the chapter
  const publishChapterRes = await request.patch(
    `/api/courses/${course.id}/chapters/${chapter.id}`,
    {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { isPublished: true },
    },
  );

  expect(publishChapterRes.status()).toBe(200);

  // 6. Publish the course
  const publishRes = await request.patch(`/api/courses/${course.id}/publish`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });

  expect(publishRes.status()).toBe(200);
  const publishedCourse = await publishRes.json();
  expect(publishedCourse.isPublished).toBe(true);
});
