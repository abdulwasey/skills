---
name: react-review
description: Use when reviewing or refactoring a React, React Native, or TypeScript pull request — cleaning up a diff before requesting review, responding to "this is messy, clean it up" feedback, auditing components, hooks, screens or E2E specs for pattern compliance, or checking a PR for comments, one-use consts, render functions, hand-rolled API types, or duplicated query hooks.
---

# React / React Native PR Review & Refactor

## Overview

An opinionated checklist for reviewing and refactoring React, React Native and
TypeScript code. Every rule came out of a real review round; apply them
proactively so they are not raised against you.

**Core principle:** reuse what exists, depend on generated types, and delete
anything that earns nothing.

The reasoning behind these rules lives in the `code-design` skill in this repo.
This is the checklist; that is the why.

In real reviews the most frequent findings, in order, are: dead code, weak
tests, re-implementing something that exists, and single-use names. Look for
those first.

## Quick Reference

| Smell | Fix |
|---|---|
| Unused var, prop, const, import, debug log, or a file with no callers | Delete it. Add things when a caller needs them. |
| Comment added in a PR diff | Delete it. The diff adds **zero** comment lines. |
| `const X = ...` used once or twice | Inline it. Extract only at **3+** uses. |
| The same 8-line block pasted in 3 sibling functions | The rule cuts both ways: extract it. |
| `if (page > 0) return []` | A magic guard standing in for behaviour the code should just have. |
| Client-side `.filter()` on a paged fetch result | It shrinks the page; check what the consumer reads as "no more". |
| `PAGE_SIZE_A = 10` and `PAGE_SIZE_B = 10` in one file | One const, or inline. |
| `const x = cond ? undefined : (<jsx/>)` | `const x = !cond && (<jsx/>)`. |
| Nested or multi-line ternary | Early return, a lookup map, a `switch`, or sibling `cond && <X/>` blocks. |
| 30 lines of JSX in a local `const`, used 2+ times | Extract a component, **into its own file**. |
| A second component appearing above the default export | One component per file. Give it a sibling `.tsx`. |
| `renderFoo()` called in JSX | Module-scope component with named props. |
| `renderFoo(a, b, c, d, e)` | Positional args are unreadable: named props. |
| Local `interface` mirroring an API DTO | `Pick<>` / `Omit<>` from the generated client. |
| `'ACTIVE'` string literal for an API value | The generated enum member, in app code and in tests. |
| `type Mode = 'a' \| 'b'` compared to `'a'` inline in several places | Make it an `enum`; compare against members. |
| `as Foo & { field?: string }` to reach a missing field | The spec regressed. Fix the spec and regenerate. |
| `any`, or an `as` cast to quiet the compiler | Derive the real type. Strict mode, no `any`. |
| `fetch` / a raw HTTP client in a component | A data hook in the query layer that wraps the generated client. |
| Query data copied into `useState` or a global store | Read it from the query cache. Server state lives in one place. |
| New hook for "fetch X by id" | Grep the query layer first. It usually exists. |
| `invalidateQueries` at a mutation call site | Check the hook's `onSettled` first. |
| `await mutateAsync()` wrapped in `try/catch` | `mutate()` with `onSuccess` / `onError`; the shared mutation hook already handles errors. |
| Business logic in the component body | Move it into the owning hook or util. Components stay thin; logic stays testable. |
| `useEffect` that copies props/query data into state, or two effects that could be one | Derive the value during render or handle it in the event handler. |
| `?.`, `?? 0`, or an `if (!x)` on a value the types already guarantee | Delete the guard. It hides real bugs. |
| Unrelated formatting or drive-by edits in the diff | Revert them. Keep the PR scoped. |
| `useQuery` / `useMutation` imported directly | Use the project's query wrapper hooks, if it has them, in the folder they live in. |
| Query key built inline | Register it in the key factory. An inline key sits outside the factory's prefix, so the hook's invalidation never reaches it. |
| Async screen with only the happy path | Loading, empty and error states too. |
| Validation logic in JSX handlers | The form's schema validator. |
| `if (status === 403) toast(...)` chains at each call site | One error-to-message mapper; one clearly named predicate per status (`isForbidden`, `isNotFound`). |
| `catch` that returns a fallback and nothing else | Surface or report the error too. A silent catch hides real breakage. |
| `process.env.X ?? 'https://...'` | No fallback hosts or secrets. Fail at startup when config is missing. |
| A token, key or PII reaching the client bundle, a log, or a toast | Keep secrets in one server-side layer; redact logs. |
| `style={{...}}` / a new styling system in a utility-class codebase | The project's styling convention (e.g. Tailwind classes, conditional classes via `cn()`). |
| Raw hex or one-off px value | The design token. If none exists, add the token first. |
| Raw `<button>` / a legacy button in new code | The project's current design-system `Button`. |
| `className` restyling a design-system primitive, or a forked copy of it | Add a variant to the one canonical component. |
| Raw `fontWeight` / ad-hoc weight classes | The type scale's weight classes (raw weights drop emphasis on Android with custom fonts). |

