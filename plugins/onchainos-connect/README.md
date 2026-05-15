# onchainos-connect

Pair Onchain OS with any WalletConnect-enabled dApp via a headless local daemon — connect, disconnect, list, status, stop.

**Website:** https://onchainosconnect.com/
**Repository:** https://github.com/jasonthewhale/onchainos-connect

## What's inside

- **Skill**: `onchainos-connect` — drives a headless WalletConnect agent that auto-spawns on first `connect`, auto-exits a few seconds after the last session closes, and routes every dApp request to Onchain OS without further prompts.

## Installation

Install via the OKX Claude Code marketplace:

```
/plugin install onchainos-connect@master-plugin-repository
```

## Usage

Once installed, invoke the skill with any of these subcommands:

- `/onchainos-connect connect wc:abc...` — pair with a dApp (paste the WalletConnect URI)
- `/onchainos-connect disconnect <dapp-name|topic|all>` — drop a session
- `/onchainos-connect list` — show active sessions
- `/onchainos-connect status` — daemon health + active sessions
- `/onchainos-connect stop` — shut the daemon down now (it auto-exits otherwise)

The daemon binds to `127.0.0.1:3748` by default and stores its pid/port at `~/.onchainos-connect/daemon.json`. WalletKit state lives at `~/.onchainos-connect/walletkit/` so sessions survive daemon restarts.

## Requirements

- `npx` (Node/npm installed)
- Node.js ≥ 22
- Onchain OS CLI installed and logged in (`onchainos wallet login`)

## Author

OnchainOS Connect
