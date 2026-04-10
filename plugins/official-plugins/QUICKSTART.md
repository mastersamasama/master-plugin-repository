# QUICKSTART — 60 seconds to your first submission

For OKX hackathon participants. Run these in order, in a Claude Code session.

```
1. /plugin marketplace add mastersamasama/master-plugin-repository
2. /plugin install official-plugins@master-plugin-repository
3. /reload-plugins
4. /official-plugins:package-plugin     ← answer 5–8 questions
5. /official-plugins:submit-plugin      ← answer 3–5 questions, opens PR
```

That's it. CI validates your PR within seconds; a reviewer merges within minutes (subject to OKX hackathon timing).

---

## Need an example to fork?

Inside this plugin we ship two reference plugins under `examples/`:

- **`minimal-plugin/`** — the smallest valid plugin (one trivial skill, ~3 files)
- **`multi-component-plugin/`** — a plugin demonstrating skill + command + agent + hook + script all together

When `package-plugin` asks "What do you have?", picking "Nothing — start from a template" copies one of these as your starter.

## Troubleshooting

**Marketplace add fails with schema error**: that's a real bug, file an issue. Phase A had one (`owner` field) that's already fixed.

**`/official-plugins:package-plugin` doesn't appear**: run `/reload-plugins` and check `/plugin` → Installed.

**Validator complains about something you don't understand**: every error code is documented in `skills/package-plugin/references/validation-checklist.md` with Why and Fix. Open that file or ask the skill to explain.

**`gh: command not found`**: install GitHub CLI from https://cli.github.com/, run `gh auth login`, retry.

**PR CI fails**: read the failing check, fix locally, push to your `submit/<plugin-name>` branch — the PR updates automatically. Don't open a new PR.

## What if I want to skip package-plugin?

You can hand-build your plugin directory if you prefer. Make sure it has:

- `.claude-plugin/plugin.json` with at least `name` (kebab-case, matches dir name)
- At least one component (a skill, command, agent, hook, or MCP config)

Then run `submit-plugin` directly. It will run the validator before doing anything externally visible.

## Support

Open an issue inside `mastersamasama/master-plugin-repository` or contact the hackathon organizers via internal OKX channels.