| `unwrap`, `getPrimaryName`, `toFormData` | Name says nothing. Rename if the blast radius is local. |
| `a ?? b ?? undefined` where `b` is already optional | Drop the dead `?? undefined`. |
| `page: number = 0` that every caller already passes | Dead default. Remove it. |
| `function Foo() {}` | Arrow function, if the project prefers them (most lint configs that do, enforce it). |
| Removed `// eslint-disable-next-line` | You now owe a fix for the lint error it suppressed. |

## Rules That Bite

### 1. Zero comments in the diff
Not "fewer comments": **zero added lines matching** `^\+\s*(//|/\*|\*|\{/\*)`.
Code that needs a comment needs a better name or a smaller function. The "why"
goes in the commit message or PR description. Existing comments in the file are
not permission to add more. Editing a
pre-existing comment counts as adding one: restore the original wording or
delete the whole block. Check with the command in Verify Before You Claim.

### 2. One-use anything gets inlined; three uses get extracted
Consts, helpers, handlers, single-use JSX builders. Threshold is **3 uses**.
**Count the references before arguing**: `grep -c` the identifier in the file.

The tell that makes it certain: the aliased expression is *also* written inline
elsewhere in the same file. Then the alias provably earns nothing.

```tsx
const isAdmin = role === 'admin';            // one reference
return isAdmin ? 'Edit user' : 'View user';
...
{isOpen && role === 'admin' && (             // the same test, inline
```

A reference inside a `useMemo` / `useCallback` dependency array counts as half.
Two real reads plus a dep entry is a keep; one read is not.

Exceptions that stay at module scope:
- An object or array passed as a prop or hook dependency that must be
  **referentially stable** (chart config, a library `styles` object, a
  `useEffect` dep). Inlining it re-creates it on every render.
- In React Native, a style value with no utility-class equivalent
  (`{ shadowOpacity: 0 }`, `{ elevation: 0 }`), when inlining it would trip
  `react-native/no-inline-styles`.

**The threshold cuts both ways, and the second direction is the one that gets
missed.** Every rule above detects *over*-extraction; none detects copy-paste,
so a reviewer reading top to bottom slides straight past three identical blocks
in three sibling functions. Read the file's functions side by side, not in
sequence:

```tsx
value: user.id!,    label: (<AvatarLabel avatar={user.avatar!} name={...} />)
value: owner?.id!,  label: (<AvatarLabel avatar={owner?.avatar!} name={...} />)
value: member.id!,  label: (<AvatarLabel avatar={member.avatar!} name={...} />)

const toUserOption = (id: string, person: PersonSummary) => ({ ... });
```

Two near-identical blocks are under the threshold: leave them. Three are not.
Don't create a new file or constants module for a short list used in one place.
And if a new *shared* hook or helper seems needed, propose it in a sentence
before writing it.
Sibling consts holding the same value under two names (`USER_PAGE_SIZE` and
`TEAM_PAGE_SIZE`, both `10`) are the same smell in miniature.

### 3. Components, not render functions
Three cases. Only the third is a smell:

| Case | Example | Verdict |
|---|---|---|
| Called once in JSX | `{renderHeader()}` | Inline the JSX |
| Required by an API | `FlatList renderItem`, a table library's `Cell`, a select's `renderOption` | Keep the function |
| Repeated or parameterized | `.map(renderRow)`, `renderChevron(...)` | Module-scope component |

An in-component render function is recreated every render, has no props type,
is invisible to the profiler, and forces positional args at the call site.
Don't "fix" the API-required case.

A JSX **value** held in a local `const` is the same smell in a different hat.
If it is more than a few lines and is consumed more than once (rendered inline
*and* passed down as a prop), it is a component:

```tsx
const typeSelector = !isEditMode && (<fieldset> ...30 lines... </fieldset>);

interface UserTypeFieldsetProps {
  value?: UserType;
  onChange: (value: UserType) => void;
}
const UserTypeFieldset: React.FC<UserTypeFieldsetProps> = ({ value, onChange }) => (
  <fieldset> ... </fieldset>
);
```

