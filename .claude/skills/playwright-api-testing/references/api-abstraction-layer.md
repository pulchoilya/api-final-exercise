# The API abstraction layer

## Principle

Wrap raw `request.get/post/put/delete(...)` calls behind typed methods so a test reads as "call the endpoint" rather than "reconstruct the URL, headers, and body every time." This layer can be called Controllers, Clients, Services, Repositories, or something else entirely — the name doesn't matter, the job does. Some very small suites skip it altogether and call `request` directly in every test; that's a legitimate choice too, not an omission to "fix."

## Detect before you build

Look for a folder that groups these classes/functions (the course project: `apps/<project>/Controllers/`), and match its existing naming, one-class-per-file convention, and constructor shape. Don't introduce a competing layer under a different name next to one that already exists — if the project calls this layer "Clients," add a client, not a controller.

## Worked example from the course project (Conduit) — detect the equivalent shape in yours

A tiny base class holds the shared dependency:

```ts
// apps/conduit/Controllers/BaseController.ts
export class BaseController {
  request: APIRequestContext;

  constructor(request: APIRequestContext) {
    this.request = request;
  }
}
```

Resource-specific subclasses add typed methods, one per endpoint, each returning the raw `APIResponse` (not pre-parsed JSON — the caller decides how much of the response it needs):

```ts
// apps/conduit/Controllers/ArticleController.ts
export class ArticleController extends BaseController {
  articlesEndpoint = '/api/articles';

  async getArticles(
    params?: { offset?: number; limit?: number; tag?: string; author?: string; favorited?: string },
    options?: { failOnStatusCode?: boolean; timeout?: number },
  ) {
    return this.request.get(this.articlesEndpoint, {
      params,
      failOnStatusCode: options?.failOnStatusCode,
      timeout: options?.timeout,
    });
  }

  async createArticle(
    article: { title?: string; description?: string; body?: string; tagList: string[] },
    options?: { failOnStatusCode?: boolean; timeout?: number },
  ) {
    return this.request.post(this.articlesEndpoint, {
      data: { article },
      failOnStatusCode: options?.failOnStatusCode,
      timeout: options?.timeout,
    });
  }
}
```

And a facade composes several resource controllers behind one object, for tests that need more than one resource:

```ts
// apps/conduit/Controllers/ApiController.ts
export class ApiController {
  articleController: ArticleController;
  userController: UserController;

  constructor(request: APIRequestContext) {
    this.articleController = new ArticleController(request);
    this.userController = new UserController(request);
  }
}
```

The course project also keeps an older, unrelated `LegacyUserController` that does **not** extend `BaseController` and takes an explicit `token` parameter on each method instead. It's still used directly in one spec file. That's fine — see "don't force a migration" below.

## Method design rules

- Optional fields via `?` on the parameter's inline type (`title?: string`), not `title: string | undefined` — the latter still forces the caller to pass something, even if it's `undefined`.
- An `options?: { failOnStatusCode?, timeout?, ... }` second parameter, matching Playwright's own request-options shape, is the recommended way to let a caller override behavior per-call without every method growing an unbounded parameter list. The course project's controllers already thread `failOnStatusCode`/`timeout` this way; a further `isCleanup?: boolean` (to opt a created entity into an automatic teardown queue) is a reasonable upgrade worth proposing only when a task actually needs it — the course project's controllers don't do this today.
- Return the raw response by default (`APIResponse`, not parsed JSON), so the caller decides what to check (status, headers, body) instead of the method deciding for it.
- Never smuggle authentication into a controller method. The controller receives an already-configured `request: APIRequestContext` (with auth headers baked in by whatever produced it — see `auth.md`); it has no opinion on how that happened.
- Store the endpoint path as a class property (`articlesEndpoint = '/api/articles'`), not repeated as a string literal in every method — one place to update if the path changes.

## Composition vs. inheritance — depth limit

- `BaseController` → one concrete resource controller is the right amount of inheritance for the shared-constructor case.
- A facade (`ApiController` above) that **composes** multiple resource controllers as properties is preferable to a class that keeps `extend`-ing a chain of controllers/helpers to accumulate more capability — a `Steps` class needing two unrelated resources should hold an `ApiController` (or equivalent) as a property, not inherit from one controller and hope the other's methods show up too.
- Cap inheritance depth at two levels (`Base` → `Concrete`). A third level (e.g. a `*Steps` class built on top of one concrete controller to add multi-call helper methods) is still reasonable; a fourth is a sign to switch to composition.

## Don't force a migration

Finding an older/inconsistent pattern (like `LegacyUserController` here) next to a newer one is not a bug to fix on its own — prefer the newer pattern for *new* work, and leave the old one alone unless the task is specifically about consolidating it. This is the same "adapt, don't impose" rule applied within a single repo, not just across repos.

## If the project is GraphQL (or mixed)

The same wrapping principle holds, but a method typically builds a `query`/`mutation` string plus a `variables` object and posts both to a single endpoint, rather than choosing a REST path/method per call. Keep the same rules (typed inputs, options-object for overrides, return the raw response) — only the body-construction detail changes.
