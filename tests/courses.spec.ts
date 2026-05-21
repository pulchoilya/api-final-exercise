import { test, expect, type APIRequestContext } from '@playwright/test';

const ADMIN_EMAIL = 'admin@dojo.api';
const ADMIN_PASSWORD = 'Password1';

async function getAdminToken(request: APIRequestContext) {
  const response = await request.post('/api/oauth/token', {
    data: {
      grant_type: 'password',
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    },
  });
  expect(response.status()).toBe(200);
  const { access_token } = await response.json();
  return access_token as string;
}

async function createCourse(
  request: APIRequestContext,
  adminToken: string,
  title: string,
) {
  const response = await request.post('/api/courses', {
    headers: { Authorization: `Bearer ${adminToken}` },
    data: { title },
  });
  expect(response.status()).toBe(201);
  return response.json();
}

test.describe('POST /api/courses', () => {
  test('creates a course with title only', async ({ request }) => {
    const adminToken = await getAdminToken(request);
    const title = `Test Course ${Date.now()}`;

    const response = await request.post('/api/courses', {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { title },
    });

    expect(response.status()).toBe(201);
    const course = await response.json();
    expect(course.id).toBeTruthy();
    expect(course.title).toBe(title);
    expect(course.slug).toBeTruthy();
    expect(course.isPublished).toBe(false);
  });

  test('generates unique slug for duplicate titles', async ({ request }) => {
    const adminToken = await getAdminToken(request);
    const title = `Unique Title ${Date.now()}`;

    const course1 = await createCourse(request, adminToken, title);
    const course2 = await createCourse(request, adminToken, title);

    expect(course1.slug).not.toBe(course2.slug);
  });

  test('returns 400 when title is too short', async ({ request }) => {
    const adminToken = await getAdminToken(request);

    const response = await request.post('/api/courses', {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { title: 'ab' },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('at least 3 characters');
  });

  test('returns 400 when title is missing', async ({ request }) => {
    const adminToken = await getAdminToken(request);

    const response = await request.post('/api/courses', {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: {},
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('at least 3 characters');
  });

  test('returns 400 when title is not a string', async ({ request }) => {
    const adminToken = await getAdminToken(request);

    const response = await request.post('/api/courses', {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { title: 123 },
    });

    expect(response.status()).toBe(400);
  });

  test('returns 401 when not authenticated', async ({ request }) => {
    const response = await request.post('/api/courses', {
      data: { title: 'Test Course' },
    });

    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body.error).toBeTruthy();
  });

  test('returns 403 when authenticated as non-admin user', async ({ request }) => {
    // First create a non-admin user
    const registerRes = await request.post('/api/auth/register', {
      data: {
        name: 'Test User',
        email: `user-${Date.now()}@example.com`,
        password: 'Password1',
      },
    });
    expect(registerRes.status()).toBe(201);
    const user = await registerRes.json();

    // Get token for non-admin user
    const tokenRes = await request.post('/api/oauth/token', {
      data: {
        grant_type: 'password',
        email: user.email,
        password: 'Password1',
      },
    });
    expect(tokenRes.status()).toBe(200);
    const { access_token } = await tokenRes.json();

    // Try to create course
    const response = await request.post('/api/courses', {
      headers: { Authorization: `Bearer ${access_token}` },
      data: { title: 'Test Course' },
    });

    expect(response.status()).toBe(403);
  });
});

test.describe('GET /api/courses', () => {
  test('lists published courses for non-authenticated users', async ({ request }) => {
    const response = await request.get('/api/courses');

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.data).toBeDefined();
    expect(body.pagination).toBeDefined();
    expect(body.pagination.page).toBe(1);
    expect(body.pagination.limit).toBeGreaterThan(0);
    expect(body.pagination.total).toBeGreaterThanOrEqual(0);
  });

  test('supports pagination with page and limit parameters', async ({ request }) => {
    const response = await request.get('/api/courses?page=1&limit=5');

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.pagination.page).toBe(1);
    expect(body.pagination.limit).toBe(5);
    expect(body.data.length).toBeLessThanOrEqual(5);
  });

  test('limits max page size to 50', async ({ request }) => {
    const response = await request.get('/api/courses?limit=100');

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.pagination.limit).toBe(50);
  });

  test('supports search by title', async ({ request }) => {
    const adminToken = await getAdminToken(request);

    const title = `Searchable Course ${Date.now()}`;
    const courseRes = await request.post('/api/courses', {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { title },
    });
    expect(courseRes.status()).toBe(201);
    const course = await courseRes.json();

    // Publish the course
    await request.patch(`/api/courses/${course.id}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: {
        description: 'Test',
        imageUrl: 'http://example.com/image.jpg',
        price: '29.99',
      },
    });

    // Create a published chapter
    const chapterRes = await request.post(`/api/courses/${course.id}/chapters`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { title: 'Chapter 1' },
    });
    const chapter = await chapterRes.json();

    await request.patch(`/api/courses/${course.id}/chapters/${chapter.id}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { isPublished: true },
    });

    await request.patch(`/api/courses/${course.id}/publish`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    // Search for the course
    const searchRes = await request.get(
      `/api/courses?search=${encodeURIComponent('Searchable')}`,
    );
    expect(searchRes.status()).toBe(200);
    const searchBody = await searchRes.json();
    expect(searchBody.data.length).toBeGreaterThan(0);
    expect(
      searchBody.data.some((c: any) => c.id === course.id),
    ).toBeTruthy();
  });

  test('shows all courses to admin, only published to non-admin', async ({ request }) => {
    const adminToken = await getAdminToken(request);

    // Create an unpublished course
    const unpublishedRes = await request.post('/api/courses', {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { title: `Unpublished ${Date.now()}` },
    });
    expect(unpublishedRes.status()).toBe(201);

    // Admin should see all courses
    const adminListRes = await request.get('/api/courses', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(adminListRes.status()).toBe(200);
    const adminBody = await adminListRes.json();
    const adminTotal = adminBody.pagination.total;

    // Non-admin should see fewer (only published)
    const publicListRes = await request.get('/api/courses');
    expect(publicListRes.status()).toBe(200);
    const publicBody = await publicListRes.json();
    const publicTotal = publicBody.pagination.total;

    expect(adminTotal).toBeGreaterThanOrEqual(publicTotal);
  });
});

test.describe('GET /api/courses/{courseId}', () => {
  test('retrieves a published course', async ({ request }) => {
    const adminToken = await getAdminToken(request);
    const course = await createCourse(request, adminToken, `Published ${Date.now()}`);

    // Publish it
    await request.patch(`/api/courses/${course.id}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: {
        description: 'Test',
        imageUrl: 'http://example.com/image.jpg',
        price: '29.99',
      },
    });

    const chapterRes = await request.post(`/api/courses/${course.id}/chapters`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { title: 'Chapter 1' },
    });
    const chapter = await chapterRes.json();

    await request.patch(`/api/courses/${course.id}/chapters/${chapter.id}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { isPublished: true },
    });

    await request.patch(`/api/courses/${course.id}/publish`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    // Retrieve it
    const response = await request.get(`/api/courses/${course.id}`);

    expect(response.status()).toBe(200);
    const retrieved = await response.json();
    expect(retrieved.id).toBe(course.id);
    expect(retrieved.isPublished).toBe(true);
    expect(retrieved.chapters).toBeDefined();
    expect(retrieved.categories).toBeDefined();
  });

  test('returns 404 for nonexistent course', async ({ request }) => {
    const response = await request.get(`/api/courses/nonexistent-id-${Date.now()}`);

    expect(response.status()).toBe(404);
    const body = await response.json();
    expect(body.error).toBeTruthy();
  });

  test('returns 404 for unpublished course to non-admin', async ({ request }) => {
    const adminToken = await getAdminToken(request);
    const course = await createCourse(request, adminToken, `Unpublished ${Date.now()}`);

    // Non-admin should get 404 for unpublished course
    const response = await request.get(`/api/courses/${course.id}`);
    expect(response.status()).toBe(404);
  });

  test('returns unpublished course to admin', async ({ request }) => {
    const adminToken = await getAdminToken(request);
    const course = await createCourse(request, adminToken, `AdminOnly ${Date.now()}`);

    const response = await request.get(`/api/courses/${course.id}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(response.status()).toBe(200);
    const retrieved = await response.json();
    expect(retrieved.id).toBe(course.id);
    expect(retrieved.isPublished).toBe(false);
  });
});

test.describe('PATCH /api/courses/{courseId}', () => {
  test('updates course fields', async ({ request }) => {
    const adminToken = await getAdminToken(request);
    const course = await createCourse(request, adminToken, `Update Test ${Date.now()}`);

    const response = await request.patch(`/api/courses/${course.id}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: {
        description: 'Updated description',
        imageUrl: 'http://example.com/new-image.jpg',
        price: '49.99',
        authorName: 'Test Author',
      },
    });

    expect(response.status()).toBe(200);
    const updated = await response.json();
    expect(updated.description).toBe('Updated description');
    expect(updated.imageUrl).toBe('http://example.com/new-image.jpg');
    expect(updated.price).toBe('49.99');
    expect(updated.authorName).toBe('Test Author');
  });

  test('returns 401 when not authenticated', async ({ request }) => {
    const response = await request.patch(`/api/courses/some-id`, {
      data: { description: 'New description' },
    });

    expect(response.status()).toBe(401);
  });

  test('returns 403 for non-admin user', async ({ request }) => {
    const registerRes = await request.post('/api/auth/register', {
      data: {
        name: 'Test User',
        email: `user-${Date.now()}@example.com`,
        password: 'Password1',
      },
    });
    const user = await registerRes.json();

    const tokenRes = await request.post('/api/oauth/token', {
      data: {
        grant_type: 'password',
        email: user.email,
        password: 'Password1',
      },
    });
    const { access_token } = await tokenRes.json();

    const response = await request.patch(`/api/courses/some-id`, {
      headers: { Authorization: `Bearer ${access_token}` },
      data: { description: 'New description' },
    });

    expect(response.status()).toBe(403);
  });
});

