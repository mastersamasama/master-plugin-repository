# Submission

<!-- Brief description: what does your plugin do, and why is it useful for OKX engineers? -->

## Plugin metadata

- **Plugin name**: <!-- kebab-case, must be unique in the marketplace -->
- **Team / author**: <!-- your team name or your name -->
- **Submission mode**: <!-- monorepo / external whole-repo / external subdir -->

## For external submissions only

- **Source URL**: <!-- e.g., https://github.com/team-alpha/my-plugin.git -->
- **Path** (subdir mode only): <!-- e.g., plugins/my-plugin -->
- **Ref** (subdir mode only): <!-- branch or tag, default main -->
- **Pinned commit SHA**: <!-- output of `git rev-parse HEAD` in your plugin repo -->

## Pre-flight checklist

- [ ] I ran `node plugins/official-plugins/scripts/validate.mjs --plugin <my-plugin-dir>` locally and it returned clean
- [ ] My plugin name is unique in `marketplace.json`
- [ ] Every `SKILL.md` has YAML frontmatter with at least `name`
- [ ] Every skill `description` follows the "This skill should be used when the user asks to ..." convention (no undertriggering vague descriptions)
- [ ] No secrets, API keys, passwords, or OKX-confidential data anywhere in the plugin
- [ ] No third-party IP without rights to use
- [ ] My submission complies with the proprietary OKX [LICENSE](../LICENSE)

## Notes for the reviewer

<!-- Anything else the reviewer should know — design decisions, dependencies, manual test steps -->
