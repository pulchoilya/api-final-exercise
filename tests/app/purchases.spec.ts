import { test } from './fixtures';
import * as assertions from './assertions';
import * as testData from './testData';

// Every test buys with a freshly registered throwaway user (the freshUser
// fixture), never the shared seeded accounts — Purchase has a unique
// (userId, courseId) constraint and PromoCodeUsage is tracked per user, so
// reusing one shared user across tests would collide on both. Purchases
// have no delete endpoint at all; there's no dedicated cleanup for them —
// deleting the throwaway course (via trackCourseForCleanup) cascades and
// removes any Purchase/PromoCodeUsage rows created against it, and the
// throwaway user itself only gets deactivated (never hard-deleted, same as
// everywhere else in this suite), leaving an orphaned-but-harmless Purchase
// row under a deactivated user if the course weren't also cleaned up.

test(
  '[PURCHASE-01] Purchasing with no promo code charges full price',
  { tag: ['@purchases', '@smoke'] },
  async ({ coursesApi, coursesSteps, freshUser, trackCourseForCleanup }) => {
    const { course } = await test.step('create and fully publish a course', () =>
      coursesSteps.createPublishedCourse(),
    );
    trackCourseForCleanup(course.id);

    const response = await test.step('purchase the course with no promo code', () =>
      coursesApi.purchase(freshUser.accessToken, course.id),
    );

    await test.step('verify the purchase was recorded at full price', () =>
      assertions.assertPurchaseCreated(response, {
        courseId: course.id,
        promoCode: null,
        amountCloseTo: Number(course.price),
      }),
    );
  },
);

test(
  '[PURCHASE-02] Purchasing with a promo code applies the discount',
  { tag: ['@purchases'] },
  async ({ coursesApi, coursesSteps, promoCodesApi, adminAccessToken, freshUser, trackCourseForCleanup }) => {
    const { course } = await test.step('create and fully publish a course', () =>
      coursesSteps.createPublishedCourse(),
    );
    trackCourseForCleanup(course.id);

    await test.step('set a known price', async () => {
      const response = await coursesApi.update(adminAccessToken, course.id, { price: 200 });
      assertions.assertStatus(response, 200);
    });

    const promoCode = await test.step('create a 30% promo code for the course', async () => {
      const payload = testData.createPromoCodePayload({ discountPercent: 30 });
      const response = await promoCodesApi.create(adminAccessToken, course.id, payload);
      return assertions.assertPromoCodeCreated(response, payload);
    });

    const response = await test.step('purchase the course with the promo code', () =>
      coursesApi.purchase(freshUser.accessToken, course.id, promoCode.code),
    );

    await test.step('verify the purchase reflects the discount', () =>
      assertions.assertPurchaseCreated(response, {
        courseId: course.id,
        promoCode: promoCode.code,
        amountCloseTo: 140,
      }),
    );
  },
);

test(
  "[PURCHASE-03] Purchased course appears in the user's history",
  { tag: ['@purchases'] },
  async ({ coursesApi, coursesSteps, purchasesApi, freshUser, trackCourseForCleanup }) => {
    const { course } = await test.step('create and fully publish a course', () =>
      coursesSteps.createPublishedCourse(),
    );
    trackCourseForCleanup(course.id);

    await test.step('purchase the course', async () => {
      const response = await coursesApi.purchase(freshUser.accessToken, course.id);
      await assertions.assertPurchaseCreated(response, { courseId: course.id });
    });

    const response = await test.step("list the user's purchases", () =>
      purchasesApi.list(freshUser.accessToken),
    );

    await test.step('verify the purchase appears in the history', async () => {
      const list = await assertions.assertPurchasesList(response);
      assertions.assertPurchasesListContains(list, { courseId: course.id });
    });
  },
);

test(
  '[PURCHASE-04] Validating an already-used promo code returns invalid',
  { tag: ['@purchases'] },
  async ({ coursesApi, coursesSteps, promoCodesApi, adminAccessToken, freshUser, trackCourseForCleanup }) => {
    const { course } = await test.step('create and fully publish a course', () =>
      coursesSteps.createPublishedCourse(),
    );
    trackCourseForCleanup(course.id);

    const promoCode = await test.step('create a promo code for the course', async () => {
      const payload = testData.createPromoCodePayload();
      const response = await promoCodesApi.create(adminAccessToken, course.id, payload);
      return assertions.assertPromoCodeCreated(response, payload);
    });

    await test.step('purchase the course with the promo code, consuming its usage', async () => {
      const response = await coursesApi.purchase(freshUser.accessToken, course.id, promoCode.code);
      await assertions.assertPurchaseCreated(response, {
        courseId: course.id,
        promoCode: promoCode.code,
      });
    });

    const response = await test.step('validate the same promo code again as the same user', () =>
      coursesApi.validatePromo(freshUser.accessToken, course.id, promoCode.code),
    );

    await test.step('verify it is now reported as already used', () =>
      assertions.assertPromoInvalid(response, 200, 'You have already used this promo code'),
    );
  },
);
