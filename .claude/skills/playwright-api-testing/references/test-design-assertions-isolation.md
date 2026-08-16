# Test structure, assertions, and isolation

## Structure: one Act per test

Arrange → Act → Assert. The Act is one action. A test that creates, reads, updates, and deletes under a title like "create product" is really four tests wearing one name — when it fails, the title alone can't tell you which part broke. If a scenario genuinely needs a prior entity to exist, that's Arrange (setup), not a second Act to also verify.

## Naming

The name states the goal and what's being verified, not the HTTP method — `post users` says nothing useful; `create user with admin email should receive admin response` tells you what would fail and why. If you can't tell what would fail just from reading the name, rename or split the test.

## `test.step` for readable reports

Wrap the request and each meaningful check in `test.step('...', async () => { ... })`. The course project doesn't use `test.step` in its current tests, but it's a low-cost improvement worth introducing in new or rewritten ones — the HTML report becomes a readable sequence of named steps instead of one opaque pass/fail block, which matters a lot once a test has more than a couple of checks. If you use the `{ box: true }` option (collapses a step's internal errors to point at the call site), confirm the installed Playwright version supports it first (see `project-analysis.md`).

## Tags

Native tag objects — `test(name, { tag: ['@smoke', '@regression'] }, fn)` — need Playwright ≥ 1.42; the course project's installed version (`@playwright/test` ^1.61.0) supported them at the time of writing. Its *existing* tests instead embed tags as strings inside the title (`` `${tags.smoke}` ``) and filter via `--grep` on the title text — a valid, working, if older-style approach that predates the native feature. Prefer native tags for genuinely new test files where you're free to choose the style in the moment (they support proper include/exclude/AND combinations that string-matching in a title can't), but don't rewrite the existing tag style across the repo as an unrelated refactor.

## Assertion depth: status, body, *and* headers

A test that only checks `response.status() === 200` can't tell you the endpoint returned garbage. Depending on what the surrounding suite already does, either:

- check status + body + relevant headers together in one focused test, using `expect.soft(...)` for each field so a run reports *every* mismatch instead of stopping at the first, or
- split into one test per endpoint that confirms the "shape" of a successful response (status, status text, key headers) — reused via `failOnStatusCode: true` everywhere else — plus separate tests per meaningfully distinct body-content scenario.

Both are legitimate; match whichever pattern the tests around the one you're adding already use.

## A `500` is a defect, not an expected negative-case status

An HTTP `500` means the server crashed processing the request — that's a bug in the system under test in effectively every case, including when the client sent a deliberately malformed request (a well-behaved API should reject bad input with a `4xx`, not fall over). If a negative test currently has to expect `500` because that's genuinely what the target API does today, write it explicitly as `failOnStatusCode: false` plus `expect(status).toBe(500)`, and say clearly in the test/PR that this is documenting a known defect, not the desired contract — don't let a `500` quietly read as "the negative case worked as intended."

## Coverage checklist (apply what's relevant, not everything mechanically)

- Required field missing — ideally one parameterized test covering each required field, not one test per field copy-pasted.
- Invalid-type value for a field.
- Non-existent resource id.
- Duplicate create, for resources where uniqueness/idempotency matters.
- Pagination edges: offset `0`, an offset past the end of the data, a zero/negative limit.
- Sorting correctness — actually verify order, don't just check "some order came back":
  ```ts
  let last = 0;
  for (const item of response) {
    expect(item.price, `sort order broken at ${item.name}`).toBeGreaterThanOrEqual(last);
    last = item.price;
  }
  ```
- Auth cases — see `auth.md`.

Cover what the endpoint's actual behavior and risk profile call for; don't generate every item on this list for every endpoint regardless of relevance.

## `expect.poll` vs. `toPass` — different retry semantics

- `expect.poll(fn).matcher()` retries a **function** and applies **one matcher** to its latest return value. Use it when waiting for one value to reach an expected state (a status code, a field).
- `expect(async () => { ...assertions... }).toPass()` retries an entire **block** containing its own assertions until all of them pass together. Use it when a whole sequence of related checks needs to hold at once.

Both take `timeout`/`intervals` options. Give either a custom failure message when there's more than trivial logic inside — a bare timeout error doesn't say what it was actually waiting for. See `external-api-resilience.md` for when polling is (and isn't) the right tool at all.

## Isolation and parallel-safety

- Unique data per test (see `test-data-payload-factories.md`) — no test should depend on another test's leftover state.
- No test depends on another test's execution order.
- No shared mutable module-level variable written by more than one test running in parallel — the course project runs with `fullyParallel: true`, so this is a real, not theoretical, risk.
- Safe to re-run the same file repeatedly without manual cleanup between runs — see `cleanup.md`.

## If the project is GraphQL (or mixed)

A GraphQL request can return HTTP `200` with an `errors` array present in the body. Check `body.errors` explicitly (absent/empty on the happy path, present and matching expectations on a negative-case path) — relying on status code alone will miss failures a REST-shaped assertion habit is used to catching via the status.
