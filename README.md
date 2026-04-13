# master-plugin-repository

**OKX Internal Claude Code Plugin Marketplace** — the official submission target for the OKX internal hackathon.

> 简体中文版本： [README.zh-Hans.md](./README.zh-Hans.md)

## What this is

A Claude Code plugin marketplace. Once you add it, every plugin submitted to the hackathon becomes discoverable inside Claude Code's `/plugin` interface and installable with one command. PRs are validated by GitHub Actions before merge.

## Who it's for

Authorized OKX personnel and hackathon participants only. Use is governed by the [LICENSE](./LICENSE) — confidential, internal-use-only, no redistribution without OKX Legal approval. See [HACKATHON.md](./HACKATHON.md) for rules, eligibility, and judging, and [CONTRIBUTING.md](./CONTRIBUTING.md) for the full submission workflow.

## Add this marketplace to Claude Code

In any Claude Code session:

```
/plugin marketplace add mastersamasama/master-plugin-repository
```

Then open the marketplace UI:

```
/plugin
```

You'll see submitted plugins under the **Discover** tab.

## Install a plugin

Pick a plugin from the list and run:

```
/plugin install <plugin-name>@master-plugin-repository
/reload-plugins
```

The plugin's skills/commands are then invokable in your current session.

## Quick submission guide

End-to-end takes 5–10 minutes for most submissions. The whole flow runs inside any Claude Code session via the `official-plugins` plugin.

### Step 1 — One-time setup

```
/plugin marketplace add mastersamasama/master-plugin-repository
/plugin install official-plugins@master-plugin-repository
/reload-plugins
```

You only need to do this once per machine. Subsequent submissions skip straight to step 2.

### Step 2 — Package your plugin

```
/official-plugins:package-plugin
```

The skill walks you through:

- **"What do you already have?"** (multi-select) — pick any combination: existing skill directories, loose `SKILL.md` files, slash command `.md` files, agent definitions, hooks (`hooks.json` or scripts), MCP server configs, supporting scripts, or **"Nothing — start from a template"** (which copies the bundled `examples/minimal-plugin/` or `examples/multi-component-plugin/` as your starter).
- **Plugin metadata** — `name` (kebab-case), `description`, `author` (defaults from `git config user.name` / `user.email`), `version`, `keywords`, `category`, and the target directory for the new plugin (default: `<cwd>/<plugin-name>`).
- **Component ingest** — for each component type you selected, the skill asks for source paths and copies the files into the right subdirs (`skills/`, `commands/`, `agents/`, `hooks/`, `scripts/`), rewriting any internal references to use `${CLAUDE_PLUGIN_ROOT}`.

The skill generates `plugin.json` and `README.md` from templates, runs the validator (non-strict — warnings let you iterate), and saves resume state to `<target>/.package-plugin.state.json` so you can pick up later if interrupted.

### Step 3 — Submit

```
/official-plugins:submit-plugin
```

The skill executes a strict gate before any externally visible action:

1. **Locates the plugin** — asks for the directory path (defaults to whatever `package-plugin` produced; pre-fills metadata from `<plugin>/.package-plugin.state.json` if present).
2. **Runs the strict quality gate** — `validate.mjs --strict` over your plugin. **Blocks** on any format or quality failure (see the next section). If blocked, it tells you to run `package-plugin` to fix, then re-invoke.
3. **Asks "Dry run first?"** — **Highly recommended for your first submission.** Dry-run fetches the live `marketplace.json`, builds the proposed merged version, validates against it (catching duplicate plugin names), shows the planned commit message and PR title/body, then **stops without forking or pushing**. Dry-run doesn't need `gh` CLI installed.
4. **Asks submission mode** (real-submission only):
   - **monorepo** — your plugin is copied into `plugins/<plugin-name>/` of this marketplace. Smaller surface area; good default.
   - **external whole-repo** — your plugin IS its own GitHub repo (`.claude-plugin/plugin.json` at the repo root). PR only adds a marketplace entry pointing at your repo.
   - **external subdir** — your plugin is a subdirectory of a larger repo. PR adds an entry pointing at that subdirectory.
5. **Checks `gh` CLI** — runs `gh --version` and `gh auth status`. If missing, prints exact install / login commands and stops.
6. **Fork + branch + apply + validate + commit + push + PR** — forks `master-plugin-repository`, creates branch `submit/<plugin-name>`, applies the changes (copies the plugin in monorepo mode; only edits `marketplace.json` in external modes), validates again inside the fork, commits, pushes, opens the PR via `gh pr create` with the body filled in from the PR template.
7. **Prints the PR URL** and tells you what to expect from CI.

### Step 4 — CI validates your PR

GitHub Actions runs `validate.mjs --all` on your PR within ~30 seconds. If checks fail, fix locally and push to your `submit/<plugin-name>` branch — the PR updates automatically. **Don't open a new PR for revisions.**

