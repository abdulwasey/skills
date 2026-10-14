---
name: code-design
description: Use when deciding how to structure or simplify code in any language - whether to extract or inline, add a helper or reuse one, hand-write a type or derive it, where a file or component belongs, what to name something, whether a guard or abstraction should exist, or how to verify and commit the result. Also use when asked "why" behind a review rule or when code "works but feels wrong".
---

# Code Design Principles

## Overview

The principles underneath an opinionated review checklist, each with the
reason behind it. For the React / React Native / TypeScript checklist that
applies them, see the `react-review` skill in this repo. Examples are
TypeScript; the principles aren't.

**Core principle:** reuse what exists, derive from the source of truth, and
delete anything that earns nothing.

## The Principles

| # | Principle | One-line test |
|---|---|---|
| 1 | Reuse before you write | Did you search for it first? |
| 2 | Every line earns its place | What breaks if this line is deleted? |
| 3 | The code is the documentation | Would a better name replace the comment? |
| 4 | Derive types from the source of truth | If the API changes, does this break loudly? |
| 5 | Fix causes, not symptoms | Is this a patch over a wrong type or missing behaviour? |
| 6 | One concern per unit, one owner per effect | Does this file do one thing? Is there one place that does this? |
| 7 | Names say what things do | Can you state what it does that the name doesn't? |
| 8 | Build what's needed now | Is there a second caller today? |
| 9 | Verify before you claim | Which command proved it? |
| 10 | Small, specific commits | Does each commit say one thing? |
| 11 | Safe by default | What happens if this runs by accident, or config is missing? |
| 12 | Decide in the open | Did the person who owns the decision see it? |

## 1. Reuse before you write

The cheapest code is code that already exists and is already tested. New
helpers that duplicate old ones split behaviour: one gets the bug fix, the
other doesn't. Search for the hook, helper, component or util before writing
it; "fetch X by id", debounce, clipboard, timers and test mocks are the usual
reinventions. If the product has a sibling app (web ↔ mobile), its version of
the screen usually answers the design question already.

Search for the concept and the body, not a name you'd have chosen: the usual
misses are near-duplicates (a second date formatter, a second phone
normaliser). Copy the nearest existing pattern instead of inventing one.

Reuse scales up too. Prefer a well-known package or platform primitive over
hand-rolled infrastructure, and give every new dependency a one-line reason:
what it replaces and what you rejected. Keep **one canonical version** of each
UI primitive (one `Button`, one `Card`); extend it with a variant rather than
forking it or restyling it from outside.

Reuse also governs **placement**: shared code lives where every consumer can
reach it, and shared code never imports from a consumer.

## 2. Every line earns its place

A name for a value used once is an indirection the reader has to resolve. A
helper with one call site is a jump. Code nothing calls (an unused prop, a
leftover debug log, a file with no importers) is pure cost: delete it. A default every caller overrides, a
`?? undefined` on an already-optional value, a ternary that returns
`undefined` instead of `false` — all noise.

The extraction threshold is **three uses**. Below that, inline. At three,
extract, and look hard for three: copy-paste across sibling functions is
invisible when you read top to bottom and obvious when you read side by side.

```ts
const isAdmin = user.role === Role.Admin;     // read once
if (isAdmin) { ... }

if (user.role === Role.Admin) { ... }          // same thing, one less name
```

Splitting over-built code across more files is not simplifying it; deleting it
is. Brief a refactor as "replace X with Y", with the behaviour that must
survive listed up front.

Exception: a value whose **identity** matters (a memo dependency, a config
object passed to a library that compares by reference) stays hoisted. That
is a reason, so it's allowed.

## 3. The code is the documentation

Add zero comments. A comment is a confession that the name or the shape isn't
saying enough; fix that instead. Comments also rot silently, while code that
lies fails a test. Two corollaries:

- Editing someone else's comment counts as adding one: restore its wording or
  delete it.
- A comment that *does* something (a lint suppression, a type-checker pragma)
  is code. Delete it and you owe the fix it was suppressing.

## 4. Derive types from the source of truth

Hand-written mirrors of server types drift silently. Derive them:

```ts
type OrderRow = Pick<OrderDto, 'id' | 'total'> & { status?: OrderDtoStatusEnum };
```

Generated code is read-only. A missing field there is a **spec bug**: fix the
API spec (OpenAPI, GraphQL schema...) and regenerate, rather than casting around it in twenty places. Use
enum members instead of the string literals they stand for, in tests as well.
A hand-written string union compared in many places wants to be an enum; a
two-member union used once in its own file can stay. No `any`; a cast that
quiets the compiler is a type you haven't derived yet.

The same goes for data: read the canonical record (join, select, cache) rather
than storing a copy that drifts. Copy data only to record a point in time (the
price on an invoice when it was issued).
And don't paper over an empty config or CMS field with default content in code;
the empty state should be visible.

## 5. Fix causes, not symptoms

- **A guard on a magic value** usually stands in for behaviour the function
  should have. `if (page > 0) return []` says "this isn't paged" while the
  caller pages it. Implement paging and the guard disappears. Reformatting the
  guard into an early return just makes the wrong claim louder.
- **Coercion is a symptom; the wide type is the cause.** A narrowing helper
  that rescues `role: string` treats the symptom. Name the real fix (narrow the
  type at its source) and its blast radius.
- **Trace a value to its consumer** before calling a change correct. Filtering
  a paged result changes what an empty page means downstream.
