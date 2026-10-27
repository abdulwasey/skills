---
name: env-branch-release
description: Use when a repo deploys from long-lived environment branches (qa, staging, team1, uat, play, preview…) and the user asks to carry a PR or branch onto one, or to release the default branch into one across several dependent services, e.g. "release this to qa", "put PR 123 on team1", "release main to staging". Confirms the source, carries exactly the selected change, follows the repo's own naming and permitted merge method, and verifies each deploy before releasing the next service. Not a substitute for an existing release tool or pipeline.
---

# Release to an Environment Branch

## Overview

Many teams deploy from long-lived **environment branches** (`staging`, `qa`, `team1`…) that are *not* copies of the default branch. They carry their own fixes, reverts and half-finished QA work. Releasing to one means one of two things:

- **Carry a change:** apply exactly one PR's or branch's change to a fresh branch cut from the environment branch, then PR and merge it into that branch.
- **Release the default branch:** PR a frozen snapshot of the default branch into the environment branch and merge it. Across services, go in a safe order and verify each deploy before the next.

**Core principle:** confirm the source, carry exactly what was chosen, and prove the deploy before moving on.

## When to Use

- "Release X to qa / team1 / staging / uat", in a repo where that branch is what deploys.
- A PR merged to the default branch also needs to reach a QA environment.
- A feature branch needs a QA environment before it's merged.
- Several services must be released together, and one depends on another's new endpoint.

Not for: production releases with their own tooling (app stores, release trains, deploy pipelines with parameters), or force-resetting an environment branch.

## 1. Learn the repo first

Resolve and write down: host, `owner/repo`, the remote that points at it (often not `origin` in a fork), the default branch and the environment branch.

```bash
repo=<owner/repo>; remote=$(git remote -v | awk -v r="$repo" '$2 ~ r && /\(push\)/ {print $1; exit}')
git fetch "$remote" --prune
gh repo view "$repo" --json defaultBranchRef,mergeCommitAllowed,squashMergeAllowed,rebaseMergeAllowed
gh api "repos/$repo/rules/branches/<env>"                 # required checks, linear history, merge queue (403 on some plans)
gh pr list -R "$repo" --base <env> --state merged --limit 10 --json number,title,headRefName,body
```

