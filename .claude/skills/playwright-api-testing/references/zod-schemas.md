# Contract validation with Zod (or equivalent)

## Principle

A schema check validates the *shape* of a response in one call, instead of a chain of `toHaveProperty`/`typeof` checks per field. It complements business assertions, it doesn't replace them: schema validation confirms "this looks like a valid response," a business assertion confirms "and it's the *correct* one for this test" (right id, right title, right count). A test that only does the former can pass while checking nothing about whether the actual scenario worked.

## Detect before introducing one

Is a schema library used at all in this project? If there are multiple sibling sub-projects/services in the same repo, check whether adoption is consistent or only partial — that unevenness is often a deliberate per-area choice (or simply "not gotten to yet"), not a gap to silently fill everywhere. The course project: fully adopted in `newsapi`, partially adopted in `fakeapi-platzi` (via a shared helper), not used at all in `conduit`. Don't introduce Zod into `conduit` just because it exists elsewhere in the same repo, unless asked.

## `z.infer` as the single source of truth for types

Don't hand-write a TypeScript type next to a schema that describes the same shape — derive the type from the schema so there is exactly one definition to keep in sync:

```ts
export const userSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  name: z.string(),
  role: z.enum(['admin', 'customer']),
});

// derived, not hand-written
export type UserResponse = z.infer<typeof userSchema>;
```

For a collection, wrap the item schema rather than duplicating its fields:

```ts
export const usersSchema = z.array(userSchema);
export type UsersResponse = z.infer<typeof usersSchema>;
```

## Two valid check styles from the course project — match whichever the surrounding tests use

**`safeParse` + a custom failure message** (`tests/fakeapi-platzi/helpers/assertions.helper.js`):

```js
export function expectValidSchema(schema, data) {
  const result = schema.safeParse(data);
  expect(result.success, { message: result.error?.message }).toBeTruthy();
}
```

**Direct `.parse(body)`** (`tests/newsapi`), which throws immediately on a mismatch — a reasonable choice when you want the test to fail hard right away rather than continue with a soft check.

Either way, always surface *what* didn't match, not just a boolean — pass `{ message: result.error?.message }` (or let `.parse` throw its own descriptive error) into the assertion, so a schema drift shows up in the report as "field X expected number, got string," not "expected true, got false."

## Dead schemas

The course project has one schema file (`apps/json-schemas/Users.ts`) that isn't wired into any test. If you notice something like this, mention it — it might be a placeholder someone's mid-way through connecting — but don't silently delete it unless asked.

## AI-generated schemas

Review manually before trusting one, whether you generated it or found it already in the repo: check it against a real, current API response (not against what a model assumed the shape should be), watch for outdated syntax for the installed Zod version (e.g. `z.string().email()` vs. a newer top-level `z.email()`), and watch for invented constraints not backed by any real validation rule (a password regex nobody asked for is a classic model hallucination here).

## OpenAPI/Swagger, if present

Treat a spec as one input, not the final source of truth — specs drift from the real implementation. Verify against actual responses before encoding a spec's claims into a schema; where they disagree, the real API wins (see source-of-truth priority in `SKILL.md`), and the discrepancy is worth surfacing, not silently resolving in the spec's favor.

## Never do this to make a schema "pass"

Making every field in a schema optional or loosening every type to keep a test green defeats the entire point of contract validation — it stops catching the exact regressions schemas exist to catch. If a field is genuinely optional in the real API, mark only that field optional; if the schema is failing because the response actually changed, that's a real finding to report, not something to paper over.

## If the project is GraphQL

The same principle and `z.infer`-as-source-of-truth approach apply — the schema just wraps the GraphQL response's `data` (and, where relevant, `errors`) shape instead of a REST body.
