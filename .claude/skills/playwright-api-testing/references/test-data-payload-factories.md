# Test data and payload factories

## Principle

Generate data that's realistic enough to exercise the real API and unique enough that parallel/repeated test runs don't collide with each other or with leftover data from a previous run — without hardcoding literals that silently couple one test's success to another's.

## Detect before introducing a new style

Factory functions, builder classes, fixture-provided data, or plain literals — match whichever this project already uses for the resource you're touching. Don't introduce a second construction style (e.g. a builder class) for an entity that already has a factory function; that's the same "parallel abstraction" problem as duplicating a controller or client layer under a different name.

## The course project's pattern: plain factory functions + Faker + a uniqueness suffix

```js
export function createProductPayload() {
  return {
    title: faker.commerce.productName(),
    price: faker.number.int({ min: 10, max: 1000 }),
    description: faker.commerce.productDescription(),
    categoryId: 1,
    images: ['https://placehold.co/600x400'],
  };
}
```

paired with setup/teardown helpers (`createProduct` / `deleteProduct`) called from `beforeEach`/`afterEach` — not a builder class, not a class-based generator. Extend this style for new payloads in the same area rather than introducing a competing one.

## Faker caveats

- There's a small but real chance a Faker-generated email collides with one that actually exists — never send Faker-generated contact data anywhere that could actually deliver mail/SMS/notifications to a real person.
- Faker can generate a value that overflows a field's real length/format limit and cause a request to fail for a reason that has nothing to do with test logic. If a "flaky" failure turns out to be data shape rather than timing, that's the first thing to suspect.

## Uniqueness

Prefer `faker`-generated values, `Math.random()`-based suffixes, or a UUID over `Date.now()` alone — two tests starting in the same millisecond under `fullyParallel: true` can produce the same "unique" value from `Date.now()`, which is exactly the kind of intermittent, hard-to-reproduce collision that erodes trust in the suite. Combining a random suffix with a timestamp is fine; relying on the timestamp alone under real parallelism is not.

## Parameterized test data

The course project currently keeps a plain data array (`tests/newsapi/data/news.data.ts`) indexed directly per test (`newsTestData[0]`, `newsTestData[1]`, ...). A recommended upgrade is to loop the array and embed an `expect` function per row:

```ts
export const testData = [
  { id: 1234, title: 'Generic', expect: (json) => expect(json.length).toBeGreaterThanOrEqual(0) },
  { id: 123, title: 'Gen', expect: (json) => expect(json.length).toBeGreaterThanOrEqual(0) },
];

for (const { id, title, expect } of testData) {
  test(`${id} get by title = "${title}"`, async ({ request }) => {
    const response = await request.get('/resource', { params: { title } });
    const json = await response.json();
    expect(json);
  });
}
```

This avoids an `if/else` cascade of custom assertions per data row, and each generated test gets its own unique, traceable title (the `id` also matters here — Playwright rejects duplicate test titles, so a stable per-row identifier isn't optional decoration). Introduce this upgrade when you're actually writing a parameterized test (several near-identical cases varying by one input) — not as an unrelated refactor of the existing indexed style in a file you're only touching for something else.

## Environment-keyed test data — a fallback, not a default

A `testEnv`/`devEnv`-style object, selected by `process.env.ENVIRONMENT`, is a documented fallback for the case where reference data genuinely can't be created by the test itself (fixed data that only exists on certain environments). Prefer self-contained tests that create their own data by default; reach for this pattern only when that's not possible, and keep the same keys/ids present in every environment's object so a lookup doesn't silently return `undefined` on one of them.

## Secrets stay out of generated payloads

Passwords and other secrets still come from `process.env`, never generated or hardcoded alongside the rest of the payload — the course project does this correctly already (`password: process.env.CONDUIT_PASSWORD!`).
