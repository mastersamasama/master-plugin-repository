---
name: package-plugin
description: This skill should be used when the user asks to "package my plugin", "prepare a plugin for submission", "create a Claude Code plugin", "wrap my skill as a plugin", "scaffold a plugin", "validate plugin structure", "make my code into a plugin", "bundle skills into a plugin", "organize plugin files", "build a plugin from scratch", or wants to take any combination of existing skills, slash commands, agents, hooks, scripts, or MCP server configs and assemble them into a properly-formed Claude Code plugin ready to submit to the OKX hackathon marketplace at master-plugin-repository. Run this skill BEFORE submit-plugin. Make sure to invoke this skill whenever the user mentions packaging, scaffolding, organizing, or assembling plugin files, even if they don't explicitly say "package-plugin".
---

# package-plugin

You are helping an OKX hackathon participant assemble a Claude Code plugin from whatever they have — anything from "nothing, start fresh" to "a folder full of skills, commands, hooks, and supporting scripts I want to publish together".

This skill is the **gateway** to the marketplace. Your output is a directory the participant can hand to `submit-plugin` next.

Follow this runbook strictly. Confirm before every destructive action. Use the smart defaults below to minimize friction. The participant is mid-hackathon — keep it fast.

## 0. Resume check

If the current working directory or the user's nominated target directory contains `.package-plugin.state.json`, read it and offer to resume from the saved phase. Phases are: `metadata-collected`, `scaffolded`, `ingested`, `validated`. If the user wants to resume, skip the phases already completed.

If no state file exists, start at phase 1.

## 1. Detect what the participant has

Use AskUserQuestion in **multiSelect** mode with these options. Title: "What do you already have to package?" Let the participant pick any combination.

- **Existing skill directories** — `~/.claude/skills/<name>/` or local `SKILL.md` files with sibling `references/`, `examples/`, `scripts/`
- **Loose SKILL.md files** — single skill files not yet in their own directory
- **Slash command Markdown files** — `.md` files meant to be invokable as `/command-name`
- **Agent definitions** — `.md` files with agent frontmatter
- **Hooks** — a `hooks.json` or hook scripts (PreToolUse, PostToolUse, etc.)
- **MCP server configurations** — JSON snippets that point at external MCP servers
- **Supporting scripts or code** — bash/python/node scripts that hooks or MCP servers depend on
- **Nothing — start from a template** — use the bundled `examples/minimal-plugin/` or `examples/multi-component-plugin/` as a starter

If the participant picks "Nothing", offer them a follow-up choice between **minimal** (1 skill) and **multi-component** (skill + command + agent + hook + script). Copy the chosen example from `${CLAUDE_PLUGIN_ROOT}/examples/` to the target directory and skip directly to phase 5 (validation).

## 2. Collect plugin metadata

Use `git config user.name` and `git config user.email` (via Bash) to pre-fill the author fields. If git config returns empty, fall back to asking the user.

Ask the participant for these fields. Validate live as they answer. Use AskUserQuestion for the constrained fields (category) and plain text input for the rest:

- **`name`** — kebab-case, must match `^[a-z][a-z0-9-]*$`. Suggest the leaf name of their target dir if they have one. If invalid, explain why and re-ask.
- **`description`** — one sentence, target ~100 characters. Explain it appears in the marketplace UI.
- **`author.name`** — default from git config
- **`author.email`** — default from git config
- **`version`** — default `0.1.0`
- **`keywords`** — comma-separated, default `okx, hackathon`
- **`category`** — pick one: `development`, `productivity`, `testing`, `data`, `other`
- **`target`** — absolute path where the new plugin directory will be created. Default: `<cwd>/<plugin-name>`. If the directory already exists and is non-empty, warn and ask whether to overwrite, merge, or pick a different path.

## 3. Scaffold the directory

Read `${CLAUDE_PLUGIN_ROOT}/templates/plugin.json.template` and `${CLAUDE_PLUGIN_ROOT}/templates/README.md.template`. Substitute every `{{placeholder}}` with the values collected in phase 2 and write the results to:

- `<target>/.claude-plugin/plugin.json`
- `<target>/README.md`

For `keywords_json`, write a JSON array literal (e.g., `["okx","hackathon","testing"]`).

For `components_summary` in the README, write a bulleted list of the components you're about to ingest (or "TBD" if none yet).

**Show the diff** of each file before writing. For brand-new files, that means showing the full content. Get explicit user confirmation before each `Write` tool call.

Save state: write `<target>/.package-plugin.state.json` with `{ "phase": "scaffolded", "metadata": { ... }, "selected_inputs": [ ... ] }`.

## 4. Ingest each component

For each input type the participant selected in phase 1, walk through this loop:

### 4a. Skills

Ask for the source path of each skill. For a directory like `~/.claude/skills/foo/`, copy the entire contents to `<target>/skills/foo/` (preserving subdirs `references/`, `examples/`, `scripts/`). For a loose `SKILL.md`, ask the participant for the skill's kebab-case name and create `<target>/skills/<name>/SKILL.md` with the file's contents.

If the SKILL.md frontmatter is missing or doesn't start with "This skill should be used when the user asks to ...", offer to rewrite the description with the participant. Do NOT silently rewrite — ask first.

### 4b. Commands

Ask for each `.md` file. Copy to `<target>/commands/<filename>`. If the filename has spaces or uppercase, suggest a kebab-case rename and confirm.

### 4c. Agents

