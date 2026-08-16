---
name: playwright-api-testing
description: Use when writing, extending, or fixing Playwright API tests (REST, GraphQL, or mixed HTTP-API testing via APIRequestContext) — not for browser/UI/E2E Playwright work (use playwright-testing for that). Always analyzes the target project's own architecture first — its API wrapper layer (Controllers, Clients, Services, Repositories, or whatever it's called), fixtures, schemas, and conventions — and follows it rather than imposing a different shape. Covers fixtures, the API abstraction layer, Zod/schema contract validation, test data and payload factories, auth, cleanup, and resilience against unstable third-party APIs.
---

# Playwright API testing

This skill writes and extends Playwright test suites that talk to APIs directly (via `request`/`APIRequestContext`), not through a browser. It is deliberately light on opinions of its own: its job is to find out how the target project already does things and continue that, using the reference files below only to fill in what the project doesn't already answer.

## Cross-cutting principles

### Rule zero: adapt, don't impose

Analyze the target project's actual architecture and follow it. Every reference file under `references/` is one illustration of a general principle, built from one real course project (a three-part Playwright API-testing course: a RealWorld/Conduit-style REST demo app, a public fake-store API, and a public news API — its code isn't included in this skill, only referenced for grounded examples) — never a mandatory shape. That includes the *name* of the API wrapper layer (Controllers in the illustrating project; Clients, Services, Repositories, or something else in yours) and the *protocol* (REST in the illustrating project; GraphQL, gRPC, or a mix in yours). A project doing something differently is not wrong and should not be "corrected" toward the reference files' example.

### Source-of-truth priority

When guidance conflicts, resolve in this order — each level only fills gaps the ones above it leave open, never overrides an explicit signal from a higher one:

1. The current request's explicit instructions.
2. The target project's actual existing architecture (what the code does, observed by inspection).
3. The target project's own written conventions (`CLAUDE.md`/`AGENTS.md`/README/ADRs/lint config).
4. Broader team/org documentation, if the user points to it.
5. This skill's own reference files (the course-derived defaults).
6. General Playwright/TypeScript best practices.

### When to ask vs. decide independently

If working through that list still leaves a genuine tie — the project has two existing conventions pointing in different directions, there's no signal at all on a needed decision, or satisfying the request would mean relaxing a hard constraint below — ask a short, specific clarifying question rather than picking silently. This is about a single task's ambiguity, distinct from "Keeping this skill current" below, which is about this skill's own content going stale over time.

### Project maturity

Assessed in `references/project-analysis.md`; it changes how aggressively to propose structure or touch shared files.

| Maturity | Signals | Behavior |
|---|---|---|
| Greenfield | No/near-zero existing tests | More latitude to establish structure; still confirm direction before scaffolding broadly |
| Existing *(assume this by default)* | Real tests, fixtures, conventions already present | Detect and mirror what's there, at full strength |
| Legacy | Stale deps, no active-maintenance signal, or user says it's frozen | Maximum conservatism: smallest footprint, don't modernize known-suboptimal patterns, avoid touching shared/central files |

### Keeping this skill current

This skill will meet scenarios its reference files don't cover, or guidance that goes stale as Playwright/the ecosystem evolves. When a reference file's guidance conflicts with reality more than once, or a recurring scenario has no home in the routing table below, don't silently improvise the same workaround every time — propose a specific, scoped edit to the relevant file (what changes, why, what prompted it) and apply it only after the user agrees. These files are global and shared across every project that uses this skill.

## Operating modes

Determine this before reading anything else.

