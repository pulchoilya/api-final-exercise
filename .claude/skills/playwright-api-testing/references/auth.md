# Authentication in tests

## Principle

Tests need some way to obtain an authenticated request context. The mechanism varies by project (a fixture that logs in per test, a token cached to a file with a validity check, Playwright's `storageState`, an explicit token threaded through method calls) — and more than one mechanism can legitimately coexist in the same repo, often from different eras of the same project.

## Detect before adding a new mechanism

Find how the target project currently authenticates before introducing a different approach. If it already has one working pattern, extend that one rather than adding a second unless the task specifically calls for something the existing pattern can't do.

## The course project has two coexisting patterns — both real, both in use

1. **Fixture-based (the current default for new Conduit tests).** The `request` fixture in `tests/conduit/helpers/fixtures.ts` signs up a fresh random user and logs in, then returns an `APIRequestContext` with the auth header already set via `extraHTTPHeaders`. The header format is `Authorization: Token <token>` — not `Bearer` — because that's what Conduit's API actually expects. **The exact scheme (`Token`/`Bearer`/something else) always comes from the target API itself** (checked via DevTools Network tab or docs), never assumed from a different project's convention.
2. **Explicit-token (older, still exercised directly in `tests/conduit/user-controller.spec.ts`).** `LegacyUserController` takes `token: string` as an explicit parameter on `login`, `getCurrentUser(token)`, `updateUser(token, userData)`, rather than baking the token into a fixture-provided context.

Prefer the fixture-based approach for *new* tests. Don't rewrite the Legacy-based ones to match unless the task is specifically about that — see "adapt, don't impose" and the project-maturity guidance in `SKILL.md`; a working older pattern sitting next to a newer one is not automatically a defect.

## Negative/edge cases worth covering, whichever mechanism is in play

- **Missing token** → typically `401`.
- **Invalid/malformed token** → typically `401`.
- **Expired token** → `401`; if the app has a refresh flow, confirm it's actually exercised by some test, not just assumed to work.
- **Valid token, insufficient permission for this specific resource (role-based)** → typically `403`, a genuinely different failure mode from "not authenticated at all" — assert the specific code, don't lump every auth failure into "some 4xx."
- **The "unauthorized" test suite is actually unauthorized.** Before trusting a `test.use({ isAuthorized: false })`-style negative-auth block, confirm the fixture it targets is declared with the `[value, { option: true }]` tuple (see `fixtures.md`) — otherwise the override silently no-ops and the "unauthorized" tests may be running fully authorized and passing for the wrong reason.

## Secrets

Password/API-key/client-secret/etc. always come from `process.env`, sourced via `.env` + `dotenv/config` (the course project's pattern) — never a literal in a fixture, controller, or test file, even for a "throwaway" test account. `.env` stays in `.gitignore`.

## Role-based testing (an extension the course project doesn't need yet)

When a task genuinely needs more than one role/permission level, an enum or constant map of known test users (`STANDARD`/`ADMIN`/`READER`/...) fed into an overridable `user`-style fixture is the natural extension — add this scaffolding only when a task actually needs it, not preemptively "in case it's useful later."

## If the project is GraphQL (or mixed)

Auth is typically still a header (or occasionally a cookie/session) attached to the single POST endpoint — the mechanisms and negative cases above still apply unchanged; only the transport detail differs.
