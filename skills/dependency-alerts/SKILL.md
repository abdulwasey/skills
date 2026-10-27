---
name: dependency-alerts
description: Use when asked to remediate npm, Yarn or pnpm dependency security alerts (Dependabot or `npm/yarn/pnpm audit`) in named GitHub repos or a whole org, e.g. "fix the Dependabot alerts", "we have 200 security alerts", "patch the critical ones". Respects the severity and package scope asked for, and prepares one verified PR per repo with a from → to table and the alerts left open and why. Not for application-code vulnerabilities, routine upgrades, framework migrations, or just looking at alerts.
---

# Clear Dependency Security Alerts

## Overview

One PR per repo. Each one moves every in-scope vulnerable package to the **smallest compatible version outside all of its vulnerable ranges**, then shows nothing broke by running the repo's own checks before and after. Work that can't be fixed safely is listed, not forced.

**Core principle:** fix the alert, not the version number. Make the smallest change that leaves no installed copy inside any vulnerable range, and verify it against a recorded baseline, not against your hopes.

## When to Use

- Dependabot or an audit shows tens or hundreds of open alerts in JavaScript or TypeScript repos.
- A security review asks for critical and high fixes before a release.

Not for: other ecosystems (follow their own tooling), routine "bump everything to latest" upgrades, or major framework migrations. Those are their own projects; this skill lists them as remaining.

If the user asked for some of the alerts ("the critical ones", "just axios"), fix those and list the rest as out of scope.

## Optional: Dependabot setup

Only when the user asks for configuration changes. Fixing existing alerts doesn't need any of it, and turning on automated fixes opens PRs and runs CI straight away.

```bash
gh api repos/<owner>/<repo>/vulnerability-alerts -i | head -1                  # 204 = alerts on, 404 = off
gh api repos/<owner>/<repo>/automated-security-fixes -q .enabled               # are fix PRs on?
gh api -X PUT repos/<owner>/<repo>/vulnerability-alerts                        # turn alerts on (admin)
gh api -X PUT repos/<owner>/<repo>/automated-security-fixes                    # turn fix PRs on (admin)
```

If the repo already has a `.github/dependabot.yml`, read it and keep its directories, registries, ignores and schedules. To add one, list the real manifest directories instead of assuming `/`. Schedules, `groups` and `open-pull-requests-limit` apply to **version updates**. Security update PRs ignore the schedule and have their own limit. Group them separately if the user wants fewer of them:

```yaml
version: 2
updates:
  - package-ecosystem: npm
    directory: /
    schedule: { interval: monthly }
    open-pull-requests-limit: 2
    groups:
      minor-and-patch: { update-types: [minor, patch] }
      security:
        applies-to: security-updates
        patterns: ['*']
  - package-ecosystem: github-actions
    directory: /
    schedule: { interval: monthly }
    groups:
      actions: { patterns: ['*'] }
```

## Triage across many repos

Keep the raw alert JSON. Grouping by package name alone mixes up workspaces and release lines. A failed request means **unknown**, never zero.

```bash
umask 077; out=$(mktemp -d "<scratch>/alerts.XXXX")
gh api --paginate "orgs/<org>/repos?per_page=100" -q '.[] | select(.archived | not) | .full_name' > "$out/repos" \
  || echo "repo listing failed" >&2      # for a user account: users/<user>/repos
while read -r full; do
  f="$out/${full//\//__}.json"
  if gh api --paginate "repos/$full/dependabot/alerts?state=open&per_page=100" > "$f.part" 2> "$f.err"; then
    mv "$f.part" "$f"
    jq -rs 'add // [] | "\(length) open, \(map(select(.security_advisory.severity=="critical"))|length) critical, \(map(select(.dependency.scope=="runtime"))|length) runtime"' "$f" | sed "s|^|$full: |"
  else
    echo "$full: UNKNOWN ($(head -1 "$f.err"))"
  fi
done < "$out/repos"
```

Each alert carries `number`, `security_advisory.ghsa_id`, `dependency.package.{ecosystem,name}`, `dependency.manifest_path`, `dependency.relationship`, `dependency.scope`, `security_vulnerability.vulnerable_version_range` and `first_patched_version`. Work from these. Report repos you couldn't read separately. On a rate limit, wait for the time GitHub gives, then retry.

Work largest-impact first: critical and high **runtime** alerts before dev-only ones. Run one agent per repo in parallel, each in **its own folder**, because agents sharing a scratch folder overwrite each other's files.

## Per repo

### 1. Fresh clone, fresh branch, known tools

Clone into a new folder, never the user's working checkout. Look for open remediation PRs first. Reuse one only if the user means to; otherwise branch `chore/security-fixes-<date>` off the default branch, and never force-push another run's branch.

Before installing, read `packageManager`, `engines`, `.nvmrc`/`.tool-versions`, the lockfiles, the workspace definitions, `.npmrc`/`.yarnrc.yml`, and the working directories CI uses. Use the manager that owns the lockfile, and never create a second lockfile.

