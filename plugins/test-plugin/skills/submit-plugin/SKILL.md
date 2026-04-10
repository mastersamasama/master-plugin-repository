---
name: submit-plugin
description: This skill should be used when the user asks to "submit my plugin", "publish my plugin", "open a PR for my plugin", "register my plugin", or wants to add a plugin to the OKX internal master-plugin-repository marketplace via a GitHub PR. This is the bootstrap submit skill that ships in test-plugin and is superseded by /official-plugins:submit-plugin once the official plugin is installed. Make sure to invoke this whenever the user mentions submitting or publishing a plugin and only test-plugin is installed.
when: When the user wants to submit, publish, upload, or add a plugin to master-plugin-repository or the OKX hackathon plugin marketplace.
---

# submit-plugin (bootstrap)

You are helping an OKX hackathon participant submit a Claude Code plugin to `mastersamasama/master-plugin-repository`. This is the **bootstrap** submit skill that ships inside `test-plugin`. It uses inline sanity checks (no external validator) and is intended to onboard the first real plugins into the marketplace, including its own eventual replacement, `plugin-store-tools`.

Follow this runbook exactly. Do not skip steps. Do not invent files. Ask the user before any destructive action.

## 0. Preflight — understand the target

Ask the user (use the AskUserQuestion tool if multiple options are involved, otherwise just ask in plain text) for the **absolute path** to the plugin they want to submit. Call this `PLUGIN_DIR`.

Confirm:

- The directory exists
- It contains `.claude-plugin/plugin.json`

If either check fails, stop and tell the user what's missing. Do not proceed.

## 1. Inline sanity checks

Run these checks against `PLUGIN_DIR`. Collect **every** problem, then report them all at once — don't bail on the first error.

### 1a. plugin.json structural checks

- Read `PLUGIN_DIR/.claude-plugin/plugin.json`
- Parse it as JSON. On parse error, record the error message verbatim.
- Required field `name` must exist and match `^[a-z][a-z0-9-]*$` (kebab-case, starts with a letter)
- Required field `description` must exist and be a non-empty string
- Optional `version`, if present, should look like semver (`^\d+\.\d+\.\d+`)
- The value of `name` **must equal** the leaf directory name of `PLUGIN_DIR` (e.g., plugin name `foo-bar` in `plugins/foo-bar/`). If not, record it.

### 1b. Skills structural checks (if any)

- If `PLUGIN_DIR/skills/` exists:
  - For every subdirectory `skills/<skill-name>/`, require a `SKILL.md` file inside.
  - Read each `SKILL.md`. The file must start with a YAML frontmatter block delimited by `---`.
  - The frontmatter must parse as YAML and must contain a `name` field.
  - The `name` in the frontmatter should match `<skill-name>` (the directory name). Record a warning (not an error) if it doesn't.

### 1c. Path traversal check

- Scan `plugin.json` for any value that is a string containing `..`. If found (e.g., `"skills": "../../evil"`), record it as an error.

### 1d. Report

If any **errors** were found, print them grouped by category, with full file paths, and then **stop**. Tell the user to fix them and re-run the skill.

If only warnings were found, print them and ask the user: "Proceed anyway? [yes/no]" via AskUserQuestion.

If everything is clean, say so briefly and continue to step 2.

## 2. Collect marketplace-entry metadata

You need a JSON object to append to `marketplace.json`'s `plugins` array. Collect these fields from the user (default where noted):

- `name` — default: the plugin's `name` from plugin.json
- `description` — default: the plugin's `description` from plugin.json
- `version` — default: the plugin's `version` from plugin.json, or `"0.1.0"`
- `author.name` — ask the user (team name or individual)
- `keywords` — optional array; ask for comma-separated list, default `["hackathon", "okx"]`

## 3. Ask: which submission mode?

Use AskUserQuestion with two options:

- **external** — "My plugin lives in its own GitHub repo. The PR will only add an entry to marketplace.json pointing at that repo."
- **monorepo** — "Copy my plugin directory into master-plugin-repository under plugins/<name>/ as part of the PR."

Recommend **external** for most hackathon teams because the PR is smaller and each team owns their code.

## 4. Preflight — gh CLI

Run these checks via Bash:

```bash
gh --version
gh auth status
```

- If `gh` is not installed, stop and print:
  > Install GitHub CLI first: https://cli.github.com/ — then run `gh auth login` and invoke this skill again.
- If not authenticated, stop and print:
  > Run `gh auth login` to authenticate, then invoke this skill again.

## 5. Mode branch

### 5a. Mode: **external**

You need the participant's plugin repo to already be pushed to GitHub.

First, ask the participant **which layout** their repo uses. Use AskUserQuestion with two options:

- **whole-repo** — "The entire repo IS my plugin (`.claude-plugin/plugin.json` is at the repo root)."
- **subdir** — "My plugin lives in a subdirectory of a larger repo (e.g., `plugins/my-plugin/.claude-plugin/plugin.json`)."

Based on the answer, collect the fields you'll need:

**Whole-repo fields:**
- `url` — full HTTPS git URL, e.g., `https://github.com/team-alpha/my-plugin.git`
- `sha` — **required** for reproducibility. Ask the participant to run `git rev-parse HEAD` inside their plugin repo and paste the result.

