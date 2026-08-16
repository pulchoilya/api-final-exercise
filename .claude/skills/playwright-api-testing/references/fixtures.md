# Fixtures

## Principle

A fixture prepares and provides something a test needs — data, an authenticated request context, a ready-to-use controller/client instance. It is not a place to hide a single one-off method call; if something is only ever called once and does nothing before/after, it belongs inline in the test or as a plain function, not a fixture.

## Lazy by construction

```ts
// runs only when a test destructures this key
someValue: async ({}, use) => {
  const data = /* ... */;
  await use(data);
},
```

A fixture declared as a plain property (`someValue: 'x'`) is **not lazy** — Playwright still creates it for every test, whether or not any test asks for it. Always use the `async (..., use) => { ...; await use(x); }` form, even for something that looks like a constant, so it's created on demand and so you have somewhere to put setup/teardown code later without a rewrite.

`use()` is the before/after split: everything before `await use(x)` runs like `beforeEach`, everything after runs like `afterEach` — this applies to any fixture, not only ones marked `auto`.

## Overridable fixtures need the option-tuple form

If a fixture is meant to be changed per test/describe-block via `test.use({ key: value })`, it **must** be declared as a tuple:

```ts
key: [defaultValue, { option: true }],
```

A fixture declared as a plain value (`key: defaultValue`) *looks* like it supports `test.use()` but silently does nothing when overridden — the test proceeds with the original default, and whoever wrote the "negative"/"unauthorized" test may not notice, because nothing errors; the suite just quietly tests the wrong thing. **Check this every time you see a fixture paired with `test.use()`, in any project** — it's an easy, non-obvious mistake to make and an easy one to miss in review.

The course project's own `isAuthorized` fixture in `tests/conduit/helpers/fixtures.ts` gets it right — use it as the positive example to match:

```ts
type MyFixtures = {
  request: APIRequestContext;
  isAuthorized: boolean;
};

export const test = base.extend<MyFixtures>({
  isAuthorized: [true, { option: true }],

  request: async ({ isAuthorized, baseURL }, use) => {
    let token: string | undefined;

    if (isAuthorized) {
      const user = await signUp(baseURL!);
      token = await login(baseURL!, user);
    }

    const apiRequest = await APIRequest.newContext({
      baseURL,
      extraHTTPHeaders: token ? { Authorization: `Token ${token}` } : {},
    });

    await use(apiRequest);
    await apiRequest.dispose();
  },
});

export { expect } from '@playwright/test';
```

Note this fixture signs up and logs in a brand-new random user *per test* rather than caching a token to a file. That's heavier per test but gives full isolation — no shared/stale token, no file-based state to go stale between runs. Caching a token (with a `try`/`catch`-based "re-login on failure" fallback) is worth the added complexity mainly when login itself is slow or rate-limited, or the whole suite intentionally reuses one user across many tests — treat it as an available option, not a required upgrade to this pattern.

Also note `export { expect } from '@playwright/test';` at the bottom — the named re-export, so test files only need one import line for both `test` and `expect`. `export default expect` does not work for this.

## Composing fixture sets: one-level extend-chain vs. `mergeTests`

The course project layers fixtures one level deep: a base file provides the authenticated `request` fixture, and a second file extends it to add ready-made controller instances built from that same `request`:

```ts
// api-fixtures.ts extends fixtures.ts's `test`
export const test = base.extend<Fixtures>({
  articleController: async ({ request }, use) => {
    await use(new ArticleController(request));
  },
  userController: async ({ request }, use) => {
    await use(new UserController(request));
  },
  apiController: async ({ request }, use) => {
    await use(new ApiController(request));
  },
});
```

Use this pattern (`base.extend()` chained one level) when the new fixtures genuinely depend on an existing one, as here — a controller needs the `request` fixture to exist first. Keep it to one level; a long chain of `extend()`s (base → feature → sub-feature → ...) makes it hard to trace where a given fixture actually comes from.

Reach for `mergeTests(fixtureSetA, fixtureSetB)` instead when combining two **independent** fixture files that don't depend on each other and shouldn't need to know about each other (e.g. a users-fixtures file and a products-fixtures file from unrelated parts of the app). `mergeTests` cannot make a fixture in one set depend on a fixture in the other — if you need that, you need the extend-chain instead.

## Dependency cycles

If fixture A needs fixture B, and B needs A, Playwright can't resolve either. Break the cycle by making the lower-level one self-sufficient (e.g. it creates its own `APIRequest.newContext()` rather than depending on the higher-level `request` fixture) rather than trying to thread the dependency both ways.

## Auto-fixtures

`key: [fn, { auto: true }]` runs for every test regardless of whether it's destructured — appropriate for cleanup/teardown that must always happen, wrong for anything that should only run when a test actually asks for it (ordinary data-prep fixtures should stay non-auto).

## Fixtures vs. plain method wrappers

Don't turn every controller method into a fixture "for consistency." A fixture that just does `get()` and returns the first result is a plain helper function or a controller method, not a fixture — fixtures exist for setup/teardown and shared context, not to avoid writing `await someController.get(...)` in the test body.
