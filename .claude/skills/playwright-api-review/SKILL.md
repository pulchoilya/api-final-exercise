---
name: playwright-api-review
description: Use when reviewing or auditing already-written Playwright API tests for quality issues — test isolation, cleanup, assertion depth, fixture/auth misuse, hardcoded secrets, flaky patterns against unstable APIs. Read-only by default; works standalone without any other tool or skill installed. Use playwright-api-testing instead when the goal is to write or extend tests, not review them.
---

# Playwright API test review

Audits already-written Playwright API tests and reports findings. It does not write or fix tests itself unless explicitly asked to apply a specific finding afterward.

## Self-contained by design

This skill works on its own, with nothing else installed:

- `references/review-checklist.md` carries a one-line rationale inline for every check — you don't need anything else to understand *why* a check matters.
- If the sibling skill `playwright-api-testing` happens to be installed alongside this one (both live under `~/.claude/skills/`), you may optionally read its `references/*.md` files for deeper background on a specific finding. This is enrichment only — never assume it's present, and never let its absence change what you can produce.
- If the `ReportFindings` tool is available in this session, use it to emit results. If it isn't, produce an equivalent plain Markdown report (see "Output format" below) so the review is fully usable in any environment.

## Workflow

1. Identify the target: a specific file, a directory, a diff, or "the whole suite" — ask if it's genuinely unclear which.
2. Skim for the project's own architecture and conventions enough to judge findings in context (a pattern that looks unusual in isolation may be exactly how this project does everything). This doesn't need the full depth of `playwright-api-testing`'s project analysis — just enough to avoid flagging an intentional, consistent project convention as a bug.
3. Walk the target file(s) against `references/review-checklist.md`, category by category.
4. For each real finding: file + line, category, a concrete failure scenario (what input or timing actually triggers it — not just "this could theoretically be a problem"), a suggested fix, and a severity.
5. Sort most severe first. Do not pad the list with stylistic nitpicks presented as if they were equally important as a real isolation or cleanup bug.
6. Emit via `ReportFindings` if available; otherwise as Markdown (below).
7. Report-only: do not edit the reviewed files. If asked to also fix what was found, treat that as a separate, explicit request and follow `playwright-api-testing`'s workflow for it (mode: Fix), not this skill.

## Output format (when `ReportFindings` is unavailable)

```
# Review: <target>

N findings — X blocking, Y high, Z medium, W low

## 1. <one-sentence summary> — <severity>
- File: <path>:<line>
- Category: <isolation | cleanup | assertion-depth | fixtures-auth | test-data | structure | resilience>
- Failure scenario: <concrete input/state that actually breaks>
- Suggested fix: <specific, minimal>

## 2. ...
```

If there are zero findings, say so plainly — don't invent minor items to avoid an empty report.

## Severity guide

- **Blocking** — the test doesn't actually verify what its name claims (e.g. an "unauthorized" test that's secretly authorized because of the fixture-tuple bug in `fixtures.md`), or it corrupts shared/other tests' data.
- **High** — a real isolation, cleanup, or assertion-depth gap that will eventually cause a flaky or misleading failure.
- **Medium** — a maintainability or duplication issue (parallel abstractions, hardcoded values that should be generated) that works today but will cost time later.
- **Low** — naming/structure/style, worth mentioning but not urgent.

## What this skill does not do

- It does not assume its own preferences override the project's established conventions — a consistent project-wide pattern is reported as "worth confirming intentional" at most, not as a uniform defect, unless it demonstrably breaks something (see `references/review-checklist.md` for the distinction, e.g. the fixture-tuple check, which is a real functional bug regardless of house style).
- It does not rewrite the suite, restructure files, or apply fixes without a separate, explicit request.
