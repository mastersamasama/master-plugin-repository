# PR Template Field Reference

When `submit-plugin` opens a PR via `gh pr create`, it fills in a body that follows the repo's `.github/PULL_REQUEST_TEMPLATE.md`. This file explains what every field means and why the reviewer cares about it.

## Plugin name

Just the kebab-case name. Must match what's in your `plugin.json` and the marketplace entry. Reviewers use this to spot duplicates and to quickly identify your submission.

## Description

One sentence, ~100 characters. This becomes the marketplace listing description that other participants see. Make it specific: "Audit Solidity contracts" is weak; "Walk Solidity codebase, extract pragmas, and produce structured findings reports" is strong.

## Submission mode

One of three values:
- **monorepo** — your plugin is being copied into `plugins/<name>/` of master-plugin-repository
- **external whole-repo** — your plugin lives in its own GitHub repo
- **external subdir** — your plugin lives in a subdirectory of a larger repo

The reviewer uses this to know what to look for in the diff. A monorepo PR should have many file additions; an external PR should have only marketplace.json changes.

## Source details (external modes only)

For **whole-repo**: paste the full https URL and the pinned sha.
For **subdir**: paste the url (owner/repo or full URL), the subdirectory path, the ref (branch/tag), and the pinned sha.

The reviewer will spot-check that the URL is reachable and the sha is a valid commit.

## Author / team

Your team name or your name. Required for the leaderboard and judging records. The reviewer cross-references this against the OKX hackathon roster.

## Validation checkboxes

- [ ] **Validated locally with `validate.mjs`** — confirms you ran the validator and it returned clean. CI will re-validate; this checkbox is your declaration that you didn't skip the step.
- [ ] **Plugin name is unique** — confirm no other entry in `marketplace.json` uses your name. CI also checks, but this is your declaration.
- [ ] **SKILL.md frontmatter present** on every skill — bare minimum for skills to load.
- [ ] **No secrets or OKX-confidential data** — your plugin must not contain API keys, passwords, internal hostnames, customer data, internal tooling secrets, or anything else marked confidential. CI cannot detect this; it's on your honor.
- [ ] **Complies with LICENSE** — you've read the proprietary OKX LICENSE at the repo root and your submission complies (internal use only, no external publishing without OKX Legal).

If you can't tick any of these boxes, fix the underlying issue before resubmitting. Don't ship a half-baked submission.

## Why each field matters

The reviewer is fast — they look for:

1. **Schema compliance** (CI handles it)
2. **Name conflict** (CI handles it)
3. **Description quality** (human judgment)
4. **Compliance** (the checkboxes)
5. **Anything fishy in the diff** (full file scan)

A clean PR with all checkboxes ticked typically merges in minutes. A PR missing any of the above triggers a back-and-forth that costs everyone time.

## Updating an existing PR

If the reviewer requests changes:

1. Locally fix the issue in your fork's `submit/<plugin-name>` branch
2. `git add -A && git commit -m "address review feedback: <what>"`
3. `git push`

The PR auto-updates. CI re-runs. The reviewer re-checks.

Do NOT close and reopen a new PR for revisions — just push to the same branch.
