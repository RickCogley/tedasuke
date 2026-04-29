# Change Management Rule (ISO 27001)

All code and content changes must follow a traceable workflow that an auditor
can verify: **issue → branch → PR → merge → verify**.

## Standard Workflow

Every change that modifies behavior, configuration, content, or dependencies:

1. **Issue first.** Create a GitHub issue describing the change before starting
   work. Use the `change-request` issue template. If an issue already exists,
   reference it.
2. **Branch.** Create a feature branch from `main` named
   `{type}/{short-description}` (e.g., `feat/engagement-model`,
   `fix/ja-em-dash-cleanup`).
3. **Work.** Make changes on the branch. Run the project's verify/preflight
   checks before committing.
4. **PR.** Create a pull request linking to the issue with `Closes #N` or
   `Fixes #N` in the body. PR body must include a Summary and Test Plan.
5. **Merge.** Merge with `gh pr merge --admin --merge --delete-branch` (org
   policy blocks auto-merge; admin override is authorized for the repo owner).
6. **Post-merge verification.** After every merge to main:
   - Check GitHub CI: `gh run list --limit 3`
   - Check Dependabot:
     `gh api repos/{owner}/{repo}/dependabot/alerts --jq '[.[] | select(.state=="open")] | length'`
     — address any new alerts
7. **Release.** Releases are created periodically (not per-change) via
   `gh release create` with hand-written notes. Tag push triggers `publish.yml`
   to push to JSR.

## Branching correctly

The `git push -u origin <branch>` in step 2 of the Standard Workflow does
**not** reliably push to a remote branch of the same name. What it actually does
is push to whatever upstream the local branch is tracking. If the branch was
created in a way that sets the upstream to `origin/main`, a push meant for a
feature branch lands directly on `main` — bypassing the whole PR process.

**Correct patterns:**

```bash
# From an already-up-to-date local main:
git switch main && git pull --ff-only
git switch -c feat/whatever
# ...work...
git push -u origin HEAD          # creates origin/feat/whatever
```

**Pre-push sanity check** before your first push on a new branch:

```bash
git branch -vv
# The line for your current branch should NOT show [origin/main] or any
# [origin/something-else] upstream.
```

If `git branch -vv` shows an upstream set to a branch you didn't intend
(typically `origin/main`), fix it before pushing:

```bash
git branch --unset-upstream
git push -u origin HEAD
```

## Writing PR and issue bodies

Always pass multi-line or markdown-rich bodies **by file**, never inline via a
heredoc:

```bash
gh pr create    --body-file <path>
gh pr edit N    --body-file <path>
gh issue create --body-file <path>
gh issue edit N --body-file <path>
git commit      -F <path>
```

Heredocs cause backslash artifacts in rendered markdown.

## Conventional Commits

```
type(scope): description

Body explaining the change (if needed).

InfoSec: [security/quality/privacy consideration]
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

**InfoSec line** — required for all changes. Examples:

- `InfoSec: input validation added for user-supplied query parameters`
- `InfoSec: no security impact — content-only change`
- `InfoSec: dependency update addresses CVE-2026-XXXX`

If a change has no security implications, state that explicitly.

## Rationale

This workflow produces the evidence chain that ISO 27001 (A.8.9, A.8.25, A.8.32)
requires:

- **Change request** → GitHub issue
- **Authorization** → PR review and merge approval
- **Testing** → CI checks
- **Implementation** → Commits on feature branch
- **Verification** → Post-merge CI confirmation

An auditor can trace any production change from PR → issue → commits → CI
results.

---

_Originally synced from
[eSolia/devkit](https://github.com/eSolia/devkit)/.claude/shared-rules/change-management.md.
This repo is not a sync consumer — edit locally as needed._
