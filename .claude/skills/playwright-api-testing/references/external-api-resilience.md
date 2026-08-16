# Working with third-party and unstable APIs

## Principle

Some APIs under test are genuinely outside your control: public services, shared demo instances, rate-limited providers, or stores with real eventual consistency. Tests still need to be reliable — but "reliable" here means asserting things that are actually always true, not retrying harder until a specific, possibly-arbitrary expectation happens to match.

## Two situations that both look like "flakiness" but need different fixes

1. **Our own eventual consistency.** We just created or changed something, and reading it back immediately can return stale data or a `404` because the backend hasn't caught up yet. This is legitimately handled with bounded polling (`expect.poll`/`toPass` — see `test-design-assertions-isolation.md` for the mechanics) against *our own* resource.
2. **Data or behavior we don't control.** A public API's results change over time, a shared demo instance is being used by other consumers concurrently, or a provider enforces a rate limit. Retrying doesn't fix this — the fix is to assert an **invariant** (something structurally true regardless of the exact data) instead of an exact value that can legitimately drift.

Treating situation 2 like situation 1 — polling a public search endpoint until its results happen to match a hardcoded expectation — is polling toward a target that may never stabilize, and produces a test that's flaky in a different, more confusing way.

## Examples from the course project

- **`newsapi`** is a real, live, rate-limited (free-tier) third-party news search. Results for a given query change day to day and total counts drift over time. Assert invariants instead: `totalResults` is a positive number, the response matches its schema, every returned article has the expected fields present and correctly typed — not an exact count or an exact first-result title, both of which will eventually break for reasons that have nothing to do with the code under test.
- **`fakeapi-platzi`** is a shared public demo instance. Other people (including other course participants) may be creating/deleting products at the same time your tests run. Avoid asserting a total item count, or "this exact offset always returns this exact item," unless the test scopes itself tightly enough to only look at data it created and owns.

## Rate limits

Don't send more requests than necessary against a free-tier or public endpoint just because a parameterized suite technically could. Before scaling up a parameterized test's data set against a rate-limited API, check whether the provider's limits actually allow the request volume the suite is about to generate. If the API returns a `429`/rate-limit response, that behavior deserves its own dedicated test rather than something to silently retry around.

## No delete/cleanup endpoint available

If the third-party or shared API has no way to remove what a test created (or the test's credentials aren't scoped to safely use one that exists), don't invent an endpoint and don't silently skip cleanup — say so explicitly, in a comment on the test and in any review/report, so the limitation is visible rather than hidden. See also `cleanup.md`.

## Transient network errors are a different problem than a wrong assertion

A bare connection reset or DNS blip is not a signal that the assertion itself is wrong. Use Playwright's own request-retry options, or a small, explicit retry wrapped tightly around the specific network call (clearly distinguished in the code from any business-logic polling) — don't loosen an assertion to paper over an occasional network hiccup, since that quietly widens what the test will accept forever, not just during the flaky network moment.

## If the project is GraphQL (or mixed)

The same distinction applies: our own eventual consistency on a mutation we just made vs. externally-owned/shared data behind the same single endpoint. Rate limits and missing-mutation-for-cleanup cases are just as common with GraphQL APIs as with REST ones.
