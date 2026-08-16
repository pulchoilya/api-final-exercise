# Cleanup

## Principle

Clean up what a test creates, so the suite stays independent and safely repeatable. And verify the cleanup actually worked — trusting a delete response's own claim ("success: true") isn't the same as confirming the resource is actually gone.

## Detect before adding a new mechanism

Manual `beforeEach`/`afterEach` pairs, an auto-fixture cleanup queue, or nothing at all yet — match what's already there for the resource you're touching.

## The course project's pattern: manual `beforeEach` create / `afterEach` delete

```js
test.beforeEach(async ({ request }) => {
  const { product } = await createProduct(request);
  createdProduct = product;
});

test.afterEach(async ({ request }) => {
  await deleteProduct(request, createdProduct.id);
});
```

## Gap worth closing in *new* delete tests (not a mandate to rewrite existing ones)

The existing `deleteProduct` helper only checks the delete response body:

```js
export async function deleteProduct(request, id) {
  const response = await request.delete(`products/${id}`);
  expect(response.status()).toBe(200);
  expect(await response.json()).toBe(true);
}
```

It never follows up with a `GET` to confirm the resource is actually gone. When you write a *new* test whose point is deletion, add that follow-up check (`GET` on the deleted resource → expect `404`/an equivalent not-found response) — a delete endpoint can return a happy response without the underlying data actually being removed, and that's exactly the class of bug this check exists to catch.

## `afterEach` over "cleanup at the end of the test body"

`afterEach` runs even when an earlier assertion in the test throws. Cleanup code placed after assertions inside the test body itself never runs if something earlier fails — that's how a suite quietly accumulates orphaned data every time a test happens to fail.

## An available upgrade: auto-fixture cleanup queue

A fixture that collects created-entity ids into a queue and deletes them all after the test (`[fn, { auto: true }]`) removes the need to remember a manual `afterEach` per test file. The course project doesn't use this pattern yet — it's a reasonable upgrade for a suite that creates a lot of entities across many files, not a requirement at the course project's current scale.

## Never silently swallow a cleanup failure

If a delete call itself fails during teardown, don't wrap it in an empty `catch` that hides the error — surface it. A silently-failed cleanup doesn't disappear; it becomes an unexplained failure in some *other* test later (a uniqueness collision, an unexpected extra row in a list), with no trace back to its actual cause.

## Don't clean up data you don't own

The course project seeds shared data once via Playwright Project Dependencies (`conduit-setup` runs before `conduit` and creates a handful of articles used across the main suite). A regular test's own cleanup must never delete or mutate that shared seed data as a side effect — only clean up what that specific test created.

## When there's no delete/reset endpoint at all

Sometimes the API under test genuinely has no way to remove what a test created (common with public/third-party APIs — see `external-api-resilience.md`). Don't fabricate an endpoint that doesn't exist, and don't just skip cleanup silently either — call it out explicitly (a comment in the test, and a note in any review/report) so the limitation is visible rather than hidden.