test.describe('PATCH /api/courses/{courseId}/publish', () => {
  test('publishes a course with all required fields and published chapter', async ({ request }) => {
    const adminToken = await getAdminToken(request);
    const course = await createCourse(request, adminToken, `Publish Test ${Date.now()}`);

    // Update with required fields
    await request.patch(`/api/courses/${course.id}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: {
        description: 'Complete course',
        imageUrl: 'http://example.com/image.jpg',
        price: '99.99',
      },
    });

    // Create and publish a chapter
    const chapterRes = await request.post(`/api/courses/${course.id}/chapters`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { title: 'Chapter 1' },
    });
    const chapter = await chapterRes.json();

    await request.patch(`/api/courses/${course.id}/chapters/${chapter.id}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { isPublished: true },
    });

    // Publish course
    const publishRes = await request.patch(`/api/courses/${course.id}/publish`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(publishRes.status()).toBe(200);
    const published = await publishRes.json();
    expect(published.isPublished).toBe(true);
  });

  test('returns 400 when required fields are missing', async ({ request }) => {
    const adminToken = await getAdminToken(request);
    const course = await createCourse(request, adminToken, `IncompletePublish ${Date.now()}`);

    const response = await request.patch(`/api/courses/${course.id}/publish`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('required fields');
  });

  test('returns 400 when no published chapters exist', async ({ request }) => {
    const adminToken = await getAdminToken(request);
    const course = await createCourse(request, adminToken, `NoChapters ${Date.now()}`);

    // Update with required fields
    await request.patch(`/api/courses/${course.id}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: {
        description: 'No chapters',
        imageUrl: 'http://example.com/image.jpg',
        price: '29.99',
      },
    });

    const response = await request.patch(`/api/courses/${course.id}/publish`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('published chapter');
  });

  test('returns 404 for nonexistent course', async ({ request }) => {
    const adminToken = await getAdminToken(request);

    const response = await request.patch(`/api/courses/nonexistent-${Date.now()}/publish`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(response.status()).toBe(404);
  });

  test('returns 401 when not authenticated', async ({ request }) => {
    const response = await request.patch(`/api/courses/some-id/publish`);

    expect(response.status()).toBe(401);
  });

  test('toggles published state on repeated publish', async ({ request }) => {
    const adminToken = await getAdminToken(request);
    const course = await createCourse(request, adminToken, `Toggle ${Date.now()}`);

    // Setup: add required fields and chapter
    await request.patch(`/api/courses/${course.id}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: {
        description: 'Toggle test',
        imageUrl: 'http://example.com/image.jpg',
        price: '29.99',
      },
    });

    const chapterRes = await request.post(`/api/courses/${course.id}/chapters`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { title: 'Chapter 1' },
    });
    const chapter = await chapterRes.json();

    await request.patch(`/api/courses/${course.id}/chapters/${chapter.id}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { isPublished: true },
    });

    // Publish
    const publishRes = await request.patch(`/api/courses/${course.id}/publish`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(publishRes.status()).toBe(200);
    let published = await publishRes.json();
    expect(published.isPublished).toBe(true);

    // Unpublish
    const unpublishRes = await request.patch(`/api/courses/${course.id}/publish`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(unpublishRes.status()).toBe(200);
    published = await unpublishRes.json();
    expect(published.isPublished).toBe(false);
  });
});

test.describe('DELETE /api/courses/{courseId}', () => {
  test('deletes a course', async ({ request }) => {
    const adminToken = await getAdminToken(request);
    const course = await createCourse(request, adminToken, `Delete Test ${Date.now()}`);

    const deleteRes = await request.delete(`/api/courses/${course.id}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(deleteRes.status()).toBe(200);
    const body = await deleteRes.json();
    expect(body.success).toBe(true);

    // Verify it's deleted
    const getRes = await request.get(`/api/courses/${course.id}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(getRes.status()).toBe(404);
  });

  test('returns 401 when not authenticated', async ({ request }) => {
    const response = await request.delete(`/api/courses/some-id`);

    expect(response.status()).toBe(401);
  });

  test('returns 403 for non-admin', async ({ request }) => {
    const registerRes = await request.post('/api/auth/register', {
      data: {
        name: 'Test User',
        email: `user-${Date.now()}@example.com`,
        password: 'Password1',
      },
    });
    const user = await registerRes.json();

    const tokenRes = await request.post('/api/oauth/token', {
      data: {
        grant_type: 'password',
        email: user.email,
        password: 'Password1',
      },
    });
    const { access_token } = await tokenRes.json();

    const response = await request.delete(`/api/courses/some-id`, {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    expect(response.status()).toBe(403);
  });
});