**Subdir fields:**
- `url` — owner/repo shorthand (e.g., `team-alpha/monorepo`) **or** full HTTPS git URL
- `path` — directory path inside that repo (e.g., `plugins/my-plugin`)
- `ref` — branch or tag. Default: `main`.
- `sha` — **required**. Ask participant to run `git rev-parse HEAD` on the branch/tag they want pinned.

After collecting:

1. Verify the repo is accessible by trying a plain `git ls-remote <url>` (no auth needed for public repos). If it fails, stop and tell the user to make the repo accessible first.
2. Pick a working directory for the marketplace fork. Default: `%TEMP%/master-plugin-repository-submit-<plugin-name>` (Windows) or `/tmp/master-plugin-repository-submit-<plugin-name>` (unix). Confirm with user.
3. Fork + clone:
   ```bash
   gh repo fork mastersamasama/master-plugin-repository --clone --remote
   ```
   (Run this **inside** the chosen working directory's parent; gh creates the fork under the authenticated user and clones it.)
4. `cd` into the cloned fork.
5. Create a branch: `git checkout -b submit/<plugin-name>`
6. Read `.claude-plugin/marketplace.json`. Parse it as JSON. Append a new entry to the `plugins` array.

   **If whole-repo**, the entry is:
   ```json
   {
     "name": "<plugin-name>",
     "description": "<description>",
     "version": "<version>",
     "author": { "name": "<author.name>" },
     "category": "<category-or-omit>",
     "keywords": [...],
     "source": {
       "source": "url",
       "url": "<url>",
       "sha": "<sha>"
     }
   }
   ```

   **If subdir**, the entry is:
   ```json
   {
     "name": "<plugin-name>",
     "description": "<description>",
     "version": "<version>",
     "author": { "name": "<author.name>" },
     "category": "<category-or-omit>",
     "keywords": [...],
     "source": {
       "source": "git-subdir",
       "url": "<url>",
       "path": "<path>",
       "ref": "<ref>",
       "sha": "<sha>"
     }
   }
   ```

   Write the file back with 2-space indentation and a trailing newline. Preserve the existing formatting style. **Before writing**, show the user the diff and get explicit confirmation.

7. Stage + commit:
   ```bash
   git add .claude-plugin/marketplace.json
   git commit -m "Add <plugin-name> to marketplace"
   ```
8. Push: `git push -u origin submit/<plugin-name>`
9. Open PR:
   ```bash
   gh pr create \
     --repo mastersamasama/master-plugin-repository \
     --base main \
     --head <your-github-username>:submit/<plugin-name> \
     --title "Add <plugin-name> to marketplace" \
     --body "<body>"
   ```
   Body should include: plugin name, description, submission mode (external, whole-repo or subdir), source url / path / ref / sha, author, and a note that CI does not yet exist (Phase A) so the reviewer will check manually.

### 5b. Mode: **monorepo**

In monorepo mode, the plugin is copied into this marketplace repo itself, and the marketplace entry's `source` is a **simple relative-path string** (not an object).

1. Pick working directory, fork + clone, and create branch `submit/<plugin-name>` — same as steps 2–5 above.
2. Copy the participant's plugin directory into the clone:
   - Destination: `<clone>/plugins/<plugin-name>/`
   - Use `cp -r` (Unix) or `xcopy /E /I /Y` (Windows). Confirm with user before copying.
   - Refuse to proceed if `plugins/<plugin-name>/` already exists in the fork — that's a name collision; tell the user to rename their plugin.
3. Read `.claude-plugin/marketplace.json`, append a new entry. **Note the `source` is a string, not an object:**
   ```json
   {
     "name": "<plugin-name>",
     "description": "<description>",
     "version": "<version>",
     "author": { "name": "<author.name>" },
     "category": "<category-or-omit>",
     "keywords": [...],
     "source": "./plugins/<plugin-name>"
   }
   ```
   Before writing, show the user the diff and get explicit confirmation.
4. Stage all new files under `plugins/<plugin-name>/` **and** the marketplace.json edit:
   ```bash
   git add plugins/<plugin-name> .claude-plugin/marketplace.json
   git commit -m "Add <plugin-name> plugin and marketplace entry"
   ```
5. Push and open PR — same as step 8–9 above, with submission mode **monorepo** in the body.

## 6. Report

Print the PR URL to the user. Then print:

> **Next steps:** a reviewer will manually verify your submission (no automated CI exists yet — that arrives in Phase B with `plugin-store-tools`). If the reviewer requests changes, update your branch and push; the PR will pick up the changes automatically.

## 7. Behavior rules

- **Never** commit or push without first showing the user the exact diff and getting confirmation.
- **Never** skip sanity checks.
- **Never** overwrite an existing `plugins/<name>/` directory in monorepo mode.
- **Never** include secrets, credentials, OKX-confidential data, or third-party IP in the PR. If you notice any in the plugin content, stop and warn the user.
- If any Bash command fails unexpectedly, stop and report the error verbatim. Do not retry silently.
- If the user's plugin targets sensitive OKX systems, remind them the repo is under OKX internal license and submissions must comply with the LICENSE file at the repo root.
