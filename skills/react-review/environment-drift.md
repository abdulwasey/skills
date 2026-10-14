# Environment drift: is it the diff or `node_modules`?

A red test or typecheck is not evidence against the diff until an **untouched**
file fails differently. Run a sibling test file the PR never touched. If it
fails the same way, the installed tree is the problem, not the PR.

## Typical signatures

- `SyntaxError: ... does not provide an export named 'X'`
- `Module '"some-lib"' has no exported member named 'Y'`
- `export 'Z' was not found in '<pkg>/...'`
- The whole unit suite dying right after an install (often a native addon
  that needs `npm rebuild <addon>`).

## Diagnose before touching anything

1. Compare the installed version with the lockfile:
   ```bash
   node -p "require('./node_modules/<pkg>/package.json').version"
   grep -A2 '^"\?<pkg>@' yarn.lock   # or package-lock.json / pnpm-lock.yaml
   ```
2. If the lockfile already resolves every range correctly, the tree on disk is
   wrong. Look for **stale nested copies**:
   ```bash
   find node_modules -path '*/node_modules/<pkg>/package.json' \
     -exec sh -c 'printf "%s -> " "$1"; node -p "require(\"./$1\").version"' _ {} \;
   ```
   A nested old copy next to a parent that declares a newer range is the bug.
   Package managers sometimes leave such folders behind when a subtree's
   version moves, and a strict lockfile install does not prune them.

## Repair

- Reinstall strictly from the lockfile (`npm ci`, or your package manager's
  lockfile-only install flag).
- **Yarn v1 trap:** deleting a package folder and re-running `yarn install`
  restores nothing. Yarn reads `node_modules/.yarn-integrity`, decides the tree
  is complete, and exits in under a second, leaving the package *missing*
  rather than stale. Delete `node_modules/.yarn-integrity` in the same breath
  as the folder.

## Confirm before reporting

- Print the installed version again.
- For a bundler error, run an actual build, not just the tests.
- Then re-run the original failing test. Only now say whether the PR is at
  fault.