| Manager | Frozen install | Who pulls it in | Override field |
| --- | --- | --- | --- |
| npm | `npm ci` | `npm explain <pkg>` | `overrides` |
| Yarn 1 | `yarn install --frozen-lockfile` | `yarn why <pkg>` | `resolutions` |
| Yarn 2+ | `yarn install --immutable` | `yarn why -R <pkg>` | `resolutions` |
| pnpm | `pnpm install --frozen-lockfile` | `pnpm why -r <pkg>` | `pnpm.overrides` |

A private registry uses the auth that's already set up. If it's missing, that's a blocker. Never copy tokens into files, logs or the PR, and never switch registries.

### 2. Record the baseline

On the default branch, after the frozen install, record:
- the SHA and the runtime and tool versions;
- the local audit output (`npm audit --json`, `yarn npm audit --json`, `pnpm audit --json`);
- every check command, with its exit code and the **names** of failing tests or diagnostics.

Find the checks in the CI workflow and the scripts it calls, or in package scripts and contributor docs if there's no workflow. Run only install, codegen, typecheck, lint, format, test and build steps, against local or test services. Skip deploy, publish, release, production migrations and anything that writes to an outside system. Steps that need hosted runners, other platforms or secrets you don't have are **unverified**; say so.

### 3. Pick the smallest fix, per installed copy

One package can be installed several times through different parents. Treat each copy (manifest, release line, parent) on its own. For each one, find a version outside **every** applicable advisory's vulnerable range. Keep a copy that's already newer and safe, and never downgrade to an advisory's "first patched" version.

| Situation | Fix |
| --- | --- |
| Direct dependency | Bump to the smallest compatible safe version; prefer patch and minor bumps |
| Transitive, and the parent's range already allows a safe version | Re-resolve just that package with the manager's own targeted update (`npm update <pkg>`, `yarn upgrade <pkg>` on Yarn 1, `yarn up -R <pkg>` on Yarn 2+, `pnpm update -r <pkg>`). These pick the highest allowed version, so check what landed. Never hand-edit or delete lockfile entries |
| Transitive, and a newer parent fixes it | Bump the parent |
| Parent's range excludes every safe version and no fixed parent exists | A scoped override (`parent>pkg` / `"parent": { "pkg": … }`), never a global one. Outside the parent's declared range, it needs tests that exercise the parent's real use of it; without them, list it as remaining |
| Unused dependency is the only source of a pile of alerts | Remove it, but confirm nothing imports it, and say so in the PR |
| Only a framework major fixes it (Next.js, React Native, Expo SDK, Rails…) | Don't. List it as remaining, with the reason |
| No patched release exists | List it; note if the vulnerable code path is unused |
| The publisher ships the fix outside the registry (e.g. a CDN tarball) | Use it only if that's the publisher's documented install method |

After each change, check the lockfile: no installed copy may still sit inside any alert's range. That's a better test than "the audit is quieter".

### 4. Verify against the baseline

Re-run the frozen install, then every check from step 2, using the repo's scripts (`yarn test`, not a bare `npx vitest`), so pre-steps like spec generation still run. The bar is **no new failures**: compare failing test and diagnostic names, not just exit codes. If a baseline failure hides the behaviour a change touches, mark that behaviour unverified. Failures that already happen on the default branch are reported, not fixed here.

An override across a major needs tests of the parent library's real integration. Identical generated output (`tsoa spec`, `prisma generate`, an OpenAPI client) is supporting evidence, not proof.

### 5. Commit and open the PR

Make small commits split by concern ("Bump axios to 1.16.0", "Override basic-ftp under ftp-client"). The PR body holds:
- a table: package → from → to → alert numbers and GHSA IDs fixed;
- GitHub alerts at baseline, the local audit before and after, and the alert numbers **expected** to close on merge. Alerts are tracked on the default branch, so they stay open until the PR merges; never present expected closures as observed;
- the verification results against the baseline, with what's unverified;
- what remains and why, including out-of-scope alerts;
- which open Dependabot PRs it supersedes (don't close them; GitHub closes the alerts on merge).

Never merge. Leave that to the owner.

## Traps

| Trap | Fix |
| --- | --- |
| A test-runner or bundler major breaks tests after a bump | Read the migration guide for the exact from and to versions, and reproduce the failure before changing test config. If a safe version doesn't need the major, don't take it |
| Pinning a tool back to dodge a breaking major | Only if the pinned version is itself outside every vulnerable range |
| GitHub still shows "no patched version" for a fix released today | Upgrade anyway; note the alert may stay open until the advisory updates |
| The parent library still requires the old major even at its latest version | An override can break it at runtime; test the exact calls the parent makes, or leave it listed |
| An upgrade changes bundled data (e.g. a geo-IP or timezone database) | Check the lookups that depend on it and say what changed in the PR |
| CI minutes are used up | Run the checks locally as above, and list what only CI can check as unverified |
| An org listing stops at 30 repos | `gh repo list` defaults to 30; use the paginated API above |