### Step 5 — Reviewer merges

A reviewer checks the PR template checkboxes (no secrets, license compliance, valid metadata) and merges. Your plugin is live in the marketplace and installable by other participants:

```
/plugin marketplace update master-plugin-repository
/plugin install <your-plugin-name>@master-plugin-repository
```

### Alternative: Zip upload (no GitHub needed)

**Don't know GitHub? No problem.** After Step 2 (package-plugin), skip submit-plugin entirely. Instead, ask Claude to zip your plugin:

```
Please zip my plugin directory into a file
```

Claude will create a `.zip` for you. Then upload it (plus your Demo recording/link) to the [submission form](https://okg-block.sg.larksuite.com/share/base/form/shrlg8ofWhLJotSJdkIaQy9PxMg). That's it — no GitHub account, no PR, no `gh` CLI.

**What the zip must contain:**
- `README.md` that mentions your project name and explains how to run it
- Complete runnable code (`npm install && npm run start` or equivalent)

> **Detailed hackathon info**: see [HACKATHON.md](./HACKATHON.md) ([简体中文版](./HACKATHON.zh-Hans.md)) for prizes, timeline, judging criteria, and full FAQ.
>
> **Even shorter**: see [`plugins/official-plugins/QUICKSTART.md`](./plugins/official-plugins/QUICKSTART.md) for the 60-second condensed version.

## What `submit-plugin` blocks on

`submit-plugin` runs `validate.mjs --strict` before doing anything externally visible. Submission is **blocked** on any of these:

**Format gates** (always errors):
- `plugin.json` malformed or missing
- `name` not kebab-case or doesn't match the directory name
- `SKILL.md` missing or has malformed YAML frontmatter
- Path traversal (`..`) in any string field

**Quality gates** (errors in `--strict`, the mode `submit-plugin` always uses):
- Skill description missing or doesn't follow the third-person `"This skill should be used when the user asks to ..."` trigger-phrase convention
- Plugin description missing, shorter than 20 characters, or contains unfilled `{{...}}` template placeholders
- Plugin has zero components (no skills, commands, agents, hooks, or MCP servers)
- **`README.md` missing** at the plugin root, **or** the README does not mention the plugin's kebab-case name
- Files contain a string matching known secret formats (OpenAI / Anthropic API keys, GitHub PATs, AWS keys, Google keys, Slack tokens, JWTs)

Full reference with explanations and fixes: [`plugins/official-plugins/skills/submit-plugin/references/quality-gates.md`](./plugins/official-plugins/skills/submit-plugin/references/quality-gates.md).

You can run the validator yourself before submitting:

```
node plugins/official-plugins/scripts/validate.mjs --plugin <your-plugin-dir> --strict
```

It's a single zero-dependency Node.js file — no `npm install` needed.

## Continuous integration

Every PR triggers `.github/workflows/validate-submissions.yml` which runs the validator over the entire marketplace using Node 20. CI catches any malformed plugin or marketplace entry before a human reviewer ever sees it.

## Repository layout

```
.claude-plugin/
└── marketplace.json                # the catalog
.github/
├── workflows/validate-submissions.yml  # CI validator on every PR
├── PULL_REQUEST_TEMPLATE.md
└── ISSUE_TEMPLATE/plugin-submission.md
plugins/
├── official-plugins/               # canonical hackathon tools (package + submit)
│   ├── scripts/validate.mjs        # zero-dep validator (shared with CI)
│   ├── schemas/                    # JSON Schema docs
│   ├── templates/                  # placeholder stubs for new plugins
│   ├── examples/                   # minimal-plugin + multi-component-plugin
│   └── skills/
│       ├── package-plugin/
│       └── submit-plugin/
└── test-plugin/                    # bootstrap artifact (kept for reference)
CONTRIBUTING.md                     # detailed submission workflow
HACKATHON.md                        # rules, timeline, judging criteria
CODE_OF_CONDUCT.md                  # references OKX internal policy
LICENSE                             # OKX proprietary notice
README.md                           # you are here
README.zh-Hans.md                   # 简体中文
```

## About `test-plugin`

`test-plugin` is the **bootstrap artifact** that shipped before `official-plugins` existed. It contains a simpler `submit-plugin` skill with inline sanity checks. It is kept in the marketplace as a minimal reference submission for participants who want to study the smallest possible plugin layout. **For real submissions, use `official-plugins` — its `submit-plugin` runs the strict quality gate via the shared validator.**

## Compliance notice

This repository and every plugin inside it are confidential OKX property. Do not publish, fork externally, or share outside authorized OKX channels. Submissions must contain no secrets, no confidential OKX data, and no third-party IP you do not have rights to. See [LICENSE](./LICENSE) for the full terms and [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md) for the conduct policy reference.

## Questions

Open an issue using the **Plugin submission help** template, or contact the hackathon organizers through internal OKX channels.
