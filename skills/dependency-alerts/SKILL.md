---
name: dependency-alerts
description: Use when a repo (or a whole GitHub org) has open Dependabot or `npm/yarn audit` security alerts to clear, e.g. "fix the vulnerabilities", "clear the Dependabot alerts", "we have 200 security alerts", "patch the critical ones". Produces one verified PR per repo that upgrades or pins every affected package to its lowest patched version, with a from → to table and a list of what is left and why.
---

# Clear Dependency Security Alerts

## Overview

One PR per repo. Each one moves every vulnerable package to its **lowest patched version**, then proves nothing broke by running the repo's own CI steps locally, compared against the default branch. Work that can't be fixed safely is listed, not forced.

**Core principle:** fix the alert, not the version number. Use the smallest change that leaves no installed version inside a vulnerable range, and verify it against the baseline, not against your hopes.

## When to Use

- Dependabot or an audit shows tens or hundreds of open alerts.
- A security review asks for critical and high fixes before a release.
- After turning Dependabot alerts on for the first time (see Setup).

Not for: routine "bump everything to latest" upgrades, or major framework migrations. Those are their own projects; this skill lists them as remaining.

## Setup (once per repo or org)

```bash
gh api -X PUT repos/<owner>/<repo>/vulnerability-alerts          # alerts on
gh api -X PUT repos/<owner>/<repo>/automated-security-fixes      # Dependabot fix PRs on
```

Add a `.github/dependabot.yml` with grouped, low-frequency updates, so update PRs don't eat CI minutes:

```yaml
version: 2
updates:
  - package-ecosystem: npm
    directory: /
    schedule: { interval: monthly }
    open-pull-requests-limit: 2
    groups:
      minor-and-patch: { update-types: [minor, patch] }
  - package-ecosystem: github-actions
    directory: /
    schedule: { interval: monthly }
    groups:
      actions: { patterns: ['*'] }
```

## Triage across many repos

```bash
for r in $(gh repo list <owner> --json name -q '.[].name'); do
  gh api "repos/<owner>/$r/dependabot/alerts?state=open&per_page=100" --paginate \
    -q '.[]|[.security_advisory.severity,.dependency.package.name,.dependency.scope,(.security_vulnerability.first_patched_version.identifier//"none")]|@tsv' > "/tmp/alerts-$r.tsv"
  echo "$r: $(wc -l < /tmp/alerts-$r.tsv) open, $(grep -c '^critical' /tmp/alerts-$r.tsv) critical, $(grep -c runtime /tmp/alerts-$r.tsv) runtime"
done
```

Work largest-impact first: critical and high **runtime** alerts before dev-only ones. Run one agent per repo in parallel, each in **its own folder**, because agents sharing a scratch folder overwrite each other's files.

## Per repo

### 1. Fresh clone, fresh branch

Clone into a new folder, never the user's working checkout. Branch `chore/security-fixes` off the default branch. Install from the frozen lockfile and **record the baseline**: run every CI step on the default branch first and note what already fails.

### 2. Group the alerts by package

For each package, note the vulnerable ranges, the first patched version, runtime vs development, and **who pulls it in** (`yarn why <pkg>` / `npm explain <pkg>`).

### 3. Pick the smallest fix, in this order

| Situation | Fix |
| --- | --- |
| Direct dependency | Bump it to the lowest patched version; prefer patch and minor bumps |
| Transitive, and the parent's range already allows the fix | Refresh the lockfile only (`yarn upgrade <pkg>` / delete its lock entry and reinstall) |
| Transitive, and a newer parent fixes it | Bump the parent |
| Parent pins the vulnerable major and no fixed parent exists | `resolutions` (yarn) / `overrides` (npm, pnpm), pinned to the patched version, **then smoke-test the parent's use of it** |
| Unused dependency is the only source of a pile of alerts | Remove it, but confirm nothing imports it, and say so in the PR |
| Only a framework major fixes it (Next.js, React Native, Expo SDK, Rails…) | Don't. List it as remaining, with the reason |
| No patched release exists | List it; note if the vulnerable code path is unused |
| The publisher ships the fix outside the registry (e.g. a CDN tarball) | Use it only if that's the publisher's documented install method |

After each change, check that no installed version in the lockfile is still inside any alert's vulnerable range. That's a better test than "the audit is quieter".

### 4. Verify against the baseline

Run the repo's own CI steps from its workflow file: install with the frozen lockfile, then codegen, typecheck, lint, format check, tests and build. Use the repo's scripts (`yarn test`, not a bare `npx vitest`), so pre-steps like spec generation still run. A change is acceptable when **every step is as good as or better than the baseline**. Failures that already happen on the default branch are reported, not fixed here.

If a forced major (`resolutions` across a major) touches generated output, diff it. An identical `tsoa spec`, `prisma generate` or OpenAPI client output is strong evidence the pin is safe.

### 5. Commit and open the PR

Make small commits split by concern ("Bump axios to 1.16.0", "Pin basic-ftp via resolutions"). The PR body holds:
- a table: package → from → to → alerts fixed;
- before and after alert counts by severity;
- the verification results against the baseline;
- what remains and why;
- which open Dependabot PRs it supersedes (don't close them; GitHub closes the alerts on merge).

Never merge. Leave that to the owner.

## Traps

| Trap | Fix |
| --- | --- |
| Vitest 3 → 4: `vi.spyOn` reuses the same spy across tests, so calls pile up | Add `vi.restoreAllMocks()` in `beforeEach` |
| Vitest 4 also fakes `performance`, which breaks scroll and animation tests | Set `fakeTimers.toFake` to the old list |
| Vitest 4 moved `poolOptions` | Move worker flags to a top-level `execArgv` |
| zod 3 → 4: `required_error` / `invalid_type_error` are gone | Use `error`; `z.coerce.number<number>()` keeps form types |
| Vite 8 can't parse legacy TypeScript decorators in tests | Hold vite at 7.x with a resolution |
| GitHub still shows "no patched version" for a fix released today | Upgrade anyway; note the alert may stay open until the advisory updates |
| The parent library still requires the old major even at its latest version | A resolution can break it at runtime; smoke-test the exact calls the parent makes, or leave it listed |
| CI minutes are used up | Everything above runs locally, so don't depend on CI to verify |
| An upgrade shifts bundled data (e.g. a geo-IP database) | Not a regression; mention it in the PR |