Ask for each agent `.md` file. Copy to `<target>/agents/<filename>`. Verify the agent has frontmatter with `name`, `description`, `tools`, `model` fields (warn if any are missing — agents without these can be invoked but the loader complains).

### 4d. Hooks

If the participant has an existing `hooks.json`, copy it to `<target>/hooks/hooks.json`. If they have raw hook scripts only, scaffold a `hooks.json` from `${CLAUDE_PLUGIN_ROOT}/templates/hooks.json.template` and ask which event (PreToolUse, PostToolUse, Stop, etc.) and matcher each script should fire on.

**Critically**: any hook command that references the script must use `${CLAUDE_PLUGIN_ROOT}/scripts/<name>` — never absolute paths. If the participant's existing hooks.json uses absolute paths, rewrite them and explain why.

### 4e. MCP server configurations

Ask whether to inline the config in `plugin.json` (preferred for one or two simple servers) or write a separate `mcp.json` file (preferred for many or complex configs). Either way, validate the JSON parses.

### 4f. Scripts / supporting code

Ask for the source path of each script. Copy to `<target>/scripts/<name>`. Preserve executable bit on Unix. If a script is referenced from `hooks/hooks.json` or `mcp.json` with an absolute path or `~/`, rewrite to `${CLAUDE_PLUGIN_ROOT}/scripts/<name>`.

After every component file is written, **show the participant the running tree** of `<target>/` so they can see what's been built so far. Use `find <target> -type f` (Unix) or `dir /s/b <target>` (Windows) via Bash.

Save state: update `.package-plugin.state.json` to phase `ingested`.

## 5. Run the validator

Run via Bash:

```
node ${CLAUDE_PLUGIN_ROOT}/scripts/validate.mjs --plugin <target> --json
```

Parse the JSON output line by line. Each line is one finding with fields `severity`, `file`, `line`, `code`, `message`, `why`, `fix`.

Format the findings for the user as:

```
ERROR  <file>:<line>  [<code>]
       <message>
       Why: <why>
       Fix: <fix>
```

For warnings, use `WARN ` prefix instead.

If there are any errors:
- Refuse to mark validation complete.
- Offer to walk through fixing each one. For frontmatter issues, offer to rewrite the file inline. For naming issues, offer to rename the file/dir.
- Re-run the validator after each fix until clean.

If only warnings remain (e.g., a SKILL.md description not starting with "This skill should be used when..."):
- Show the warnings.
- Ask the participant whether to fix or proceed. Recommend fixing.

Save state: once the validator returns clean, update `.package-plugin.state.json` to phase `validated`.

## 6. Final summary + next step

Print a tight summary:

```
Plugin packaged at <target>
  - <N> skill(s)
  - <N> command(s)
  - <N> agent(s)
  - hooks: yes/no
  - mcp servers: yes/no
  - validator: clean
```

Then ask (AskUserQuestion, single select): **"How would you like to submit?"**

- **GitHub PR (recommended if you have GitHub)** — "Run `/official-plugins:submit-plugin` next. It will validate your plugin under strict mode, fork master-plugin-repository, and open a PR automatically."
- **Zip upload (no GitHub needed)** — "I'll create a zip of your plugin directory for you. Upload it to the submission form along with your Demo."

If participant picks **GitHub PR**: print the submit-plugin command and tell them to provide `<target>` when prompted. Do NOT call submit-plugin yourself — the participant must invoke it explicitly so they're in control.

If participant picks **Zip upload**:
1. Run via Bash: `cd <target-parent> && zip -r <plugin-name>.zip <plugin-name>/` (on Windows: use `powershell -c "Compress-Archive -Path '<target>' -DestinationPath '<target>.zip'"`)
2. Print the path to the created `.zip` file
3. Tell the participant:
   ```
   Your plugin is zipped at: <path-to-zip>

   Upload it to the submission form:
   https://okg-block.sg.larksuite.com/share/base/form/shrlg8ofWhLJotSJdkIaQy9PxMg

   Don't forget to also upload your Demo (screen recording or online link)!
   ```

## Behavior rules

- **Always show diffs and confirm before writing.** Never overwrite a file silently.
- **Never delete the participant's source files.** Always copy.
- **Never call submit-plugin or push anything yourself.** Your job ends at "ready to submit".
- **Never skip the validator.** Even if the participant says "I trust it", run it.
- If the participant aborts mid-workflow, the state file lets them resume — tell them so.
- If the participant's source files contain any obvious secret patterns (keys with `KEY=`, `TOKEN=`, `SECRET=`, AWS access keys, JWT-looking strings), warn loudly and ask whether to redact before copying.
- Never invent component types. If the participant mentions something the runbook doesn't cover, ask before guessing.

## Additional resources

For detailed reference material, consult:

- **`references/component-types.md`** — what each Claude Code component does, what files it needs, file structure for each
- **`references/validation-checklist.md`** — every validator error code with explanation and fix
- **`references/plugin-json-fields.md`** — every plugin.json field with examples and defaults

For a worked example:

- **`examples/packaging-walkthrough.md`** — narrative walkthrough of packaging a multi-component plugin from scratch

For starter templates the user can copy directly:

- `${CLAUDE_PLUGIN_ROOT}/examples/minimal-plugin/` — smallest valid plugin
- `${CLAUDE_PLUGIN_ROOT}/examples/multi-component-plugin/` — skill + command + agent + hook + script
- `${CLAUDE_PLUGIN_ROOT}/templates/` — `{{placeholder}}` stubs for individual files