| Mode | Triggered by | Behavior |
|---|---|---|
| **Explain** | "why does X work this way", "walk me through", "what would happen if" | Read-only. Analyze and explain; never edit a file unless separately asked, in this turn or a later one. |
| **Create** | a test suite for an endpoint/resource with no existing coverage | Full workflow below, including deciding whether new fixtures/abstraction-layer classes/schemas are warranted. |
| **Extend** | "add a case to this suite" — the most common request | Mirror the existing file's/suite's conventions tightly; minimal new abstraction. |
| **Fix** | "this test is failing/flaky", "why did this break" | Diagnose the root cause first — don't just retry harder or loosen an assertion. Smallest change that addresses the cause. Surface a short plan first if the cause is architectural (a shared fixture, a base controller). |
| **Refactor** | "clean this up", "reduce duplication", "restructure" | Most conservative mode: no behavior change, smallest footprint, always state the plan before editing, never bundled with unrelated Create/Extend work in the same pass. |

## Workflow

1. Determine the mode (above).
2. Read `references/project-analysis.md`. Check for the target project's own `CLAUDE.md`/`AGENTS.md` first — it often already answers most of what that checklist asks. As part of this step: detect installed Playwright/TypeScript/Node versions and relevant config before assuming any version-gated feature is usable; detect the API protocol style (REST/GraphQL/gRPC/mixed); assess project maturity.
3. Identify which sub-project/module/service the task belongs to and find its closest existing analogous test — mirror *that*, not a different module's or a different repo's style.
4. Read only the reference files the task actually touches, using the routing table below.
5. Decide reuse vs. a new abstraction (fixture, controller/client method, factory, schema) as a **default guideline, not a hard rule**: lean toward reuse; a new one is easiest to justify when it's used repeatedly or encapsulates real complexity (auth, cleanup, multi-step setup) — but a single-use abstraction is still fine when it matches the project's existing grain, or the logic is genuinely complex enough to deserve isolation. Equally avoid a speculative abstraction added "just in case" with no current second use and no real complexity behind it.
6. If step 2–5 left a genuine tie or no signal, ask (see "When to ask vs. decide independently") rather than guess.
7. If the mode is Explain, stop here — produce the analysis/explanation, no file writes. Otherwise, state a short plan before writing for anything non-trivial or ambiguous.
8. Implement, matching the target module's existing style, naming, and protocol (e.g. for GraphQL, check the response body's `errors` array, not just HTTP status).
9. Discover and run the narrowest relevant test command from the target's own `package.json`/config. Don't assume `npm test` exists — the course project has no such script; it runs `npx playwright test <path> --project <name>` directly.
10. Run lint/typecheck only if scripts for them actually exist in the project.
11. Fix failures, re-run.
12. Report: files changed, commands actually run and their results, and any pre-existing limitation you deliberately left untouched.

## Routing table (read only what's relevant)

| Task touches... | Read |
|---|---|
| *(always, first)* | `references/project-analysis.md` |
| a new/changed endpoint wrapper or method (whatever the project calls that layer) | `references/api-abstraction-layer.md` |
| a new custom fixture, auth context, lazy setup | `references/fixtures.md` |
| response shape/contract checking | `references/zod-schemas.md` |
| new payload, randomized data, parameterized cases | `references/test-data-payload-factories.md` |
| login/token/roles/permission scenarios | `references/auth.md` |
| entity creation that needs teardown | `references/cleanup.md` |
| a third-party/public API with rate limits, uncontrolled shared data, no delete endpoint, or flaky network behavior | `references/external-api-resilience.md` |
| test structure, assertions, positive/negative/boundary cases, isolation | `references/test-design-assertions-isolation.md` |

## Hard constraints

- No parallel abstraction for a layer (API wrapper, fixture, factory, schema) that already exists under a different name in this project.
- No hardcoded secrets or tokens — environment variables only, and never printed/logged.
- No fixed-timeout waits for eventual consistency — `expect.poll`/`toPass` instead (see `references/test-design-assertions-isolation.md` and `references/external-api-resilience.md`).
- Never make an entire schema optional just to make a test pass.
- Never couple tests to execution order or to shared mutable state written by more than one test.
- Never silently swallow a cleanup failure.
- Don't refactor or rename unrelated files "for consistency" while doing something else.
- Never recommend or use a Playwright/TypeScript feature without first confirming the installed version supports it.
- Ask before a large refactor or adding a new dependency.
