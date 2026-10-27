---
name: env-branch-release
description: Use when shipping a change to a long-lived environment branch (qa, staging, team1, uat, play, preview…) instead of the default branch, or releasing the default branch to such a branch across several dependent services, e.g. "release this to qa", "put PR 123 on team1", "release main to staging", "deploy this branch to uat". Confirms the source, carries only the commits that branch is missing, follows the repo's own naming conventions, merges with a merge commit, and verifies the deploy is live before releasing the next service.
---

# Release to an Environment Branch

## Overview

Many teams deploy from long-lived **environment branches** (`staging`, `qa`, `team1`…) that are *not* copies of the default branch. They carry their own fixes, reverts and half-finished QA work. Releasing to one means one of two things:

- **Carry a change:** take a PR's or branch's *own* commits onto a fresh branch cut from the environment branch, then PR and merge it into that branch.
- **Release the default branch:** open a PR from the default branch into the environment branch and merge it with a merge commit. Across services, do this in dependency order, and verify each deploy before the next.

**Core principle:** confirm the source, carry only what's missing, and prove the deploy before moving on.

## When to Use

- "Release X to qa / team1 / staging / uat".
- A PR merged to the default branch also needs to reach a QA environment.
- A feature branch needs a QA environment before it's merged.
- Several services must be released together, and one depends on another's new endpoint.

Not for: production releases with their own tooling (app stores, release trains), or force-resetting an environment branch.

## 1. Learn the repo's conventions first

```bash
git fetch origin --prune
gh repo view --json defaultBranchRef -q .defaultBranchRef.name
git branch -r | grep -E 'origin/(staging|qa|uat|play|preview|team[0-9]+)$'
gh pr list --base <env> --state merged --limit 10 --json number,title,headRefName,body
```

Copy what the last ten PRs into that branch do: **branch names** (`<ticket>-<env>`, `<env>-<ticket>-<slug>`…), **title format** (`[QA] : TICKET: title`), and **body** (usually the original PR's body, with a note about anything extra carried). Never invent a new format.

## 2. Confirm the source (always ask)

| Situation | Ask |
| --- | --- |
| A PR or ticket was named | Show every PR that matches (a ticket often has several) and confirm which to carry |
| The user is on the **default branch** and named nothing | "Release all of `<default>` to `<env>`, or a specific PR?" Offer the most recent merged PRs |
| The user is on a **feature branch** | "Release `<branch>` (N commits not on `<default>`) to `<env>`?" Show the commits |

Don't touch anything until the user confirms.

## 3. Work out exactly what to carry

- **A merged PR:** its own commits (`gh pr view <n> --json commits`), or its squash/merge commit (`mergeCommit.oid`; cherry-pick a true merge with `-m 1`).
- **A feature branch:** `git log --reverse --no-merges --format=%H origin/<default>..<branch>`. **Never** use `origin/<env>..<branch>`, which drags in everything on the default branch that the env branch lacks.
- **Skip what's there:** `git cherry -v origin/<env> <sha>` (a `-` line is already on the env branch).
- **Prerequisites:** for the files the commits touch, `git log --oneline origin/<env>..origin/<default> -- <files>` lists earlier changes the env branch lacks. If the change builds on one, say which and ask whether to carry it too. Note it in the PR body ("Also carries #123, which `<env>` didn't have").

## 4. Build, check, PR, merge

```bash
git worktree add -b <branch-per-convention> <scratch>/release-<env> origin/<env>
git -C <scratch>/release-<env> cherry-pick -x <shas oldest first>
```

1. **Conflicts:** stop and resolve them with the user. A conflict usually means a missing prerequisite.
2. **Check:** run the repo's own typecheck, lint and nearby tests in the worktree after a frozen-lockfile install.
3. **PR:** push, then `gh pr create --base <env>` with the house title and body.
4. **Merge:** use a merge commit, never a squash (`gh pr merge <n> --merge`). If an automated guard blocks the merge, hand the user the exact command and wait.
5. **Confirm:** `git cherry -v origin/<env> <last sha>` shows only `-` lines.
6. **Clean up:** remove the worktree.

Use a worktree so the user's checkout, often mid-work on the default branch, is never touched. Use `git -C <worktree>` for every git command.

## 5. Releasing the default branch to an env branch, across services

1. **Order by dependency.** The service that *provides* a new endpoint, schema or token claim goes first, and its consumers follow. Write the order down before starting (for example: identity → backend API → client API → frontends).
2. For each service: check how far ahead and behind it is (`gh api repos/<o>/<r>/compare/<env>...<default>`). If the env branch is *behind* nothing but has commits of its own, merge rather than replace. Then `gh pr create --base <env> --head <default>` and merge with a merge commit.
3. **Verify the deploy from outside, by behaviour.** Probe something that answers differently before and after the change. A new route returns 401 without a key, where an unknown route returns 503 or 404. A version endpoint returns the new SHA. A header or field appears.

   ```bash
   for i in $(seq 1 60); do
     a=$(curl -s -o /dev/null -w '%{http_code}' -X POST https://<host>/api/new/route)
     n=$(curl -s -o /dev/null -w '%{http_code}' -X POST https://<host>/api/does-not-exist)
     [ "$a" != "$n" ] && { echo "live: new=$a unknown=$n"; break; }; sleep 20
   done
   ```

   A health check passing is **not** proof the new code is live.
4. Only release the next service once the previous one is verified.

## 6. Report

Give the PR links, what was carried (marking prerequisites), check results, merge state, and how each deploy was verified. Never say "deployed" without the evidence from step 5.

## Traps

| Trap | Fix |
| --- | --- |
| Env branches aren't subsets of the default branch | Compute the carry from the source side, never by diffing against the env branch |
| Reusing an old release branch for a ticket | Cut a fresh one (`-2`, `-3`) from current `origin/<env>` |
| A consumer released before its provider calls a route the env doesn't have yet | Release in dependency order, and probe the provider first |
| A rejected or blocked command may still have run | Check `gh pr view <n> --json state` before retrying |
| A commit hook blocks plain `git commit` while the main checkout is on the default branch | `git -C <worktree> …` |
| Squash-merged PRs have no individual commits on the default branch | Cherry-pick the squash commit |
| Wording a branch as "nothing deploys from it" when production just isn't wired up yet | Say what's true: "meant to deploy to production; not set up yet" |
