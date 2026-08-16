# Project analysis (always read first)

This is step 1 for every task, in every mode except a pure Explain of something you already know from earlier in the same conversation. It exists so the rest of this skill adapts to the target project instead of imposing this skill's own defaults.

## 0. Check for an existing map before building your own

Look for `CLAUDE.md`, `AGENTS.md`, `.cursorrules`, `.github/copilot-instructions.md`, or a `README` with a testing section at the project root. If one exists, it usually already answers most of the checklist below — use it, and only fall back to manual inspection for what it doesn't cover or where it looks stale (compare a couple of its claims against the actual files before trusting it fully).

## 1. Runner, versions, and capabilities

Don't assume a feature is available just because this skill recommends it.

- Read `package.json`: `scripts` (is there a `test` script, or does the project run `npx playwright test` directly? some projects — including the course project — have no `test` script at all), `dependencies`/`devDependencies` for `@playwright/test`, `typescript`, `zod`, `@faker-js/faker`, or an HTTP client if one is used instead of Playwright's own `request`.
- Check the installed `@playwright/test` version (`package.json`/lockfile, or `node_modules/@playwright/test/package.json`). Version gates real behavior differences, e.g.:
  - Native `test(name, { tag: [...] }, fn)` tag objects need Playwright ≥ 1.42 — on an older version, tags embedded in the title string (`` `${name} @smoke` ``) plus `--grep` may be the only option, and that's not a worse choice there, just the available one.
  - `test.step`'s `{ box: true }` option, newer matchers, etc. — same logic: confirm before recommending.
- Check `tsconfig.json` (`target`, `module`, `experimentalDecorators`) before suggesting anything that depends on it (e.g. the `@step` decorator pattern from OOP-style controllers needs decorator support).
- Check Node's version if it's pinned (`.nvmrc`, `engines` field) — matters for `fs/promises`, top-level await, etc., though these are stable everywhere reasonably current.
- If a version or capability can't be confirmed confidently, default to the safer/older syntax, or ask.

## 2. Directory layout and naming

- `testDir` in `playwright.config.ts` and any per-project `testDir` overrides.
- How tests are grouped: by sub-project/service (the course project: `tests/fakeapi-platzi`, `tests/newsapi`, `tests/conduit` — three unrelated APIs, each with its own conventions, deliberately not sharing code), by resource/endpoint, or by feature.
- File naming convention actually in use (the course project is inconsistent: `products.api.spec.ts`, `conduit.tests.spec.ts`, `user-controller.spec.ts` — note whichever pattern dominates *the specific area you're touching*, don't invent a fourth one).
- One-class-per-file / one-concern-per-file conventions already followed (the course project's controllers: file name matches class name, PascalCase).

## 3. The API wrapper layer — name and shape

Find whatever this project calls the layer that wraps `request.get/post/put/delete(...)` calls (Controllers, Clients, Services, Repositories, or nothing at all — some projects call `request` directly in every test, which is also a legitimate choice for a small suite). See `api-abstraction-layer.md` once you know which shape applies here.

## 4. Fixtures

Find the project's fixture file(s) (commonly `fixtures.ts`/`*-fixtures.ts` next to or under the tests). Note: whether fixtures are chained via `test.extend()` (and how many levels deep), whether `mergeTests` is used, which fixtures are meant to be overridden via `test.use()` (and whether they're correctly declared as `[value, { option: true }]` — see `fixtures.md`), and whether cleanup is handled by an auto-fixture, a hook, or manually per test.

## 5. Contract / schema validation

Is there a schema library in use at all (Zod, Joi, TypeBox, ajv, generated types from an OpenAPI spec)? If several sibling projects/services exist in the same repo, check whether schema validation is adopted consistently or only in some of them (the course project: yes in newsapi, partially in fakeapi-platzi, not in conduit at all) — that unevenness is often intentional (a deliberate style choice per sub-project, or simply not gotten to yet) and not something to "fix" without being asked.

## 6. Test data

Factory functions, builder classes, fixture-provided data, hardcoded literals, or a mix. Check for an existing randomization/uniqueness convention (the course project: `@faker-js/faker` + a random numeric suffix) before introducing a different one.

## 7. Auth

How does an authenticated request get its credentials: a fixture that logs in per test, a cached token (file or in-memory), a `storageState`, an explicit token parameter threaded through method calls, or something else? Check whether more than one pattern coexists in the same repo (the course project does: a fixture-based sign-up+login flow for most Conduit tests, and an older, separate `LegacyUserController` that takes an explicit token — both are real and in use; see `auth.md`).

## 8. Setup / seed data and its idempotency

`globalSetup`/`globalTeardown` and Playwright Project Dependencies (a `*-setup` project matched via `testMatch` and consumed via `dependencies: [...]`) are the two supported mechanisms — check which one(s) the target project uses and for what (a health-check ping vs. actual data seeding are different jobs and can use different mechanisms, as they do in the course project: `global.setup.ts` pings an endpoint, `conduit-setup` seeds articles). If you're the one adding seed/setup logic, make it idempotent (check-before-create) so re-running the suite doesn't duplicate data.

## 9. API protocol style

Confirm REST vs. GraphQL vs. gRPC vs. a mix before writing anything — the rest of this skill's guidance defaults to REST framing (status codes, per-endpoint schemas) because that's what most Playwright API-test codebases (including the course project) actually are, but don't assume it. Signals: a single POST-only endpoint with a `query`/`mutation` string and `variables` in the body usually means GraphQL, where a `200` response can still carry an `errors` array — check the body, not just the status, in that case.

## 10. Project maturity

- **Greenfield** — no or almost no existing tests, template/boilerplate only. More latitude to establish structure; this skill's defaults are a reasonable starting point, but confirm direction with the user before scaffolding broadly.
- **Existing** (the default assumption, and what the course project is) — has real tests, fixtures, and conventions already. Detect and mirror them; this is what "rule zero" in the main `SKILL.md` is mostly about.
- **Legacy** — stale dependencies, no recent history, no active-maintenance signal, or the user says it's frozen/inherited. Maximum conservatism: smallest possible footprint, don't "modernize" existing patterns even if you know a better one, avoid touching shared/central files, no incidental cleanup.

## What to do with what you found

Once you've walked this checklist, you should be able to answer, for the specific area of the repo you're about to touch: what's the closest existing test to copy the shape of, what layer/fixture/schema/factory already exists that you should reuse, and which reference file(s) from the routing table in `SKILL.md` are actually relevant to the task. If two things you found conflict, or nothing in the repo gives a clear signal, that's exactly the case for asking a short clarifying question rather than guessing — see "When to ask vs. decide independently" in `SKILL.md`.