- **Never silence the signal.** A `catch` that returns a fallback must still
  surface the error; a suppressed lint or type error must be fixed, not hidden;
  a flaky test gets a real wait condition, not a longer timeout. Don't bypass
  hooks or guards to get green.
- **Before blaming the change, run something it didn't touch.** If an untouched
  test fails the same way, it's the environment.

Then report the severity you actually believe. Worst-case framing is not rigour.

## 6. One concern per unit, one owner per effect

Why: a unit with one job can be named, found, tested and deleted on its own,
and an effect with one owner can't be done twice or done differently.

- One component (or class, or module) per file, named after it. This applies
  once something has *earned* extraction (principle 2); a single-use fragment
  stays inline. Extracting to the top of the same file only moves clutter; the
  extraction is finished when it has its own file and takes its private types
  and constants with it.
- Components, not render functions: a component has a props type, a name in
  the profiler, and named arguments.
- Each side effect has **one owner**: one module talks to the network, one place
  sets a given piece of state, one layer holds secrets. Everything else calls it
  through a thin, typed wrapper.
- Keep the logic that decides things **pure** (input → output, no I/O) and
  push I/O to the edges. Pure logic is where the tests go.
- Respect layer boundaries (screen → container → component, or endpoint →
  service → repository). Don't skip a layer to save an import.
- Don't repeat work another layer already does: if the mutation already
  invalidates the cache, the call site doesn't.
- When a contract is shared across repos or apps (route lists, schemas,
  enums), change both sides in the same piece of work.

## 7. Names say what things do

`unwrap` (what, into what?), `getPrimaryName` (of what?), `toRole` (it parses,
it doesn't map), `isAlso...` (also than what?). Flag a name only when you can
state what the thing does and the name doesn't. Rename freely when the blast
radius is local; for exported names, raise it and let the owner decide.

## 8. Build what's needed now

Implement what was asked. Every speculative piece is code someone must read,
test and eventually delete. No abstraction before the third use (principle 2),
no parameter without a caller that varies it, no option nobody sets, no
tracking table or audit log nobody will read, no feature flag nobody asked for
(safety flags on external writes, principle 11, are asked for by default). Don't
reach into fragile shared wiring (build config, module federation, global
providers) to make one feature easier; read why it is the
way it is first.

## 9. Verify before you claim

State only what you checked, with the command that checked it. "Tests pass"
means you ran them. Scope checks to what you touched (one test file, the
changed files' lint) and leave full suites to CI, but run a real typecheck
after touching a shared type. After a scripted edit, prove nothing else
changed. If something changed that you didn't do, say so plainly; don't guess
at a culprit. If verification was blocked, say exactly what wasn't verified.

Tests are verification too, so they must test behaviour: wait on conditions,
not timers; mock at the system boundary, not your own pure helpers; assert
what a user would observe.

Output from another agent or tool is a lead, not a finding. Check it before
you repeat it. UI work needs eyes: look at the rendered screen.

Diff against the **merge-base**, not the tip of a moving base branch, or you'll
report other people's commits as yours.

## 10. Small, specific commits

Small commits are reviewable, revertable and bisectable; a catch-all commit
is none of those. Split work along concern boundaries: one coherent change per commit, in
dependency order, each one building on its own, with its tests in the same
commit. No file split across two commits. Messages are terse and specific
and state the resulting behaviour or rule, not the activity:
`fix(orders): an empty status filter means all orders`, not `fix filter bug`
or `cleanup`. No body unless it's needed; no boilerplate trailers.
Work on a branch, never directly on the default branch. A reviewer should be
able to read the log as a list of decisions.

## 11. Safe by default

- **Secrets live in one layer** (the server, the native side, the keychain) and
  never reach the client bundle, logs, notifications, or shipped builds.
- **Config fails fast.** No fallback hosts or keys in code; a missing value
  should crash at startup, not silently point at the wrong place. Tests use
  obviously fake hosts.
- **The dangerous path is opt-in.** External writes ship behind a flag that
  starts off; scripts default to dry-run; bulk or destructive data changes need
  explicit approval, and approval of a rule isn't approval to rewrite existing
  data.
- **The server is the authority.** Client-side permission checks mirror what
  the server enforces; they never replace it, and they gate on the same rule.
- **Writes survive retries and races.** Make creates idempotent, re-read
  before a conditional write, and retry on conflict instead of overwriting.
- **Failure paths do nothing.** When unsure, deny, skip, or print nothing; never
  auto-approve.

## 12. Decide in the open

The person who owns the code owns its trade-offs, and a choice they never saw
is one they can't correct. For non-trivial work, plan before editing and list
the judgment calls before acting on them. Once the owner decides, raise a concern once, then do what was
asked.

## Red Flags

| Thought | Principle |
|---|---|
| "I'll add a quick helper / hook for this" | 1, 8: search first; under three uses means inline |
| "A short comment will clarify it" | 3: rename or reshape instead |
| "I'll cast; the generated type is missing the field" | 4: the spec regressed |
| "I'll tidy this guard into an early return" | 5: should the guard exist? |
| "This extracted component is only used here, it can live in this file" | 6: one unit per file |
| "I'll invalidate here too, to be safe" | 6: one owner per effect |
| "Each of these functions looks fine" | 2: read them side by side |
| "It should work" | 9: run it |
| "One commit for everything" | 10: split it |
| "I'll default it so it works locally" | 11: fail fast |
| "I'll just run the write, it's probably fine" | 11: dry-run first, ask |
| "The agent said so" | 9: verify it |