**The extraction is not finished until the component is in its own file.**
Hoisting it to module scope in the consumer only moves the clutter up thirty
lines; the reviewer still opens one file and finds two components. One
component per file, named after the component, as a sibling the consumer
imports by path. Take its private supporting cast with it: the props interface
and any `const X_OPTIONS` nothing else references.

`cond ? undefined : (<jsx/>)` is always `!cond && (<jsx/>)`. `ReactNode`
accepts `false` and `{false}` renders nothing, so they are identical to the
runtime and the type checker. (Watch the React Native exception: `{0 && ...}`
renders a bare `0` outside `<Text>` and crashes; make the condition a boolean.)

### 4. Depend on generated types
Hand-rolled row/DTO mirrors go stale silently. Derive them:

```ts
export interface OrderRow extends Pick<OrderDto, 'id' | 'total' | 'createdAt'> {
  status?: OrderDtoStatusEnum;
}
```

Hand-written string unions are the same defect one level down. A local
`type Mode = 'list' | 'grid'` whose members are compared against inline literals
in more than one place should be an enum. A two-member union used once inside
its own file can stay a union.

If the generated client emits real enums, use the member, never the literal,
in app code **and in tests** (`status: 'ACTIVE' as never` should be
`OrderDtoStatusEnum.Active`).

Generated clients are **do not edit**. A field the API serves but the client
lacks is a **spec regression**: fix the spec and regenerate, don't scatter
`as X & { field?: string }` casts. Check the default branch to see whether the
field used to exist.

### 5. Grep before you add
Before writing any new query hook, helper, or component, search for an existing
one. Debounce hooks, "fetch X by id", date and phone formatting, feature-flag
readers, breakpoint hooks, copy-to-clipboard, countdown timers, and typed mocks
for the API client get reinvented constantly. Search for the **concept and the
body** (`toISOString`, `replace(/\D/g`), not just a name you'd have picked.
Copy the nearest existing pattern in the codebase rather than inventing a new one.

Placement is part of the rule. In a monorepo: used by several apps → the shared
package; used by one → that app. A shared package never imports from an app.

### 6. Don't double-invalidate
Mutation hooks usually invalidate in `onSettled`, and key factories match by
**prefix** (an `orders` root key already covers `list`, `detail`, `notes`). A
call-site `invalidateQueries` is redundant unless the hook has **no**
`onSettled`. Read the hook before adding one.

### 7. Deleting a lint-suppressing comment means fixing the lint
`// eslint-disable-next-line` is load-bearing. Removing it ("zero comments"!)
obligates you to fix the underlying error. If the repo keeps a suppression
baseline file, fixing a grandfathered violation may also require pruning it or
CI goes red.

### 8. Ask whether the guard should exist before you tidy it
A guard on a magic value is usually a stand-in for behaviour the function was
supposed to have. Reformatting it (ternary to early return) makes the magic
number *louder*, not clearer, and it is the easy move that feels like progress.

```tsx
page > 0 ? [] : options.filter(...).map(...)   // "this list isn't paged"
if (page > 0) { return []; }                    // same claim, bigger font
```

But the consumer *is* paging it. So page it, and the guard disappears along
with the magic number and the unbounded first page:

```tsx
const matches = options.filter(...).map(...);
return matches.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
```

The test for the old guard (`page 1 resolves to []`) still passes, because that
was always a consequence of the behaviour rather than the behaviour itself.
When a guard genuinely belongs, it is an early `return`, not the head of a
multi-line ternary.

### 9. A filter after a paged fetch changes what "no more pages" means
Filtering a fetched page client-side shrinks it, and the paginating consumer
usually infers "nothing left" from an empty or short result
(`hasMore = data.length > 0`). A page whose every row was filtered out stops
the infinite scroll even though the server has more.

Trace the value all the way to the consumer before calling such a filter
correct, and say plainly how likely the bad case is. Report the severity you
actually believe, not the worst one you can construct.

### 10. A name that says what the thing does
Flag a name only when you can state what it actually does and the name does not.

| Name | Problem | Fix |
|---|---|---|
| `unwrap` | unwrap *what*, to *what*? | `unwrapWireValue` |
| `getPrimaryName` | primary name of what? | `getPrimaryContactName` |
| `toUserRole` | `to*` implies mapping; it *narrows a string* | `parseUserRole` |
| `isAlsoAdmin` | "also" relative to what? | `isEditedUserAnAdmin` |
| `toFormData` | which form? | `toInviteFormData` |

