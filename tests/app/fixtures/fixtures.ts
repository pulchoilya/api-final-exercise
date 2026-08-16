import { test as base } from '@playwright/test';
import { AuthApi } from '../api/AuthApi';
import { OAuthApi } from '../api/OAuthApi';
import { AdminApi } from '../api/AdminApi';
import { CoursesApi } from '../api/CoursesApi';
import { ChaptersApi } from '../api/ChaptersApi';
import { CoursesSteps } from '../api/CoursesSteps';
import { TagsApi } from '../api/TagsApi';
import { PostsApi } from '../api/PostsApi';
import { PromoCodesApi } from '../api/PromoCodesApi';
import { PurchasesApi } from '../api/PurchasesApi';
import { LearningPathsApi } from '../api/LearningPathsApi';
import { seedAdmin } from '../testData/seedUsers';
import { createRegisterPayload } from '../testData/factories';
import { assertStatus } from '../assertions';
import { readCachedAdminToken } from '../../support/adminTokenCache';

type FreshUser = { id: string; accessToken: string };

type AppFixtures = {
  authApi: AuthApi;
  oauthApi: OAuthApi;
  adminApi: AdminApi;
  coursesApi: CoursesApi;
  chaptersApi: ChaptersApi;
  coursesSteps: CoursesSteps;
  tagsApi: TagsApi;
  postsApi: PostsApi;
  promoCodesApi: PromoCodesApi;
  purchasesApi: PurchasesApi;
  learningPathsApi: LearningPathsApi;
  adminAccessToken: string;
  freshUser: FreshUser;
  trackUserForCleanup: (userId: string) => void;
  trackRefreshTokenForCleanup: (refreshToken: string) => void;
  trackOAuthClientForCleanup: (clientId: string) => void;
  trackCourseForCleanup: (courseId: string) => void;
  trackTagForCleanup: (tagId: string) => void;
  trackPostForCleanup: (postId: string) => void;
};

export const test = base.extend<AppFixtures>({
  authApi: async ({ request }, use) => {
    await use(new AuthApi(request));
  },

  oauthApi: async ({ request }, use) => {
    await use(new OAuthApi(request));
  },

  adminApi: async ({ request }, use) => {
    await use(new AdminApi(request));
  },

  coursesApi: async ({ request }, use) => {
    await use(new CoursesApi(request));
  },

  chaptersApi: async ({ request }, use) => {
    await use(new ChaptersApi(request));
  },

  coursesSteps: async ({ coursesApi, chaptersApi, request, adminAccessToken }, use) => {
    await use(new CoursesSteps(coursesApi, chaptersApi, request, adminAccessToken));
  },

  tagsApi: async ({ request }, use) => {
    await use(new TagsApi(request));
  },

  postsApi: async ({ request }, use) => {
    await use(new PostsApi(request));
  },

  promoCodesApi: async ({ request }, use) => {
    await use(new PromoCodesApi(request));
  },

  purchasesApi: async ({ request }, use) => {
    await use(new PurchasesApi(request));
  },

  learningPathsApi: async ({ request }, use) => {
    await use(new LearningPathsApi(request));
  },

  adminAccessToken: async ({ oauthApi }, use) => {
    const cached = readCachedAdminToken();
    if (cached) {
      await use(cached);
      return;
    }

    const response = await oauthApi.getToken({
      grant_type: 'password',
      email: seedAdmin.email,
      password: seedAdmin.password,
    });

    assertStatus(response, 200);
    const body = await response.json();
    await use(body.access_token as string);
  },

  freshUser: async ({ authApi, oauthApi, trackUserForCleanup }, use) => {
    const payload = createRegisterPayload();

    const registerResponse = await authApi.register(payload);
    assertStatus(registerResponse, 201);
    const user = await registerResponse.json();
    trackUserForCleanup(user.id);

    const tokenResponse = await oauthApi.getToken({
      grant_type: 'password',
      email: payload.email,
      password: payload.password,
    });
    assertStatus(tokenResponse, 200);
    const tokenBody = await tokenResponse.json();

    await use({ id: user.id as string, accessToken: tokenBody.access_token as string });
  },

  trackUserForCleanup: async ({ adminApi, adminAccessToken }, use) => {
    const userIds: string[] = [];
    await use((userId) => {
      userIds.push(userId);
    });
    for (const userId of userIds) {
      const response = await adminApi.deactivateUser(adminAccessToken, userId);
      assertStatus(response, 200);
    }
  },

  trackRefreshTokenForCleanup: async ({ oauthApi, adminAccessToken }, use) => {
    const refreshTokens: string[] = [];
    await use((refreshToken) => {
      refreshTokens.push(refreshToken);
    });
    for (const refreshToken of refreshTokens) {
      const response = await oauthApi.revokeToken(adminAccessToken, refreshToken);
      assertStatus(response, 200);
    }
  },

  trackOAuthClientForCleanup: async ({ oauthApi, adminAccessToken }, use) => {
    const clientIds: string[] = [];
    await use((clientId) => {
      clientIds.push(clientId);
    });
    for (const clientId of clientIds) {
      const response = await oauthApi.deactivateClient(adminAccessToken, clientId);
      assertStatus(response, 200);
    }
  },

  trackCourseForCleanup: async ({ coursesApi, adminAccessToken }, use) => {
    const courseIds: string[] = [];
    await use((courseId) => {
      courseIds.push(courseId);
    });
    for (const courseId of courseIds) {
      await coursesApi.remove(adminAccessToken, courseId);
    }
  },

  trackTagForCleanup: async ({ tagsApi, adminAccessToken }, use) => {
    const tagIds: string[] = [];
    await use((tagId) => {
      tagIds.push(tagId);
    });
    for (const tagId of tagIds) {
      await tagsApi.remove(adminAccessToken, tagId);
    }
  },

  trackPostForCleanup: async ({ postsApi, adminAccessToken }, use) => {
    const postIds: string[] = [];
    await use((postId) => {
      postIds.push(postId);
    });
    for (const postId of postIds) {
      await postsApi.remove(adminAccessToken, postId);
    }
  },
});

export { expect } from '@playwright/test';
