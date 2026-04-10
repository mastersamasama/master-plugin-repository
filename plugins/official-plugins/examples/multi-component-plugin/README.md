# multi-component-plugin (example)

A reference Claude Code plugin demonstrating how all the major component types coexist in one plugin directory.

```
multi-component-plugin/
├── .claude-plugin/
│   └── plugin.json
├── skills/
│   └── example-skill/
│       └── SKILL.md
├── commands/
│   └── example-command.md
├── agents/
│   └── example-agent.md
├── hooks/
│   └── hooks.json
├── scripts/
│   └── example-hook.sh
└── README.md
```

## Components shipped

- **Skill** — `example-skill` (invoked as `/multi-component-plugin:example-skill`)
- **Slash command** — `/example-command`
- **Agent** — `example-agent` (referenced via the Agent tool)
- **PreToolUse hook** — runs `scripts/example-hook.sh` before any Bash call
- **Script** — `example-hook.sh`, referenced from `hooks/hooks.json` via `${CLAUDE_PLUGIN_ROOT}/scripts/example-hook.sh`

## Why this exists

Hackathon participants who have a mix of skills, commands, and supporting code can use this as a template for organizing their plugin. `package-plugin` knows how to copy this structure when scaffolding a multi-component submission.

## Notes on `${CLAUDE_PLUGIN_ROOT}`

When a hook (or any JSON manifest field) needs to reference a file inside the plugin, use the env var `${CLAUDE_PLUGIN_ROOT}` rather than absolute paths or `~/`. Claude Code resolves this at runtime to wherever the plugin is installed. See `hooks/hooks.json` for the live example.