Rename freely when the blast radius is local (module-private helpers, file-local
consts). For an exported symbol used across packages, raise it and let the
author decide; a rename touching twelve files is its own PR.

### 11. Coercion is a symptom; the wide type is the cause
A runtime narrowing helper added to survive an over-wide field
(`role?: string` on a hand-rolled type) treats the symptom. Say so, name the
blast radius of narrowing the type at its source, and let the author choose.

### 12. Tests exercise behaviour
- No fixed sleeps or longer timeouts to beat a flake: wait for a real condition
  (web-first assertions, `waitFor`) and compare with a passing sibling test.
- Mock at the API boundary (typed client mocks), not pure helpers.
- Assert what the user sees, not internals; no tautological or negative-only
  assertions; cover the error path; share fixtures instead of copying them.

### 13. Check the sibling platform for parity
If the product has a sibling app (web ↔ mobile), read the equivalent screen
there before designing behaviour. It usually answers the question.

## Verify Before You Claim

State only what you have checked, with the command that checked it.

**Zero added comments**, diffed against the merge-base (never the base branch's
moving tip, which reports its new commits back at you as if they were yours):

```bash
BASE=$(git merge-base origin/main HEAD)
git diff "$BASE" -U0 --diff-filter=ad -- . ':!**/generated/**' ':!**/openapi/**' \
  | grep -cE '^\+\s*(//|/\*|\*|\{/\*)'
```

Must print `0`. If the PR is stacked on another branch, use that branch as the
base (`gh pr view <n> --json baseRefName`), or read `gh pr diff <n>`. Adjust the
excluded paths to wherever generated code lives. Count references before
inlining (`grep -c 'name' File.tsx`); search before adding
(`grep -rnE 'use\w*(ById|Debounce)' src`).

- **Scope checks to the files you touched**: one test file, lint and format the
  changed files. Full suites are CI's job. But run a real typecheck
  (`tsc --noEmit`) after changing a shared type; lint won't catch it.
- After a codemod or scripted edit, prove nothing else changed.
- If an edit you did not make appears in the working tree, say so plainly.
- **Before blaming the diff** for a red test, run an untouched sibling file
  (see `environment-drift.md`). Before blaming it for red CI, compare the stack
  frames with a recent default-branch run.
- **UI changes need eyes**: screenshots on every affected platform and
  viewport. For paging changes, scroll a real list.
- **Review agents' output is a lead, not a finding.** Verify each item and mark
  what you couldn't. Review agents never check out branches or write to the
  working tree; use `git diff` / `git show` or a separate worktree.

## Writing the Review

- When one issue occurs at several sites, list every site (or say "same at
  L12, L40, L77"). The author fixes all of them, not the one you quoted.
- Back each finding with evidence: the existing helper's path, the reference
  count, the line the value flows to.
- Tier the findings: must-fix vs nit. Report the severity you believe.

## Common Mistakes

- **Migrating between two button components and mistranslating props.** Diff
  the two props interfaces before touching call sites: test-id prop casing
  (`testId` vs `testID`), icon props (element vs icon definition), size and
  variant names, padding flags, and default font weight all drift between
  generations of a design system. A dropped test id breaks E2E page objects
  silently.
- **Renaming a button label** breaks E2E helpers that tap the literal text.
- Bypassing project wrappers (`fetch`, `process.env`, deleted color tokens,
  raw E2E locators). Read the custom lint rules once.

## Red Flags: Stop

- "I'll add a short comment explaining this" → no.
- "This const documents the magic value" → used once? Inline it.
- "I'll write a small helper for this one call site" → inline it.
- "Each of these three functions is fine on its own" → read them side by side.
- "I'll flip that ternary into an early return" → first ask why the guard is
  there at all.
- "I extracted it to module scope, that's cleaner" → not done. Own file.
- "It's only used by this one file, so it can live here" → true of almost every
  component. Not a reason.
- "I'll add a hook for fetching X by id" → grep first.
- "The generated type is missing the field, I'll cast" → check the default branch.
- "I'll invalidate here to be safe" → read the hook's `onSettled`.
- "I'll bump the timeout, it's just flaky" → find the real wait condition.
- "I'll default the env var so it works locally" → fail loudly instead.
- "The agent flagged it, so it's a finding" → verify it first.
- "Tests pass" without having run them → run them or say you didn't.
