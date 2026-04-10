# `plugin.json` Field Reference

Every field that can appear in `.claude-plugin/plugin.json`. Only `name` is strictly required; everything else is optional.

## Required

### `name` (string)
Kebab-case identifier (`^[a-z][a-z0-9-]*$`). Must match the leaf directory name. Used for slash command syntax (`/<plugin-name>:<skill-name>`) and marketplace install (`/plugin install <plugin-name>@<marketplace-name>`).

```json
"name": "my-plugin"
```

## Strongly recommended

### `description` (string)
One-sentence summary of what the plugin does. Shown in the marketplace UI.

```json
"description": "Lint and format Solidity contracts using forge fmt"
```

### `author` (object)
Who maintains the plugin.

```json
"author": {
  "name": "Team Alpha",
  "email": "team-alpha@example.com",
  "url": "https://github.com/team-alpha"
}
```

Required field inside author: `name`. Optional: `email`, `url`.

### `version` (string)
Semantic version. Tools rely on semver ordering for diffs and updates.

```json
"version": "0.1.0"
```

## Optional metadata

### `keywords` (array of strings)
Used for search/filtering in the marketplace UI.

```json
"keywords": ["solidity", "forge", "linting"]
```

### `category` (string)
Free-form category tag. Common values: `development`, `productivity`, `testing`, `data`, `other`.

```json
"category": "development"
```

### `homepage` (string, URL)
Project homepage or documentation site.

```json
"homepage": "https://my-plugin.example.com"
```

### `repository` (string)
Source repository URL.

```json
"repository": "https://github.com/team-alpha/my-plugin"
```

### `license` (string)
License identifier or human-readable note. For OKX hackathon submissions, use:

```json
"license": "See LICENSE"
```

(Refers to the marketplace's proprietary OKX LICENSE file.)

## Component declarations

These tell Claude Code where to find each component type. **All are optional** — if you omit them, Claude Code auto-discovers components by looking for the standard directories (`skills/`, `commands/`, `agents/`, `hooks/`, etc.). Only declare these explicitly if you want to point at a non-standard location.

### `skills` (string OR array of strings)
```json
"skills": "./skills/"                          // single dir
"skills": ["./skills", "./extra-skills"]       // multiple dirs
```

### `commands` (string OR array of strings)
```json
"commands": "./commands/"
```

### `agents` (string OR array of strings)
```json
"agents": "./agents/"
```

### `hooks` (string OR object)
String form points at a `hooks.json` file:
```json
"hooks": "./hooks/hooks.json"
```

Object form is inline:
```json
"hooks": {
  "PreToolUse": [...]
}
```

### `mcpServers` (string OR object)
String form points at an `mcp.json` file:
```json
"mcpServers": "./mcp.json"
```

Object form is inline:
```json
"mcpServers": {
  "weather": {
    "command": "npx",
    "args": ["-y", "weather-mcp"]
  }
}
```

### `lspServers` (string OR object)
Similar to mcpServers but for language servers. Out of scope for most hackathon plugins.

## Auto-discovery rule of thumb

Don't declare component fields unless you have a specific reason. Just put your files in the standard directories and Claude Code will find them:

```
my-plugin/
├── .claude-plugin/plugin.json    # name, description, author — that's it
├── skills/<name>/SKILL.md        # auto-discovered
├── commands/<name>.md            # auto-discovered
├── agents/<name>.md              # auto-discovered
└── hooks/hooks.json              # auto-discovered
```

## Minimal valid plugin.json

```json
{
  "name": "my-plugin",
  "version": "0.1.0",
  "description": "A short description",
  "author": { "name": "Your Name" }
}
```

That's enough. Everything else is optional.
