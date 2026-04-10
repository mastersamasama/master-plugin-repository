# Claude Code Plugin Component Types

A reference for `package-plugin` and any participant who wants to understand what each component type in a Claude Code plugin does, what files it needs, and how it's wired up.

## Skills

**Purpose**: Long-form, instruction-rich procedures that Claude follows in-session. Triggered by description-matching when the user's prompt mentions the topic.

**File structure**:
```
skills/<skill-name>/
├── SKILL.md              # required — frontmatter + body runbook
├── references/           # optional — supporting docs Claude reads on demand
│   └── *.md
├── examples/             # optional — concrete examples Claude can reference
│   └── *
└── scripts/              # optional — bash/node/python scripts the skill invokes
    └── *
```

**SKILL.md frontmatter** (required `name`, strongly recommended `description`):
```yaml
---
name: <kebab-case-name>
description: This skill should be used when the user asks to "<phrase>", "<phrase>", or wants to <topic>. Make sure to invoke this whenever the user mentions <topic>, even if they don't explicitly ask for it.
---
```

**Invocation**: `/<plugin-name>:<skill-name>` or auto-triggered by description match.

## Slash commands

**Purpose**: Short, single-shot user-facing actions. Less powerful than skills but quicker to write.

**File structure**:
```
commands/
├── <command-name>.md      # one file per command
└── ...
```

**Optional frontmatter**:
```yaml
---
description: Short description shown in /help
argument-hint: <arg1> <arg2>
---
```

**Invocation**: `/<plugin-name>:<command-name>` or `/<command-name>` if name is unique.

## Agents

**Purpose**: Specialized sub-Claude instances with their own scope, tools, and model. Invoked from another Claude session via the Agent tool.

**File structure**:
```
agents/
├── <agent-name>.md
└── ...
```

**Required frontmatter**:
```yaml
---
name: <kebab-case-name>
description: When this agent should be used (used to match Agent tool calls)
tools: Read, Write, Bash         # optional — restricts available tools
model: sonnet                    # optional — sonnet|opus|haiku
---
```

**Invocation**: `Agent({subagent_type: "<agent-name>", ...})` from a parent Claude session.

## Hooks

**Purpose**: Shell commands the Claude Code harness executes in response to events (before/after tool use, on session start, on stop).

**File structure**:
```
hooks/
└── hooks.json              # required if any hooks
scripts/
└── <hook-script>           # the actual scripts the hooks invoke
```

**hooks.json shape**:
```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          { "type": "command", "command": "bash ${CLAUDE_PLUGIN_ROOT}/scripts/my-hook.sh" }
        ]
      }
    ]
  }
}
```

**Events**: `PreToolUse`, `PostToolUse`, `Stop`, `SessionStart`, `UserPromptSubmit`, etc.

**Critical**: hook commands MUST use `${CLAUDE_PLUGIN_ROOT}` — never absolute paths or `~/`.

## MCP servers

**Purpose**: External tool servers that expose tools to Claude via the Model Context Protocol.

**Two delivery methods**:

### Inline in plugin.json (preferred for simple cases)
```json
{
  "name": "my-plugin",
  "mcpServers": {
    "weather": {
      "command": "npx",
      "args": ["-y", "weather-mcp"],
      "env": { "WEATHER_API_KEY": "..." }
    }
  }
}
```

### Separate `mcp.json` file (preferred for many or complex configs)
```
mcp.json
```

Reference from plugin.json: `"mcpServers": "./mcp.json"`.

## LSP servers

Similar to MCP but for language server protocol integration. File: `lsp.json` or inline in plugin.json under `lspServers`. Out of scope for most hackathon plugins.

## Scripts

Not a "component" per se — `scripts/` is just a folder for executables that hooks, MCP servers, and skills reference. Scripts MUST be referenced via `${CLAUDE_PLUGIN_ROOT}/scripts/<name>` from any JSON manifest, never absolute paths.

## The `${CLAUDE_PLUGIN_ROOT}` env var

When the Claude Code harness runs a hook command or starts an MCP server, it sets `CLAUDE_PLUGIN_ROOT` to the absolute path of the installed plugin directory. Always use this in hook/MCP commands so your plugin is portable across machines and install methods.

In SKILL.md prose (markdown body, references), use **relative paths** like `references/patterns.md` instead — the `${CLAUDE_PLUGIN_ROOT}` env var is for shell-executed commands, not for markdown links.
