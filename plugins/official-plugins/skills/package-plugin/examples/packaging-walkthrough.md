# Walkthrough: Packaging a Multi-Component Plugin From Scratch

This is a narrative example of a hackathon team using `package-plugin` to bundle their work into a submittable plugin. Use it as a reference when guiding participants through unusual or complex situations.

## Scenario

Team Alpha built a "Solidity audit helper" during the hackathon. Over two days they accumulated:

- A SKILL.md at `~/work/audit-skill/SKILL.md` with `references/` and `examples/` siblings — describes how to walk a Solidity codebase and produce an audit report
- A loose slash command at `~/work/audit-skill/commands/quick-audit.md` they wrote separately
- A bash script at `~/work/audit-skill/scripts/extract-pragmas.sh` the skill calls
- An idea for a hook that runs a static-analysis tool before any `forge build` Bash invocation
- They want to ship all of this as one plugin called `solidity-audit-helper`

They've never made a Claude Code plugin before. They run `/official-plugins:package-plugin`.

## Phase 1 — Detect inputs

**You ask** (multiSelect): "What do you already have?"

**They pick**: Existing skill directory + Slash command Markdown + Hooks (will need to create from scratch) + Supporting scripts.

## Phase 2 — Metadata

**You collect** (with defaults from `git config`):

- name: `solidity-audit-helper`
- description: "Audit Solidity contracts: walk the codebase, extract pragmas, and produce a structured findings report"
- author.name: "Team Alpha" (from git config)
- author.email: "alpha@example.com" (from git config)
- version: 0.1.0
- keywords: solidity, audit, security, hackathon, okx
- category: development
- target: `~/work/solidity-audit-helper/`

The target directory does not yet exist — proceed.

## Phase 3 — Scaffold

**You write** (after showing diffs and getting confirmation for each):

- `~/work/solidity-audit-helper/.claude-plugin/plugin.json` — substituted from `${CLAUDE_PLUGIN_ROOT}/templates/plugin.json.template`
- `~/work/solidity-audit-helper/README.md` — substituted from the README template

You write the state file:

```json
{
  "phase": "scaffolded",
  "metadata": { "name": "solidity-audit-helper", "version": "0.1.0", ... },
  "selected_inputs": ["skills", "commands", "hooks", "scripts"]
}
```

## Phase 4 — Ingest

### 4a. Skills

You ask: "What's the source path of your skill?"

They paste: `~/work/audit-skill/`.

You verify it has `SKILL.md` and copy:
- `~/work/audit-skill/SKILL.md` → `~/work/solidity-audit-helper/skills/audit/SKILL.md`
- `~/work/audit-skill/references/` → `~/work/solidity-audit-helper/skills/audit/references/`
- `~/work/audit-skill/examples/` → `~/work/solidity-audit-helper/skills/audit/examples/`

You read the SKILL.md and notice the description is "Audit Solidity contracts" — too vague, doesn't follow the trigger-phrase convention. You offer to rewrite it. They accept. You propose:

```yaml
description: This skill should be used when the user asks to "audit my contract", "review this Solidity code", "find security issues in Solidity", "extract pragmas", or wants a structured report of findings in a Solidity codebase. Make sure to invoke this whenever the user mentions Solidity auditing or contract review.
```

They approve. You rewrite the file.

### 4b. Commands

You ask for the command file path. They paste `~/work/audit-skill/commands/quick-audit.md`. You copy it to `~/work/solidity-audit-helper/commands/quick-audit.md`. The frontmatter parses cleanly.

### 4c. Hooks

They want a PreToolUse hook on Bash that warns before `forge build` runs. You scaffold from the template:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          { "type": "command", "command": "bash ${CLAUDE_PLUGIN_ROOT}/scripts/forge-build-warn.sh" }
        ]
      }
    ]
  }
}
```

Written to `~/work/solidity-audit-helper/hooks/hooks.json`.

You note that the script `forge-build-warn.sh` doesn't exist yet — flag it for phase 4f.

### 4f. Scripts

You ask for the path of `extract-pragmas.sh`. They paste `~/work/audit-skill/scripts/extract-pragmas.sh`. You copy to `~/work/solidity-audit-helper/scripts/extract-pragmas.sh`. You also flag that the SKILL.md references this script — you need to verify the path inside SKILL.md uses `${CLAUDE_PLUGIN_ROOT}/scripts/extract-pragmas.sh` (since SKILL.md will be invoking it via Bash). It already does (good), or you offer to fix it (if it doesn't).

You ask Team Alpha to write `forge-build-warn.sh` — they paste content, you write it to `~/work/solidity-audit-helper/scripts/forge-build-warn.sh`.

## Phase 5 — Validate

You run:

```
node ${CLAUDE_PLUGIN_ROOT}/scripts/validate.mjs --plugin ~/work/solidity-audit-helper --json
```

It returns one warning:

```
WARN [PLUGIN_DESCRIPTION_MISSING] ~/work/solidity-audit-helper/.claude-plugin/plugin.json
       plugin.json should include a 'description' field
```

Wait — you set description in phase 2. You re-read `plugin.json` and notice the template substitution missed the field (template bug or operator error). You fix it inline and re-run the validator. Now clean.

## Phase 6 — Summary

```
Plugin packaged at ~/work/solidity-audit-helper
  - 1 skill (audit)
  - 1 command (quick-audit)
  - 0 agents
  - hooks: yes (1 PreToolUse on Bash)
  - mcp servers: no
  - validator: clean

Next step:
  /official-plugins:submit-plugin
  When prompted for the plugin path, provide: ~/work/solidity-audit-helper
```

Team Alpha runs submit-plugin next, picks **monorepo** mode, lets it fork master-plugin-repository, opens a PR. CI passes. A reviewer merges. Their plugin is live.

## Lessons embedded in this walkthrough

- Multiple component types in one plugin is the common case, not an edge case
- The trigger-phrase rewrite step is where most participants need help
- Scripts referenced from hooks/skills MUST use `${CLAUDE_PLUGIN_ROOT}` — verify this during ingest
- The validator catches real issues participants miss (like missed template substitutions)
- Resume state means a participant can stop after phase 4 and finish next day