- **Is `<env>` really what deploys?** Check the deploy config (platform settings, `vercel.json`, `render.yaml`, CI deploy jobs). A branch name alone doesn't prove it.
- **House style:** copy what the last ten PRs into that branch do for **branch names** (`<ticket>-<env>`, `<env>-<ticket>-<slug>`…), **title** (`[QA] : TICKET: title`) and **body** (usually the original PR's body, plus a note about anything extra carried). With no history, propose a simple format and say so.
- **Branch rules:** if the rules API is unavailable, try `gh api "repos/$repo/branches/<env>/protection"`; if that's unavailable too, treat the rules as unknown and read any merge error in full.
- **Merge method:** use one the repo allows. Releasing the default branch over and over needs merge commits, so the env branch keeps the default branch's history. If the rules forbid merge commits, explain that and stop. Never suggest turning protection off or using `--admin`.

## 2. Confirm the source

| Situation | Do |
| --- | --- |
| The user named a PR, ticket or branch | Resolve it. If it matches exactly one PR or branch, state it and go on. If a ticket has several PRs, show them all and ask which to carry |
| The user is on the **default branch** and named nothing | Ask: "Release all of `<default>` to `<env>`, or a specific PR?" Offer the most recent merged PRs |
| The user is on a **feature branch** and named nothing | Confirm: "Release `<branch>` (N commits not on `<default>`) to `<env>`?" Show the commits |
| The user said "all of main to staging" | That's the source; don't ask again |

Also be clear what you're allowed to do: open the PR, or merge it as well. If the user asked to release, merging into `<env>` is part of it. If they only asked to prepare, stop at the open PR.

## 3. Work out exactly what to carry

Record the source SHAs now. Everything later is checked against them.

- **A merged PR:** check how it was merged (`gh pr view <n> -R "$repo" --json mergeCommit,commits,baseRefName,headRefOid`).
  - Squash: the squash commit.
  - True merge commit: its first-parent delta, `git cherry-pick -x -m 1 <merge_sha>`. This keeps any conflict resolution done in the merge.
  - Rebase merge: the whole rebased sequence on the default branch. `mergeCommit.oid` alone is only its last commit.
- **An unmerged feature branch:** find its real base (the PR's `baseRefName`; a stacked PR's base is another branch). Read the diff from its merge base, the commit graph, and any changes made only inside merge commits. Name stacked prerequisites explicitly. If the branch is already merged into the default branch, use the merged-PR rules instead. **Never** use `<env>..<branch>`, which drags in everything on the default branch that the env branch lacks.
- **Already there?** Patch equivalence only gives you candidates. For one ordinary commit, `git cherry -v "$remote/<env>" <sha> <sha>^` (a `-` means an equal patch is on `<env>`). Then check that the content is still there, i.e. not reverted later, before you skip it.
- **Prerequisites:** look at what the change needs, not just file history: new imports, shared types, schema migrations, config and env names, lockfile changes, API contracts. `git log --oneline "$remote/<env>..$remote/<default>" -- <files>` is only a clue. Name each real prerequisite and ask whether to carry it. Note it in the PR body ("Also carries #123, which `<env>` didn't have").

Show the resulting patch (`git diff` of what you'll carry) before you build the branch.

## 4. Build and check

```bash
wt=<scratch>/release-<env>-<ticket>
git worktree add -b <branch-per-convention> "$wt" "$remote/<env>"
git -C "$wt" cherry-pick -x <shas oldest first>          # add -m 1 for a true merge commit
```

Use a worktree so the user's checkout, often mid-work on the default branch, is never touched. Use `git -C "$wt"` for every git command.

- **Conflicts:** stop and resolve them with the user, never by picking a side silently. A conflict usually means a missing prerequisite.
- **Empty cherry-pick:** skip it only once you've confirmed its effect is already on `<env>`.
- **Check:** after a frozen-lockfile install, run the repo's own typecheck, lint and nearby tests in the worktree. If a check already fails on `<env>`, say so and don't fix it here.
- **On any failure,** keep the worktree and report its path and `git -C "$wt" status`.

## 5. PR and merge

Name the repo and head on every `gh` call. Otherwise `gh` can pick the branch of whatever checkout the shell is in.

```bash
git -C "$wt" push "$remote" "HEAD:refs/heads/<release-branch>"
gh pr create -R "$repo" --base <env> --head <release-branch> --title "<house title>" --body-file <body.md>
head=$(gh pr view <n> -R "$repo" --json headRefOid -q .headRefOid)   # the head you checked
gh pr merge <n> -R "$repo" --merge --match-head-commit "$head"        # or the allowed method from step 1
gh pr view <n> -R "$repo" --json state,mergeCommit                    # must be MERGED, not queued or auto-merge
```

- If the head or `<env>` moves after you checked, check again before merging.
- If a guard, hook or permission check blocks the merge, report its exact reason and ask the user how to proceed. Don't route around it.
- A rejected or blocked command may still have run. Check the PR state before retrying.
- After merging, fetch again and confirm the release branch head is an ancestor of `<env>`: `git merge-base --is-ancestor <release_head> "$remote/<env>"`.
- Remove the worktree only when its status is clean and the merge is confirmed. Never `--force` it.

## 6. Release the default branch, across services

1. **Freeze the source.** Record the default-branch SHA you're releasing. If the default branch keeps moving, push that SHA as a release branch and PR that instead of `--head <default>`.
2. **Compare.** `gh api "repos/$repo/compare/<env>...<sha>"`: `ahead_by` is commits only on the source, `behind_by` is commits only on `<env>`. With `ahead_by` 0 there's nothing to release. Review the `<env>`-only commits: an env-specific revert stays in force after the merge.
3. **Test the combination.** Merge the frozen SHA into a worktree off `<env>` and run the checks there before you open the PR.
4. **Order safely.** For every shared contract that changes (endpoint, schema, token claim, queue payload), check it still works with the consumers deployed *now*. Additive changes go provider-first. A breaking change needs expand → migrate consumers → contract, as separate releases. If no safe order exists (a cycle, or a migration both sides depend on), stop and propose a coordinated plan. Write the order and a tested way back before starting.
5. **Merge each service** as in step 5, then verify its deploy (step 7) before starting the next.

## 7. Verify every deploy

Run this after **every** merge, single change or full release. A passing health check is **not** proof the new code is live.

Best: a read-only version endpoint that reports the deployed SHA.

```bash
verified=0
for i in $(seq 1 60); do
  actual=$(curl -fsS --connect-timeout 5 --max-time 15 "https://<host>/version" | jq -r .sha) \
    && [ "$actual" = "$expected_sha" ] && { verified=1; break; }
  sleep 20
done
[ "$verified" = 1 ] || { echo "deploy not verified after 20 min" >&2; exit 1; }
```

Without one, use a behaviour probe: a read-only request whose exact expected response you recorded against the old deploy, showing that it fails there and passes on the new one (for example, a new `GET` route answering 401 where the old deploy answers 404). Never send writes to probe. On a timeout or failure, keep the evidence and stop before any dependent release.

## 8. Report

Give the PR links, what was carried (marking prerequisites), check results, merge state, and how each deploy was verified. Never say "deployed" without the evidence from step 7.

## Traps

| Trap | Fix |
| --- | --- |
| Env branches aren't subsets of the default branch | Compute the carry from the source side, never by diffing against the env branch |
| `gh pr create` in the wrong directory opens a PR from the default branch | Always pass `-R` and `--head` |
| Reusing an old release branch for a ticket | Cut a fresh one (`-2`, `-3`) from current `<env>` |
| A provider release breaks consumers that are still on the old contract | Check compatibility with what's deployed now; expand before you contract |
| `git cherry` says `-`, but the change was reverted on `<env>` | Check the current content, not just patch IDs |
| Describing the default branch's deploy wiring from memory | Say what the deploy config shows; call something planned only when a document says so |
