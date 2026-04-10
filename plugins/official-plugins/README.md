# official-plugins

The OKX hackathon's official tooling plugin. Two skills that take any combination of skills, commands, agents, hooks, scripts, or MCP configs and turn them into a properly-formed Claude Code plugin published to the marketplace.

> **Quickstart card**: see [QUICKSTART.md](./QUICKSTART.md) for the 5-step onboarding.

## What's inside

| Skill | Invocation | Purpose |
|---|---|---|
| **package-plugin** | `/official-plugins:package-plugin` | Interactive workflow that scaffolds, ingests, and validates a Claude Code plugin from whatever source material the participant has. Replaces the older scaffold/validate/skill-to-plugin trio with one consolidated runbook. |
| **submit-plugin** | `/official-plugins:submit-plugin` | Validates a packaged plugin one more time, then forks `mastersamasama/master-plugin-repository`, edits `marketplace.json`, opens a PR via the `gh` CLI. Supports monorepo and external (whole-repo or subdir) modes. Has a dry-run preview mode. |

## Install

```
/plugin marketplace add mastersamasama/master-plugin-repository
/plugin install official-plugins@master-plugin-repository
/reload-plugins
```

## Repository contents

```
official-plugins/
├── .claude-plugin/plugin.json          # this plugin's manifest
├── README.md                           # you are here
├── QUICKSTART.md                       # 60-second onboarding for participants
├── scripts/
│   └── validate.mjs                    # zero-dep Node.js validator
├── schemas/
│   ├── marketplace.schema.json         # JSON Schema docs (manually enforced by validate.mjs)
│   ├── plugin.schema.json
│   └── skill-frontmatter.schema.json
├── templates/                          # {{placeholder}} stubs that package-plugin substitutes from
│   └── *.template
├── examples/
│   ├── minimal-plugin/                 # smallest valid plugin (1 skill)
│   └── multi-component-plugin/         # skill + command + agent + hook + script
└── skills/
    ├── package-plugin/                 # the prep skill
    │   ├── SKILL.md
    │   ├── references/
    │   └── examples/
    └── submit-plugin/                  # the GitHub PR skill
        ├── SKILL.md
        └── references/
```

## How participants typically use it

1. They've spent the hackathon hacking — they have a folder with a `SKILL.md`, a few `commands/`, a couple of agent files, and some bash scripts that hooks reference.
2. They run `/official-plugins:package-plugin`. They answer 5–8 questions about their inputs and metadata. Within minutes they have a clean plugin directory at `~/<plugin-name>/`, with a `plugin.json`, a README, and all their components copied into the right subdirectories. The validator passes.
3. They run `/official-plugins:submit-plugin`. They confirm the metadata, pick **monorepo** mode (or external if they want to keep their plugin in their own repo), and the skill forks the marketplace, opens a PR, and prints the URL.
4. CI validates the PR. A reviewer merges. Their plugin is live in the marketplace.

## Requirements

- **Node.js** (any modern version) — for running `validate.mjs`. No `npm install` needed; the validator uses only Node built-ins.
- **`gh` CLI** — for `submit-plugin` only. Install from https://cli.github.com/ and run `gh auth login` once.
- **Git** — for `submit-plugin` only.

## License

See [LICENSE](../../LICENSE) at the repo root. Proprietary OKX internal use only.
