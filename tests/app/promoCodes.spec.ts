import { test } from './fixtures/fixtures';
import * as assertions from './assertions';
import * as testData from './testData';

test(
  '[PROMO-01] Creating a promo code for a course',
  { tag: ['@promoCodes', '@smoke'] },
  async ({ coursesSteps, promoCodesApi, adminAccessToken, trackCourseForCleanup }) => {
    const course = await test.step('create a course', () => coursesSteps.createCourse());
    trackCourseForCleanup(course.id);

    const payload = testData.createPromoCodePayload();

    const response = await test.step('create the promo code', () =>
      promoCodesApi.create(adminAccessToken, course.id, payload),
    );

    await test.step('verify the created promo code', () =>
      assertions.assertPromoCodeCreated(response, payload),
    );
  },
);

test(
  '[PROMO-02] Listing promo codes for a course',
  { tag: ['@promoCodes'] },
  async ({ coursesSteps, promoCodesApi, adminAccessToken, trackCourseForCleanup }) => {
    const course = await test.step('create a course', () => coursesSteps.createCourse());
    trackCourseForCleanup(course.id);

    const [first, second] = await test.step('create two promo codes', async () => {
      const payloadA = testData.createPromoCodePayload();
      const payloadB = testData.createPromoCodePayload();
      const [responseA, responseB] = await Promise.all([
        promoCodesApi.create(adminAccessToken, course.id, payloadA),
        promoCodesApi.create(adminAccessToken, course.id, payloadB),
      ]);
      return Promise.all([
        assertions.assertPromoCodeCreated(responseA, payloadA),
        assertions.assertPromoCodeCreated(responseB, payloadB),
      ]);
    });

    const response = await test.step('list the course promo codes', () =>
      promoCodesApi.list(adminAccessToken, course.id),
    );

    await test.step('verify both promo codes appear in the list', async () => {
      const list = await assertions.assertPromoCodesList(response);
      assertions.assertPromoCodesListContains(list, { id: first.id });
      assertions.assertPromoCodesListContains(list, { id: second.id });
    });
  },
);

test(
  "[PROMO-03] Toggling a promo code's active status",
  { tag: ['@promoCodes'] },
  async ({ coursesSteps, promoCodesApi, adminAccessToken, trackCourseForCleanup }) => {
    const course = await test.step('create a course', () => coursesSteps.createCourse());
    trackCourseForCleanup(course.id);

    const promoCode = await test.step('create a promo code (active by default)', async () => {
      const payload = testData.createPromoCodePayload();
      const response = await promoCodesApi.create(adminAccessToken, course.id, payload);
      return assertions.assertPromoCodeCreated(response, payload);
    });

    await test.step('deactivate the promo code', async () => {
      const response = await promoCodesApi.toggleActive(adminAccessToken, course.id, promoCode.id);
      await assertions.assertPromoCodeToggled(response, false);
    });

    await test.step('reactivate the promo code', async () => {
      const response = await promoCodesApi.toggleActive(adminAccessToken, course.id, promoCode.id);
      await assertions.assertPromoCodeToggled(response, true);
    });
  },
);

test(
  '[PROMO-04] Deleting a promo code removes it from the list',
  { tag: ['@promoCodes'] },
  async ({ coursesSteps, promoCodesApi, adminAccessToken, trackCourseForCleanup }) => {
    const course = await test.step('create a course', () => coursesSteps.createCourse());
    trackCourseForCleanup(course.id);

    const promoCode = await test.step('create a promo code', async () => {
      const payload = testData.createPromoCodePayload();
      const response = await promoCodesApi.create(adminAccessToken, course.id, payload);
      return assertions.assertPromoCodeCreated(response, payload);
    });

    const response = await test.step('delete the promo code', () =>
      promoCodesApi.remove(adminAccessToken, course.id, promoCode.id),
    );

    await test.step('verify the deletion succeeded', () =>
      assertions.assertPromoCodeDeleted(response),
    );

    await test.step('verify it no longer appears in the list', async () => {
      const listResponse = await promoCodesApi.list(adminAccessToken, course.id);
      const list = await assertions.assertPromoCodesList(listResponse);
      assertions.assertPromoCodesListExcludes(list, promoCode.id);
    });
  },
);

const discountScenarios = [
  { id: 'PROMO-05', price: 200, discountPercent: 25, expectedFinalPrice: 150 },
  { id: 'PROMO-06', price: 150, discountPercent: 20, expectedFinalPrice: 120 },
  { id: 'PROMO-07', price: 80, discountPercent: 5, expectedFinalPrice: 76 },
  { id: 'PROMO-08', price: 50, discountPercent: 100, expectedFinalPrice: 0 },
  { id: 'PROMO-09', price: 120, discountPercent: 10, expectedFinalPrice: 108 },
];

for (const scenario of discountScenarios) {
  test(
    `[${scenario.id}] ${scenario.discountPercent}% off a $${scenario.price} course costs $${scenario.expectedFinalPrice}`,
    { tag: ['@promoCodes'] },
    async ({ coursesApi, coursesSteps, promoCodesApi, adminAccessToken, freshUser, trackCourseForCleanup }) => {
      const course = await test.step('create a course with the scenario price', async () => {
        const created = await coursesSteps.createCourse();
        const updateResponse = await coursesApi.update(adminAccessToken, created.id, {
          price: scenario.price,
        });
        assertions.assertStatus(updateResponse, 200);
        return created;
      });
      trackCourseForCleanup(course.id);

      const promoCode = await test.step('create a promo code for the scenario discount', async () => {
        const payload = testData.createPromoCodePayload({
          discountPercent: scenario.discountPercent,
        });
        const response = await promoCodesApi.create(adminAccessToken, course.id, payload);
        return assertions.assertPromoCodeCreated(response, payload);
      });

      const response = await test.step('validate the promo code as a signed-in user', () =>
        coursesApi.validatePromo(freshUser.accessToken, course.id, promoCode.code),
      );

      await test.step('verify the discount calculation', () =>
        assertions.assertPromoValid(response, {
          discountPercent: scenario.discountPercent,
          originalPrice: scenario.price,
          finalPrice: scenario.expectedFinalPrice,
        }),
      );
    },
  );
}
