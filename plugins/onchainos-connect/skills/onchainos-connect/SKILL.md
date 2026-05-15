---
name: onchainos-connect
description: This skill should be used when the user asks to pair Onchain OS with a WalletConnect dApp, paste a `wc:` URI, disconnect a session, list active sessions, check daemon status, or stop the WalletConnect agent. Subcommands "connect <wc-uri>", "disconnect <dapp-name|topic|all>", "list", "status", "stop". The agent runs as a headless daemon that auto-spawns on first connect and auto-exits a few seconds after the last session closes.
disable-model-invocation: true
allowed-tools: Bash(./agent.sh*) Bash(curl http://127.0.0.1:*) Bash(test -f *) Bash(grep *)
---

## Pre-flight

> Before the first `connect` this session, read and follow: [_shared/preflight.md](_shared/preflight.md)

## Routing on `$ARGUMENTS`

Parse the first whitespace-separated token of `$ARGUMENTS`:

| First token | Action |
|---|---|
| `connect` | `./agent.sh connect <rest of args>` (the rest is the `wc:` URI) |
| starts with `wc:` | `./agent.sh connect $ARGUMENTS` (treat the whole thing as a URI) |
| `disconnect` | `./agent.sh disconnect <rest of args>` (`<dapp-name>`, WalletConnect topic, or `all`) |
| `list` | `./agent.sh list` |
| `status` or empty | `./agent.sh status` |
| `stop` | `./agent.sh stop` |

If the user pasted a bare WC URI without `connect`, treat it as `connect <uri>`.

## Behavior

- **`connect <wc-uri>`** spawns the daemon from `npx -y onchainos-connect@latest` if it's not running, then pairs. The daemon binds to `127.0.0.1:3748` by default and writes its pid/port to `~/.onchainos-connect/daemon.json`. Auto-handle is always on — every dApp request is routed to Onchain OS without further prompts. The driver verifies `npx`, Node.js >=22, and an authenticated Onchain OS CLI before starting the daemon. Defaults: `ONCHAINOS_ENABLE_EXECUTE_TX=true`, Reown project ID `d299ed6633d8183a134445e9fbac6ae0`. Override `WC_PROJECT_ID` for a different Reown app.

- **`disconnect <name|topic|all>`** with a name matches case-insensitive exact dApp name first, then case-insensitive substring. A 64-character WalletConnect topic disconnects that exact session. `disconnect all` disconnects every active session.

- **Auto-exit.** The daemon exits ~5s after the last session closes. The next `connect` re-spawns it.

- **Session rehydration.** WalletKit state lives at `~/.onchainos-connect/walletkit/`. Sessions survive daemon restarts; if a dApp closed its side while the daemon was down, the cleanup arrives lazily on the next ping.

- **Logs.** `~/.onchainos-connect/daemon.log` has the full stdout/stderr stream.

## Examples

```text
/onchainos-connect connect wc:abc123...@2?relay-protocol=irn&symKey=...
/onchainos-connect disconnect Uniswap
/onchainos-connect disconnect all
/onchainos-connect list
/onchainos-connect stop
```

## Failure surface

- daemon failed to start within 90s → tail `~/.onchainos-connect/daemon.log` (the script prints this path on timeout).
- "no active session named …" → ask the user for the correct name; `list` shows what's currently paired.
- "multiple matches for …" → the daemon prints the candidates; pick the more specific name.
- bare `WC_PROJECT_ID` not configured is not a failure — the bundled default is used.
