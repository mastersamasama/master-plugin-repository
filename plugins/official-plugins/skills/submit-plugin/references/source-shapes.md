# Marketplace Entry `source` Shapes

The single most common cause of submission failures is a malformed `source` field in the marketplace entry. This file documents every valid shape with concrete examples.

## Shape 1: String (relative path) — for monorepo plugins

When your plugin lives inside this marketplace repo at `plugins/<name>/`, the source is just a relative path string from the repo root.

```json
{
  "name": "my-plugin",
  "description": "...",
  "source": "./plugins/my-plugin"
}
```

**When to use**: monorepo submission mode. The PR copies your plugin into `plugins/<name>/` and adds this entry.

**Constraints**:
- Path must start with `./`
- Path must NOT contain `..`
- The directory `plugins/<name>/.claude-plugin/plugin.json` MUST exist when the PR is merged (the validator checks)

## Shape 2: `{source: "url", url, sha?}` — for external whole-repo plugins

When your plugin IS its own GitHub repo (the `.claude-plugin/plugin.json` is at the root of your repo, not in a subdirectory), use this shape.

```json
{
  "name": "my-plugin",
  "description": "...",
  "source": {
    "source": "url",
    "url": "https://github.com/team-alpha/my-plugin.git",
    "sha": "aa70dbdbbbb843e94a794c10c2b13f5dd66b5e40"
  }
}
```

**When to use**: external submission mode where the plugin is the entire repo.

**Fields**:
- `source` — must be exactly the string `"url"`
- `url` — full https git clone URL ending in `.git`
- `sha` — recommended; pins the exact commit. Get it via `git rev-parse HEAD` inside your repo.

**Why pin sha**: without it, the marketplace tracks `HEAD` of the default branch, which can change under judges' feet. Pin sha for reproducibility.

## Shape 3: `{source: "git-subdir", url, path, ref?, sha?}` — for plugins in a subdirectory

When your plugin is one of several inside a larger external repo (e.g., a monorepo your team maintains), use this shape.

```json
{
  "name": "my-plugin",
  "description": "...",
  "source": {
    "source": "git-subdir",
    "url": "team-alpha/monorepo",
    "path": "plugins/my-plugin",
    "ref": "main",
    "sha": "7f18e11d694b9ae62ea3009fbbc175f08ae913df"
  }
}
```

**When to use**: external submission mode where the plugin is a subdirectory of a larger external repo.

**Fields**:
- `source` — must be exactly the string `"git-subdir"`
- `url` — either `owner/repo` shorthand OR a full https git URL
- `path` — relative subdirectory inside the external repo (e.g., `plugins/my-plugin`)
- `ref` — branch or tag name (default: `main`)
- `sha` — recommended; pins the exact commit

## Common mistakes

### ❌ `{source: "github", repo, path}`
This shape does **not exist**. Earlier drafts of master-plugin-repository's docs incorrectly suggested it. Real Claude Code only understands `url` and `git-subdir`.

### ❌ `source` as an object when you mean monorepo
For monorepo plugins, use the simple string form. Wrapping the path in `{source: ..., url: ...}` is wrong — there's no `source` type for "same repo as marketplace".

### ❌ Bare `url` without `source`
```json
"source": { "url": "https://github.com/foo/bar.git" }
```
Missing the `source: "url"` discriminator. Add it.

### ❌ Path traversal
```json
"source": "../plugins/foo"
```
The validator rejects `..` in any source path.

### ❌ Forgetting `.git` suffix on https URLs
Some Claude Code versions require the trailing `.git`. Always include it for whole-repo URLs.

### ❌ Using SSH URL instead of HTTPS
```json
"source": { "source": "url", "url": "git@github.com:foo/bar.git" }
```
The marketplace fetches over HTTPS without auth. Use the https URL.

## How to obtain a sha

In your plugin's git repo:

```bash
git rev-parse HEAD
```

This prints the full 40-character commit hash. Paste it into the `sha` field. If you're working off a tag, you can also use `git rev-list -n 1 v1.0.0`.

## How to validate your entry locally

After adding your entry to `marketplace.json`, run from the master-plugin-repository repo root:

```bash
node plugins/official-plugins/scripts/validate.mjs --marketplace
```

The validator checks:
- Plugin name is unique within the marketplace
- Source has the correct shape for its discriminator
- For string sources: the target directory exists with a valid plugin.json
- No path traversal
- Required fields per shape
