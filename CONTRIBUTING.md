# Contributing to master-plugin-repository

This is the **OKX internal Claude Code plugin marketplace** for the hackathon. Contributions are restricted to authorized OKX personnel and hackathon participants.

> By submitting a plugin you acknowledge the proprietary [LICENSE](./LICENSE) and confirm your submission complies with OKX internal IP, security, and compliance policies.

## TL;DR

```
/plugin marketplace add mastersamasama/master-plugin-repository
/plugin install official-plugins@master-plugin-repository
/reload-plugins
/official-plugins:package-plugin   # builds your plugin directory
/official-plugins:submit-plugin    # opens the PR
```

That's the canonical path. Skip to the **Detailed workflow** section if you want to understand each step.

## Submission modes

You choose per submission:

- **Monorepo** — Your plugin is copied into `plugins/<name>/` of this repo as part of the PR. Smaller surface area for participants who don't want to maintain their own repo. Recommended for most hackathon submissions.
- **External whole-repo** — Your plugin lives in its own GitHub repo (`.claude-plugin/plugin.json` at the repo root). The PR only adds a marketplace entry pointing at your repo + a pinned commit SHA. You retain ownership of the plugin code.
- **External subdir** — Your plugin lives in a subdirectory of a larger external repo. The PR adds a marketplace entry pointing at that subdirectory.

## Detailed workflow

### 1. Build your plugin

Use `/official-plugins:package-plugin`. It supports any starting state:

- Nothing — start from a template
- An existing skill directory you want to publish
- Loose `SKILL.md` files
- Slash command `.md` files
- Agent `.md` files
- Hooks (`hooks.json` or hook scripts)
- MCP server configurations
- Supporting bash/python/node scripts
- Any combination of the above

The skill walks you through metadata collection, scaffolds the plugin directory from templates, copies your components into the right subdirectories, and runs the validator. State is saved to `.package-plugin.state.json` so you can resume if interrupted.

### 2. Validate locally

`package-plugin` runs the validator automatically as its last step. If you want to re-validate at any time:

```
node plugins/official-plugins/scripts/validate.mjs --plugin <your-plugin-dir>
```

The validator is zero-dependency Node.js — no `npm install` required. Works on Windows, macOS, Linux.

### 3. Submit

Use `/official-plugins:submit-plugin`. It will:

1. Run the validator one more time (refuses to proceed on errors)
2. Pre-fill metadata from your `plugin.json` (no re-asking)
3. Ask for submission mode
4. Offer a **dry-run** preview of the planned PR diff (recommended for your first submission)
5. Check that `gh` CLI is installed and authenticated
6. Fork this repo, create a `submit/<plugin-name>` branch, apply changes, validate inside the fork, commit, push, and open a PR via `gh pr create`
7. Print the PR URL

### 4. CI runs automatically

Every PR triggers `.github/workflows/validate-submissions.yml` which runs the validator over the entire marketplace. If validation fails, the check turns red and the PR cannot merge until you fix and push.

### 5. Reviewer merges

A reviewer manually inspects:
- Description quality
- License compliance (no secrets, no confidential data, no third-party IP)
- The PR template checkboxes
- Anything fishy in the diff

If approved, they merge. Your plugin is live in the marketplace.

## Validator rules (short version)

The full reference is in [official-plugins/skills/package-plugin/references/validation-checklist.md](./plugins/official-plugins/skills/package-plugin/references/validation-checklist.md). Quick summary:

- `plugin.json` must have a kebab-case `name` matching the directory name
- Every `SKILL.md` must have YAML frontmatter with a `name` matching its directory name
- Skill descriptions should follow the "This skill should be used when..." pattern (warning, not error)
- No `..` (path traversal) in any string field
- Marketplace plugin names must be unique
- Marketplace `source` must be a valid string path or `{source: "url"|"git-subdir", ...}` object

## Compliance obligations

By submitting, you affirm:

- Your plugin is your own work (or you have rights to all included code)
- No secrets, API keys, passwords, internal hostnames, customer data, or any OKX-confidential information is included
- Your submission complies with OKX internal IP, security, and compliance policies
- You've read the [LICENSE](./LICENSE) and accept that everything in this repo is proprietary OKX internal use only

If a reviewer finds a compliance issue post-merge, the entry will be removed and the responsible team contacted.

## Need help?

- Open an issue using the **Plugin submission help** template
- Read the plugin-store-tools `references/` for detailed validator and source-shape docs
- Contact hackathon organizers via internal OKX channels
