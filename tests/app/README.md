# Test suite conventions

Applies to every spec file under `tests/app/`. Spec files themselves have no
explanatory comments — this page is the one place for the conventions and
rationale behind how the suite is built.

## Scope: positive/happy-path only

Every test uses valid input from an authorized admin (or, where the endpoint
is public, no auth at all) and asserts a successful response. Negative cases
(validation errors, unauthorized/forbidden callers, not-found ids) are a
deliberately separate follow-up pass — not missing, just out of scope for
this pass.

The one exception is `oauth.spec.ts`: `OAUTH-07`..`OAUTH-13` cover a handful
of grant-type error responses (invalid credentials, invalid secret, unknown
refresh token, etc.) plus one extra positive-path check (a `client_credentials`
token's `/userinfo` reflects the client, not a user). All were migrated in
from legacy pre-convention spec files because they were cheap, deterministic,
and not duplicated anywhere else.

## Known limitations

Two scenarios named in the assignment brief have no test because the API
itself doesn't support them yet:

- **Posts: filter by tags** — `GET /api/posts` takes no query parameters at
  all; it always returns the full published list. `PostsApi.list()` has no
  filter arguments to match.
- **Learning paths: read/update/delete** — `/api/learning-paths` only
  exposes `POST`. There's no list/get/update/delete route, so `LP-01`..`LP-03`
  (creation only) is the full coverage the API currently allows.

## Architecture

- **API Client** (`api/*.ts`) — one class per resource (`CoursesApi`,
  `TagsApi`, ...), extending `BaseApiClient`. Methods return the raw
  `APIResponse` with `failOnStatusCode: false` — assertions decide what
  counts as success.
- **Assertions** (`assertions/*.ts`) — every `expect()` call in the suite
  lives here, one file per resource, re-exported from `assertions/index.ts`.
  Spec files only call assertion functions; they never import `expect`
  directly (except where a test needs an inline one-off check).
- **Steps** (`api/CoursesSteps.ts`) — composes multiple API Client calls into
  one multi-step setup flow (e.g. create a course + add chapters + publish).
  Anything that would otherwise be a helper *function* in a spec file belongs
  here instead.
- **Fixtures** (`fixtures/fixtures.ts`) — dependency injection for API Clients,
  Steps, tokens (including the cached admin token), and `track*ForCleanup`
  queues that tear down created data after each test.
- **Factories** (`testData/factories.ts`) — one `createXPayload()` per
  resource, built on `@faker-js/faker`, with an `overrides` param for
  test-specific values.

## Naming and organization

Every test title is `[ID] Short human-readable name` (e.g. `[COURSES-05] ...`)
with a stable per-resource ID prefix, plus a native Playwright `tag` — one
domain tag per file (`@courses`, `@tags`, ...) and `@smoke` on one
representative test per file. Multi-step test bodies use `test.step` for
each logical phase (Arrange/Act/Assert), not just for narration.
