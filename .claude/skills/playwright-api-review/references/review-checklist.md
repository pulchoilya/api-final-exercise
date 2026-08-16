# Review checklist

Each item includes a one-line rationale so this file is useful without anything else installed. Not every item applies to every test — skip what genuinely doesn't apply rather than forcing a finding.

## Test isolation & parallel-safety

- Unique data per test (no hardcoded ids/emails/titles reused across tests) — prevents collisions under parallel execution and pollution between runs.
- No test reads or depends on another test's side effect or execution order — suites must survive being run in any order, any subset, any shard.
- No shared mutable module-level variable written by more than one test — a race between parallel workers writing the same variable silently corrupts one of them.
- Safe to re-run repeatedly with no manual cleanup step required between runs — otherwise every rerun after a failed cleanup starts from a dirty, unpredictable state.

## Cleanup

- Entities a test creates are deleted in `afterEach`/an auto-fixture, not at the end of the test body — cleanup placed after assertions never runs if an earlier assertion throws.
- Deletion is verified with a follow-up read, not just trusted from the delete response — a "success" delete response doesn't guarantee the resource is actually gone server-side.
- Cleanup failures are surfaced, not swallowed in an empty `catch` — a silently-failed cleanup becomes an unexplained failure in some unrelated, later test.
- Shared/seeded data (from a setup project or `globalSetup`) isn't deleted as a side effect of a regular test's own cleanup — that corrupts every other test relying on it.
- Where no delete endpoint exists at all, the limitation is called out explicitly in a comment, not silently left unaddressed.

## Assertion depth

- More than status code alone is checked — body and relevant headers too — a `200` with a garbage body still passes a status-only test.
- A `500` is never treated as an acceptable "expected" negative-case status — a server crash from client input is a real defect, however invalid the input was.
- Multi-field checks use `expect.soft` or a schema rather than a single assertion that stops at the first mismatch — otherwise only the first broken field is ever visible in a run.
- Create/update/delete each verify the actual resulting state (a follow-up read), not only the immediate response — the response can be incomplete or wrong about what really happened.

## Fixtures & auth

- Any fixture meant to be overridden via `test.use()` is declared as `[value, { option: true }]`, not a plain value — without the tuple, the override silently does nothing.
- "Unauthorized"/negative-auth test blocks are confirmed to actually produce an unauthenticated request — if the fixture-tuple issue above is present, these tests may be passing for the wrong reason (secretly still authorized).
- A fixture used exactly once with no setup/teardown value is a plain function in disguise — not a defect on its own, but worth a note if it's adding indirection without benefit.
- No dependency cycle between fixtures (fixture A needs B, B needs A) — this either errors outright or forces an awkward workaround.

## Test data & hardcoded values

- No hardcoded secrets, tokens, or passwords anywhere in test files, fixtures, or factories — a real credential leak into version control/CI logs.
- Uniqueness doesn't rely on `Date.now()` alone under parallel execution — two workers can generate the same timestamp in the same millisecond.
- No second, competing payload-construction style (e.g. a builder class alongside an existing factory function) for the same entity — two ways to build the same thing drift apart over time.

## Structure & naming

- Test name states the goal/expected result, not just the HTTP method — without this, a failing test's title tells you nothing about what actually broke.
- One Act per test — a test bundling create+update+delete under one name can't tell you which step failed when it goes red.
- File size and grouping match the suite's own established convention — an unreadably large file is as much a maintainability problem as scattered duplication would be.

## Resilience against third-party/unstable APIs

- Assertions against third-party/shared data use invariants (shape, non-empty, field presence), not exact values that can legitimately drift — exact-value assertions against data you don't control eventually fail for reasons unrelated to the code under test.
- `expect.poll`/`toPass` is used for the app's own eventual consistency, not to force a match against externally-owned, changing data — polling toward a moving target never actually stabilizes.
- No unnecessarily high request volume against a rate-limited/free-tier API — avoidable `429`s make a suite flaky for reasons unrelated to the code under test.

## Protocol-appropriate checks

- For GraphQL-style APIs, `body.errors` is checked in addition to (or instead of) HTTP status — a GraphQL error commonly still returns `200`.

## Severity quick-reference

- **Blocking** — the test doesn't verify what its name claims, or it corrupts shared/other tests' data.
- **High** — a real isolation/cleanup/assertion-depth gap likely to cause a flaky or misleading failure.
- **Medium** — maintainability/duplication that works today but costs time later.
- **Low** — naming/structure/style.
